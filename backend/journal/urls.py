from django.urls import path
from .views import (AnalyzeEmotionsView, EmotionList, NoteCreate, NoteDelete, NoteRead, NoteShareView, NoteToggleFavorite, NoteToggleShared, NoteUpdateView, TherapistDeleteSharedNoteView, TherapistSharedNotesView, emotion_stats, therapist_client_emotion_stats)

app_name = 'journal'

urlpatterns = [
    # GET - api/journal/notes/
    # POST - api/journal/notes/
    path('notes/', NoteCreate.as_view(), name='note-list-create'),

    # GET - api/journal/notes/<pk>/
    path('notes/<int:pk>/', NoteRead.as_view(), name='note-detail'),

    # PATCH - api/journal/notes/<pk>/update/
    path('notes/<int:pk>/update/', NoteUpdateView.as_view(), name='note-update'),

    # DELETE - api/journal/notes/<pk>/delete/
    path('notes/<int:pk>/delete/', NoteDelete.as_view(), name='note-delete'),

    # POST - api/journal/notes/<pk>/favorite/
    path('notes/<int:pk>/favorite/', NoteToggleFavorite.as_view(), name='note-favorite'),

    # POST = api/journal/notes/<pk>/share/
    path('notes/<int:pk>/share/', NoteToggleShared.as_view(), name='note-share'),

    # POST - api/journal/notes/<pk>/send-to-therapist/
    path('notes/<int:pk>/send-to-therapist/', NoteShareView.as_view(), name='note-send-to-therapist'),

    # GET - api/journal/emotions/
    path('emotions/', EmotionList.as_view(), name='emotion-list'),
    path('analyze/', AnalyzeEmotionsView.as_view(), name='analyze-emotions'),

    # GET - api/journal/therapist/clients/<client_id>/notes/
    path('therapist/clients/<int:client_id>/notes/', TherapistSharedNotesView.as_view(), name='therapist-shared-notes'),

    # DELETE - api/journal/therapist/shared-notes/<shared_note_id>/
    path('therapist/shared-notes/<int:shared_note_id>/', TherapistDeleteSharedNoteView.as_view(), name='therapist-delete-shared-note'),
    # GET - api/journal/emotion-stats/?period=weekly|monthly|yearly
    path('emotion-stats/', emotion_stats, name='emotion-stats'),
    path('therapist/clients/<int:client_id>/emotion-stats/',therapist_client_emotion_stats,name='therapist-client-emotion-stats'),
    ]