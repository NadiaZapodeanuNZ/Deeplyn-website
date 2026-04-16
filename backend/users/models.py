from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta
import random
import string
import uuid

class User(AbstractUser):
    email = models.EmailField(max_length=256, unique=True, null=False)
    username = models.CharField(max_length=32, unique=True, null=False)
    is_active = models.BooleanField(default=False)
    # AbstractUser help me to inherit some traits like:

    # username - CharField 
    # first_name - CharField (optional)
    # last_name -CharField – nume de familie (opțional)
    # password - hashed automatically, VARCHAR(128)
    # email - EmailField – email (overrided)
    # is_active - BooleanField – default True (my case - False)
    # is_staff - BooleanField  admin Django
    # is_superuser - BooleanField all permissions
    # date_joined - DateTimeField
    # last_login - DateTimeField 

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        db_table = "users"

    def __str__(self):
        return f"{self.username} ({self.email})"


class EmailVerification(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='email_verification')
    token = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    resend_attempts = models.IntegerField(default=0)
    blocked_until = models.DateTimeField(null=True, blank=True)
    first_resend_at  = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Email Verification"
        db_table = "email_verification"

    def __str__(self):
        return f"{self.user.username} - {self.token}"

    def is_token_expired(self):
        return timezone.now() > self.expires_at

    def is_blocked(self):
        return self.blocked_until is not None and timezone.now() < self.blocked_until

    def generate_new_token(self):
        self.token = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        self.expires_at = timezone.now() + timedelta(minutes=5)
        self.save(update_fields=['token', 'expires_at'])
        return self.token
    
class PasswordReset(models.Model):
    #this table reffers to user. if the user is deleted, EVERYTHING IS DELETED (cascade)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_resets')
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    expires_at = models.DateTimeField()
    request_attempts = models.IntegerField(default=0)
    blocked_until = models.DateTimeField(null=True, blank=True)
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = "password_reset"

    def __str__(self):
        return f"{self.user.username} - {self.token}"

    def is_expired(self):
        return timezone.now() > self.expires_at

    def is_blocked(self):
        if self.blocked_until is None:
            return False
        return timezone.now() < self.blocked_until