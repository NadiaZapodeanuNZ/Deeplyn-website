import hmac
import traceback
from tokenize import TokenError
from django.utils import timezone
from datetime import timedelta
import uuid
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from journal.models import Journal
from users.exceptions import InvalidResetToken, InvalidToken, NewPasswordSameAsOld, TokenExpired, TooManyAttempts, MissingField, InvalidVerificationRequest, ResetTokenAlreadyUsed, MagicLinkExpired, InvalidMagicLink
from users.exceptions import(AllFieldsRequired, MissingRefreshToken, NoVerificationFound)
from users.models import ClientTherapist, TherapistProfile, User, EmailVerification, PasswordReset
from users.serializers import  ChangePasswordSerializer, RegisterSerializer, LoginSerializer, ForgotPasswordSerializer, ResetPasswordSerializer, TherapistRegisterSerializer, UpdateProfilePhotoSerializer
from users.utils import create_verification_and_send_email, format_block_message, send_crisis_email, send_forgot_password_email
from django.db.models import F
from django.db import transaction
from config.permissions import IsClient, IsTherapist

MAX_FAILED_ATTEMPTS = 5
BLOCK_DURATION_HOURS = 24
MAX_FORGOT_ATTEMPTS = 5
FORGOT_BLOCK_MINUTES = 60
MAX_RESEND_ATTEMPTS = 5



@api_view(['POST'])
@permission_classes([AllowAny])
def register_client(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user = serializer.save()
    Journal.objects.create(user=user)
    create_verification_and_send_email(user)

    return Response(
        {
            "message": "Account created. Please check your email to activate your account.",
            "email": user.email
        },
        status=status.HTTP_201_CREATED
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def register_therapist(request):
    serializer = TherapistRegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    create_verification_and_send_email(user)
    return Response(
        {
            "message": "Account created. Please check your email to activate your account.",
            "email": user.email
        },status=status.HTTP_201_CREATED)
    


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    email = request.data.get('email', '').strip().lower()
    token = request.data.get('token', '').strip().upper()
    if not email or not token:
        raise MissingField(message="Email and token are required.")
    
    try:
        user = User.objects.get(email__iexact=email, is_active=False)
    except User.DoesNotExist:
        raise InvalidVerificationRequest()
    
    try:
        verification = user.email_verification
    except EmailVerification.DoesNotExist:
        raise NoVerificationFound()

    if verification.blocked_until and verification.blocked_until <= timezone.now():
        verification.failed_attempts = 0
        verification.blocked_until = None
        verification.save(update_fields=['failed_attempts', 'blocked_until'])

    if verification.is_blocked():
        raise TooManyAttempts(message=format_block_message(verification.blocked_until))


    if verification.is_token_expired():
        raise TokenExpired()


    if not hmac.compare_digest(verification.token, token):
        verification.failed_attempts = F('failed_attempts') + 1
        verification.save(update_fields=['failed_attempts'])
        verification.refresh_from_db(fields=['failed_attempts'])

        if verification.failed_attempts >= MAX_FAILED_ATTEMPTS:
            verification.blocked_until = (timezone.now() + timedelta(hours=BLOCK_DURATION_HOURS))
            verification.save(update_fields=['blocked_until'])
            raise TooManyAttempts(message=format_block_message(verification.blocked_until))

        remaining = MAX_FAILED_ATTEMPTS - verification.failed_attempts
        raise InvalidToken(message=f"Invalid token. {remaining} attempts remaining.")

    with transaction.atomic():
        user.is_active = True
        user.save(update_fields=['is_active'])
        verification.delete()

    return Response(
        {"message": "Account activated successfully. You can now log in."},
        status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data['user']
    remember_me = serializer.validated_data['remember_me']
    refresh = RefreshToken.for_user(user)

    if remember_me:
        refresh.set_exp(lifetime=timedelta(days=30))
    
    response = Response({"message": "Login successful."}, status=status.HTTP_200_OK)
    response.set_cookie(key='access_token', value=str(refresh.access_token), httponly=True, secure=False, samesite='Lax', max_age=15*60)
    response.set_cookie(key='refresh_token', value=str(refresh), httponly=True, secure=False, samesite='Lax', max_age=30*24*60*60 if remember_me else 7*24*60*60)
    return response


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    old_refresh_token = request.COOKIES.get('refresh_token')

    if not old_refresh_token:
        raise InvalidToken(message="Refresh token is required!")
    
    try:
        refresh = RefreshToken(old_refresh_token)
    except Exception:
        raise InvalidToken()
    
    response = Response(
            {"message": "Token refreshed."},
            status=status.HTTP_200_OK)

    response.set_cookie(key = 'access_token', value = str(refresh.access_token), httponly = True,
                        secure = False, samesite = 'Lax', max_age = 15 * 60)

    return response
      



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):

    refresh_token = request.COOKIES.get('refresh_token')

    if not refresh_token:
        raise MissingRefreshToken()
    
    response = Response(
        {"message": "Logout successful."},
        status=status.HTTP_200_OK)
    
    response.delete_cookie('access_token')
    response.delete_cookie('refresh_token')

    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
    except TokenError:
        pass

    return response


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    serializer = ForgotPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data['email']

    try:
        user = User.objects.get(email__iexact=email, is_active=True)
    except User.DoesNotExist:
        return Response(
            {"message": "If this email exists, a reset link has been sent."},
            status=status.HTTP_200_OK)

    reset, _ = PasswordReset.objects.get_or_create(user=user,defaults={'expires_at': timezone.now()})

    
    if reset.blocked_until and timezone.now() > reset.blocked_until:
        reset.request_attempts = 0
        reset.blocked_until = None
        reset.save(update_fields=['request_attempts', 'blocked_until'])


    if reset.is_blocked():
        remaining = (reset.blocked_until - timezone.now()).seconds // 60
        raise TooManyAttempts(message=format_block_message(reset.blocked_until))

    reset.request_attempts += 1

    if reset.request_attempts >= MAX_FORGOT_ATTEMPTS:
        reset.blocked_until = timezone.now() + timedelta(minutes=FORGOT_BLOCK_MINUTES)
        reset.save(update_fields=['request_attempts', 'blocked_until'])
        raise TooManyAttempts(message="Too many attempts. Try again in 1 hour!")

    reset.token = uuid.uuid4()
    reset.expires_at = timezone.now() + timedelta(minutes=15)
    reset.is_used = False
    reset.save(update_fields=['token', 'expires_at', 'is_used', 'request_attempts'])

    send_forgot_password_email(user, reset.token)

    return Response(
        {"message": "If this email exists, a reset link has been sent."},
        status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    token = request.data.get('token', '').strip()

    if not token:
        raise MissingField(message="Token is required.")

    try:
        reset = PasswordReset.objects.get(token=token, is_used=False)
    except PasswordReset.DoesNotExist:
        raise InvalidResetToken()

    if reset.is_expired():
        raise TokenExpired()

    serializer = ResetPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user = reset.user
    
    if user.check_password(serializer.validated_data['password']):
        raise NewPasswordSameAsOld()

    user.set_password(serializer.validated_data['password'])
    user.save(update_fields=['password'])

    reset.is_used = True
    reset.save(update_fields=['is_used'])

    return Response(
        {"message": "Password reset successfully. You can now log in."},
        status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def resend_token(request):
    email = request.data.get('email', '').strip().lower()

    if not email:
        raise MissingField(message="Email is required.")

    generic_success_response = Response(
        {"message": "If this email exists, a new code has been sent."},
        status=status.HTTP_200_OK)

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
            status=status.HTTP_429_TOO_MANY_REQUESTS)

    verification.resend_attempts += 1
    if verification.resend_attempts >= MAX_RESEND_ATTEMPTS:
        verification.blocked_until = timezone.now() + timedelta(hours=BLOCK_DURATION_HOURS)
        verification.save(update_fields=['resend_attempts', 'blocked_until'])
        return Response(
            {"error": "Too many attempts. Your account is temporarily blocked for 24 hours."},
            status=status.HTTP_429_TOO_MANY_REQUESTS)

    verification.save(update_fields=['resend_attempts'])
    create_verification_and_send_email(user)

    return Response(
        {
            "message": "A new verification code has been sent to your email.",
            "attempts_remaining": MAX_RESEND_ATTEMPTS - verification.resend_attempts,
        },
        status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def login_with_link(request):
    token = request.GET.get('token', '').strip()

    if not token:
        raise MissingField(message="Token is required.")

    try:
        reset = PasswordReset.objects.get(token=token, is_used=False)
    except PasswordReset.DoesNotExist:
        raise InvalidMagicLink()

    if reset.is_expired():
        raise MagicLinkExpired()

    reset.is_used = True
    reset.save(update_fields=['is_used'])

    user = reset.user
    refresh = RefreshToken.for_user(user)

    response = Response(
        {
            "message": "Login successful.",
            "user": {
                "username": user.username,
                "email": user.email,
                "role": user.role,
            }
        },
        status=status.HTTP_200_OK)
    
    response.set_cookie(key='access_token', value=str(refresh.access_token), httponly=True,
                        secure=False, samesite='Lax', max_age=15 * 60)
    response.set_cookie(key='refresh_token', value=str(refresh), httponly=True,
                        secure=False, samesite='Lax', max_age=7 * 24 * 60 * 60)
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    data = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "date_joined": user.date_joined,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "profile_photo": request.build_absolute_uri(user.profile_photo.url) if user.profile_photo else None,
        "country": str(user.country.name) if user.country else None}
    
    if user.is_therapist and hasattr(user, 'therapist'):
        data["therapist_status"] = user.therapist.request_status
        data["is_accepting_clients"] = user.therapist.is_accepting_clients
        data["bio"] = user.therapist.bio
        data["specializations"] = user.therapist.specializations

    if user.is_client:
        data["has_active_therapist"] = ClientTherapist.objects.filter(
            client=user,
            status=ClientTherapist.Status.ACTIVE
        ).exists()

    return Response(data, status=status.HTTP_200_OK)



@api_view(['GET'])
@permission_classes([IsAuthenticated,IsClient])
def available_therapists(request):
    therapists = TherapistProfile.objects.select_related('user').filter(
        request_status=TherapistProfile.RequestStatus.APPROVED,
        is_accepting_clients=True)
    data = [
        {
            "id": t.user.id,
            "username": t.user.username,
            "first_name": t.user.first_name,
            "last_name": t.user.last_name,
            "bio": t.bio,
            "email": t.user.email,
            "specializations": t.specializations,
            "profile_photo": request.build_absolute_uri(t.user.profile_photo.url) if t.user.profile_photo else None,
            "is_accepting_clients": t.is_accepting_clients,
            "country": str(t.user.country.name) if t.user.country else None
        }
        for t in therapists
    ]
    return Response(data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsClient])
def request_therapist(request, therapist_id):
    try:
        therapist_profile = TherapistProfile.objects.get(
            user_id=therapist_id,
            request_status=TherapistProfile.RequestStatus.APPROVED,
            is_accepting_clients=True
        )
    except TherapistProfile.DoesNotExist:
        return Response(
            {"message": "Therapist not found or not available."},
            status=status.HTTP_404_NOT_FOUND
        )

    already_exists = ClientTherapist.objects.filter(client=request.user,status__in=[ClientTherapist.Status.PENDING, ClientTherapist.Status.ACTIVE]).exists()

    if already_exists:
        return Response(
            {"message": "You already have an active or pending therapist relationship."},
            status=status.HTTP_400_BAD_REQUEST
        )

    ClientTherapist.objects.create(client=request.user,therapist=therapist_profile.user,status=ClientTherapist.Status.PENDING)
    return Response(
        {"message": "Request sent successfully. Waiting for therapist approval."},
        status=status.HTTP_201_CREATED
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsTherapist])
def accept_client(request, client_id):
    try:
        relation = ClientTherapist.objects.get(
            client_id=client_id,
            therapist=request.user,
            status=ClientTherapist.Status.PENDING
        )
    except ClientTherapist.DoesNotExist:
        return Response(
            {"message": "Request not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    relation.status = ClientTherapist.Status.ACTIVE
    relation.save(update_fields=['status'])

    return Response(
        {"message": "Client accepted successfully."},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsTherapist])
def reject_client(request, client_id):
    try:
        relation = ClientTherapist.objects.get(
            client_id=client_id,
            therapist=request.user,
            status=ClientTherapist.Status.PENDING
        )
    except ClientTherapist.DoesNotExist:
        return Response(
            {"message": "Request not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    relation.status = ClientTherapist.Status.REJECTED
    relation.save(update_fields=['status'])

    return Response(
        {"message": "Client request rejected."},
        status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated,IsTherapist])
def pending_requests(request):
    requests = ClientTherapist.objects.select_related('client').filter(therapist=request.user,status=ClientTherapist.Status.PENDING)
    data = [
        {
            "client_id": r.client.id,
            "username": r.client.username,
            "first_name": r.client.first_name,
            "last_name": r.client.last_name,
            "requested_at": r.created_at,
            "email": r.client.email,
        }
        for r in requests
    ]

    return Response(data, status=status.HTTP_200_OK)



@api_view(['GET'])
@permission_classes([IsAuthenticated,IsClient])
def my_therapist(request):
    relation = ClientTherapist.objects.select_related('therapist','therapist__therapist'
    ).filter(client=request.user,status=ClientTherapist.Status.ACTIVE
    ).first()

    if not relation:
        return Response(
            {"message": "You don't have an active therapist."},
            status=status.HTTP_404_NOT_FOUND )

    therapist = relation.therapist
    therapist_profile = therapist.therapist

    from journal.models import SharedNote
    shared_notes_count = SharedNote.objects.filter(client=request.user,therapist=therapist).count()

    from quiz.models import DailyQuizAnswer
    quiz_shared_count = DailyQuizAnswer.objects.filter(daily_quiz__client=request.user,is_shared_by_client=True).count()

    from exercises.models import ExerciseCompletion
    exercises_shared_count = ExerciseCompletion.objects.filter(client=request.user,is_shared_with_therapist=True).count()

    photo_url = None
    if therapist.profile_photo:
        photo_url = request.build_absolute_uri(therapist.profile_photo.url)
    
    
    
    data = {
        "id": therapist.id,
        "username": therapist.username,
        "first_name": therapist.first_name,
        "last_name": therapist.last_name,
        "country": str(therapist.country.name) if therapist.country else None,
        "profile_photo": photo_url,
        "bio": therapist_profile.bio,
        "email": therapist.email,
        "specializations": therapist_profile.specializations,
        "connected_since": relation.created_at,
        "stats": {
            "shared_notes": shared_notes_count,
            "exercises_done": exercises_shared_count,
            "quiz_done": quiz_shared_count}
    }
    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsClient])
def dashboard_stats(request):
    from journal.models import Note
    from exercises.models import ExerciseCompletion
    from quiz.models import DailyQuizAnswer
    from django.db.models import DateField
    from django.db.models.functions import TruncDate
    from datetime import date, timedelta

    user = request.user
    journal_notes = Note.objects.filter(journal__user=user).count()
    exercises_done = ExerciseCompletion.objects.filter(client=user).count()
    print(f"USER: {user.username}, EXERCISES: {exercises_done}")

    quizzes_done = DailyQuizAnswer.objects.filter(daily_quiz__client=user,is_submitted=True).values('daily_quiz').distinct().count()

    note_dates = Note.objects.filter(journal__user=user).annotate(d=TruncDate('created_at')).values_list('d', flat=True)

    exercise_dates = ExerciseCompletion.objects.filter(client=user).annotate(d=TruncDate('completed_at')).values_list('d', flat=True)
    quiz_dates = DailyQuizAnswer.objects.filter(daily_quiz__client=user,is_submitted=True
    ).annotate(
        d=TruncDate('submitted_at')
    ).values_list('d', flat=True)

    all_active_days = set(note_dates) | set(exercise_dates) | set(quiz_dates)
    all_active_days.discard(None)

    streak = 0
    current = date.today()
    while current in all_active_days:
        streak += 1
        current -= timedelta(days=1)

    data = {
        "day_streak": streak,
        "quizzes_done": quizzes_done,
        "journal_notes": journal_notes,
        "exercises_done": exercises_done,
    }
    return Response(data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def end_relationship(request, client_id=None):
    user = request.user

    if user.is_client:
        relation = ClientTherapist.objects.filter(client=user,status=ClientTherapist.Status.ACTIVE).first()
        if not relation:
            return Response(
                {"message": "You don't have an active therapist relationship."},
                status=status.HTTP_404_NOT_FOUND
            )

    elif user.is_therapist:
        if not client_id:
            return Response(
                {"message": "Client ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        relation = ClientTherapist.objects.filter(therapist=user,client_id=client_id,status=ClientTherapist.Status.ACTIVE).first()
        if not relation:
            return Response(
                {"message": "No active relationship found with this client."},
                status=status.HTTP_404_NOT_FOUND)

    else:
        return Response(
            {"message": "Only clients and therapists can end relationships."},
            status=status.HTTP_403_FORBIDDEN
        )

    relation.end_collaboration()

    return Response(
        {"message": "Relationship ended successfully."},
        status=status.HTTP_200_OK
    )



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crisis_alert(request):
    relation = ClientTherapist.objects.filter(client=request.user,status=ClientTherapist.Status.ACTIVE).first()
 
    if not relation:
        return Response(
            {"message": "You don't have an active therapist to alert."},
            status=status.HTTP_404_NOT_FOUND
        )
 
    message = request.data.get('message', '').strip()
 
    from users.models import CrisisAlert
    CrisisAlert.objects.create(client=request.user,therapist=relation.therapist, message=message)
 
    send_crisis_email(
        therapist=relation.therapist,
        client=request.user,
        message=message
    )
 
    return Response(
        {"message": "Alert sent successfully."},
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTherapist])
def my_clients(request):
    from journal.models import SharedNote

    relations = ClientTherapist.objects.select_related('client').filter(therapist=request.user,status=ClientTherapist.Status.ACTIVE)

    data = [
        {"client_id": r.client.id,
        "username": r.client.username,
        "first_name": r.client.first_name,
        "last_name": r.client.last_name,
        "email": r.client.email,
        "profile_photo": request.build_absolute_uri(r.client.profile_photo.url) if r.client.profile_photo else None,
        "connected_since": r.created_at,
        "shared_notes_count": SharedNote.objects.filter(client=r.client, therapist=request.user).count()}
        for r in relations
    ]

    return Response(data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(
        {"message": "Password changed successfully."},
        status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile_photo(request):
    serializer = UpdateProfilePhotoSerializer(request.user, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()

    photo_url = None
    if request.user.profile_photo:
        photo_url = request.build_absolute_uri(request.user.profile_photo.url)

    return Response(
        {"message": "Profile photo updated.", "profile_photo": photo_url},
        status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_username(request):
    new_username = request.data.get('username', '').strip()

    if not new_username:
        return Response(
            {"error": {"message": "Username is required."}},
            status=status.HTTP_400_BAD_REQUEST)

    if not (4 <= len(new_username) <= 32):
        return Response(
            {"error": {"message": "Username must be between 4 and 32 characters."}},
            status=status.HTTP_400_BAD_REQUEST)

    if new_username.lower() == request.user.username.lower():
        return Response(
            {"error": {"message": "This is already your username."}},
            status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username__iexact=new_username).exclude(pk=request.user.pk).exists():
        return Response(
            {"error": {"message": "This username is already taken."}},
            status=status.HTTP_400_BAD_REQUEST)

    request.user.username = new_username
    request.user.save(update_fields=['username'])

    return Response(
        {"message": "Username updated.", "username": request.user.username},
        status=status.HTTP_200_OK)



@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_account(request):
    password = request.data.get('password', '')

    if not password:
        return Response(
            {"error": {"message": "Password is required to delete your account."}},
            status=status.HTTP_400_BAD_REQUEST)

    if not request.user.check_password(password):
        return Response(
            {"error": {"message": "Incorrect password."}},
            status=status.HTTP_400_BAD_REQUEST)

    request.user.delete()

    response = Response(
        {"message": "Account deleted."},
        status=status.HTTP_200_OK)
    response.delete_cookie('access_token')
    response.delete_cookie('refresh_token')
    return response


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsTherapist])
def update_accepting_clients(request):
    profile = request.user.therapist

    accepting = request.data.get("is_accepting_clients")

    if accepting is None:
        return Response(
            {"error": {"message": "is_accepting_clients is required."}},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not isinstance(accepting, bool):
        return Response(
            {"error": {"message": "is_accepting_clients must be a boolean."}},
            status=status.HTTP_400_BAD_REQUEST
        )

    profile.is_accepting_clients = accepting
    profile.save(update_fields=["is_accepting_clients"])

    return Response(
        {"message": "Preference updated.", "is_accepting_clients": profile.is_accepting_clients},
        status=status.HTTP_200_OK
    )

@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsTherapist])
def update_bio(request):
    profile = request.user.therapist
    bio = request.data.get('bio', '').strip()

    if len(bio) > 250:
        return Response(
            {"error": {"message": "Bio must be maximum 250 characters."}},
            status=status.HTTP_400_BAD_REQUEST)

    profile.bio = bio
    profile.save(update_fields=['bio'])

    return Response(
        {"message": "Bio updated.", "bio": profile.bio},
        status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsTherapist])
def update_specializations(request):
    ALLOWED = {
        "ADHD", "Addiction", "Anxiety", "Career", "child_adolescent",
        "Depression", "eating_disorders", "Grief", "personality_disorders",
        "PTSD", "Trauma", "OCD", "Relationships", "Stress", "Suicide", "Treatment"
    }

    profile = request.user.therapist
    specializations = request.data.get('specializations', [])

    if not isinstance(specializations, list):
        return Response(
            {"error": {"message": "Specializations must be a list."}},
            status=status.HTTP_400_BAD_REQUEST)

    if len(specializations) > 5:
        return Response(
            {"error": {"message": "You cannot select more than 5 specializations."}},
            status=status.HTTP_400_BAD_REQUEST)

    for spec in specializations:
        if spec not in ALLOWED:
            return Response(
                {"error": {"message": f"'{spec}' is not a valid specialization."}},
                status=status.HTTP_400_BAD_REQUEST)

    profile.specializations = specializations
    profile.save(update_fields=['specializations'])

    return Response(
        {"message": "Specializations updated.", "specializations": profile.specializations},
        status=status.HTTP_200_OK)