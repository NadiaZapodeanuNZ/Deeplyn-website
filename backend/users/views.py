import hmac
from tokenize import TokenError
from django.utils import timezone
from datetime import timedelta
import uuid
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import User, EmailVerification, PasswordReset
from users.serializers import  RegisterSerializer, LoginSerializer, ForgotPasswordSerializer, ResetPasswordSerializer
from users.utils import create_verification_and_send_email, format_block_message, send_forgot_password_email
from django.db.models import F
from django.db import transaction

MAX_FAILED_ATTEMPTS  = 5
BLOCK_DURATION_HOURS = 24
MAX_FORGOT_ATTEMPTS  = 5
FORGOT_BLOCK_MINUTES = 60
MAX_RESEND_ATTEMPTS  = 5


# -------------------------REGISTERRRRR-------------------------------------

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

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
    # so - i normalize the input :
    # no spaces, email in lowercase , token in uppercase

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
    # we try to find an INACTIVE user with this email (iexact - case insensitive)
    # if the user is active. we treat the same with "DON T EXIST!!!!"


    try:
        verification = user.email_verification
    except EmailVerification.DoesNotExist:
        return Response(
            {"error": "No verification found. Please register again."},
            status=status.HTTP_400_BAD_REQUEST,
        )


    # if verification.is_blocked():
    #     remaining = int((verification.blocked_until - timezone.now()).total_seconds() // 3600)
    #     return Response(
    #         {"error": f"Too many attempts. Try again in {remaining} hours."},
    #         status=status.HTTP_429_TOO_MANY_REQUESTS,
    #     )
    #this case is a bug - because when the user is unblocked, the counter didn t reset and it s not ok


    if verification.blocked_until and verification.blocked_until <= timezone.now():
        verification.failed_attempts = 0
        verification.blocked_until = None
        verification.save(update_fields=['failed_attempts', 'blocked_until'])
    #if the blockage period has passed, we reset the counter and unblock the user
    # and delete the blocked_until .

    if verification.is_blocked():
        return Response(
            {"error": format_block_message(verification.blocked_until)},
            # import from utils the function that formats
            #  the message with the remaining time
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )


    if verification.is_token_expired():
        return Response(
            {"error": "Token expired. Please request a new one."},
            status=status.HTTP_400_BAD_REQUEST,
        )


    if not hmac.compare_digest(verification.token, token):
        # Wrong token — we increment the counter ATOMICALLY using F().
        # F('failed_attempts') + 1 translates into an SQL UPDATE that
        # performs the increment directly on the server, 
        
        verification.failed_attempts = F('failed_attempts') + 1
        verification.save(update_fields=['failed_attempts'])

        verification.refresh_from_db(fields=['failed_attempts'])

        # if the user has reached the max failed attempts, we block the user for 24 hours
        if verification.failed_attempts >= MAX_FAILED_ATTEMPTS:
            verification.blocked_until = (timezone.now() + timedelta(hours=BLOCK_DURATION_HOURS))
            verification.save(update_fields=['blocked_until'])
            return Response(
                {"error": format_block_message(verification.blocked_until)},
                status=status.HTTP_429_TOO_MANY_REQUESTS)

        remaining = MAX_FAILED_ATTEMPTS - verification.failed_attempts
        return Response(
            {"error": f"Invalid token. {remaining} attempts remaining."},
            status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
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
    refresh_token = request.COOKIES.get('refresh_token')

    if not refresh_token:
        return Response(
            {"error": "Refresh token is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    response = Response(
        {"message": "Logout successful."},
        status=status.HTTP_200_OK,
    )
    response.delete_cookie('access_token')
    response.delete_cookie('refresh_token')

    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
    except TokenError:
        pass

    return response


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
    generic_success_response = Response(
        {"message": "If this email exists, a new code has been sent."},
        status=status.HTTP_200_OK,
    )

    try:
        user = User.objects.get(email__iexact=email, is_active=False)
    except User.DoesNotExist:
        return generic_success_response

    try:
        verification = user.email_verification
    except EmailVerification.DoesNotExist:
        return generic_success_response

    if verification.blocked_until and verification.blocked_until <= timezone.now():
        verification.resend_attempts = 0
        verification.blocked_until = None
        verification.save(update_fields=['resend_attempts', 'blocked_until'])

    if verification.is_blocked():
        remaining = (verification.blocked_until - timezone.now()).seconds // 3600
        return Response(
            {"error": f"Account temporarily blocked. Try again in {remaining} hours."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    verification.resend_attempts += 1
    if verification.resend_attempts >= MAX_RESEND_ATTEMPTS:
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
            "attempts_remaining": MAX_RESEND_ATTEMPTS - verification.resend_attempts,
        },
        status=status.HTTP_200_OK,
    )
#---------------------------LOGIN WITH LINK-------------------------
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_active": user.is_active,
        "date_joined": user.date_joined,
    }, status=status.HTTP_200_OK)