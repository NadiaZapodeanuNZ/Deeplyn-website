import re
import uuid
from django.utils.crypto import get_random_string
from django.core.cache import cache
from django.conf import settings
from rest_framework import serializers
from users.models import User 
from django.contrib.auth import authenticate 
from django.core.cache import cache
from django.core.mail import send_mail
from django.db.models import Q
import random

# class register
# it provides us the usual validation that we need

class RegisterSerializer(serializers.ModelSerializer):
    # confirm_pass stands for confirm password
    confirm_pass = serializers.CharField(write_only=True, label="Confirm Password")
    

    class Meta:
        model  = User
        fields = ['username', 'email', 'password', 'confirm_pass']
        extra_kwargs = {
            'password': {'write_only': True},
            'email':    {'required': True,'validators': []},
            'username': {'required': True,'validators': []},
        }
    
    def validate_email(self, value):
        # i verified why it s very important to validate email in this way
        # first, i tried with regex , but ,it s not a valid way to validate an
        # email bcs regex is more strict and emails are verious 
        email = value.strip().lower()
        
        parts = email.split('@')
        domain = parts[1] if len(parts) == 2 else ''
        # i used 2 parts  
        if len(parts) != 2 or not parts[0] or '.' not in domain \
            or domain.startswith('.') or domain.endswith('.'):
            raise serializers.ValidationError("Enter a valid email address.")
        # so in this case we validate an email by having . and @ and the actual 
        # validation consists in sending an otp tu user email:))))
        return email

    def validate_username(self, value):
        value = value.strip()
        if not (4 <= len(value) <= 32):
            raise serializers.ValidationError("Username must be between 8 and 32 characters.")
        return value

    def validate_password(self, value):
  
        if not (8 <= len(value) <= 32):
            raise serializers.ValidationError(
                "Password must be between 8 and 32 characters."
            )

        pattern = r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{}|;:,.<>?/\\`~"\']).*$'
        if not re.match(pattern, value):
            raise serializers.ValidationError(
                "Password must contain at least one uppercase letter, "
                "one lowercase letter, one number, and one special character."
            )
        return value

    def validate(self, attrs):
        required = ['username', 'email', 'password', 'confirm_pass']
        for field in required:
            if not attrs.get(field, '').strip():
                raise serializers.ValidationError("All fields are required.")

        if attrs['password'] != attrs['confirm_pass']:
            raise serializers.ValidationError({"confirm_pass": "Passwords do not match."})

        # for security reasons, it s important to give little infos about what s wrong
        # because if an attacker tries an email for example, and our register says: this email 
        # is used, he knows that he can try to login with that email
        # that s why i tried to separate the username and emaiil
        # they need to be unique

        if User.objects.filter(email__iexact=attrs['email']).exists():
            raise serializers.ValidationError(
                {"email": "An account with this email or username already exists."}
            )

        if User.objects.filter(username__iexact=attrs['username']).exists():
            raise serializers.ValidationError(
                {"username": "An account with this email or username already exists."}
            )

        return attrs


    def create(self, validated_data):
        validated_data.pop('confirm_pass')

        user = User.objects.create_user(
            username = validated_data['username'],
            email = validated_data['email'],
            password = validated_data['password'],
            is_active = False)

        # is_active here means that the user didnt verified the email to 
        # create the actual account

        return user
    

class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(label="Email or Username")
    password = serializers.CharField(write_only=True)
    remember_me = serializers.BooleanField(default=False)

    def validate(self, attrs):
        identifier = attrs.get('identifier', '').strip()
        password = attrs.get('password', '')
        remember_me = attrs.get('remember_me', False)

        if not identifier or not password:
            raise serializers.ValidationError("All fields are required.")

        # the login is based on email or username
        # so an user can loggin with email or username
        try:
            user = User.objects.get(
                Q(email__iexact=identifier) | Q(username__iexact=identifier)
            )
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid credentials.")

        # verifying the password
        if not user.check_password(password):
            raise serializers.ValidationError("Invalid credentials.")

        # if the email is verified
        if not user.is_active:
            raise serializers.ValidationError("Account is not activated. Please verify your email.")

        attrs['user'] = user
        attrs['remember_me'] = remember_me
        return attrs
    
class ForgotPasswordSerializer(serializers.Serializer):
    # the logic here is that the user uses the email to connect to her/his account
    email = serializers.CharField()
    def validate_email(self, value):
        value = value.strip().lower()
        if '@' not in value or '.' not in value:
            raise serializers.ValidationError("Enter a valid email address.")
        return value

class ResetPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)
    confirm_pass = serializers.CharField(write_only=True)

    def validate_password(self, value):
        if not (8 <= len(value) <= 32):
            raise serializers.ValidationError(
                "Password must be between 8 and 32 characters."
            )
        pattern = r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{}|;:,.<>?/\\`~"\']).*$'
        if not re.match(pattern, value):
            raise serializers.ValidationError(
                "Password must contain at least one uppercase letter, "
                "one lowercase letter, one number, and one special character."
            )
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_pass']:
            raise serializers.ValidationError({"confirm_pass": "Passwords do not match."})
        return attrs