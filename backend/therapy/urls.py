from django.urls import path
from therapy.views import (list_sessions,create_session,approve_session,reject_session,delete_session)

urlpatterns = [
    path('sessions/',list_sessions,name='list-sessions'),
    path('sessions/create/',create_session,name='create-session'),
    path('sessions/<int:session_id>/approve/',approve_session,name='approve-session'),
    path('sessions/<int:session_id>/reject/',reject_session,name='reject-session'),
    path('sessions/<int:session_id>/delete/',delete_session,name='delete-session')
]