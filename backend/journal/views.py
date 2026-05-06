from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db import transaction

from config.permissions import IsClient
from journal.models import Note, Journal, Emotion, NoteEmotion
from journal.serializers import (
    NoteCreateSerializer,
    NoteUpdateSerializer,
    NoteReadSerializer,
    NoteFavoriteSerializer,
    JournalSerializer,
    EmotionSerializer,
)
from journal.utils import encrypt_note, decrypt_note
from journal.exceptions import (NoteNotFound, NoteNotOwned)


class NoteBaseView(APIView):
    permission_classes = [IsAuthenticated, IsClient]

    def get_note(self, pk, user):
        try:
            note = Note.objects.get(pk=pk)
        except Note.DoesNotExist:
            raise NoteNotFound()

        if note.journal != user.journal:
            raise NoteNotOwned()

        return note

    def get_encryption_key(self, user):
        return bytes(user.encryption_key)