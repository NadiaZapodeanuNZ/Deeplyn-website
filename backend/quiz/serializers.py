from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from journal.serializers import EmotionSerializer
from users.exceptions import InvalidInput
from users.models import ClientTherapist
from .exceptions import (AnswerAlreadySubmitted,ClientNotConnected,QuizDateConflict,)
from .models import (DailyQuiz, DailyQuizAnswer, DailyQuizQuestion,QAEmotion, QuizDraft, QuizDraftQuestion, QuizQuestion,)
from quiz.models import DailyQuizAnswer, DailyQuiz

class QAEmotionReadSerializer(serializers.ModelSerializer):
    emotion = EmotionSerializer(read_only=True)
    class Meta:
        model = QAEmotion
        fields = ['id', 'emotion', 'intensity', 'source']

class QAEmotionWriteSerializer(serializers.ModelSerializer):
    intensity = serializers.FloatField(min_value=0.0, max_value=10.0)
    class Meta:
        model = QAEmotion
        fields = ['emotion', 'intensity', 'source']

    def validate_intensity(self, value):
        if (value * 2) != int(value * 2):
            raise InvalidInput(message="Intensity must be a multiple of 0.5.",details={"field": "intensity"})
        return round(value / 10, 2)

    def validate_source(self, value):
        allowed = [choice[0] for choice in QAEmotion.Source.choices]
        if value not in allowed:
            raise InvalidInput(message="Invalid source.",details={"allowed": allowed, "field": "source"})
        return value


class QuizQuestionReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = ['id', 'text', 'is_predefined', 'created_by', 'created_at']
        read_only_fields = fields

class DailyQAReadSerializer(serializers.ModelSerializer):
    question = QuizQuestionReadSerializer(read_only=True)
    answer_emotions = QAEmotionReadSerializer(many=True, read_only=True)
    max_chars = serializers.SerializerMethodField()

    class Meta:
        model = DailyQuizAnswer
        fields = ['id', 'question', 'max_chars', 'answer_text','emotions_source', 'is_submitted', 'submitted_at',
            'answer_emotions', 'is_shared_by_client']
        read_only_fields = fields

    def get_max_chars(self, answer):
        try:
            dqq = DailyQuizQuestion.objects.get(daily_quiz=answer.daily_quiz,question=answer.question)
            return dqq.max_chars
        except DailyQuizQuestion.DoesNotExist:
            return 500
        
class DailyQuizReadSerializer(serializers.ModelSerializer):
    answers = serializers.SerializerMethodField()
    has_shared_answers = serializers.BooleanField(read_only=True)
    is_fully_submitted = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = DailyQuiz
        fields = ['id', 'date', 'source', 'is_shared_by_therapist',
            'has_shared_answers', 'is_fully_submitted', 'is_expired',
            'deadline', 'created_by', 'created_at', 'answers']
        read_only_fields = fields

    def get_answers(self, quiz):
        order_map = dict(quiz.quiz_questions.values_list('question_id', 'order'))
        answers_sorted = sorted(quiz.answers.select_related('question').all(),key=lambda a: order_map.get(a.question_id, 999))

        return DailyQAReadSerializer(
            answers_sorted, many=True, context=self.context).data

class AnswerDraftSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyQuizAnswer
        fields = ['answer_text']

    def validate(self, data):
        if self.instance and self.instance.is_submitted:
            raise AnswerAlreadySubmitted()
        return data

    def update(self, instance, validated_data):
        instance.answer_text = validated_data.get('answer_text', instance.answer_text)
        instance.save(update_fields=['answer_text'])
        return instance



class AnswerSubmitSerializer(serializers.ModelSerializer):
    answer_emotions = QAEmotionWriteSerializer(many=True, required=False)

    class Meta:
        model = DailyQuizAnswer
        fields = ['answer_text', 'emotions_source', 'answer_emotions']

    def validate(self, data):
        if self.instance and self.instance.is_submitted:
            raise AnswerAlreadySubmitted()

        emotions_source = data.get('emotions_source', DailyQuizAnswer.EmotionsSource.NONE)
        answer_emotions = data.get('answer_emotions', [])

        if emotions_source == DailyQuizAnswer.EmotionsSource.NONE:
            if answer_emotions:
                raise InvalidInput(message="Remove emotions when using None.",details={"field": "answer_emotions"})

        elif emotions_source == DailyQuizAnswer.EmotionsSource.MANUAL:
            if len(answer_emotions) != 3:
                raise InvalidInput(message="Choose exactly 3 emotions for Manual.",details={"field": "answer_emotions"})

            sources = {e.get('source') for e in answer_emotions}
            if len(sources) > 1 or next(iter(sources)) != 'manual':
                raise InvalidInput(message="All emotions must have source='manual'.",details={"field": "source"})

            emotion_ids = [e.get('emotion').id for e in answer_emotions]
            if len(emotion_ids) != len(set(emotion_ids)):
                raise InvalidInput(message="Choose 3 different emotions.",details={"field": "answer_emotions"})

        elif emotions_source == DailyQuizAnswer.EmotionsSource.TRANSFORMER:
            if answer_emotions:
                raise InvalidInput(message="Do not send emotions when using Automatically.",details={"field": "answer_emotions"})

        return data

    def update(self, instance, validated_data):
        answer_emotions_data = validated_data.pop('answer_emotions', [])
        with transaction.atomic():
            instance.answer_text = validated_data.get('answer_text', instance.answer_text)
            instance.emotions_source = validated_data.get('emotions_source', instance.emotions_source)
            instance.is_submitted = True
            instance.submitted_at = timezone.now()
            instance.save(update_fields=['answer_text', 'emotions_source','is_submitted', 'submitted_at'])

            for emotion_data in answer_emotions_data:
                QAEmotion.objects.create(answer=instance, **emotion_data)

        return instance


class AnswerEmotionUpdateSerializer(serializers.Serializer):
    answer_emotions = QAEmotionWriteSerializer(many=True)
    emotions_source = serializers.ChoiceField(
        choices=DailyQuizAnswer.EmotionsSource.choices)

    def validate(self, data):
        emotions_source = data.get('emotions_source')
        answer_emotions = data.get('answer_emotions', [])

        if emotions_source == DailyQuizAnswer.EmotionsSource.NONE:
            if answer_emotions:
                raise InvalidInput(message="Remove emotions when using None.",details={"field": "answer_emotions"})

        elif emotions_source == DailyQuizAnswer.EmotionsSource.MANUAL:
            if len(answer_emotions) != 3:
                raise InvalidInput(message="Choose exactly 3 emotions.",details={"field": "answer_emotions"})

            emotion_ids = [e.get('emotion').id for e in answer_emotions]
            if len(emotion_ids) != len(set(emotion_ids)):
                raise InvalidInput(message="Choose 3 different emotions.",details={"field": "answer_emotions"})

        elif emotions_source == DailyQuizAnswer.EmotionsSource.TRANSFORMER:
            if answer_emotions:
                raise InvalidInput(message="Do not send emotions when using Automatically.",details={"field": "answer_emotions"})

        return data

    def update(self, instance, validated_data):
        answer_emotions_data = validated_data.pop('answer_emotions', [])
        with transaction.atomic():
            # delete old emotions and create new one!!!
            instance.answer_emotions.all().delete()
            instance.emotions_source = validated_data.get('emotions_source')
            instance.save(update_fields=['emotions_source'])
            for emotion_data in answer_emotions_data:
                QAEmotion.objects.create(answer=instance, **emotion_data)
        return instance

# Therapist is the only one who can create quizez!!! 
class QuizQuestionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = ['text']

    def validate_text(self, value):
        value = value.strip()
        if not value:
            raise InvalidInput(message="Question text cannot be empty.",details={"field": "text"})
        if len(value) > 500:
            raise InvalidInput(message="Question text cannot exceed 500 characters.",details={"field": "text"})
        return value

    def create(self, validated_data):
        return QuizQuestion.objects.create(**validated_data, is_predefined=False)


class QuizQuestionUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = ['text']

    def validate_text(self, value):
        value = value.strip()
        if not value:
            raise InvalidInput(message="Question text cannot be empty.",details={"field": "text"})
        if len(value) > 500:
            raise InvalidInput(message="Question text cannot exceed 500 characters.",details={"field": "text"})
        return value

class TherapistQuizQuestionSerializer(serializers.Serializer):
    question_id = serializers.IntegerField(required=False)
    text = serializers.CharField(required=False, max_length=500)
    max_chars = serializers.IntegerField(default=500, min_value=50, max_value=2000)

    def validate(self, data):
        has_id = 'question_id' in data
        has_text = 'text' in data and data['text'].strip()

        if has_id and has_text:
            raise InvalidInput(message="Send either question_id or text, not both.",details={"field": "question"})

        if not has_id and not has_text:
            raise InvalidInput(message="Send either question_id or text.",details={"field": "question"})

        if has_id:
            exists = QuizQuestion.objects.filter(id=data['question_id']).exists()
            if not exists:
                raise InvalidInput(message="Question not found.",details={"field": "question_id"})

        return data

# THE WHOLE DAILY QUIZ CREATED BY THERAPIST!
# the therapist NEEDS to have an active relationship
# it cannot exist a daily quiz Therapist (another already existed for this day)
# the quiz must have 1-20 questions. 
#  create ---> everything needs to be atomic:
# DAILY QUIZ - need to be created , 
# for every question , i create DailyQuizQuestion and DailyQuizAnswer
class TherapistCreateQuizSerializer(serializers.Serializer):
    client_id = serializers.IntegerField()
    date = serializers.DateField()
    deadline = serializers.DateField(required=False, allow_null=True)
    questions = TherapistQuizQuestionSerializer(many=True)

    def validate_questions(self, value):
        if len(value) < 1:
            raise InvalidInput(message="A quiz must have at least 1 question.",details={"field": "questions"})
        if len(value) > 20:
            raise InvalidInput(message="A quiz cannot have more than 20 questions.",details={"field": "questions"})
        return value

    def validate(self, data):
        therapist = self.context['request'].user

        # the therapist MUST HAVE an active relationship with client
        connected = ClientTherapist.objects.filter(therapist=therapist,client_id=data['client_id'],status=ClientTherapist.Status.ACTIVE).exists()
        if not connected:
            raise ClientNotConnected()

        already_exists = DailyQuiz.objects.filter(client_id=data['client_id'],date=data['date'],source=DailyQuiz.Source.THERAPIST).exists()
        if already_exists:
            raise QuizDateConflict()

        if not data.get('deadline'):
            data['deadline'] = data['date']

        if data['deadline'] < data['date']:
            raise InvalidInput(
                message="Deadline cannot be before the quiz date.",
                details={"field": "deadline"})

        return data

    def create(self, validated_data):
        therapist = self.context['request'].user
        questions_data = validated_data.pop('questions')

        with transaction.atomic():
            quiz = DailyQuiz.objects.create(
                client_id=validated_data['client_id'],
                created_by=therapist,
                date=validated_data['date'],
                deadline=validated_data['deadline'],
                source=DailyQuiz.Source.THERAPIST,
                is_shared_by_therapist=False)

            for order, q_data in enumerate(questions_data, start=1):
                if 'question_id' in q_data:
                    question_id = q_data['question_id']
                else:
                    new_question = QuizQuestion.objects.create(
                        text=q_data['text'].strip(),
                        is_predefined=False,
                        created_by=therapist)
                    question_id = new_question.id

                DailyQuizQuestion.objects.create(
                    daily_quiz=quiz,
                    question_id=question_id,
                    order=order,
                    max_chars=q_data.get('max_chars', 500))
                
                DailyQuizAnswer.objects.create(
                    daily_quiz=quiz,
                    question_id=question_id)

        quiz = DailyQuiz.objects.prefetch_related('quiz_questions__question','answers__answer_emotions__emotion',).get(id=quiz.id)
        return quiz



#  modify a quiz that is NOT SHARED !!!!
#  it can change 
# - deadline
# - questions
# -if questions --> it deletes every old questions and old answers 
# and it creates new one
class TherapistUpdateQuizSerializer(serializers.Serializer):
    deadline = serializers.DateField(required=False, allow_null=True)
    questions = TherapistQuizQuestionSerializer(many=True, required=False)

    def validate_questions(self, value):
        if len(value) < 1:
            raise InvalidInput(message="A quiz must have at least 1 question.",details={"field": "questions"})
        if len(value) > 20:
            raise InvalidInput(message="A quiz cannot have more than 20 questions.",details={"field": "questions"})
        return value

    def validate(self, data):
        if 'deadline' in data and data['deadline'] is not None:
            if data['deadline'] < self.instance.date:
                raise InvalidInput(message="Deadline cannot be before the quiz date.",details={"field": "deadline"})
        return data

    def update(self, instance, validated_data):
        therapist = self.context['request'].user
        questions_data = validated_data.pop('questions', None)

        with transaction.atomic():
            if 'deadline' in validated_data:
                instance.deadline = validated_data['deadline']
                instance.save(update_fields=['deadline'])

            if questions_data is not None:
                instance.quiz_questions.all().delete()
                instance.answers.all().delete()

                for order, q_data in enumerate(questions_data, start=1):
                    if 'question_id' in q_data:
                        question_id = q_data['question_id']
                    else:
                        new_question = QuizQuestion.objects.create(
                            text=q_data['text'].strip(),
                            is_predefined=False,
                            created_by=therapist)
                        question_id = new_question.id

                    DailyQuizQuestion.objects.create(
                        daily_quiz=instance,
                        question_id=question_id,
                        order=order,
                        max_chars=q_data.get('max_chars', 500))
                    
                    DailyQuizAnswer.objects.create(
                        daily_quiz=instance,
                        question_id=question_id)

        instance = DailyQuiz.objects.prefetch_related('quiz_questions__question','answers__answer_emotions__emotion',).get(id=instance.id)
        return instance


# it inherits DailyQuizReadSerializer
# and addes new info about the client , so the therapist 
# see the quizez that are sended ---> terapist send the quiz and needs to know
# to whom it was sended , not only the quiz info !!!!
class SentQuizReadSerializer(DailyQuizReadSerializer):
    client_id = serializers.IntegerField(source='client.id', read_only=True)
    client_username = serializers.CharField(source='client.username', read_only=True)
    client_first_name = serializers.CharField(source='client.first_name', read_only=True)
    client_last_name = serializers.CharField(source='client.last_name', read_only=True)

    class Meta(DailyQuizReadSerializer.Meta):
        fields = DailyQuizReadSerializer.Meta.fields + [
            'client_id', 'client_username',
            'client_first_name', 'client_last_name',
        ]
        read_only_fields = fields

    def get_answers(self, quiz):
        order_map = dict(
            quiz.quiz_questions.values_list('question_id', 'order'))
        
        # the therapist can see ONLY THE RESPONSES SHARED by client!!!!
        shared_answers = quiz.answers.filter(is_shared_by_client=True)
        answers_sorted = sorted(shared_answers,key=lambda a: order_map.get(a.question_id, 999))
        return DailyQAReadSerializer(answers_sorted, many=True).data



# the share is ireversible!!!!
class ShareAnswersSerializer(serializers.Serializer):
    answer_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
    )

    def validate_answer_ids(self, value):
        quiz = self.context['quiz']
        valid_ids = set(quiz.answers.values_list('id', flat=True))
        invalid = set(value) - valid_ids
        if invalid:
            raise InvalidInput(message="Some answers don't belong to this quiz.",details={"invalid_ids": list(invalid)})

        not_submitted = quiz.answers.filter(
            id__in=value, is_submitted=False).exists()
        if not_submitted:
            raise InvalidInput(
                message="You can only share submitted answers.",
                details={"field": "answer_ids"})

        return value

    def save(self):
        answer_ids = self.validated_data['answer_ids']
        quiz = self.context['quiz']
        quiz.answers.filter(id__in=answer_ids).update(is_shared_by_client=True)

class QuizDraftQuestionReadSerializer(serializers.ModelSerializer):
    question = QuizQuestionReadSerializer(read_only=True)
 
    class Meta:
        model = QuizDraftQuestion
        fields = ['id', 'question', 'order', 'max_chars']
        read_only_fields = fields
 
 
class QuizDraftReadSerializer(serializers.ModelSerializer):
    draft_questions = QuizDraftQuestionReadSerializer(many=True, read_only=True)
    question_count = serializers.SerializerMethodField()
 
    class Meta:
        model = QuizDraft
        fields = ['id', 'created_at', 'updated_at',
                  'draft_questions', 'question_count']
        read_only_fields = fields
 
    def get_question_count(self, draft):
        return draft.draft_questions.count()
 
 
class QuizDraftCreateSerializer(serializers.Serializer):
    questions = TherapistQuizQuestionSerializer(many=True)
 
    def validate_questions(self, value):
        if len(value) < 1:
            raise InvalidInput(
                message="A draft must have at least 1 question.",
                details={"field": "questions"})
        if len(value) > 20:
            raise InvalidInput(
                message="A draft cannot have more than 20 questions.",
                details={"field": "questions"})
        return value
 
    def create(self, validated_data):
        therapist = self.context['request'].user
        questions_data = validated_data.pop('questions')
 
        with transaction.atomic():
            draft = QuizDraft.objects.create(created_by=therapist)
 
            for order, q_data in enumerate(questions_data, start=1):
                if 'question_id' in q_data:
                    question_id = q_data['question_id']
                else:
                    new_question = QuizQuestion.objects.create(
                        text=q_data['text'].strip(),
                        is_predefined=False,
                        created_by=therapist)
                    question_id = new_question.id
 
                QuizDraftQuestion.objects.create(
                    draft=draft,
                    question_id=question_id,
                    order=order,
                    max_chars=q_data.get('max_chars', 500))
 
        return QuizDraft.objects.prefetch_related(
            'draft_questions__question').get(id=draft.id)
 

class QuizDraftUpdateSerializer(serializers.Serializer):
    questions = TherapistQuizQuestionSerializer(many=True, required=False)
 
    def validate_questions(self, value):
        if len(value) < 1:
            raise InvalidInput(
                message="A draft must have at least 1 question.",
                details={"field": "questions"})
        if len(value) > 20:
            raise InvalidInput(
                message="A draft cannot have more than 20 questions.",
                details={"field": "questions"})
        return value
 
    def update(self, instance, validated_data):
        therapist = self.context['request'].user
        questions_data = validated_data.pop('questions', None)
 
        with transaction.atomic():
            if questions_data is not None:
                instance.draft_questions.all().delete()
 
                for order, q_data in enumerate(questions_data, start=1):
                    if 'question_id' in q_data:
                        question_id = q_data['question_id']
                    else:
                        new_question = QuizQuestion.objects.create(
                            text=q_data['text'].strip(),
                            is_predefined=False,
                            created_by=therapist)
                        question_id = new_question.id
 
                    QuizDraftQuestion.objects.create(
                        draft=instance,
                        question_id=question_id,
                        order=order,
                        max_chars=q_data.get('max_chars', 500))
 
        return QuizDraft.objects.prefetch_related(
            'draft_questions__question').get(id=instance.id)
 

class QuizDraftSendSerializer(serializers.Serializer):
    client_ids = serializers.ListField(child=serializers.IntegerField(), min_length=1)
    deadline = serializers.DateField(required=False, allow_null=True)
 
    def validate_client_ids(self, value):
        therapist = self.context['request'].user
        for client_id in value:
            connected = ClientTherapist.objects.filter(
                therapist=therapist,
                client_id=client_id,
                status=ClientTherapist.Status.ACTIVE).exists()
            if not connected:
                raise ClientNotConnected()
        return value
 
    def validate(self, data):
        today = timezone.now().date()
        data['date'] = today
 
        if not data.get('deadline'):
            data['deadline'] = today
 
        if data['deadline'] < today:
            raise InvalidInput(
                message="Deadline cannot be before today.",
                details={"field": "deadline"})
        return data