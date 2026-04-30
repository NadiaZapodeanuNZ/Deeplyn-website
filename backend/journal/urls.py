from django.urls import path
# from .views import NoteCreateView, NoteDetailUpdateDeleteView, NoteToggleFavoriteView, NoteFavoritesListView
from backend.journal import views

# all urls begin with /journal/
app_name = 'journal'

urlpatterns = [ 

    # POST /journal/notes/ - create a new note
    path('notes/', views.NoteCreateView.as_view(), name='notes'),

    # GET    /journal/notes/<id>/ - view details of a note
    # PATCH  /journal/notes/<id>/ - edit  note
    # DELETE /journal/notes/<id>/ - delete note
    path('notes/<int:pk>/', views.NoteDetailUpdateDeleteView.as_view(), name='note-detail'),

    # POST /journal/notes/<id>/favorite/ - toggle favorite status of a note
    path('notes/<int:pk>/favorite/', views.NoteToggleFavoriteView.as_view(), name='note-favorite'),

    # GET /journal/notes/favorites/ - list favorite notes
    path('notes/favorites/', views.NoteFavoritesListView.as_view(), name='note-favorites'),

]