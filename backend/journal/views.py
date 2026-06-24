from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .utils import get_period_config, process_emotion_statistics
from users.models import ClientTherapist
from .models import Note, Journal, Emotion, NoteEmotion, SharedNote
from config.permissions import IsClient, IsTherapist
from .serializers import (NoteCreateSerializer,NoteUpdateSerializer,NoteReadSerializer,NoteFavoriteSerializer,EmotionSerializer, SharedNoteTherapistSerializer,)
from .exceptions import JournalNotFound, NoActiveRelationship, NoActiveTherapist, NoteNotFound, NoteNotOwned
from collections import defaultdict
from rest_framework.decorators import api_view, permission_classes
from django.utils import timezone

class NoteAccess(APIView):
    permission_classes = [IsAuthenticated, IsClient]
    def get_journal(self, user):
        try:
            return user.journal
        except Journal.DoesNotExist:
            raise JournalNotFound()
    def get_note(self, pk, user):
        try:
            note = Note.objects.get(pk=pk)
        except Note.DoesNotExist:
            raise NoteNotFound()

        if note.journal != user.journal:
            raise NoteNotOwned()
        return note

class EmotionList(APIView):
    permission_classes = [IsAuthenticated,IsClient]
    def get(self, request):
        emotions = Emotion.objects.all()
        serializer = EmotionSerializer(emotions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class NoteCreate(NoteAccess):
    def get(self, request):
        journal = self.get_journal(request.user)
        notes = journal.notes.prefetch_related('note_emotions__emotion').all()
        serializer = NoteReadSerializer(notes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = NoteCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        note = serializer.save()

        if note.emotions_source == Note.EmotionsSource.TRANSFORMER:
            try:
                from config.ml import detect_emotions
                rezultate = detect_emotions(note.content)
                print(f"DEBUG continut: {note.content[:100]}")
                print(f"DEBUG rezultate: {rezultate}")

                with transaction.atomic():
                    for item in rezultate:
                        emotie = Emotion.objects.get(id=item["emotion_id"])
                        NoteEmotion.objects.create(
                            note=note,
                            emotion=emotie,
                            intensity=item["intensity"],
                            source=NoteEmotion.Source.TRANSFORMER)

            except Exception as e:
                print(f"Error detection: {e}")

        relation = ClientTherapist.objects.filter(
            client=request.user,
            status=ClientTherapist.Status.ACTIVE
        ).first()

        if relation:
            emotions_snapshot = []
            for ne in note.note_emotions.select_related('emotion').all():
                emotions_snapshot.append({
                    "emotion_id": ne.emotion.id,
                    "emotion_name": ne.emotion.name,
                    "intensity": ne.intensity,
                    "source": ne.source,
                })

            SharedNote.objects.create(
                note=note,
                client=request.user,
                therapist=relation.therapist,
                title=note.title,
                content=note.content,
                emotions_source=note.emotions_source,
                emotions_snapshot=emotions_snapshot)

            note.is_shared = True
            note.save(update_fields=['is_shared'])

        return Response(
            NoteReadSerializer(note).data,
            status=status.HTTP_201_CREATED)
    
class NoteRead(NoteAccess):
    def get(self, request, pk):
        note = self.get_note(pk, request.user)
        serializer = NoteReadSerializer(note)
        return Response(serializer.data, status=status.HTTP_200_OK)

class NoteUpdateView(NoteAccess):
    def patch(self, request, pk):
        note = self.get_note(pk, request.user)

        serializer = NoteUpdateSerializer(note, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_note = serializer.save()

        if updated_note.emotions_source == Note.EmotionsSource.TRANSFORMER:
            try:
                from config.ml import detect_emotions
                rezultate = detect_emotions(updated_note.content)

                with transaction.atomic():
                    updated_note.note_emotions.all().delete()

                    for item in rezultate:
                        try:
                            emotie = Emotion.objects.get(id=item["emotion_id"])
                            NoteEmotion.objects.create(
                                note=updated_note,
                                emotion=emotie,
                                intensity=item["intensity"],
                                source=NoteEmotion.Source.TRANSFORMER
                            )
                        except Emotion.DoesNotExist:
                            pass

            except Exception as e:
                print(f"Eroare la detectia emotiilor: {e}")

        if updated_note.is_shared:
            updated_note.is_shared = False
            updated_note.save(update_fields=['is_shared'])

        return Response(
            NoteReadSerializer(updated_note).data,
            status=status.HTTP_200_OK
        )
    
class NoteDelete(NoteAccess):
    def delete(self, request, pk):
        note = self.get_note(pk, request.user)
        note.delete()
        return Response(
            {"message": "Note deleted successfully."},
            status=status.HTTP_204_NO_CONTENT)
    
class NoteToggleFavorite(NoteAccess):

    def post(self, request, pk):
        note = self.get_note(pk, request.user)
        serializer = NoteFavoriteSerializer(note, data={})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"id": note.id, "is_favorite": note.is_favorite},
            status=status.HTTP_200_OK)

class NoteToggleShared(NoteAccess):
    def post(self, request, pk):
        note = self.get_note(pk, request.user)
        note.is_shared = not note.is_shared
        note.save(update_fields=['is_shared'])
        return Response(
            {"id": note.id, "is_shared": note.is_shared},
            status=status.HTTP_200_OK)
    
class NoteShareView(NoteAccess):
    def post(self, request, pk):
        note = self.get_note(pk, request.user)
        relation = ClientTherapist.objects.filter(client=request.user, status=ClientTherapist.Status.ACTIVE).first()

        if not relation:
            raise NoActiveTherapist()
        emotions_snapshot = []
        for ne in note.note_emotions.select_related('emotion').all():
            emotions_snapshot.append({
                "emotion_id": ne.emotion.id,
                "emotion_name": ne.emotion.name,
                "intensity": ne.intensity,
                "source": ne.source})

        SharedNote.objects.update_or_create(
            note=note,
            therapist=relation.therapist,
            defaults={
                'client': request.user,
                'title': note.title,
                'content': note.content,
                'emotions_source': note.emotions_source,
                'emotions_snapshot': emotions_snapshot})

        return Response(
            {"message": "Note shared successfully with your therapist."},
            status=status.HTTP_200_OK)
    
class AnalyzeEmotionsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        text = request.data.get('text', '').strip()

        if not text:
            return Response({'emotions': []}, status=status.HTTP_200_OK)

        try:
            from config.ml import detect_emotions
            rezultate = detect_emotions(text)
            return Response({'emotions': rezultate}, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Eroare AnalyzeEmotionsView: {e}")
            return Response({'emotions': []}, status=status.HTTP_200_OK)


class TherapistSharedNotesView(APIView):
    permission_classes = [IsAuthenticated, IsTherapist]

    def get(self, request, client_id):
        relation = ClientTherapist.objects.filter(therapist=request.user,client_id=client_id,status=ClientTherapist.Status.ACTIVE).first()

        if not relation:
            raise NoActiveRelationship()

        shared_notes = SharedNote.objects.filter(therapist=request.user,client_id=client_id
        ).select_related('note', 'client').order_by('-shared_at')

        serializer = SharedNoteTherapistSerializer(shared_notes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TherapistDeleteSharedNoteView(APIView):
    permission_classes = [IsAuthenticated, IsTherapist]

    def delete(self, request, shared_note_id):
        try:
            shared_note = SharedNote.objects.get(id=shared_note_id,therapist=request.user)
        except SharedNote.DoesNotExist:
            raise NoteNotFound()

        shared_note.delete()
        return Response(
            {"message": "Note removed from panel."},
            status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsClient])
def emotion_stats(request):
    from quiz.models import QAEmotion
    from exercises.models import ExerciseEmotion

    period = request.query_params.get('period', 'weekly')
    start_date, ordered = get_period_config(period, timezone.now())

    note_qs = NoteEmotion.objects.filter(note__journal__user=request.user,note__created_at__date__gte=start_date).exclude(intensity__lte=0).select_related('emotion', 'note')
    qa_qs = QAEmotion.objects.filter(answer__daily_quiz__client=request.user,answer__daily_quiz__date__gte=start_date).exclude(intensity__lte=0).select_related('emotion', 'answer__daily_quiz')
    ex_qs = ExerciseEmotion.objects.filter(completion__client=request.user,completion__completed_at__date__gte=start_date).exclude(intensity__lte=0).select_related('emotion', 'completion')

    period_emotions = [
        {'name': ne.emotion.name, 'intensity': ne.intensity, 'date': ne.note.created_at.date()}
        for ne in note_qs] + [
        {'name': qe.emotion.name, 'intensity': qe.intensity, 'date': qe.answer.daily_quiz.date}
        for qe in qa_qs]+ [
        {'name': ee.emotion.name, 'intensity': ee.intensity, 'date': ee.completion.completed_at.date()}
        for ee in ex_qs]
    

    return Response(process_emotion_statistics(period_emotions, period, ordered))

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTherapist])
def therapist_client_emotion_stats(request, client_id):
    from quiz.models import QAEmotion
    from exercises.models import ExerciseEmotion

    if not ClientTherapist.objects.filter(therapist=request.user, client_id=client_id, status='active').exists():
        return Response({"error": "No active relationship"}, status=status.HTTP_403_FORBIDDEN)

    period = request.query_params.get('period', 'weekly')
    start_date, ordered = get_period_config(period, timezone.now())

    notes_qs = SharedNote.objects.filter(therapist=request.user, client_id=client_id, shared_at__date__gte=start_date)
    qa_qs = QAEmotion.objects.filter(answer__daily_quiz__client_id=client_id, answer__is_shared_by_client=True,answer__daily_quiz__date__gte=start_date).exclude(intensity__lte=0).select_related('emotion', 'answer__daily_quiz')
    ex_qs = ExerciseEmotion.objects.filter(completion__client_id=client_id,completion__is_shared_with_therapist=True,completion__is_deleted_from_therapist_panel=False,completion__completed_at__date__gte=start_date).exclude(intensity__lte=0).select_related('emotion', 'completion')

    period_emotions = []
    for note in notes_qs:
        for item in (note.emotions_snapshot or []):
            if item.get('emotion_name') and item.get('intensity', 0) > 0:
                period_emotions.append({'name': item['emotion_name'], 'intensity': item['intensity'], 'date': note.shared_at.date()})
                
    for qe in qa_qs:
        period_emotions.append({'name': qe.emotion.name, 'intensity': qe.intensity, 'date': qe.answer.daily_quiz.date})
    
    for ee in ex_qs:
        period_emotions.append({'name': ee.emotion.name,'intensity': ee.intensity,'date': ee.completion.completed_at.date()})

    return Response(process_emotion_statistics(period_emotions, period, ordered))