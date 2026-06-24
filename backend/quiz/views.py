from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from users.models import ClientTherapist
from config.permissions import IsClient, IsTherapist
from .models import DailyQuiz, DailyQuizAnswer, DailyQuizQuestion, QuizDraft, QuizQuestion,QAEmotion
from journal.models import Emotion
from .serializers import (QAEmotionReadSerializer,QAEmotionWriteSerializer, QuizDraftCreateSerializer, QuizDraftReadSerializer, QuizDraftSendSerializer, QuizDraftUpdateSerializer,QuizQuestionReadSerializer,
DailyQAReadSerializer,DailyQuizReadSerializer,AnswerDraftSerializer,AnswerSubmitSerializer,
AnswerEmotionUpdateSerializer,QuizQuestionCreateSerializer,QuizQuestionUpdateSerializer, SentQuizReadSerializer, ShareAnswersSerializer,
TherapistQuizQuestionSerializer,TherapistCreateQuizSerializer,TherapistUpdateQuizSerializer,)
from .utils import get_today_quiz_for_client
from .exceptions import (AnswerNotFound, AnswerNotOwned, AnswerTooLong, DraftNotFound, InvalidInput, QuizDateConflict,
QuizNotFound, QuizAlreadyShared, QuizAlreadyPublished,QuizHasNoAnswers, NoTherapistConnected,
QuestionNotFound, CannotDeleteQuestion, CannotModifyQuiz,ClientNotConnected)
from django.db import transaction
from users.utils import send_quiz_assigned_notification, send_quiz_shared_notification

class QABaseView(APIView):
    permission_classes = [IsAuthenticated, IsClient]
 
    def get_answer(self, pk, user):
        try:
            answer = DailyQuizAnswer.objects.select_related('daily_quiz', 'question').get(pk=pk)
        except DailyQuizAnswer.DoesNotExist:
            raise AnswerNotFound()
 
        if answer.daily_quiz.client != user:
            raise AnswerNotOwned()
 
        return answer
 
    def check_max_chars(self, answer, text):
        dqq = DailyQuizQuestion.objects.get(daily_quiz=answer.daily_quiz,question=answer.question)
        if len(text) > dqq.max_chars:
            raise AnswerTooLong(message=f"Answers can be maximum {dqq.max_chars} characters.",details={"max_chars": dqq.max_chars})
 
    def get_quiz_response(self, answer):
        quiz = DailyQuiz.objects.prefetch_related('quiz_questions__question','answers__answer_emotions__emotion',).get(id=answer.daily_quiz_id)
        return Response(
            DailyQuizReadSerializer(quiz).data,
            status=status.HTTP_200_OK)


class TodayQuizView(APIView):
    permission_classes = [IsAuthenticated, IsClient]

    def get(self, request):
        quiz = get_today_quiz_for_client(request.user)
        serializer = DailyQuizReadSerializer(quiz)
        return Response(serializer.data, status=status.HTTP_200_OK)


class QuizHistoryView(APIView):
    permission_classes = [IsAuthenticated, IsClient]
 
    def get(self, request):
        quizzes = DailyQuiz.objects.filter(client=request.user,
        ).exclude(source=DailyQuiz.Source.THERAPIST, is_shared_by_therapist=False,
        ).prefetch_related('quiz_questions__question','answers__answer_emotions__emotion',
        ).order_by('-date')
 
        serializer = DailyQuizReadSerializer(quizzes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

class QADraftView(QABaseView):
    def patch(self, request, pk):
        answer = self.get_answer(pk, request.user)
 
        answer_text = request.data.get('answer_text', '')
        self.check_max_chars(answer, answer_text)
 
        serializer = AnswerDraftSerializer(answer, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return self.get_quiz_response(answer)

class QASubmitView(QABaseView):
    def post(self, request, pk):
        answer = self.get_answer(pk, request.user)

        answer_text = request.data.get('answer_text', '')
        self.check_max_chars(answer, answer_text)

        serializer = AnswerSubmitSerializer(answer, data=request.data)
        serializer.is_valid(raise_exception=True)
        answer = serializer.save()

        if answer.emotions_source == DailyQuizAnswer.EmotionsSource.TRANSFORMER:
            try:
                from config.ml import detect_emotions
                rezultate = detect_emotions(answer.answer_text)

                with transaction.atomic():
                    for item in rezultate:
                        try:
                            emotie = Emotion.objects.get(id=item["emotion_id"])
                            QAEmotion.objects.create(
                                answer=answer,
                                emotion=emotie,
                                intensity=item["intensity"],
                                source=QAEmotion.Source.TRANSFORMER)
                        except Emotion.DoesNotExist:
                            pass

            except Exception as e:
                print(f"error:detection quiz: {e}")

        return self.get_quiz_response(answer)

class QAEmotionUpdateView(QABaseView):
   def patch(self, request, pk):
        answer = self.get_answer(pk, request.user)
        serializer = AnswerEmotionUpdateSerializer(answer, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return self.get_quiz_response(answer)


class QuizShareView(APIView):
    permission_classes = [IsAuthenticated, IsClient]
 
    def post(self, request, pk):
        try:
            quiz = DailyQuiz.objects.prefetch_related('answers').get(pk=pk, client=request.user)
        except DailyQuiz.DoesNotExist:
            raise QuizNotFound()
        
        relation = ClientTherapist.objects.filter(client=request.user,status=ClientTherapist.Status.ACTIVE,).first()
        if not relation:
            raise NoTherapistConnected()
 
        serializer = ShareAnswersSerializer(data=request.data,context={'quiz': quiz})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        try:
            send_quiz_shared_notification(therapist=relation.therapist,client=request.user)
        except Exception:
            pass
        quiz = DailyQuiz.objects.prefetch_related('quiz_questions__question','answers__answer_emotions__emotion',).get(id=quiz.id)
        return Response(
            DailyQuizReadSerializer(quiz).data,
            status=status.HTTP_200_OK)

 

class QuizCreateView(APIView):
    permission_classes = [IsAuthenticated, IsTherapist]

    def post(self, request):
        serializer = TherapistCreateQuizSerializer(data=request.data,context={'request': request})
        serializer.is_valid(raise_exception=True)
        quiz = serializer.save()
        return Response(DailyQuizReadSerializer(quiz).data,status=status.HTTP_201_CREATED)


class QuizUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsTherapist]
 
    def patch(self, request, pk):
        try:
            quiz = DailyQuiz.objects.get(pk=pk,source=DailyQuiz.Source.THERAPIST)
        except DailyQuiz.DoesNotExist:
            raise QuizNotFound()
 
        if quiz.created_by != request.user:
            raise CannotModifyQuiz()
 
        if quiz.is_shared_by_therapist:
            raise QuizAlreadyPublished(message="Cannot modify a published quiz.")
 
        serializer = TherapistUpdateQuizSerializer(quiz, data=request.data,context={'request': request})
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        return Response(DailyQuizReadSerializer(updated).data,status=status.HTTP_200_OK)

class QuizPublishView(APIView):
    permission_classes = [IsAuthenticated, IsTherapist]
 
    def post(self, request, pk):
        try:
            quiz = DailyQuiz.objects.get(pk=pk,source=DailyQuiz.Source.THERAPIST)
        except DailyQuiz.DoesNotExist:
            raise QuizNotFound()
 
        if quiz.created_by != request.user:
            raise CannotModifyQuiz()
 
        if quiz.is_shared_by_therapist:
            raise QuizAlreadyPublished()
 
        quiz.is_shared_by_therapist = True
        quiz.save(update_fields=['is_shared_by_therapist'])
        
        try:
            send_quiz_assigned_notification(client=quiz.client,therapist=request.user)
        except Exception:
            pass
 
        return Response({"message": "Quiz published. The patient can see it now."},status=status.HTTP_200_OK)

class QuizDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsTherapist]
 
    def delete(self, request, pk):
        try:
            quiz = DailyQuiz.objects.get(pk=pk,source=DailyQuiz.Source.THERAPIST)
        except DailyQuiz.DoesNotExist:
            raise QuizNotFound()
 
        if quiz.created_by != request.user:
            raise CannotModifyQuiz()
 
        if quiz.is_shared_by_therapist:
            raise QuizAlreadyPublished(message="Cannot delete a published quiz.")
 
        quiz.delete()
        return Response({"message": "Quiz deleted."},status=status.HTTP_204_NO_CONTENT)
 


class ClientQuizzesView(APIView):
    permission_classes = [IsAuthenticated, IsTherapist]
 
    def get(self, request, client_id):
        connected = ClientTherapist.objects.filter(therapist=request.user,client_id=client_id,status=ClientTherapist.Status.ACTIVE,).exists()
        if not connected:
            raise ClientNotConnected()
        
        quizzes = DailyQuiz.objects.filter(client_id=client_id,answers__is_shared_by_client=True,
        ).distinct().prefetch_related('quiz_questions__question','answers__answer_emotions__emotion',
        ).order_by('-date')
 
        serializer = SentQuizReadSerializer(quizzes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
 

class ClientQuizDetailView(APIView):
    permission_classes = [IsAuthenticated, IsTherapist]
 
    def get(self, request, client_id, quiz_id):
        connected = ClientTherapist.objects.filter(therapist=request.user,client_id=client_id,status=ClientTherapist.Status.ACTIVE,).exists()
        if not connected:
            raise ClientNotConnected()
 
        try:
            quiz = DailyQuiz.objects.prefetch_related('quiz_questions__question','answers__answer_emotions__emotion',
            ).filter(pk=quiz_id,client_id=client_id,answers__is_shared_by_client=True,
            ).distinct().get()
        except DailyQuiz.DoesNotExist:
            raise QuizNotFound()
 
        serializer = SentQuizReadSerializer(quiz)
        return Response(serializer.data, status=status.HTTP_200_OK)




class QuestionCreateView(APIView):
    permission_classes = [IsAuthenticated, IsTherapist]
 
    def post(self, request):
        serializer = QuizQuestionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        question = serializer.save(created_by=request.user)
        return Response(QuizQuestionReadSerializer(question).data,status=status.HTTP_201_CREATED)


class QuestionUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsTherapist]
 
    def patch(self, request, pk):
        try:
            question = QuizQuestion.objects.get(pk=pk)
        except QuizQuestion.DoesNotExist:
            raise QuestionNotFound()
 
        if question.is_predefined or question.created_by != request.user:
            raise CannotDeleteQuestion(message="You can only modify questions you created.")
 
        serializer = QuizQuestionUpdateSerializer(question, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(QuizQuestionReadSerializer(question).data,status=status.HTTP_200_OK)

class QuestionDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsTherapist]
 
    def delete(self, request, pk):
        try:
            question = QuizQuestion.objects.get(pk=pk)
        except QuizQuestion.DoesNotExist:
            raise QuestionNotFound()
 
        if question.is_predefined or question.created_by != request.user:
            raise CannotDeleteQuestion()
 
        question.is_active = False
        question.save(update_fields=['is_active'])
        return Response({"message": "Question deleted."}, status=status.HTTP_200_OK)
 
 
class OwnQuestionsView(APIView):
    permission_classes = [IsAuthenticated, IsTherapist]
 
    def get(self, request):
        questions = QuizQuestion.objects.filter(created_by=request.user,is_predefined=False,is_active=True,).order_by('-created_at')
        serializer = QuizQuestionReadSerializer(questions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
 
 
class PredefinedQuestionsView(APIView):
    permission_classes = [IsAuthenticated, IsTherapist]
 
    def get(self, request):
        questions = QuizQuestion.objects.filter(is_predefined=True,).order_by('id')
        serializer = QuizQuestionReadSerializer(questions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
 
 
class SentQuizzesView(APIView):

    permission_classes = [IsAuthenticated, IsTherapist]
 
    def get(self, request):
        quizzes = DailyQuiz.objects.filter(created_by=request.user,source=DailyQuiz.Source.THERAPIST,
        ).select_related('client'
        ).prefetch_related('quiz_questions__question','answers__answer_emotions__emotion',
        ).order_by('-date')
 
        client_id = request.query_params.get('client_id')
        if client_id:
            quizzes = quizzes.filter(client_id=client_id)
 
        serializer = SentQuizReadSerializer(quizzes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class DraftListView(APIView):
    permission_classes = [IsAuthenticated, IsTherapist]
 
    def get(self, request):
        drafts = QuizDraft.objects.filter(
            created_by=request.user
        ).prefetch_related('draft_questions__question')
 
        serializer = QuizDraftReadSerializer(drafts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
 
 
class DraftCreateView(APIView):
    permission_classes = [IsAuthenticated, IsTherapist]
 
    def post(self, request):
        serializer = QuizDraftCreateSerializer(
            data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        draft = serializer.save()
        return Response(
            QuizDraftReadSerializer(draft).data,
            status=status.HTTP_201_CREATED)
 
 
class DraftDetailView(APIView):
    permission_classes = [IsAuthenticated, IsTherapist]
 
    def get(self, request, pk):
        try:
            draft = QuizDraft.objects.prefetch_related(
                'draft_questions__question'
            ).get(pk=pk, created_by=request.user)
        except QuizDraft.DoesNotExist:
            raise DraftNotFound()
 
        return Response(
            QuizDraftReadSerializer(draft).data,
            status=status.HTTP_200_OK)
 
 
class DraftUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsTherapist]
 
    def patch(self, request, pk):
        try:
            draft = QuizDraft.objects.get(pk=pk, created_by=request.user)
        except QuizDraft.DoesNotExist:
            raise DraftNotFound()
 
        serializer = QuizDraftUpdateSerializer(
            draft, data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        return Response(
            QuizDraftReadSerializer(updated).data,
            status=status.HTTP_200_OK)
 
 
class DraftDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsTherapist]
 
    def delete(self, request, pk):
        try:
            draft = QuizDraft.objects.get(pk=pk, created_by=request.user)
        except QuizDraft.DoesNotExist:
            raise DraftNotFound()
 
        draft.delete()
        return Response(
            {"message": "Draft deleted."},
            status=status.HTTP_204_NO_CONTENT)
 
 
class DraftSendView(APIView):
    permission_classes = [IsAuthenticated, IsTherapist]
 
    def post(self, request, pk):
        try:
            draft = QuizDraft.objects.prefetch_related(
                'draft_questions__question'
            ).get(pk=pk, created_by=request.user)
        except QuizDraft.DoesNotExist:
            raise DraftNotFound()
 
        serializer = QuizDraftSendSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
 
        date = serializer.validated_data['date']
        deadline = serializer.validated_data.get('deadline')
        client_ids = serializer.validated_data['client_ids']
        draft_questions = draft.draft_questions.select_related('question').all()
 
        if draft_questions.count() == 0:
            raise InvalidInput(message="This draft has no questions.",details={"field": "questions"})
 
        created_quizzes = []
 
        with transaction.atomic():
            for client_id in client_ids:
                already_exists = DailyQuiz.objects.filter(client_id=client_id,date=date,source=DailyQuiz.Source.THERAPIST).exists()
                if already_exists:
                    raise QuizDateConflict()
 
                quiz = DailyQuiz.objects.create(
                    client_id=client_id,
                    created_by=request.user,
                    date=date,
                    deadline=deadline,
                    source=DailyQuiz.Source.THERAPIST,
                    is_shared_by_therapist=True)
 
                for dq in draft_questions:
                    DailyQuizQuestion.objects.create(
                        daily_quiz=quiz,
                        question=dq.question,
                        order=dq.order,
                        max_chars=dq.max_chars)
 
                    DailyQuizAnswer.objects.create(
                        daily_quiz=quiz,
                        question=dq.question)
 
                created_quizzes.append(quiz)
 
        return Response(
            {"message": "Quiz sent to " + str(len(client_ids)) + " patient(s).",
             "quiz_ids": [q.id for q in created_quizzes]},
            status=status.HTTP_201_CREATED)
 