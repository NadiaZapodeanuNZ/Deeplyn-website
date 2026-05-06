import os
import re
from rest_framework import serializers
from users.models import User, TherapistProfile
from django.db.models import Q
from django.db import transaction
from users.exceptions import (EmailOrUsernameAlreadyExists, InvalidCredentials, AccountNotActivated, PasswordMismatch,
InvalidEmail, InvalidPassword, InvalidPasswordLength, InvalidUsername, AllFieldsRequired, InvalidLength,InvalidInput, NewPasswordSameAsOld,)
ALLOWED_SPECIALIZATIONS = {
  "ADHD","Addiction", "Anxiety",
  "Bipolar Disorder","Depression",
  "Eating Disorders", "Grief & Loss",
  "Personality Disorders", "PTSD & Trauma",
  "Stress", "Suicide & Self-Harm",
  "Treatment" 
}


# -------------Register - as a CLIENT------------------------

class RegisterSerializer(serializers.ModelSerializer):
    
    confirm_pass = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'username', 'email',
                  'password', 'confirm_pass', 'country']
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True, 'validators': []},
            'username': {'required': True, 'validators': []},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'country': {'required': True}
        }
    
    def validate_email(self, value):
        email = value.strip().lower()
        parts = email.split('@')
        domain = parts[1] if len(parts) == 2 else ''
        if len(parts) != 2 or not parts[0] or '.' not in domain \
            or domain.startswith('.') or domain.endswith('.'):
            raise InvalidEmail()
        return email

    def validate_username(self, value):
        value = value.strip()
        if not (4 <= len(value) <= 32):
            raise InvalidUsername()
        return value

    def validate_password(self, value):
        if not (8 <= len(value) <= 32):
            raise InvalidPasswordLength()
        pattern = r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{}|;:,.<>?/\\`~"\']).*$'
        if not re.match(pattern, value):
            raise InvalidPassword()
        return value

    def validate_first_name(self, value):
        if not (1 <= len(value) <= 32):
            raise InvalidLength(
                message="First name must be maximum 32 characters",
                details={"field": "first_name"})
        if not re.match(r"^[A-Za-z]+$", value):
            raise InvalidInput(
                message="First name must contain letters",
                details={"field": "first_name"})
        return value
    
    def validate_last_name(self, value):
        if not (1 <= len(value) <= 32):
            raise InvalidLength(
                message="Last name must be maximum 32 characters",
                details={"field": "last_name"})
        if not re.match(r"^[A-Za-z]+$", value):
            raise InvalidInput(
                message="Last name must contain letters",
                details={"field": "last_name"})
        return value
    
    def validate_country(self, value):
        if not value:
            raise InvalidInput(
                message="You must select a country.",
                details={"field": "country"}
            )
        return value

    def validate(self, attrs):
        required = ['first_name', 'last_name', 'username', 'email',
                    'password', 'confirm_pass', 'country']
        
        for field in required:
            if not str(attrs.get(field, '')).strip():
                raise AllFieldsRequired()
            
        if attrs['password'] != attrs['confirm_pass']:
            raise PasswordMismatch()

        existing_user_by_email = User.objects.filter(email__iexact=attrs['email']).first()

        if existing_user_by_email and existing_user_by_email.is_active:
            raise EmailOrUsernameAlreadyExists()
        
        if existing_user_by_email and not existing_user_by_email.is_active:
            conflicting_username = User.objects.filter(
                username__iexact=attrs['username']
            ).exclude(
                pk=existing_user_by_email.pk
            ).first()

            if conflicting_username:
                raise EmailOrUsernameAlreadyExists()
            attrs['_existing_inactive_user'] = existing_user_by_email
            return attrs

        if User.objects.filter(username__iexact=attrs['username']).exists():
            raise EmailOrUsernameAlreadyExists()

        return attrs
    
    @ transaction.atomic()
    def create(self, validated_data):
        validated_data.pop('confirm_pass')
        existing_user = validated_data.pop('_existing_inactive_user', None)

        if existing_user is not None:
            existing_user.username = validated_data['username']
            existing_user.first_name = validated_data['first_name']
            existing_user.last_name = validated_data['last_name']
            existing_user.country = validated_data['country']
            existing_user.role = User.Role.CLIENT
            existing_user.set_password(validated_data['password'])
            existing_user.save(update_fields=[
                'username', 'first_name', 'last_name',
                'country', 'password', 'role'
            ])

            if hasattr(existing_user, 'email_verification'):
                existing_user.email_verification.delete()
            
            if hasattr(existing_user, 'therapist'):
                existing_user.therapist.delete()
            
            return existing_user
        
  
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            country=validated_data['country'],
            role=User.Role.CLIENT,
            is_active=False
        )
        return user


# ------------------Register---as--a ---THERAPIST-----------

class TherapistRegisterSerializer(RegisterSerializer):
    license_code = serializers.CharField(required=True, max_length=50)
    where_to_check_license = serializers.URLField(required=True)
    documents_pdf = serializers.FileField(required=True)
    bio = serializers.CharField(required=False, allow_blank=True, max_length=250)
    specializations = serializers.ListField(child=serializers.CharField(max_length=50),required=True,allow_empty=False,)
    
    class Meta(RegisterSerializer.Meta):
        fields = RegisterSerializer.Meta.fields + [
            'license_code',
            'where_to_check_license',
            'documents_pdf',
            'bio',
            'specializations',
        ]
    
    def validate_license_code(self, value):
        value = value.strip()
        if not value:
            raise InvalidInput(
                message="License code is required.",
                details={"field": "license_code"}
            )
        return value
    
    def validate_documents_pdf(self, file):
        # Case 1: the extension needs to be verified
        if not file.name.lower().endswith('.pdf'):
            raise InvalidInput(
                message="The file must have .pdf extension.",
                details={"field": "documents_pdf"}
            )
        
        # Case 2: it's important to verify the size of the pdf
        # I don't want pdfs that are larger than 10MB
        max_size = 10 * 1024 * 1024
        if file.size > max_size:
            raise InvalidInput(
                message="The file size must not exceed 10MB.",
                details={"field": "documents_pdf"}
            )
        
        # Case 3: I need to verify the "magic bytes"
        # I read the first 5 bytes for the signature of a pdf file
        first_bytes = file.read(5)
        file.seek(0)
        # seek(0) here means that the pointer will be at the start of the
        # file. This is important so the file will not be corrupted when
        # Django saves it later.
        
        if first_bytes != b'%PDF-':
            raise InvalidInput(
                message="The file is not a valid PDF.",
                details={"field": "documents_pdf"}
            )
        return file
    
    def validate_specializations(self, value):
        # Case 1: no more than 5 specializations
        if len(value) > 5:
            raise InvalidInput(
                message="You cannot select more than 5 specializations.",
                details={"field": "specializations"}
            )
        
        # Case 2: must be a specialization from the allowed list
        invalid = set(value) - ALLOWED_SPECIALIZATIONS
        if invalid:
            raise InvalidInput(
                message=f"Invalid specializations: {', '.join(sorted(invalid))}.",
                details={
                    "field": "specializations",
                    "allowed": sorted(ALLOWED_SPECIALIZATIONS),
                }
            )
        
        # Case 3: no duplicate specializations
        if len(set(value)) != len(value):
            raise InvalidInput(
                message="Duplicate specializations are not allowed.",
                details={"field": "specializations"}
            )
        return value
       
    def validate(self, attrs):
        required = [
            'first_name', 'last_name', 'username', 'email',
            'password', 'confirm_pass', 'country',
            'license_code', 'where_to_check_license',
            'documents_pdf', 'specializations',
        ]
        
        for field in required:
            value = attrs.get(field)
            
            if value is None:
                raise AllFieldsRequired()
            
            if isinstance(value, list) and len(value) == 0:
                raise AllFieldsRequired()
            
            if not isinstance(value, list):
                if not str(value).strip():
                    raise AllFieldsRequired()
        
        return super().validate(attrs)
    
    @transaction.atomic
    def create(self, validated_data):
        therapist_data = {
            'license_code': validated_data.pop('license_code'),
            'where_to_check_license': validated_data.pop('where_to_check_license'),
            'documents_pdf': validated_data.pop('documents_pdf'),
            'bio': validated_data.pop('bio', ''),
            'specializations': validated_data.pop('specializations'),
        }
        
        validated_data.pop('confirm_pass')
        existing_user = validated_data.pop('_existing_inactive_user', None)
        
        if existing_user is not None:
            existing_user.username = validated_data['username']
            existing_user.first_name = validated_data['first_name']
            existing_user.last_name = validated_data['last_name']
            existing_user.country = validated_data['country']
            existing_user.role = User.Role.THERAPIST
            existing_user.set_password(validated_data['password'])
            existing_user.save(update_fields=[
                'username', 'first_name', 'last_name',
                'country', 'password', 'role',
            ])
        
            if hasattr(existing_user, 'email_verification'):
                existing_user.email_verification.delete()
            
            if hasattr(existing_user, 'therapist'):
                existing_user.therapist.delete()
            
            user = existing_user
        else:
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                password=validated_data['password'],
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
                country=validated_data['country'],
                role=User.Role.THERAPIST,
                is_active=False,
            )

        TherapistProfile.objects.create(
            user=user,
            license_code=therapist_data['license_code'],
            where_to_check_license=therapist_data['where_to_check_license'],
            documents_pdf=therapist_data['documents_pdf'],
            bio=therapist_data['bio'],
            specializations=therapist_data['specializations'],
            request_status=TherapistProfile.RequestStatus.PENDING,
            is_accepting_clients=False,
        )
        return user



#--------------------Login-------------------------------

class LoginSerializer(serializers.Serializer):   
    identifier = serializers.CharField(label="Email or Username")
    password = serializers.CharField(write_only=True)
    remember_me = serializers.BooleanField(default=False)

    def validate(self, attrs):
        identifier = attrs.get('identifier', '').strip()
        password = attrs.get('password', '')
        remember_me = attrs.get('remember_me', False)

        if not identifier:
            raise AllFieldsRequired()
        if not password:
            raise AllFieldsRequired()

        try:
            user = User.objects.get(
                Q(email__iexact=identifier) | Q(username__iexact=identifier)
            )
        except User.DoesNotExist:
            raise InvalidCredentials()

        if not user.check_password(password):
            raise InvalidCredentials()

        if not user.is_active:
            raise AccountNotActivated(details={"email": user.email})

        attrs['user'] = user
        attrs['remember_me'] = remember_me
        return attrs

#--------------Forgot Password-------------------

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    
    def validate_email(self, value):
        email = value.strip().lower()
        parts = email.split('@')
        domain = parts[1] if len(parts) == 2 else ''
        if len(parts) != 2 or not parts[0] or '.' not in domain \
            or domain.startswith('.') or domain.endswith('.'):
            raise InvalidEmail()
        return email

# -------------------Reset Password-------------------------

class ResetPasswordSerializer(serializers.Serializer):
 
    token = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)
    confirm_pass = serializers.CharField(write_only=True)

    def validate_password(self, value):
        if not (8 <= len(value) <= 32):
            raise InvalidPasswordLength()
        pattern = r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{}|;:,.<>?/\\`~"\']).*$'
        if not re.match(pattern, value):
            raise InvalidPassword()
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_pass']:
            raise PasswordMismatch()
        return attrs

#-------------------------User profile (read-only)------------------------

class UserSerializer(serializers.ModelSerializer):
    # Read-only serializer for GET /users/me/.
    
    therapist_profile = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'is_active',
            'date_joined',
            'therapist_profile',
        ]
        read_only_fields = fields
    
    def get_therapist_profile(self, user):
        if user.role != User.Role.THERAPIST:
            return None
        if not hasattr(user, 'therapist'):
            return None
        return {
            'request_status': user.therapist.request_status,
            'is_accepting_clients': user.therapist.is_accepting_clients,
            'specializations': user.therapist.specializations,
            }


# ---------------- LOGGEEEED USERS!!!!--------------------------
# -------------------Change Password----------------------------

class ChangePasswordSerializer(serializers.Serializer):

    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        if not (8 <= len(value) <= 32):
            raise InvalidPasswordLength()
        pattern = r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{}|;:,.<>?/\\`~"\']).*$'
        if not re.match(pattern, value):
            raise InvalidPassword()
        return value

    def validate(self, attrs):
        user = self.context['request'].user
        if not user.check_password(attrs['old_password']):
            raise InvalidCredentials()

        if attrs['old_password'] == attrs['new_password']:
            raise NewPasswordSameAsOld()

        if attrs['new_password'] != attrs['confirm_new_password']:
            raise PasswordMismatch()
        return attrs

    def save(self):
        user = self.context['request'].user
        data = self.validated_data

        with transaction.atomic():
            user.set_password(data['new_password'])
            user.save(update_fields=['password'])
        return user


class UpdateProfilePhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['profile_photo']

    def validate_profile_photo(self, file):
        allowed_extensions = ['.jpg', '.jpeg', '.png']
        ext = os.path.splitext(file.name.lower())[1]
        
        if ext not in allowed_extensions:
            raise InvalidInput(
                message="Only JPG, PNG and WEBP images are allowed.",
                details={"field": "profile_photo"}
            )
        
        if file.size > 5 * 1024 * 1024:
            raise InvalidInput(
                message="Profile photo must be under 5MB.",
                details={"field": "profile_photo"}
            )
        return file
    
class UpdateUsernameSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username']

    def validate_username(self, value):
        value = value.strip()
        if not (4 <= len(value) <= 32):
            raise InvalidUsername()
        
        current_user = self.context['request'].user
        if value.lower() == current_user.username.lower():
            raise InvalidInput(
                message="New username must be different from the current one.",
                details={"field": "username"})
        
        if User.objects.filter(username__iexact=value).exclude(pk=current_user.pk).exists():
            raise EmailOrUsernameAlreadyExists()
        return value