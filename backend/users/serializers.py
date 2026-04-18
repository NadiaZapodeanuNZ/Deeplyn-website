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
from django.db.models import Q, F
import random


# class register
# it provides us the usual validation that we need

class RegisterSerializer(serializers.ModelSerializer):
    
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
            raise serializers.ValidationError(
                {"confirm_pass": "Passwords do not match."}
            )

        existing_user_by_email = User.objects.filter(
            email__iexact=attrs['email']
        ).first()

        # Case 1 : If the email belongs to an ACTIVE account.
        # This is a real account, used by someone who has verified their email.
        # the server will refuse the registration to prevent any form of unauthorized access.

        if existing_user_by_email and existing_user_by_email.is_active:
            raise serializers.ValidationError(
                {"email": "An account with this email or username already exists."}
            )
        
        # Case 2: If the email belongs to an INACTIVE account.
        # This means that someone started the registration process but never
        # completed the email verification step. This could be the same person
        # trying to re-register, or it could be someone else who is trying to
        # take over that email. To be safe, wthe server will treat it as a potential takeover
        # attempt and check if the username they want to use is already taken
        if existing_user_by_email and not existing_user_by_email.is_active:
            conflicting_username = User.objects.filter(
                username__iexact=attrs['username']
            ).exclude(
                pk=existing_user_by_email.pk
            ).first()

            if conflicting_username:
                raise serializers.ValidationError(
                    {"username": "An account with this email or username already exists."}
                )
            attrs['_existing_inactive_user'] = existing_user_by_email
            return attrs

        # Case 3 : If the email is completely new, it doesn't exist at all in the database.
        # We only check if the username is free.
        if User.objects.filter(username__iexact=attrs['username']).exists():
            raise serializers.ValidationError(
                {"username": "An account with this email or username already exists."}
            )

        return attrs


    def create(self, validated_data):
        validated_data.pop('confirm_pass')
        existing_user = validated_data.pop('_existing_inactive_user', None)

        if existing_user is not None:
            existing_user.username = validated_data['username']
            existing_user.set_password(validated_data['password'])
            existing_user.save(update_fields=['username', 'password'])
            if hasattr(existing_user, 'email_verification'):
                existing_user.email_verification.delete()

            return existing_user

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            is_active=False,
        )

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
    

# class DeleteAccountSerializer(serializers.Serializer):
#     password = serializers.CharField(write_only=True)

#     def validate_password(self, value):
#         user = self.context['request'].user
#         if not user.check_password(value):
#             raise serializers.ValidationError("Parola este incorectă.")
#         return value

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
    

# class DeleteAccountSerializer(serializers.Serializer):
#     password = serializers.CharField(write_only=True)

#     def validate_password(self, value):
#         user = self.context['request'].user
#         if not user.check_password(value):
#             raise serializers.ValidationError("Parola este incorectă.")
#         return value