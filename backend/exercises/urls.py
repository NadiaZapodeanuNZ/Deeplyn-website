from django.urls import path
from .views import (ClientExerciseListView, ClientExerciseCompleteView, ClientCompletionHistoryView, ClientCompletionShareView,
TherapistDashboardExercisesView, TherapistExerciseCreateView, TherapistExercisePublishView, TherapistExerciseUpdateView, TherapistExerciseDeleteView,
TherapistClientCompletionsListView, TherapistCompletionDeleteView)

urlpatterns = [
    path('client/', ClientExerciseListView.as_view(), name='client-exercise-list'),
    path('client/<int:pk>/complete/', ClientExerciseCompleteView.as_view(), name='client-exercise-complete'),
    path('client/completions/', ClientCompletionHistoryView.as_view(), name='client-completion-history'),
    path('client/completions/<int:pk>/share/', ClientCompletionShareView.as_view(), name='client-completion-share'),
    path('therapist/', TherapistDashboardExercisesView.as_view(), name='therapist-dashboard-exercises'),
    path('therapist/create/', TherapistExerciseCreateView.as_view(), name='therapist-exercise-create'),
    path('therapist/<int:pk>/update/', TherapistExerciseUpdateView.as_view(), name='therapist-exercise-update'),
    path('therapist/<int:pk>/delete/', TherapistExerciseDeleteView.as_view(), name='therapist-exercise-delete'),
    path('therapist/client-completions/', TherapistClientCompletionsListView.as_view(), name='therapist-client-completions'),
    path('therapist/client-completions/<int:pk>/delete/', TherapistCompletionDeleteView.as_view(), name='therapist-completion-delete'),
    path('therapist/<int:pk>/publish/', TherapistExercisePublishView.as_view() , name="therapist-publish-exercises"),
]