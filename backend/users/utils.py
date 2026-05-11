
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
from .models import EmailVerification
from django.core.mail import EmailMessage
from django.core.mail import EmailMultiAlternatives
from decouple import config
from django.template.loader import render_to_string
import datetime

#--------------BLOCK MESSAGE - USER BLOCKED - TOO MANY ATTEMPTS-----------------

def format_block_message(blocked_until):

    delta = blocked_until - timezone.now()
    total_minutes = max(0, int(delta.total_seconds() // 60))

    if total_minutes >= 60:
        hours = total_minutes // 60
        unit = "hour" if hours == 1 else "hours"
        return f"Too many attempts. Try again in {hours} {unit}."

    # if less than 60 minutes, show minutes
    unit = "minute" if total_minutes == 1 else "minutes"
    return f"Too many attempts. Try again in {total_minutes} {unit}."

# ------------------EMAIL VERIFICATION - TOKEN GENERATION AND SENDING-----------------

def create_verification_and_send_email(user):
    token = generate_and_store_token(user)
    send_verification_email(user, token)


def generate_and_store_token(user):
    verification, created = EmailVerification.objects.get_or_create(
        user=user,
        defaults={
            'token': '',
            'expires_at': timezone.now()}
    )
    return verification.generate_new_token()


def send_verification_email(user, token):
    subject = "Activate your account"
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

    html_content = render_to_string("emails/verification.html", {"username": user.username,"token": token,})

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_content, 
        from_email=config('EMAIL_HOST_USER'),
        to=[user.email])
    email.attach_alternative(html_content, "text/html")
    email.send()
    
def send_forgot_password_email(user, token):
    magic_link = f"http://localhost:5173/users/login/with-link?token={token}"
    reset_link = f"http://localhost:5173/users/reset-password?token={token}"

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
        to  = [user.email])
    email.attach_alternative(html_content, "text/html")
    email.send(fail_silently=False)

def therapist_documents_path(instance, filename):

    # it s a callable function for upload_to!!
    # instance -> the TherapistProfile object
    first_name = instance.user.first_name
    last_name = instance.user.last_name
    return f'therapist_documents/{datetime.now().strftime("%Y/%m")}/{first_name}_{last_name}/{filename}'

def send_therapist_approved_email(user):
    subject = "Your Deeplyn therapist application has been approved!"

    text_content = (
        f"Hello, {user.first_name}!\n\n"
        f"Great news — your application to join Deeplyn as a therapist "
        f"has been reviewed and approved.\n\n"
        f"You can now log in and set up your therapist profile:\n"
        f"http://localhost:5173/login\n\n"
        f"Welcome to the Deeplyn community!\n\n"
        f"Best regards,\n"
        f"The Deeplyn Team"
    )

    html_content = f"""
<html>
<body style="font-family: Arial, sans-serif; color: #333;">
    <h2 style="color: #6B21A8;">Welcome to Deeplyn, {user.first_name}! 🎉</h2>
    <p>Your application to join Deeplyn as a licensed therapist has been 
    <strong style="color: green;">approved</strong>.</p>
    <p>You can now log in and start setting up your profile, 
    adding your specializations, and accepting clients.</p>
    <p>
        <a href="http://localhost:5173/login" 
           style="background-color: #6B21A8; color: white; padding: 10px 20px; 
                  border-radius: 6px; text-decoration: none;">
            Log in to Deeplyn
        </a>
    </p>
    <br>
    <p>Best regards,<br><strong>The Deeplyn Team</strong></p>
</body>
</html>
"""

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=config('EMAIL_HOST_USER'),
        to=[user.email],
    )
    email.attach_alternative(html_content, "text/html")
    email.send(fail_silently=False)


def send_therapist_rejected_email(user):
    subject = "Update on your Deeplyn therapist application"

    text_content = (
        f"Hello, {user.first_name},\n\n"
        f"Thank you for your interest in joining Deeplyn as a therapist.\n\n"
        f"After carefully reviewing your application and documents, "
        f"we were unfortunately unable to approve your request at this time.\n\n"
        f"This may be due to incomplete documentation or information that "
        f"could not be verified. You are welcome to submit a new application "
        f"with updated documents.\n\n"
        f"If you have any questions, please contact us at nzapodeanu@gmail.com\n\n"
        f"Best regards,\n"
        f"Deeplyn "
    )

    html_content = f"""
<html>
<body style="font-family: Arial, sans-serif; color: #333;">
    <h2 style="color: #6B21A8;">An update on your application</h2>
    <p>Hello, <strong>{user.first_name}</strong>,</p>
    <p>Thank you for your interest in joining Deeplyn as a therapist. 
    After carefully reviewing your application and submitted documents, 
    we were unfortunately <strong style="color: #dc2626;">unable to approve</strong> 
    your request at this time.</p>
    <p>This may be due to incomplete documentation or information that 
    could not be verified. You are welcome to 
    <a href="http://localhost:5173/register/therapist">submit a new application</a> 
    with updated documents.</p>
    <p>If you have questions or need clarification, feel free to reach us at 
    <a href="mailto:nzapodeanu@gmai.com">nzapodeanu@gmai.com</a>.</p>
    <br>
    <p>Best regards,<br><strong>Deeplyn</strong></p>
</body>
</html>
"""

    email = EmailMultiAlternatives(subject=subject,body=text_content,from_email=config('EMAIL_HOST_USER'),to=[user.email])
    email.attach_alternative(html_content, "text/html")
    email.send(fail_silently=False)