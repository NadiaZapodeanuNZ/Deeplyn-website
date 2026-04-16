# from django.utils import timezone
# from datetime import timedelta
# import uuid
# from rest_framework import status
# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import AllowAny, IsAuthenticated
# from rest_framework.response import Response
# from rest_framework_simplejwt.tokens import RefreshToken
# from users.models import User, EmailVerification, PasswordReset
# from users.serializers import (
#     RegisterSerializer, LoginSerializer,
#     ForgotPasswordSerializer, ResetPasswordSerializer,
# )
# from users.utils import create_verification_and_send_email, send_forgot_password_email

# # ──────────────────────────────────────────────────────────
# # RATE LIMITING CONSTANTS
# # Centralized here so they're easy to find and adjust
# # ──────────────────────────────────────────────────────────

# MAX_SEND_VERIFY_EMAIL_PER_20_MINUTES = 5
# BLOCK_DURATION_HOURS = 24
# MAX_FORGOT_ATTEMPTS = 5
# FORGOT_BLOCK_MINUTES = 60


# # ──────────────────────────────────────────────────────────
# # REGISTER
# # Creates a new user with is_active=False
# # Sends a verification email with a 6-character code
# # ──────────────────────────────────────────────────────────

# @api_view(['POST'])
# @permission_classes([AllowAny])
# def register(request):
#     serializer = RegisterSerializer(data=request.data)

#     if not serializer.is_valid():
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#     user = serializer.save()
#     create_verification_and_send_email(user)

#     return Response(
#         {
#             "message": "Account created. Please check your email to activate your account.",
#             "email": user.email,
#         },
#         status=status.HTTP_201_CREATED,
#     )


# # ──────────────────────────────────────────────────────────
# # VERIFY EMAIL
# # User enters the 6-character code received via email
# # If correct, activates the account (is_active = True)
# # Includes rate limiting: 5 wrong attempts = 24h block
# # ──────────────────────────────────────────────────────────

# @api_view(['POST'])
# @permission_classes([AllowAny])
# def verify_email(request):
#     email = request.data.get('email', '').strip().lower()
#     token = request.data.get('token', '').strip().upper()

#     if not email or not token:
#         return Response(
#             {"error": "Email and token are required."},
#             status=status.HTTP_400_BAD_REQUEST,
#         )

#     # Find the user - must exist and not be active yet
#     try:
#         user = User.objects.get(email__iexact=email, is_active=False)
#     except User.DoesNotExist:
#         return Response(
#             {"error": "Invalid email or account already activated."},
#             status=status.HTTP_400_BAD_REQUEST,
#         )

#     # Find the verification record
#     try:
#         verification = user.email_verification
#     except EmailVerification.DoesNotExist:
#         return Response(
#             {"error": "No verification found. Please register again."},
#             status=status.HTTP_400_BAD_REQUEST,
#         )

#     # Check if user is blocked from too many attempts
#     if verification.is_blocked():
#         remaining = int((verification.blocked_until - timezone.now()).total_seconds() // 3600)
#         return Response(
#             {"error": f"Too many attempts. Try again in {remaining} hours."},
#             status=status.HTTP_429_TOO_MANY_REQUESTS,
#         )

#     # Check if token has expired
#     if verification.is_token_expired():
#         return Response(
#             {"error": "Token expired. Please request a new one."},
#             status=status.HTTP_400_BAD_REQUEST,
#         )

#     # Check if token matches
#     if verification.token != token:
#         verification.resend_attempts += 1

#         if verification.resend_attempts >= 5:
#             verification.blocked_until = timezone.now() + timedelta(hours=24)
#             verification.save(update_fields=['resend_attempts', 'blocked_until'])
#             return Response(
#                 {"error": "Too many wrong attempts. Try again in 24 hours."},
#                 status=status.HTTP_429_TOO_MANY_REQUESTS,
#             )

#         remaining_attempts = 5 - verification.resend_attempts
#         verification.save(update_fields=['resend_attempts'])
#         return Response(
#             {"error": f"Invalid token. {remaining_attempts} attempts remaining."},
#             status=status.HTTP_400_BAD_REQUEST,
#         )

#     # Token is correct - activate the account
#     user.is_active = True
#     user.save(update_fields=['is_active'])
#     verification.delete()

#     return Response(
#         {"message": "Account activated successfully. You can now log in."},
#         status=status.HTTP_200_OK,
#     )


# # ──────────────────────────────────────────────────────────
# # RESEND VERIFICATION TOKEN
# # Generates a new 6-character code and sends it via email
# # Rate limited: 5 resends per window, then 24h block
# # ──────────────────────────────────────────────────────────

# @api_view(['POST'])
# @permission_classes([AllowAny])
# def resend_token(request):
#     email = request.data.get('email', '').strip().lower()

#     if not email:
#         return Response(
#             {"error": "Email is required."},
#             status=status.HTTP_400_BAD_REQUEST,
#         )

#     # Security: same response whether email exists or not
#     try:
#         user = User.objects.get(email__iexact=email, is_active=False)
#     except User.DoesNotExist:
#         return Response(
#             {"message": "If this email exists, a new code has been sent."},
#             status=status.HTTP_200_OK,
#         )

#     try:
#         verification = user.email_verification
#     except EmailVerification.DoesNotExist:
#         return Response(
#             {"error": "No verification found. Please register again."},
#             status=status.HTTP_400_BAD_REQUEST,
#         )

#     if verification.is_blocked():
#         remaining = (verification.blocked_until - timezone.now()).seconds // 3600
#         return Response(
#             {"error": f"Account temporarily blocked. Try again in {remaining} hours."},
#             status=status.HTTP_429_TOO_MANY_REQUESTS,
#         )

#     verification.resend_attempts += 1

#     if verification.resend_attempts >= MAX_SEND_VERIFY_EMAIL_PER_20_MINUTES:
#         verification.blocked_until = timezone.now() + timedelta(hours=BLOCK_DURATION_HOURS)
#         verification.save(update_fields=['resend_attempts', 'blocked_until'])
#         return Response(
#             {"error": "Too many attempts. Your account is temporarily blocked for 24 hours."},
#             status=status.HTTP_429_TOO_MANY_REQUESTS,
#         )

#     verification.save(update_fields=['resend_attempts'])
#     create_verification_and_send_email(user)

#     return Response(
#         {
#             "message": "A new verification code has been sent to your email.",
#             "attempts_remaining": MAX_SEND_VERIFY_EMAIL_PER_20_MINUTES - verification.resend_attempts,
#         },
#         status=status.HTTP_200_OK,
#     )


# # ──────────────────────────────────────────────────────────
# # LOGIN
# # Accepts email OR username as identifier
# # Returns JWT tokens stored in httpOnly cookies
# # Supports "remember me" for extended refresh token lifetime
# # ──────────────────────────────────────────────────────────

# @api_view(['POST'])
# @permission_classes([AllowAny])
# def login(request):
#     serializer = LoginSerializer(data=request.data)

#     if not serializer.is_valid():
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#     user = serializer.validated_data['user']
#     remember_me = serializer.validated_data['remember_me']

#     # Generate JWT token pair
#     refresh = RefreshToken.for_user(user)

#     # "Remember me" extends refresh token to 30 days instead of 7
#     if remember_me:
#         refresh.set_exp(lifetime=timedelta(days=30))

#     response = Response(
#         {"message": "Login successful."},
#         status=status.HTTP_200_OK,
#     )

#     # Store tokens in httpOnly cookies (more secure than localStorage)
#     # httpOnly=True means JavaScript cannot access these cookies
#     # This protects against XSS attacks stealing tokens
#     response.set_cookie(
#         key='access_token',
#         value=str(refresh.access_token),
#         httponly=True,
#         secure=False,     # Set True in production (HTTPS only)
#         samesite='Lax',
#         max_age=15 * 60,  # 15 minutes, matches ACCESS_TOKEN_LIFETIME
#     )
#     response.set_cookie(
#         key='refresh_token',
#         value=str(refresh),
#         httponly=True,
#         secure=False,     # Set True in production (HTTPS only)
#         samesite='Lax',
#         max_age=30 * 24 * 60 * 60 if remember_me else 7 * 24 * 60 * 60,
#     )

#     return response


# # ──────────────────────────────────────────────────────────
# # REFRESH TOKEN
# # Reads the refresh token from cookies
# # Returns a new access token in a cookie
# # ──────────────────────────────────────────────────────────

# @api_view(['POST'])
# @permission_classes([AllowAny])
# def refresh_token(request):
#     old_refresh_token = request.COOKIES.get('refresh_token')

#     if not old_refresh_token:
#         return Response(
#             {"error": "Refresh token is required."},
#             status=status.HTTP_401_UNAUTHORIZED,
#         )

#     try:
#         refresh = RefreshToken(old_refresh_token)

#         response = Response(
#             {"message": "Token refreshed."},
#             status=status.HTTP_200_OK,
#         )

#         response.set_cookie(
#             key='access_token',
#             value=str(refresh.access_token),
#             httponly=True,
#             secure=False,     # True in production
#             samesite='Lax',
#             max_age=15 * 60,
#         )

#         return response

#     except Exception:
#         return Response(
#             {"error": "Invalid or expired refresh token. Please log in again."},
#             status=status.HTTP_401_UNAUTHORIZED,
#         )


# # ──────────────────────────────────────────────────────────
# # LOGOUT
# # Blacklists the refresh token so it can't be reused
# # Deletes both cookies from the browser
# # BUG FIX: removed reference to non-existent is_logged_in field
# # ──────────────────────────────────────────────────────────

# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def logout(request):
#     try:
#         refresh_token_value = request.COOKIES.get('refresh_token')

#         if not refresh_token_value:
#             return Response(
#                 {"error": "Refresh token is required."},
#                 status=status.HTTP_400_BAD_REQUEST,
#             )

#         # Blacklist the refresh token so it cannot be reused
#         token = RefreshToken(refresh_token_value)
#         token.blacklist()

#         response = Response(
#             {"message": "Logout successful."},
#             status=status.HTTP_200_OK,
#         )

#         # Remove cookies from the browser
#         response.delete_cookie('access_token')
#         response.delete_cookie('refresh_token')

#         return response

#     except Exception:
#         return Response(
#             {"error": "Invalid token."},
#             status=status.HTTP_400_BAD_REQUEST,
#         )


# # ──────────────────────────────────────────────────────────
# # FORGOT PASSWORD
# # Sends an email with a magic login link AND a reset password link
# # Rate limited: 5 attempts per hour
# # Security: same response whether email exists or not
# # ──────────────────────────────────────────────────────────

# @api_view(['POST'])
# @permission_classes([AllowAny])
# def forgot_password(request):
#     serializer = ForgotPasswordSerializer(data=request.data)

#     if not serializer.is_valid():
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#     email = serializer.validated_data['email']

#     # Security: always return the same message whether email exists or not
#     # This prevents attackers from discovering which emails are registered
#     try:
#         user = User.objects.get(email__iexact=email, is_active=True)
#     except User.DoesNotExist:
#         return Response(
#             {"message": "If this email exists, a reset link has been sent."},
#             status=status.HTTP_200_OK,
#         )

#     # Get or create a reset record for this user
#     reset, _ = PasswordReset.objects.get_or_create(
#         user=user,
#         defaults={'expires_at': timezone.now()}
#     )

#     # If block period has passed, reset the counter
#     if reset.blocked_until and timezone.now() > reset.blocked_until:
#         reset.request_attempts = 0
#         reset.blocked_until = None
#         reset.save(update_fields=['request_attempts', 'blocked_until'])

#     # Check if currently blocked
#     if reset.is_blocked():
#         remaining = (reset.blocked_until - timezone.now()).seconds // 60
#         return Response(
#             {"error": f"Too many requests. Try again in {remaining} minutes."},
#             status=status.HTTP_429_TOO_MANY_REQUESTS,
#         )

#     reset.request_attempts += 1

#     # Block after too many attempts
#     if reset.request_attempts >= MAX_FORGOT_ATTEMPTS:
#         reset.blocked_until = timezone.now() + timedelta(minutes=FORGOT_BLOCK_MINUTES)
#         reset.save(update_fields=['request_attempts', 'blocked_until'])
#         return Response(
#             {"error": "Too many requests. Try again in 1 hour."},
#             status=status.HTTP_429_TOO_MANY_REQUESTS,
#         )

#     # Generate new token and send email
#     reset.token = uuid.uuid4()
#     reset.expires_at = timezone.now() + timedelta(minutes=15)
#     reset.is_used = False
#     reset.save(update_fields=['token', 'expires_at', 'is_used', 'request_attempts'])

#     send_forgot_password_email(user, reset.token)

#     return Response(
#         {"message": "If this email exists, a reset link has been sent."},
#         status=status.HTTP_200_OK,
#     )


# # ──────────────────────────────────────────────────────────
# # RESET PASSWORD
# # User clicks the reset link from email, enters new password
# # Validates password strength and confirms match
# # Marks token as used so it can't be reused
# # ──────────────────────────────────────────────────────────

# @api_view(['POST'])
# @permission_classes([AllowAny])
# def reset_password(request):
#     token = request.data.get('token', '').strip()

#     if not token:
#         return Response(
#             {"error": "Token is required."},
#             status=status.HTTP_400_BAD_REQUEST,
#         )

#     try:
#         reset = PasswordReset.objects.get(token=token, is_used=False)
#     except PasswordReset.DoesNotExist:
#         return Response(
#             {"error": "Invalid or already used token."},
#             status=status.HTTP_400_BAD_REQUEST,
#         )

#     if reset.is_expired():
#         return Response(
#             {"error": "Token expired. Please request a new one."},
#             status=status.HTTP_400_BAD_REQUEST,
#         )

#     serializer = ResetPasswordSerializer(data=request.data)
#     if not serializer.is_valid():
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#     # set_password hashes the password automatically
#     user = reset.user
#     user.set_password(serializer.validated_data['password'])
#     user.save(update_fields=['password'])

#     # Mark token as used so it cannot be reused
#     reset.is_used = True
#     reset.save(update_fields=['is_used'])

#     return Response(
#         {"message": "Password reset successfully. You can now log in."},
#         status=status.HTTP_200_OK,
#     )


# # ──────────────────────────────────────────────────────────
# # LOGIN WITH MAGIC LINK
# # User clicks the login link from the forgot password email
# # Logs them in directly without needing a password
# # ──────────────────────────────────────────────────────────

# @api_view(['GET'])
# @permission_classes([AllowAny])
# def login_with_link(request):
#     token = request.GET.get('token', '').strip()

#     if not token:
#         return Response(
#             {"error": "Token is required."},
#             status=status.HTTP_400_BAD_REQUEST,
#         )

#     try:
#         reset = PasswordReset.objects.get(token=token, is_used=False)
#     except PasswordReset.DoesNotExist:
#         return Response(
#             {"error": "Invalid or already used link."},
#             status=status.HTTP_400_BAD_REQUEST,
#         )

#     if reset.is_expired():
#         return Response(
#             {"error": "Link expired. Please request a new one."},
#             status=status.HTTP_400_BAD_REQUEST,
#         )

#     # Mark token as used - prevents reuse for both login and reset
#     reset.is_used = True
#     reset.save(update_fields=['is_used'])

#     user = reset.user
#     refresh = RefreshToken.for_user(user)

#     response = Response(
#         {
#             "message": "Login successful.",
#             "user": {
#                 "username": user.username,
#                 "email": user.email,
#             },
#         },
#         status=status.HTTP_200_OK,
#     )

#     response.set_cookie(
#         key='access_token',
#         value=str(refresh.access_token),
#         httponly=True,
#         secure=False,
#         samesite='Lax',
#         max_age=15 * 60,
#     )
#     response.set_cookie(
#         key='refresh_token',
#         value=str(refresh),
#         httponly=True,
#         secure=False,
#         samesite='Lax',
#         max_age=7 * 24 * 60 * 60,
#     )

#     return response


from django.utils import timezone
from datetime import timedelta
import uuid
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import User, EmailVerification, PasswordReset
from users.serializers import RegisterSerializer, LoginSerializer, ForgotPasswordSerializer, ResetPasswordSerializer
from users.utils import create_verification_and_send_email, send_forgot_password_email

MAX_SEND_VERIFY_EMAIL_PER_20_MINUTES  = 5
BLOCK_DURATION_HOURS = 24
MAX_FORGOT_ATTEMPTS  = 5
FORGOT_BLOCK_MINUTES = 60


# -------------------------REGISTERRRRR-------------------------------------

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.save()
    create_verification_and_send_email(user)

    return Response(
        {
            "message": "Account created. Please check your email to activate your account.",
            "email": user.email,
        },
        status=status.HTTP_201_CREATED,
    )

# ----------------------------EMAIL VERIFY--------------------------------

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    email = request.data.get('email', '').strip().lower()
    token = request.data.get('token', '').strip().upper()
    #if the email / token is not provided by the user, the default will be ''
    #actually, '' in Python is considerated FALSE

    if not email or not token:
        return Response(
            {"error": "Email and token are required."},
            status=status.HTTP_400_BAD_REQUEST)


    try:
        user = User.objects.get(email__iexact=email, is_active=False)
        # email__iexact=email is case INsensitive, that means that maria@gmail.com is the same with Maria@GmAil.com
    except User.DoesNotExist:
        return Response(
            {"error": "Invalid email or account already activated."},
            status=status.HTTP_400_BAD_REQUEST)

    try:
        verification = user.email_verification
    except EmailVerification.DoesNotExist:
        return Response(
            {"error": "No verification found. Please register again."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if verification.is_blocked():
        remaining = int((verification.blocked_until - timezone.now()).total_seconds() // 3600)
        return Response(
            {"error": f"Too many attempts. Try again in {remaining} hours."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    if verification.is_token_expired():
        return Response(
            {"error": "Token expired. Please request a new one."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if verification.token != token:
        verification.resend_attempts += 1

        if verification.resend_attempts >= 5:
            verification.blocked_until = timezone.now() + timedelta(hours=24)
            verification.save(update_fields=['resend_attempts', 'blocked_until'])
            return Response(
                {"error": "Too many wrong attempts. Try again in 24 hours."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        
        remaining_attempts = 5 - verification.resend_attempts
        verification.save(update_fields=['resend_attempts'])
        return Response(
            {"error": f"Invalid token. {remaining_attempts} attempts remaining."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    user.is_active = True
    user.save(update_fields=['is_active'])
    verification.delete()

    return Response(
        {"message": "Account activated successfully. You can now log in."},
        status=status.HTTP_200_OK,
    )

# -------------------------LOGIN-----------------------------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):

    serializer = LoginSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.validated_data['user']
    remember_me = serializer.validated_data['remember_me']

    # generate the tokens for jwt
    refresh = RefreshToken.for_user(user)

    # remember me it will refresh the token after 30 days (else 7)
    if remember_me:
        refresh.set_exp(lifetime=timedelta(days=30))


    response = Response(
        {
            "message":"Login successful."
        },
        status=status.HTTP_200_OK,
    )
    response.set_cookie(
        key = 'access_token',
        value = str(refresh.access_token),
        httponly = True,
        secure = False,  # False in development, True in production
        samesite = 'Lax',
        max_age  = 15 * 60
    )
    response.set_cookie(
        key = 'refresh_token',
        value = str(refresh),
        httponly = True,
        secure = False,  # False in development, True in production
        samesite = 'Lax',
        max_age = 30 * 24 * 60 * 60 if remember_me else 7 * 24 * 60 * 60
    )
    return response
# --------------------------REFRESH-TOKENNNN----------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    old_refresh_token = request.COOKIES.get('refresh_token')

    if not old_refresh_token:
        return Response(
            {"error": "Refresh token is required."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        
        refresh = RefreshToken(old_refresh_token)

        response = Response(
            {"message": "Token refreshed."},
            status=status.HTTP_200_OK,
        )

        # setam noul access token in cookie
        response.set_cookie(
            key = 'access_token',
            value = str(refresh.access_token),
            httponly = True,
            secure = False,  # True in productie
            samesite = 'Lax',
            max_age = 15 * 60
        )

        return response

    except Exception:
        return Response(
            {"error": "Invalid or expired refresh token. Please log in again."},
            status=status.HTTP_401_UNAUTHORIZED,
        )
# ------------------------ LOGOUT -----------------------------------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.COOKIES.get('refresh_token')

        if not refresh_token:
            return Response(
                {"error": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        token = RefreshToken(refresh_token)
        token.blacklist()

        request.user.is_logged_in = False
        request.user.save(update_fields=['is_logged_in'])

        response = Response(
            {"message": "Logout successful."},
            status=status.HTTP_200_OK,
        )

        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')

        return response

    except Exception as e:
        return Response(
            {"error": "Invalid token."},
            status=status.HTTP_400_BAD_REQUEST,
        )

# -----------------FORGOT PASSWORD-----------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    serializer = ForgotPasswordSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email']

    try:
        user = User.objects.get(email__iexact=email, is_active=True)
    except User.DoesNotExist:
        return Response(
            {"message": "If this email exists, a reset link has been sent."},
            status=status.HTTP_200_OK,
        )

    reset, _ = PasswordReset.objects.get_or_create(
        user=user,
        defaults={'expires_at': timezone.now()}
    )

    
    if reset.blocked_until and timezone.now() > reset.blocked_until:
        reset.request_attempts = 0
        reset.blocked_until    = None
        reset.save(update_fields=['request_attempts', 'blocked_until'])


    if reset.is_blocked():
        remaining = (reset.blocked_until - timezone.now()).seconds // 60
        return Response(
            {"error": f"Too many requests. Try again in {remaining} minutes."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    reset.request_attempts += 1

    # daca a depasit limita, il blocam 1 ora
    if reset.request_attempts >= MAX_FORGOT_ATTEMPTS:
        reset.blocked_until = timezone.now() + timedelta(minutes=FORGOT_BLOCK_MINUTES)
        reset.save(update_fields=['request_attempts', 'blocked_until'])
        return Response(
            {"error": "Too many requests. Try again in 1 hour."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    reset.token = uuid.uuid4()
    reset.expires_at = timezone.now() + timedelta(minutes=15)
    reset.is_used = False
    reset.save(update_fields=['token', 'expires_at', 'is_used', 'request_attempts'])

    send_forgot_password_email(user, reset.token)

    return Response(
        {"message": "If this email exists, a reset link has been sent."},
        status=status.HTTP_200_OK,
    )

# ------------------------------------RESET PASSWORD-------------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    # we get the token from URL , when the user clicked it
    token = request.data.get('token', '').strip()

    if not token:
        return Response(
            {"error": "Token is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # we will search the token in database and we set is_used is false
    # so it can be used 2 times
    try:
        reset = PasswordReset.objects.get(token=token, is_used=False)
    except PasswordReset.DoesNotExist:
        return Response(
            {"error": "Invalid or already used token."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # if the link is expired
    if reset.is_expired():
        return Response(
            {"error": "Token expired. Please request a new one."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # we need to validate the new password!!!!!!
    serializer = ResetPasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # set_password is a good method that hashes the passwords
    user = reset.user
    user.set_password(serializer.validated_data['password'])
    user.save(update_fields=['password'])

    # after that, the token is used = true so no one can access the link again!!!!!
    reset.is_used = True
    reset.save(update_fields=['is_used'])

    return Response(
        {"message": "Password reset successfully. You can now log in."},
        status=status.HTTP_200_OK,
    )
# ---------------------RESEND TOKEN0-------------
@api_view(['POST'])
@permission_classes([AllowAny])
def resend_token(request):
    email = request.data.get('email', '').strip().lower()

    if not email:
        return Response(
            {"error": "Email is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = User.objects.get(email__iexact=email, is_active=False)
    except User.DoesNotExist:
        return Response(
            {"message": "If this email exists, a new code has been sent."},
            status=status.HTTP_200_OK,
        )

    try:
        verification = user.email_verification
    except EmailVerification.DoesNotExist:
        return Response(
            {"error": "No verification found. Please register again."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if verification.is_blocked():
        remaining = (verification.blocked_until - timezone.now()).seconds // 3600
        return Response(
            {"error": f"Account temporarily blocked. Try again in {remaining} hours."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    verification.resend_attempts += 1

    if verification.resend_attempts >= MAX_SEND_VERIFY_EMAIL_PER_20_MINUTES:
        verification.blocked_until = timezone.now() + timedelta(hours=BLOCK_DURATION_HOURS)
        verification.save(update_fields=['resend_attempts', 'blocked_until'])
        return Response(
            {"error": "Too many attempts. Your account is temporarily blocked for 24 hours."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    verification.save(update_fields=['resend_attempts'])

    create_verification_and_send_email(user)

    return Response(
        {
            "message": "A new verification code has been sent to your email.",
            "attempts_remaining": MAX_SEND_VERIFY_EMAIL_PER_20_MINUTES - verification.resend_attempts,
        },
        status=status.HTTP_200_OK,
    )

@api_view(['GET'])
@permission_classes([AllowAny])
def login_with_link(request):
    token = request.GET.get('token', '').strip()

    if not token:
        return Response({"error": "Token is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        reset = PasswordReset.objects.get(token=token, is_used=False)
    except PasswordReset.DoesNotExist:
        return Response({"error": "Invalid or already used link."}, status=status.HTTP_400_BAD_REQUEST)

    if reset.is_expired():
        return Response({"error": "Link expired. Please request a new one."}, status=status.HTTP_400_BAD_REQUEST)

    # marcam tokenul ca folosit — nu mai poate fi folosit nici pentru reset, nici pentru login
    reset.is_used = True
    reset.save(update_fields=['is_used'])

    user = reset.user
    refresh = RefreshToken.for_user(user)


    response = Response(
        {"message": "Login successful.", "user": {"username": user.username, "email": user.email}},
        status=status.HTTP_200_OK,
    )
    response.set_cookie(key='access_token',  value=str(refresh.access_token), httponly=True, secure=False, samesite='Lax', max_age=15 * 60)
    response.set_cookie(key='refresh_token', value=str(refresh),              httponly=True, secure=False, samesite='Lax', max_age=7 * 24 * 60 * 60)
    return response
