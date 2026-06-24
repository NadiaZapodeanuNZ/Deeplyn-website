from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from decouple import config

APP_URL = config('FRONTEND_URL')


def _send_email(subject, text_content, html_template, context, to_email):

    context['app_url'] = APP_URL
    html_content = render_to_string(html_template, context)
    email = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=config('EMAIL_HOST_USER'),
        to=[to_email])
    email.attach_alternative(html_content, "text/html")
    email.send(fail_silently=True)


def _send_session_request_email_to_therapist(session):
    therapist = session.therapist
    client = session.client
    date_str = session.date.strftime("%A, %B %d at %I:%M %p")

    subject = f"New session request from {client.first_name} {client.last_name}"
    text_content = (
        f"Hello, {therapist.first_name} {therapist.last_name},\n\n"
        f"{client.first_name} {client.last_name} has requested a session "
        f"on {date_str}.\n\n"
        f"Please log in to Deeplyn to approve or reject this request.\n\n"
        f"Best regards,\nDeeplyn")

    _send_email(
        subject=subject,
        text_content=text_content,
        html_template='emails/session_request.html',
        context={
            'therapist': therapist,
            'client':client,
            'date_str': date_str,
            'client_notes': session.client_notes,
        },to_email=therapist.email)


def _send_session_created_by_therapist_email(session):
    client = session.client
    therapist = session.therapist
    date_str = session.date.strftime("%A, %B %d at %I:%M %p")

    subject = f"Session scheduled by {therapist.first_name} {therapist.last_name}"

    text_content = (
        f"Hello, {client.first_name} {client.last_name},\n\n"
        f"Your therapist {therapist.first_name} {therapist.last_name} "
        f"has proposed a session on {date_str}.\n\n"
        f"Log in to Deeplyn to confirm or decline.\n\n"
        f"Best regards,\n Deeplyn")

    _send_email(
        subject=subject,
        text_content=text_content,
        html_template='emails/session_created_by_therapist.html',
        context={
            'client':client,
            'therapist':therapist,
            'date_str': date_str,
            'therapist_notes':session.therapist_notes,
        },to_email=client.email)


def _send_session_approved_by_therapist_email(session):
    client = session.client
    therapist = session.therapist
    date_str = session.date.strftime("%A, %B %d at %I:%M %p")

    subject = f"Your session request was approved - {date_str}"

    text_content = (
        f"Hello, {client.first_name} {client.last_name},\n\n"
        f"{therapist.first_name} {therapist.last_name} approved "
        f"your session request for {date_str}.\n\n"
        f"Best regards,\nDeeplyn"
    )

    _send_email(
        subject=subject,
        text_content=text_content,
        html_template='emails/session_approved_by_therapist.html',
        context={
            'client':client,
            'therapist': therapist,
            'date_str':date_str,
        },
        to_email=client.email)


def _send_session_rejected_email(session):
    client = session.client
    therapist = session.therapist
    date_str = session.date.strftime("%A, %B %d at %I:%M %p")

    subject = f"Session request declined - {date_str}"

    text_content = (
        f"Hello, {client.first_name} {client.last_name},\n\n"
        f"Unfortunately, {therapist.first_name} {therapist.last_name} "
        f"was unable to accept your session request for {date_str}.\n\n"
        f"You can request a different date from your Deeplyn calendar.\n\n"
        f"Best regards,\nDeeplyn")

    _send_email(
        subject=subject,
        text_content=text_content,
        html_template='emails/session_rejected_by_therapist.html',
        context={
            'client':client,
            'therapist': therapist,
            'date_str':date_str,
        },to_email=client.email)

def _send_session_accepted_by_client_email(session):
    therapist = session.therapist
    client = session.client
    date_str = session.date.strftime("%A, %B %d at %I:%M %p")
    subject = f"{client.first_name} accepted your session proposal - {date_str}"
    text_content = (
        f"Hello, {therapist.first_name} {therapist.last_name},\n\n"
        f"{client.first_name} {client.last_name} accepted "
        f"your session proposal for {date_str}.\n\n"
        f"Best regards,\nDeeplyn"
    )

    _send_email(
        subject=subject,
        text_content=text_content,
        html_template='emails/session_accepted_by_client.html',
        context={
            'therapist': therapist,
            'client': client,
            'date_str': date_str,
        },to_email=therapist.email)


def _send_session_rejected_by_client_email(session):
    therapist = session.therapist
    client = session.client
    date_str = session.date.strftime("%A, %B %d at %I:%M %p")

    subject = f"{client.first_name} declined your session proposal - {date_str}"

    text_content = (
        f"Hello, {therapist.first_name} {therapist.last_name},\n\n"
        f"{client.first_name} {client.last_name} declined "
        f"your session proposal for {date_str}.\n\n"
        f"Best regards,\nDeeplyn"
    )

    _send_email(
        subject=subject,
        text_content=text_content,
        html_template='emails/session_rejected_by_client.html',
        context={
            'therapist':therapist,
            'client':client,
            'date_str':date_str,
        },to_email=therapist.email)


def _send_cancellation_email(cancelled_by, session):

    recipient = session.therapist if cancelled_by.is_client else session.client
    date_str  = session.date.strftime("%A, %B %d at %I:%M %p")
    subject = f"Session cancelled: {date_str}"
    text_content = (
        f"Hello, {recipient.first_name} {recipient.last_name},\n\n"
        f"{cancelled_by.first_name} {cancelled_by.last_name} has cancelled "
        f"the session scheduled for {date_str}.\n\n"
        f"Best regards,\nDeeplyn")

    _send_email(
        subject=subject,
        text_content=text_content,
        html_template='emails/session_cancelled.html',
        context={
            'recipient':recipient,
            'cancelled_by': cancelled_by,
            'date_str':date_str,
        },to_email=recipient.email)