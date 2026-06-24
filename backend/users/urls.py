from django.urls import path
from users.views import (
    accept_client, change_password, crisis_alert, dashboard_stats, delete_account, end_relationship, my_clients, pending_requests, register_client,register_therapist, reject_client, request_therapist, update_accepting_clients, update_bio, update_profile_photo, update_specializations, update_username, verify_email, resend_token,
    login, login_with_link, logout, refresh_token,
    forgot_password, reset_password,me,available_therapists, my_therapist,)

urlpatterns = [
    path('register/client/', register_client, name='register-client'), # +frontend
    path('register/therapist/',register_therapist, name = 'register-therapist'), #+frontend
    path('verify-email/', verify_email, name='verify-email'), #+frontend
    path('resend-token/', resend_token, name='resend-token'), #+frontend
    path('login/', login, name='login'), #+frontend
    path('login/refresh/', refresh_token, name='refresh-token'),#+frontend
    path('login/with-link/', login_with_link, name='login-with-link'),#+frontend
    path('logout/', logout, name='logout'),#+frontend
    path('forgot-password/', forgot_password, name='forgot-password'), #+frontend
    path('reset-password/', reset_password, name='reset-password'),#+frontend
    path('me/', me, name='current-user'),
    path('therapists/available/', available_therapists, name='available-therapists'),#+frontend
    path('therapists/<int:therapist_id>/request/', request_therapist, name='request-therapist'),#+frontend
    path('clients/<int:client_id>/accept/', accept_client, name='accept-client'),
    path('clients/requests/', pending_requests, name='pending-requests'),
    path('my-therapist/', my_therapist, name='my-therapists'),#+frontend
    path('end-relationship/', end_relationship, name='end-relationship'),
    path('end-relationship/<int:client_id>/', end_relationship, name='end-relationship-therapist'),
    path('crisis-alert/', crisis_alert, name='crisis-alert'),
    path('dashboard-stats/', dashboard_stats, name='dashboard-stats'),
    path('clients/<int:client_id>/reject/', reject_client, name='reject-client'),
    path('my-clients/', my_clients, name='my-clients'), #+frontend
    # path('clients/<int:client_id>/journal/', clients_journal, name='clients-journal'), #+frontend

    path('change-password/', change_password, name='change-password'),
    path('update-profile-photo/', update_profile_photo, name='update-profile-photo'),
    path('update-username/', update_username, name='update-username'),
    path('delete-account/', delete_account, name='delete-account'),
    path('accepting-clients/', update_accepting_clients),
    path('update-bio/', update_bio, name='update-bio'),
    path('update-specializations/', update_specializations, name='update-specializations')
]
