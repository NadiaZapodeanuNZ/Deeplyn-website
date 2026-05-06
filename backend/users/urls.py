from django.urls import path
from users.views import (
    register_client,register_therapist, verify_email, resend_token,
    login, login_with_link, logout, refresh_token,
    forgot_password, reset_password,me,
    
)

urlpatterns = [
    
    path('register/client/', register_client, name='register-client'),
    path('register/therapist/',register_therapist, name = 'register-therapist'),
    path('verify-email/', verify_email, name='verify-email'),
    path('resend-token/', resend_token, name='resend-token'),

    path('login/', login, name='login'),
    path('login/refresh/', refresh_token, name='refresh-token'),
    path('login/with-link/', login_with_link, name='login-with-link'),
    path('logout/', logout, name='logout'),

    path('forgot-password/', forgot_password, name='forgot-password'),
    path('reset-password/', reset_password, name='reset-password'),
    path('me/', me, name='current-user'),

]
