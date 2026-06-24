from rest_framework import serializers
from django.db import transaction
from .models import Exercise, ExerciseCompletion, ExerciseEmotion
from journal.serializers import EmotionSerializer
from users.models import ClientTherapist
from .exceptions import InvalidInput

class ExerciseEmotionReadSerializer(serializers.ModelSerializer):
    emotion = EmotionSerializer(read_only=True)
    
    class Meta:
        model = ExerciseEmotion
        fields = ['id', 'emotion', 'intensity', 'source']

class ExerciseEmotionWriteSerializer(serializers.ModelSerializer):
    intensity = serializers.FloatField(min_value=1.0, max_value=10.0)

    class Meta:
        model = ExerciseEmotion
        fields = ['emotion', 'intensity', 'source']

    def validate_intensity(self, value):
        if (value * 2) != int(value * 2):
            raise InvalidInput(
                message="Intensity must be a multiple of 0.5.",
                details={"field": "intensity"})
        return round(value / 10, 2)

    def validate_source(self, value):
        allowed = [choice[0] for choice in ExerciseEmotion.Source.choices]
        if value not in allowed:
            raise InvalidInput(
                message="Invalid source.",
                details={"allowed": allowed, "field": "source"})
        return value

class ExerciseReadSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    therapy_type_display = serializers.CharField(source='get_therapy_type_display', read_only=True)
    content_format_display = serializers.CharField(source='get_content_format_display', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True)

    class Meta:
        model = Exercise
        fields = ['id', 'title', 'category', 'category_display', 'therapy_type', 'therapy_type_display',
            'content_format', 'content_format_display', 'nr_questions', 'content',
            'is_predefined', 'is_shared_by_therapist', 'created_by', 'created_by_username',
            'assigned_to', 'assigned_to_username', 'created_at', 'updated_at']
        read_only_fields = fields

class ExerciseCompletionReadSerializer(serializers.ModelSerializer):
    exercise = ExerciseReadSerializer(read_only=True)
    exercise_emotions = ExerciseEmotionReadSerializer(many=True, read_only=True)
    client_username = serializers.CharField(source='client.username', read_only=True)
    client_first_name = serializers.CharField(source='client.first_name', read_only=True)
    client_last_name = serializers.CharField(source='client.last_name', read_only=True)
    client_profile_photo = serializers.SerializerMethodField()

    def get_client_profile_photo(self, obj):
        request = self.context.get('request')
        if obj.client.profile_photo and request:
            return request.build_absolute_uri(obj.client.profile_photo.url)
        return None

    class Meta:
        model = ExerciseCompletion
        fields = ['id', 'exercise', 'client', 'client_username', 'client_first_name', 'client_last_name',
            'client_profile_photo', 'response', 'comment', 'emotions_source', 'is_shared_with_therapist',
            'completed_at', 'updated_at', 'exercise_emotions']
        read_only_fields = fields

class ExerciseCompletionCreateSerializer(serializers.ModelSerializer):
    exercise_emotions = ExerciseEmotionWriteSerializer(many=True, required=False)

    class Meta:
        model = ExerciseCompletion
        fields = ['response', 'comment', 'emotions_source', 'exercise_emotions']

    def validate_response(self, value):
        if len(value) > 1000:
            raise InvalidInput(message="Response cannot exceed 1000 characters.", details={"field": "response"})
        return value

    def validate(self, data):
        emotions_source = data.get('emotions_source', ExerciseCompletion.EmotionsSource.NONE)
        exercise_emotions = data.get('exercise_emotions', [])

        if emotions_source == ExerciseCompletion.EmotionsSource.NONE:
            if exercise_emotions:
                raise InvalidInput(message="Remove emotions when using None.", details={"field": "exercise_emotions"})

        elif emotions_source == ExerciseCompletion.EmotionsSource.MANUAL:
            if len(exercise_emotions) != 3:
                raise InvalidInput(message="Choose exactly 3 emotions for Manual.", details={"field": "exercise_emotions"})

            sources = {e.get('source') for e in exercise_emotions}
            if len(sources) > 1 or next(iter(sources)) != 'manual':
                raise InvalidInput(message="All emotions must have source='manual'.", details={"field": "source"})

            emotion_ids = [e.get('emotion').id for e in exercise_emotions]
            if len(emotion_ids) != len(set(emotion_ids)):
                raise InvalidInput(message="Choose 3 different emotions.", details={"field": "exercise_emotions"})

        elif emotions_source == ExerciseCompletion.EmotionsSource.TRANSFORMER:
            if exercise_emotions:
                raise InvalidInput(message="Do not send emotions when using Automatically.", details={"field": "exercise_emotions"})

        return data

    def create(self, validated_data):
        exercise_emotions_data = validated_data.pop('exercise_emotions', [])
        exercise = self.context['exercise']
        client = self.context['request'].user

        with transaction.atomic():
            completion = ExerciseCompletion.objects.create(exercise=exercise,client=client,**validated_data)

            for emotion_data in exercise_emotions_data:
                ExerciseEmotion.objects.create(completion=completion,**emotion_data)
        return completion

class TherapistExerciseCreateSerializer(serializers.ModelSerializer):
    assigned_to_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = Exercise
        fields = ['title', 'category', 'therapy_type', 'content_format', 'nr_questions', 'content', 'assigned_to_id']

    def validate_assigned_to_id(self, value):
        if value:
            therapist = self.context['request'].user
            connected = ClientTherapist.objects.filter(therapist=therapist,client_id=value,status=ClientTherapist.Status.ACTIVE).exists()
            if not connected:
                raise InvalidInput(message="This client is not connected to you.", details={"field": "assigned_to_id"})
        return value

    def create(self, validated_data):
        therapist = self.context['request'].user
        assigned_to_id = validated_data.pop('assigned_to_id', None)

        is_shared = True if assigned_to_id else False

        return Exercise.objects.create(
            created_by=therapist,
            is_predefined=False,
            is_shared_by_therapist=is_shared,
            assigned_to_id=assigned_to_id,
            **validated_data)

class TherapistExerciseUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ['title', 'category', 'therapy_type', 'content_format', 'nr_questions', 'content']