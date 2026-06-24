from django.urls import path
from .views import (DraftCreateView, DraftDeleteView, DraftDetailView, DraftListView, DraftSendView, DraftUpdateView, TodayQuizView,QuizHistoryView,QADraftView,QASubmitView,
QAEmotionUpdateView,QuizShareView,QuizCreateView,QuizUpdateView,QuizPublishView,
QuizDeleteView,SentQuizzesView,ClientQuizzesView,ClientQuizDetailView,QuestionCreateView,QuestionUpdateView,
QuestionDeleteView,OwnQuestionsView,PredefinedQuestionsView)

urlpatterns = [
    path('today/', TodayQuizView.as_view(), name='quiz-today'),
    path('history/', QuizHistoryView.as_view(), name='quiz-history'),
    path('answers/<int:pk>/', QADraftView.as_view(), name='quiz-answer-draft'),
    path('answers/<int:pk>/submit/', QASubmitView.as_view(), name='quiz-answer-submit'),
    path('answers/<int:pk>/emotions/', QAEmotionUpdateView.as_view(), name='quiz-answer-emotions'),
    path('<int:pk>/share/', QuizShareView.as_view(), name='quiz-share'),
    path('create/', QuizCreateView.as_view(), name='quiz-create'),
    path('<int:pk>/update/', QuizUpdateView.as_view(), name='quiz-update'),
    path('<int:pk>/publish/', QuizPublishView.as_view(), name='quiz-publish'),
    path('<int:pk>/delete/', QuizDeleteView.as_view(), name='quiz-delete'),
    path('sent/', SentQuizzesView.as_view(), name='quiz-sent'),
    path('clients/<int:client_id>/quizzes/', ClientQuizzesView.as_view(), name='client-quizzes'),
    path('clients/<int:client_id>/quizzes/<int:quiz_id>/', ClientQuizDetailView.as_view(), name='client-quiz-detail'),
    path('questions/', QuestionCreateView.as_view(), name='question-create'),
    path('questions/<int:pk>/update/', QuestionUpdateView.as_view(), name='question-update'),
    path('questions/<int:pk>/delete/', QuestionDeleteView.as_view(), name='question-delete'),  
    path('questions/mine/', OwnQuestionsView.as_view(), name='questions-mine'),
    path('questions/predefined/', PredefinedQuestionsView.as_view(), name='questions-predefined'),

    path('drafts/', DraftListView.as_view(), name='draft-list'),
    path('drafts/create/', DraftCreateView.as_view(), name='draft-create'),
    path('drafts/<int:pk>/', DraftDetailView.as_view(), name='draft-detail'),
    path('drafts/<int:pk>/update/', DraftUpdateView.as_view(), name='draft-update'),
    path('drafts/<int:pk>/delete/', DraftDeleteView.as_view(), name='draft-delete'),
    path('drafts/<int:pk>/send/', DraftSendView.as_view(), name='draft-send'),
]

