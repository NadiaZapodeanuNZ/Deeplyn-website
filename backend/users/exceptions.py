
from rest_framework.exceptions import APIException
from rest_framework import status


class AppException(APIException):

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "An error occurred."
    default_code = "error"

    def __init__(self, message=None, code=None, details=None):
        self.message = message or self.default_detail
        self.code = code or self.default_code
        self.details = details or {}
        super().__init__(detail=self.message, code=self.code)


# ----------Exceptions for USER - REGISTER, LOGIN---------

class InvalidCredentials(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = "Invalid credentials. Try again!"
    default_code = "invalid_credentials"


class AccountNotActivated(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "Your account is not activated. Please verify your email first."
    default_code = "account_not_activated"


class EmailOrUsernameAlreadyExists(AppException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "An account with this email or username already exists."
    default_code = "email_or_username_already_exists"


class PasswordMismatch(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "The passwords you entered do not match."
    default_code = "password_mismatch"

class InvalidEmail(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Enter a valid email address!"
    default_code = "invalid_email"

class InvalidUsername(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Username must be between 4 and 32 characters!"
    default_code = "invalid_username"

class InvalidPasswordLength(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Password must be between 8 and 32 characters!"
    default_code = "invalid_password_length"

class InvalidPassword(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character!"
    default_code = "invalid_password"

class AllFieldsRequired(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "All fields are required."
    default_code = "all_fields_required"
    
# ------------------Exceptions for email verification---------


class TokenExpired(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "The verification code has expired. Please request a new one!"
    default_code = "token_expired"


class InvalidToken(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "The verification code is invalid."
    default_code = "invalid_token"


class TooManyAttempts(AppException):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = "Too many attempts. Please try again later!"
    default_code = "too_many_attempts"



# -----Exceptions for password reset---------

class InvalidResetToken(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "This password reset link is invalid or has expired."
    default_code = "invalid_reset_token"


class ResetTokenAlreadyUsed(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "This password reset link has already been used."
    default_code = "reset_token_used"

class MagicLinkExpired(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "This password reset link has expired. Please request a new one!"
    default_code = "magic_link_expired"

class InvalidMagicLink(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "This password reset link is invalid."
    default_code = "invalid_magic_link"

class MissingField(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "A required field is missing."
    default_code = "missing_field"

class InvalidVerificationRequest(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Invalid email or account already activated."
    default_code = "invalid_verification_request"

class NoVerificationFound(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "No verification found. Please register again."
    default_code = "no_verification_found"

class MissingRefreshToken(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = "Refresh token is required."
    default_code = "missing_refresh_token"