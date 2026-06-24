from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta
from django_countries.fields import CountryField
import random
import string
import uuid

class User(AbstractUser):
    class Role(models.TextChoices):
        CLIENT = 'client', 'Client'
        THERAPIST = 'therapist', 'Therapist'

    first_name = models.CharField(max_length=32)
    last_name = models.CharField(max_length=32)
    email = models.EmailField(max_length=256, unique=True)
    username = models.CharField(max_length=32, unique=True)
    is_active = models.BooleanField(default=True)
    role = models.CharField(max_length=10,choices=Role.choices,default=Role.CLIENT,db_index = True)
    country = CountryField(blank_label="Select the country",default ="Select the country" )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    profile_photo = models.ImageField(upload_to='user_photos/%Y/%m/',blank=True,default = 'default/download.jpg')
    
    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        db_table = "users"

    def __str__(self):
        return f"{self.username} ({self.email})"

    @property
    def is_client(self):
        return self.role == self.Role.CLIENT

    @property
    def is_therapist(self):
        return self.role == self.Role.THERAPIST

class TherapistProfile(models.Model):
    class RequestStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    class Specialization(models.TextChoices):
        ADHD = "ADHD", "ADHD"
        ADDICTION = "Addiction", "Addiction & Recovery"
        ANXIETY = "Anxiety", "Anxiety"
        CAREER = "Career", "Career & Work Stress"
        CHILD_ADOLESCENT = "child_adolescent"," Child & Adolescent"
        DEPRESSION = "Depression", "Depression"
        EATING_DISORDERS = "eating_disorders","Eating Disorders"
        GRIEF = "Grief","Grief & Loss"
        TRAUMA = "Trauma", "Trauma & PTSD"
        RELATIONSHIPS = "Relationships", "Relationships & Couples"
        PERSONALITY = "personality_disorder","Personality Disorders"
        PTSD = "PTSD", "PTSD & Trauma"
        OCD = "OCD", "OCD"
        STRESS = "Stress","Stress"
        SUICIDE = "Suicide", "Suicide & Self-Harm"
        TREATMENT = "Treatment", "Treatment"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='therapist')
    license_code = models.CharField(max_length=50)
    where_to_check_license = models.URLField()
    documents_pdf = models.FileField(upload_to='therapist_documents/%Y/%m/')
    bio = models.TextField(max_length=250, blank=True)
    specializations = models.JSONField(default=list, blank=True)
    is_accepting_clients = models.BooleanField(default=False)
    request_status = models.CharField(max_length=10, choices=RequestStatus.choices,default=RequestStatus.PENDING, db_index=True)

    class Meta:
        db_table = 'therapist'

    def __str__(self):
        return f"{self.user.username} - {self.license_code} ({self.request_status})"
    
    @property
    def is_approved(self):
        return self.request_status == self.RequestStatus.APPROVED

    @property
    def is_available(self):
        return self.is_approved and self.is_accepting_clients
    

class EmailVerification(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='email_verification')
    token = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    resend_attempts = models.PositiveIntegerField(default=0)
    failed_attempts = models.PositiveIntegerField(default=0)
    blocked_until = models.DateTimeField(null=True, blank=True)
    first_resend_at = models.DateTimeField(null=True, blank=True)

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


class ClientTherapist(models.Model):

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        ACTIVE = 'active', 'Active'
        ENDED = 'ended', 'Ended'

    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='therapist_relations')
    therapist = models.ForeignKey(User, on_delete=models.CASCADE, related_name='client_relations')
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'client_therapist'

    def __str__(self):
        return f"{self.client.username} - {self.therapist.username} ({self.status})"

    def end_collaboration(self):
        from journal.models import SharedNote, Note
        from therapy.models import Session
        shared_note_ids = SharedNote.objects.filter(client=self.client,therapist=self.therapist,note__isnull=False).values_list('note_id', flat=True)
        Note.objects.filter(id__in=shared_note_ids).update(is_shared=False)
        SharedNote.objects.filter(client=self.client, therapist=self.therapist).delete()
        Session.objects.filter(client=self.client, therapist=self.therapist).delete()
        self.status = self.Status.ENDED
        self.ended_at = timezone.now()
        self.save(update_fields=['status','ended_at'])


class CrisisAlert(models.Model):
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='crisis_alerts')
    therapist = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_crisis_alerts')
    message = models.TextField(blank=True)
    is_seen = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'crisis_alerts'
        ordering = ['-created_at']

    def __str__(self):
        return f"Crisis: {self.client.username} - {self.therapist.username} ({self.created_at})"