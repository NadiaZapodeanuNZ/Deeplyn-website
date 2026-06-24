from .models import EmailVerification
from django.core.mail import EmailMessage
from django.core.mail import EmailMultiAlternatives
from decouple import config
from django.template.loader import render_to_string
import datetime
from django.utils import timezone

def format_block_message(blocked_until):
    delta = blocked_until - timezone.now()
    total_minutes = max(0, int(delta.total_seconds() // 60))

    if total_minutes >= 60:
        hours = total_minutes // 60
        unit = "hour" if hours == 1 else "hours"
        return f"Too many attempts. Try again in {hours} {unit}."

    unit = "minute" if total_minutes == 1 else "minutes"
    return f"Too many attempts. Try again in {total_minutes} {unit}."


def create_verification_and_send_email(user):
    token = generate_and_store_token(user)
    send_verification_email(user, token)


def generate_and_store_token(user):
    verification, created = EmailVerification.objects.get_or_create(
        user=user,
        defaults={
            'token': '',
            'expires_at': timezone.now()})
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
        f"Deeplyn" )

    html_content = render_to_string("emails/verification.html", 
    {
        "username": user.username,
        "token": token
    })

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
        f"Best regards,\nDeeplyn")

    html_content = render_to_string("emails/forgot_password.html", {
        "username": user.username,
        "magic_link": magic_link,
        "reset_link": reset_link})

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=config('EMAIL_HOST_USER'),
        to=[user.email])
    
    email.attach_alternative(html_content, "text/html")
    email.send()


def therapist_documents_path(instance, filename):
    first_name = instance.user.first_name
    last_name = instance.user.last_name
    return f'therapist_documents/{timezone.now().strftime("%Y/%m")}/{first_name}_{last_name}/{filename}'


def send_therapist_approved_email(user):
    subject = "Your Deeplyn therapist application has been approved!"

    text_content = (
        f"Hello, {user.first_name}!\n\n"
        f"Great news - your application to join Deeplyn as a therapist "
        f"has been reviewed and approved.\n\n"
        f"You can now log in and set up your therapist profile:\n"
        f"http://localhost:5173/login\n\n"
        f"Welcome to the Deeplyn community!\n\n"
        f"Best regards,\n"
        f"Deeplyn")

    html_content = render_to_string("emails/therapist_approved.html", {
        "user": user})

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=config('EMAIL_HOST_USER'),
        to=[user.email])
    
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
        f"Deeplyn")

    html_content = render_to_string("emails/therapist_rejected.html", {
        "user": user})

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=config('EMAIL_HOST_USER'),
        to=[user.email])
    
    email.attach_alternative(html_content, "text/html")
    email.send(fail_silently=False)


def send_crisis_email(therapist, client, message):
    subject = f"URGENT: {client.first_name} {client.last_name} needs help"

    text_content = (
        f"Hello, {therapist.first_name},\n\n"
        f"Your client {client.first_name} {client.last_name} has triggered a crisis alert.\n\n"
        f"{'Message from client: ' + message if message else 'No message was provided.'}\n\n"
        f"Please reach out as soon as possible.\n\n"
        f"Deeplyn")

    html_content = render_to_string("emails/crisis.html", {
        "therapist": therapist,
        "client": client,
        "message":message})

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=config('EMAIL_HOST_USER'),
        to=[therapist.email])
    
    email.attach_alternative(html_content, "text/html")
    email.send(fail_silently=False)

def send_quiz_shared_notification(therapist, client):
    subject = "A patient shared their quiz answers with you"
    text_content = (
        f"Hello, {therapist.first_name} {therapist.last_name}!\n\n"
        f"Your patient {client.first_name} {client.last_name} has shared their daily quiz answers with you.\n\n"
        f"Log in to Deeplyn to view their responses.\n\n"
        f"Best regards,\n"
        f"Deeplyn"
    )

    html_content = render_to_string("emails/quiz_shared.html", {
        "therapist_first_name": therapist.first_name,
        "therapist_last_name": therapist.last_name,
        "client_first_name": client.first_name,
        "client_last_name": client.last_name,
    })

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=config('EMAIL_HOST_USER'),
        to=[therapist.email]
    )

    email.attach_alternative(html_content, "text/html")
    email.send()

def send_quiz_assigned_notification(client, therapist):
    subject = "You have a new quiz from your therapist"
    text_content = (
        f"Hello, {client.first_name} {client.last_name}!\n\n"
        f"Your therapist {therapist.first_name} {therapist.last_name} has assigned you a new daily quiz.\n\n"
        f"Log in to Deeplyn to complete it.\n\n"
        f"Best regards,\n"
        f"Deeplyn")

    html_content = render_to_string("emails/quiz_assigned.html", {
        "client_first_name": client.first_name,
        "client_last_name": client.last_name,
        "therapist_first_name": therapist.first_name,
        "therapist_last_name": therapist.last_name,
    })

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=config('EMAIL_HOST_USER'),
        to=[client.email])

    email.attach_alternative(html_content, "text/html")
    email.send()

def send_exercise_assigned_notification(client, therapist, exercise):
    category = exercise.category.upper()
    source = "Deeplyn(APP)" if exercise.is_predefined else therapist.first_name + " " + therapist.last_name

    subject = f"You have a new exercise assigned by your therapist"
    text_content = (
        f"Hello, {client.first_name} {client.last_name}!\n\n"
        f"Your therapist {therapist.first_name} {therapist.last_name} has assigned you a new exercise:\n\n"
        f"Title: {exercise.title}\n"
        f"Category: {category}\n"
        f"Source: {source}\n\n"
        f"Log in to Deeplyn to complete it.\n\n"
        f"Best regards,\n"
        f"Deeplyn"
    )

    html_content = render_to_string("emails/exercise_assigned.html", {
        "client_first_name": client.first_name,
        "client_last_name": client.last_name,
        "therapist_first_name": therapist.first_name,
        "therapist_last_name": therapist.last_name,
        "exercise_title": exercise.title,
        "exercise_category": category,
        "exercise_source": source,
    })

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=config('EMAIL_HOST_USER'),
        to=[client.email]
    )
    email.attach_alternative(html_content, "text/html")
    email.send()

def send_completion_shared_notification(therapist, client, exercise):
    category = exercise.category.upper()

    subject = "A patient shared an exercise completion with you"
    text_content = (
        f"Hello, {therapist.first_name} {therapist.last_name}!\n\n"
        f"Your patient {client.first_name} {client.last_name} has shared a completion for:\n\n"
        f"Title: {exercise.title}\n"
        f"Category: {category}\n\n"
        f"Log in to Deeplyn to view their response.\n\n"
        f"Best regards,\n"
        f"Deeplyn"
    )

    html_content = render_to_string("emails/completion_shared.html", {
        "therapist_first_name": therapist.first_name,
        "therapist_last_name": therapist.last_name,
        "client_first_name": client.first_name,
        "client_last_name": client.last_name,
        "exercise_title": exercise.title,
        "exercise_category": category,
    })

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=config('EMAIL_HOST_USER'),
        to=[therapist.email]
    )
    email.attach_alternative(html_content, "text/html")
    email.send()