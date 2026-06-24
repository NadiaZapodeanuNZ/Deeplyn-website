from django.db import transaction
from rest_framework import serializers
from .models import Journal, Note, Emotion, NoteEmotion, SharedNote
from .exceptions import(InvalidNumberOfEmotions, NotValidIntensity, NotValidSource,MixedEmotionSource,
InvalidNoneSource,NotUniqueEmotions,JournalNotFound,InvalidFrontendRequestUpdate)


class EmotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Emotion
        fields = ['id', 'name', 'vector_index']
        read_only_fields = ['id', 'name', 'vector_index']

class NoteEmotionWriteSerializer(serializers.ModelSerializer):
    intensity = serializers.FloatField(min_value=1.0, max_value=10.0)

    class Meta:
        model = NoteEmotion
        fields = ['emotion', 'intensity', 'source']

    def validate_intensity(self, value):
        if (value * 2) != int(value * 2):
            raise NotValidIntensity()
        return round(value / 10, 2)

    def validate_source(self, value):
        allowed = [choice[0] for choice in NoteEmotion.Source.choices]
        if value not in allowed:
            raise NotValidSource(
                message="Invalid source provided.",
                details={"allowed": allowed})
        return value


class NoteEmotionReadSerializer(serializers.ModelSerializer):
    emotion = EmotionSerializer(read_only=True)
    class Meta:
        model = NoteEmotion
        fields = ['id', 'emotion', 'intensity', 'source']


class NoteCreateSerializer(serializers.ModelSerializer):
    note_emotions = NoteEmotionWriteSerializer(many=True, required=False)
    class Meta:
        model = Note
        fields = [
         'title',
         'content',
         'emotions_source',
         'is_shared',
         'note_emotions']
    

    def validate(self, data):
        emotions_source = data.get('emotions_source', Note.EmotionsSource.NONE)
        note_emotions = data.get('note_emotions', [])

        if emotions_source == Note.EmotionsSource.NONE:
            if note_emotions:
                raise InvalidNoneSource()

        elif emotions_source == Note.EmotionsSource.MANUAL:

            if len(note_emotions) != 3:
                raise InvalidNumberOfEmotions()

            sources_in_emotions = {e.get('source') for e in note_emotions}
            if len(sources_in_emotions) > 1:
                raise MixedEmotionSource()

            emotion_source = next(iter(sources_in_emotions))
            if emotion_source != emotions_source:
                raise MixedEmotionSource()

            emotion_ids = [e.get('emotion').id for e in note_emotions]
            if len(emotion_ids) != len(set(emotion_ids)):
                raise NotUniqueEmotions()

        elif emotions_source == Note.EmotionsSource.TRANSFORMER:
            if note_emotions:
                raise InvalidNoneSource(
                    message="When using AUTOMATICALLY, emotions are detected "
                            "by the transformer. Do not send emotions manually.")
        return data

    def create(self, validated_data):
        note_emotions_data = validated_data.pop('note_emotions', [])

        user = self.context['request'].user
        try:
            journal = user.journal
        except Journal.DoesNotExist:
            raise JournalNotFound()

        with transaction.atomic():
            note = Note.objects.create(journal=journal, **validated_data)
            for emotion_data in note_emotions_data:
                NoteEmotion.objects.create(note=note, **emotion_data)

        return note
    
class NoteUpdateSerializer(serializers.ModelSerializer):
    title = serializers.CharField(max_length=32, required=False)
    content = serializers.CharField(max_length=1500, required=False)
    note_emotions = NoteEmotionWriteSerializer(many=True, required=False)

    content_changed = serializers.BooleanField(required=False,default=False,write_only=True)

    class Meta:
        model = Note
        fields = [
            'title',
            'content',
            'content_changed',
            'emotions_source',
            'is_shared',
            'note_emotions']

    def validate(self, data):
        content_changed = data.get('content_changed', False)

        if 'content' in data and not content_changed:
            raise InvalidFrontendRequestUpdate(
                message="Contradiction: content was sent but content_changed = False!")

        new_source = data.get('emotions_source')
        source_changed = ( new_source is not None and
            self.instance is not None and
            new_source != self.instance.emotions_source)

        should_clear = content_changed or source_changed

        if should_clear:
            emotions_source = data.get('emotions_source', self.instance.emotions_source)
            note_emotions = data.get('note_emotions', [])

            if emotions_source == Note.EmotionsSource.NONE:
                if note_emotions:
                    raise InvalidNoneSource()

            elif emotions_source == Note.EmotionsSource.MANUAL:
                if len(note_emotions) != 3:
                    raise InvalidNumberOfEmotions()

                sources_in_emotions = {e.get('source') for e in note_emotions}
                if len(sources_in_emotions) > 1:
                    raise MixedEmotionSource()

                emotion_source = next(iter(sources_in_emotions))
                if emotion_source != emotions_source:
                    raise MixedEmotionSource()

                emotion_ids = [e.get('emotion').id for e in note_emotions]
                if len(emotion_ids) != len(set(emotion_ids)):
                    raise NotUniqueEmotions()

            elif emotions_source == Note.EmotionsSource.TRANSFORMER:
                if note_emotions:
                    raise InvalidNoneSource(
                        message="When using AUTOMATICALLY, do not send emotions manually."
                    )

            data['_should_clear_emotions'] = True

        return data

    def update(self, instance, validated_data):
        should_clear_emotions = validated_data.pop('_should_clear_emotions', False)
        note_emotions_data = validated_data.pop('note_emotions', [])
        validated_data.pop('content_changed', None)

        if should_clear_emotions:
            instance.note_emotions.all().delete()
            for emotion_data in note_emotions_data:
                NoteEmotion.objects.create(note=instance, **emotion_data)

        for field, value in validated_data.items():
            setattr(instance, field, value)

        instance.save()
        return instance


class NoteReadSerializer(serializers.ModelSerializer):
    title = serializers.CharField(read_only=True)
    content = serializers.CharField(read_only=True) 

    note_emotions = NoteEmotionReadSerializer(many=True, read_only=True)

    class Meta:
        model = Note
        fields = ['id','title','content',
            'created_at', 'updated_at',
            'is_favorite', 'emotions_source',
            'is_shared','note_emotions']
        read_only_fields = fields

class NoteFavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ['id','is_favorite']
        read_only_fields = ['id', 'is_favorite']

    def update(self, instance, validated_data):
        instance.is_favorite = not instance.is_favorite
        instance.save(update_fields=['is_favorite'])
        return instance


class JournalSerializer(serializers.ModelSerializer):
    notes_count = serializers.SerializerMethodField()

    class Meta:
        model = Journal
        fields = ['id', 'created_at', 'notes_count']

    def get_notes_count(self, obj):
        return obj.notes.count()

class SharedNoteReadSerializer(serializers.ModelSerializer):
    client_username = serializers.CharField(source='client.username', read_only=True)

    class Meta:
        model = SharedNote
        fields = ['id', 'client_username', 'title', 'content', 'emotions_source', 'emotions_snapshot', 'shared_at']
        read_only_fields = fields

class SharedNoteTherapistSerializer(serializers.ModelSerializer):
    client_first_name = serializers.CharField(source='client.first_name', read_only=True)
    client_last_name = serializers.CharField(source='client.last_name', read_only=True)
    is_favorite = serializers.SerializerMethodField()
    created_at = serializers.SerializerMethodField()
    note_emotions = serializers.SerializerMethodField()

    class Meta:
        model = SharedNote
        fields = [
            'id',
            'client_first_name',
            'client_last_name',
            'title',
            'content',
            'emotions_source',
            'note_emotions',
            'is_favorite',
            'created_at',
            'shared_at']
        read_only_fields = fields

    def get_is_favorite(self, obj):
        if obj.note is None:
            return False
        return obj.note.is_favorite

    def get_created_at(self, obj):
        if obj.note is not None:
            return obj.note.created_at
        return obj.shared_at

    def get_note_emotions(self, obj):
        result = []
        for item in (obj.emotions_snapshot or []):
            result.append({
                "emotion": {
                    "id": item.get("emotion_id"),
                    "name": item.get("emotion_name")},
                "intensity": item.get("intensity"),
                "source": item.get("source")})
        return result