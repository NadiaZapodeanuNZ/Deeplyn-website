from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.db import transaction
from users.utils import send_completion_shared_notification, send_exercise_assigned_notification
from config.permissions import IsClient, IsTherapist
from users.models import ClientTherapist
from journal.models import Emotion
from .models import Exercise, ExerciseCompletion, ExerciseEmotion
from .serializers import (ExerciseReadSerializer, ExerciseCompletionReadSerializer,ExerciseCompletionCreateSerializer, TherapistExerciseCreateSerializer, TherapistExerciseUpdateSerializer)
from .exceptions import ( ExerciseNotFound, CompletionNotFound, CannotModifyExercise,
ClientNotConnected, CompletionAlreadyShared, NoTherapistConnected)

class ClientExerciseListView(APIView):
    permission_classes = [IsAuthenticated, IsClient]

    def get(self, request):
        exercises = Exercise.objects.filter(Q(is_predefined=True) | Q(assigned_to=request.user)).distinct()
        serializer = ExerciseReadSerializer(exercises, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ClientExerciseCompleteView(APIView):
    permission_classes = [IsAuthenticated, IsClient]

    def post(self, request, pk):
        try:
            exercise = Exercise.objects.get(Q(pk=pk) & (Q(is_predefined=True) | Q(assigned_to=request.user)))
        except Exercise.DoesNotExist:
            raise ExerciseNotFound()

        serializer = ExerciseCompletionCreateSerializer(data=request.data,context={'request': request, 'exercise': exercise})
        serializer.is_valid(raise_exception=True)
        completion = serializer.save()

        if completion.emotions_source == ExerciseCompletion.EmotionsSource.TRANSFORMER:
            try:
                from config.ml import detect_emotions
                text_to_analyze = f"{completion.response} {completion.comment}".strip()
                if text_to_analyze:
                    results = detect_emotions(text_to_analyze)
                    with transaction.atomic():
                        for item in results:
                            try:
                                emotion_obj = Emotion.objects.get(id=item["emotion_id"])
                                ExerciseEmotion.objects.create(
                                    completion=completion,
                                    emotion=emotion_obj,
                                    intensity=item["intensity"],
                                    source=ExerciseEmotion.Source.TRANSFORMER)
                            except Emotion.DoesNotExist:
                                pass
            except Exception as e:
                print(f"ML detection error for exercise: {e}")

        completion = ExerciseCompletion.objects.prefetch_related('exercise_emotions__emotion').get(id=completion.id)
        return Response(ExerciseCompletionReadSerializer(completion).data, status=status.HTTP_201_CREATED)

class ClientCompletionHistoryView(APIView):
    permission_classes = [IsAuthenticated, IsClient]

    def get(self, request):
        completions = ExerciseCompletion.objects.filter(client=request.user).prefetch_related('exercise', 'exercise_emotions__emotion').order_by('-completed_at')
        serializer = ExerciseCompletionReadSerializer(completions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ClientCompletionShareView(APIView):
    permission_classes = [IsAuthenticated, IsClient]

    def post(self, request, pk):
        try:
            completion = ExerciseCompletion.objects.get(pk=pk, client=request.user)
        except ExerciseCompletion.DoesNotExist:
            raise CompletionNotFound()

        if completion.is_shared_with_therapist:
            raise CompletionAlreadyShared()

        relation = ClientTherapist.objects.filter(client=request.user, status=ClientTherapist.Status.ACTIVE).first()
        if not relation:
            raise NoTherapistConnected()

        completion.is_shared_with_therapist = True
        completion.save(update_fields=['is_shared_with_therapist'])
        try:
            send_completion_shared_notification(
                therapist=relation.therapist,
                client=request.user,
                exercise=completion.exercise)
        except Exception:
            pass
        
        return Response({"message": "Exercise shared successfully with your therapist."}, status=status.HTTP_200_OK)



class TherapistDashboardExercisesView(APIView):
    permission_classes = [IsAuthenticated, IsTherapist]

    def get(self, request):
        exercises = Exercise.objects.filter(Q(is_predefined=True) | Q(created_by=request.user, is_deleted_from_therapist_panel=False)).distinct()
        serializer = ExerciseReadSerializer(exercises, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class TherapistExerciseCreateView(APIView):
    permission_classes = [IsAuthenticated, IsTherapist]

    def post(self, request):
        serializer = TherapistExerciseCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        exercise = serializer.save()
        return Response(ExerciseReadSerializer(exercise).data, status=status.HTTP_201_CREATED)

class TherapistExerciseUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsTherapist]

    def patch(self, request, pk):
        try:
            exercise = Exercise.objects.get(pk=pk, created_by=request.user, is_predefined=False)
        except Exercise.DoesNotExist:
            raise ExerciseNotFound()

        if exercise.is_shared_by_therapist:
            raise CannotModifyExercise()

        serializer = TherapistExerciseUpdateSerializer(exercise, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_exercise = serializer.save()

        return Response(ExerciseReadSerializer(updated_exercise).data, status=status.HTTP_200_OK)

class TherapistExerciseDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsTherapist]

    def delete(self, request, pk):
        try:
            exercise = Exercise.objects.get(pk=pk, created_by=request.user, is_predefined=False)
        except Exercise.DoesNotExist:
            raise ExerciseNotFound()

        exercise.is_deleted_from_therapist_panel = True
        exercise.save(update_fields=['is_deleted_from_therapist_panel'])
        return Response({"message": "Exercise deleted from your panel."}, status=status.HTTP_204_NO_CONTENT)

class TherapistClientCompletionsListView(APIView):
    permission_classes = [IsAuthenticated, IsTherapist]

    def get(self, request):
        client_id = request.query_params.get('client_id')
        connected_client_ids = ClientTherapist.objects.filter(therapist=request.user, status=ClientTherapist.Status.ACTIVE).values_list('client_id', flat=True)

        if client_id:
            if int(client_id) not in connected_client_ids:
                raise ClientNotConnected()
            target_ids = [client_id]
        else:
            target_ids = connected_client_ids

        completions = ExerciseCompletion.objects.filter(
            client_id__in=target_ids,
            is_shared_with_therapist=True,
            is_deleted_from_therapist_panel=False
        ).prefetch_related('exercise', 'exercise_emotions__emotion', 'client').order_by('-completed_at')

        serializer = ExerciseCompletionReadSerializer(completions, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

class TherapistCompletionDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsTherapist]

    def delete(self, request, pk):
        connected_client_ids = ClientTherapist.objects.filter( therapist=request.user, status=ClientTherapist.Status.ACTIVE).values_list('client_id', flat=True)

        try:
            completion = ExerciseCompletion.objects.get(pk=pk, client_id__in=connected_client_ids, is_shared_with_therapist=True)
        except ExerciseCompletion.DoesNotExist:
            raise CompletionNotFound()

        completion.is_deleted_from_therapist_panel = True
        completion.save(update_fields=['is_deleted_from_therapist_panel'])
        return Response({"message": "Client answer removed from your panel."}, status=status.HTTP_204_NO_CONTENT)
    
class TherapistExercisePublishView(APIView):
    permission_classes = [IsAuthenticated, IsTherapist]

    def post(self, request, pk):
        try:
            exercise = Exercise.objects.get(pk=pk, created_by=request.user, is_predefined=False)
        except Exercise.DoesNotExist:
            raise ExerciseNotFound()

        if exercise.is_shared_by_therapist:
            raise CannotModifyExercise()

        client_id = request.data.get('client_id')
        if not client_id:
            return Response({"error": "client_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        relation = ClientTherapist.objects.filter(
            therapist=request.user,
            client_id=client_id,
            status=ClientTherapist.Status.ACTIVE
        ).first()
        if not relation:
            raise ClientNotConnected()

        new_exercise = Exercise.objects.create(
            title=exercise.title,
            category=exercise.category,
            therapy_type=exercise.therapy_type,
            content_format=exercise.content_format,
            nr_questions=exercise.nr_questions,
            content=exercise.content,
            is_predefined=False,
            is_shared_by_therapist=True,
            created_by=request.user,
            assigned_to=relation.client
        )

        try:
            send_exercise_assigned_notification(
                client=relation.client,
                therapist=request.user,
                exercise=new_exercise
            )
        except Exception:
            pass
        return Response(ExerciseReadSerializer(new_exercise).data, status=status.HTTP_200_OK)