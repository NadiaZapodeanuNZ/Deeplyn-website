# from django.conf import settings
# from django.core.mail import EmailMultiAlternatives
# from django.template.loader import render_to_string
# from django.utils import timezone
# from decouple import config
# from .models import EmailVerification


# def create_verification_and_send_email(user):
#     """Generate a new verification token and send it to the user's email."""
#     token = generate_and_store_token(user)
#     send_verification_email(user, token)


# def generate_and_store_token(user):
#     """Create or update the EmailVerification record with a new 6-char token."""
#     verification, created = EmailVerification.objects.get_or_create(
#         user=user,
#         defaults={
#             'token': '',
#             'expires_at': timezone.now(),
#         }
#     )
#     return verification.generate_new_token()


# def send_verification_email(user, token):
#     """Send a verification email with the 6-character code."""
#     subject = "Activate your account"

#     # Plain text fallback for email clients without HTML support
#     text_content = (
#         f"Hello, {user.username}!\n\n"
#         f"To activate your account, use the verification code below:\n\n"
#         f"{token}\n\n"
#         f"This code is valid for 5 minutes.\n"
#         f"Do not share this code with anyone.\n\n"
#         f"If you did not create an account, please ignore this email!\n\n"
#         f"Best regards,\n"
#         f"Deeplyn"
#     )

#     # HTML version - uses a Django template for better design
#     html_content = render_to_string("emails/verification.html", {
#         "username": user.username,
#         "token": token,
#     })

#     email = EmailMultiAlternatives(
#         subject=subject,
#         body=text_content,
#         from_email=config('EMAIL_HOST_USER'),
#         to=[user.email],
#     )
#     email.attach_alternative(html_content, "text/html")
#     email.send()


# def send_forgot_password_email(user, token):
#     """Send a forgot password email with both a magic login link and a reset link."""
#     # FIX: Uses FRONTEND_URL from settings instead of hardcoded URL
#     # This makes it easy to change when deploying to production
#     frontend_url = settings.FRONTEND_URL

#     magic_link = f"{frontend_url}/login/with-link?token={token}"
#     reset_link = f"{frontend_url}/reset-password?token={token}"

#     subject = "Reset your Deeplyn password"

#     text_content = (
#         f"Hello, {user.username}!\n\n"
#         f"Login directly: {magic_link}\n\n"
#         f"Reset password: {reset_link}\n\n"
#         f"Both links expire in 15 minutes.\n\n"
#         f"Best regards,\nDeeplyn"
#     )

#     html_content = f"""
# <html>
# <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
#     <h2>Hello, <strong>{user.username}</strong>!</h2>
#     <p>We received a request to access your Deeplyn account.</p>
#     <p>You have two options:</p>
#     <p>
#         <a href="{magic_link}" 
#            style="background-color: #7c3aed; color: white; padding: 12px 24px; 
#                   text-decoration: none; border-radius: 8px; display: inline-block;">
#             Login directly (no password needed)
#         </a>
#     </p>
#     <p>
#         <a href="{reset_link}"
#            style="background-color: #e5e7eb; color: #333; padding: 12px 24px; 
#                   text-decoration: none; border-radius: 8px; display: inline-block;">
#             Reset your password instead
#         </a>
#     </p>
#     <p style="color: #888; font-size: 14px;">Both links expire in 15 minutes.</p>
#     <p>Best regards,<br><strong>Deeplyn</strong></p>
# </body>
# </html>
# """

#     email = EmailMultiAlternatives(
#         subject=subject,
#         body=text_content,
#         from_email=config('EMAIL_HOST_USER'),
#         to=[user.email],
#     )
#     email.attach_alternative(html_content, "text/html")
#     email.send(fail_silently=False)

from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
from .models import EmailVerification
from django.core.mail import EmailMessage
from django.core.mail import EmailMultiAlternatives
from decouple import config
from django.template.loader import render_to_string

def create_verification_and_send_email(user):
    token = generate_and_store_token(user)
    send_verification_email(user, token)

def generate_and_store_token(user):
    verification, created = EmailVerification.objects.get_or_create(
        user=user,
        defaults={
            'token': '',
            'expires_at': timezone.now(),
        }
    )
    return verification.generate_new_token()


def send_verification_email(user, token):
    subject = "Activate your account"

    # Plain text - fallback pentru clienti fara HTML
    text_content = (
        f"Hello, {user.username}!\n\n"
        f"To activate your account, use the verification code below:\n\n"
        f"{token}\n\n"
        f"This code is valid for 5 minutes.\n"
        f"Do not share this code with anyone.\n\n"
        f"If you did not create an account, please ignore this email!\n\n"
        f"Best regards,\n"
        f"Deeplyn"
    )

    # HTML - versiunea frumoasa
    html_content = render_to_string("emails/verification.html", {
        "username": user.username,
        "token": token,
    })

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_content,              # plain text obligatoriu
        from_email=config('EMAIL_HOST_USER'),
        to=[user.email],
    )
    email.attach_alternative(html_content, "text/html")  # adaugi HTML peste
    email.send()
    
def send_forgot_password_email(user, token):
    magic_link = f"http://localhost:5173/login/with-link?token={token}"
    reset_link = f"http://localhost:5173/reset-password?token={token}"

    subject = "Reset your Deeplyn password"

    text_content = (
        f"Hello, {user.username}!\n\n"
        f"Login directly: {magic_link}\n\n"
        f"Reset password: {reset_link}\n\n"
        f"Both links expire in 15 minutes.\n\n"
        f"Best regards,\nDeeplyn"
    )

    html_content = f"""
<html>
<body>
    <p>Hello, <strong>{user.username}</strong>!</p>
    <p>We received a request to access your Deeplyn account.</p>
    <p><a href="{magic_link}">Login directly (no password needed)</a></p>
    <p><a href="{reset_link}">Reset your password instead</a></p>
    <p>Both links expire in 15 minutes.</p>
    <p>Best regards,<br>Deeplyn</p>
</body>
</html>
"""

    email = EmailMultiAlternatives(
        subject = subject,
        body  = text_content,
        from_email = config('EMAIL_HOST_USER'),
        to  = [user.email],
    )
    email.attach_alternative(html_content, "text/html")
    email.send(fail_silently=False)