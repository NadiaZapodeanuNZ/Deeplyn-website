from config.base64 import Base64BinaryField
from django.db import transaction
from rest_framework import serializers
from .models import Journal, Note, Emotion, NoteEmotion
from journal.exceptions import(
    InvalidNumberOfEmotions,
    NotValidIntensity,
    NotValidSource,
    MixedEmotionSource,
    InvalidNoneSource,
    NotUniqueEmotions,
    JournalNotFound,
    InvalidFrontendRequestUpdate,
    )


class EmotionSerializer(serializers.ModelSerializer):
    # The serializers for 28 emotions - from GoEmotions
    # Read-only because the emotions are stored in database!!!
    # so the user can only read and select them, not modify/create
    # it is used with get /journal/emotions so it could be shown in 
    # frontend

    class Meta:
        model = Emotion
        fields = ['id', 'name', 'vector_index']
        read_only_fields = ['id', 'name', 'vector_index']

class NoteEmotionWriteSerializer(serializers.ModelSerializer):
    # Used for Emotions labels on a Note
    # used for frontend 
    # front: emotion (id), intensity (1.0-10.0 - multiplii de 0.5),
    # and  source ('manual' sau 'transformer').

    intensity = serializers.FloatField(min_value=1.0, max_value=10.0)

    class Meta:
        model = NoteEmotion
        fields = ['emotion', 'intensity', 'source']

    def validate_intensity(self, value):
        #value needs to be a multiplier for 0.5
        #so i multiply it with 2 
        # 7.5 * 2 = 15.0 - thi is ok but  7.3 * 2 = 14.6 - not ok
        if (value * 2) != int(value * 2):
            raise NotValidIntensity()
        # return like thsi 7.5/10 = 0.75
        return round(value / 10, 2)

    def validate_source(self, value):
        # verify if the choice that user made is valid!
        #   0 : None = user doesn t want to lable with emotions
        #   1 : Manual = user wants to put himself the top 3 emotions and their intensities
        #   2 : Transformer = users wants the transformer to do the job for them
        allowed = [choice[0] for choice in NoteEmotion.Source.choices]
        if value not in allowed:
            raise NotValidSource(
                message="Invalid source provided.",
                details={"allowed": allowed}
            )
        return value


class NoteEmotionReadSerializer(serializers.ModelSerializer):
    # Return emotion : {id: 3, name: "Joy" , vector_index: 1}

    emotion = EmotionSerializer(read_only=True)

    class Meta:
        model = NoteEmotion
        fields = ['id', 'emotion', 'intensity', 'source']




class NoteCreateSerializer(serializers.ModelSerializer):
    # ONLY FOR----> POST  /notes/... - create the note
   

    note_emotions = NoteEmotionWriteSerializer(many=True, required=False)

    class Meta:
        model = Note
        fields = [
         'title',
         'content',
         'emotions_source',
         'note_emotions'
        ]
    

    def validate(self, data):
        emotions_source = data.get('emotions_source', Note.EmotionsSource.NONE)
        note_emotions = data.get('note_emotions', [])

        if emotions_source == Note.EmotionsSource.NONE:
            if note_emotions:
                raise InvalidNoneSource()

        elif emotions_source == Note.EmotionsSource.MANUAL:
            # MANUAL --> exactly 3 unique emotions required with intensities
            if len(note_emotions) != 3:
                raise InvalidNumberOfEmotions()

            # All 3 emotions must be from same source (manual)
            sources_in_emotions = {e.get('source') for e in note_emotions}
            if len(sources_in_emotions) > 1:
                raise MixedEmotionSource()

            emotion_source = next(iter(sources_in_emotions))
            if emotion_source != emotions_source:
                raise MixedEmotionSource()

            # not the same emotions, they need to be different
            # INVALID --> joy , joy , sadness
            emotion_ids = [e.get('emotion').id for e in note_emotions]
            if len(emotion_ids) != len(set(emotion_ids)):
                raise NotUniqueEmotions()

        elif emotions_source == Note.EmotionsSource.TRANSFORMER:
            # TRANSFORMER --> frontend sends NO emotions
            # transformer will add them after save() in the view
            if note_emotions:
                raise InvalidNoneSource(
                    message="When using AUTOMATICALLY, emotions are detected "
                            "by the transformer. Do not send emotions manually."
                )
        return data

    def create(self, validated_data):
        # note_emotions for MANUAL are saved here
        # for TRANSFORMER, this list is empty 
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
    # PATCH /notes/<id>/ — CLIENT role only
    # Rules:
    # - if only the title changed  -->> emotions stay untouched  
    # - if the content changed -->> emotions DELETED, user must re-declare emotions_source

    # Frontend sends plain text —>> view handles encryption
    # Serializer only validates data and emotions logic

    title = serializers.CharField(max_length=32, required=False)
    content = serializers.CharField(max_length=1500, required=False)
    note_emotions = NoteEmotionWriteSerializer(many=True, required=False)

    content_changed = serializers.BooleanField(
        required=False,
        default=False,
        write_only=True
    )

    class Meta:
        model = Note
        fields = [
            'title',
            'content',
            'content_changed',
            'emotions_source',
            'note_emotions',
        ]

    def validate(self, data):
        content_changed = data.get('content_changed', False)

        # Case 1: content sent but content_changed = False -- is the frontend error
        if 'content' in data and not content_changed:
            raise InvalidFrontendRequestUpdate(
                message="Contradiction: content was sent but content_changed = False!"
            )

        # Case 2: content changed -->> validate new emotions (same rules as create)
        if content_changed:
            emotions_source = data.get('emotions_source')

            if not emotions_source:
                raise NotValidSource()

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
        # title and content are popped by view and replaced with encrypted versions
        validated_data.pop('title', None)
        validated_data.pop('content', None)

        if should_clear_emotions:
            instance.note_emotions.all().delete()

        # At this point validated_data contains encrypted fields injected by view
        for field, value in validated_data.items():
            setattr(instance, field, value)

        instance.save()

        # Save new MANUAL emotions after clearing old ones
        # TRANSFORMER emotions added by view after this returns
        for emotion_data in note_emotions_data:
            NoteEmotion.objects.create(note=instance, **emotion_data)

        return instance

# ------------------------------------------
class NoteReadSerializer(serializers.ModelSerializer):
    #  (GET /notes/<id>/ and listing).

    title = serializers.CharField(read_only=True)
    content = serializers.CharField(read_only=True) 

    note_emotions = NoteEmotionReadSerializer(many=True, read_only=True)

    class Meta:
        model = Note
        fields = [
            'id',
            'title',
            'content',
            'created_at', 'updated_at',
            'is_favorite', 'emotions_source',
            'note_emotions',
        ]
        read_only_fields = fields

class NoteFavoriteSerializer(serializers.ModelSerializer):
    # toggle for favourite (POST /notes/<id>/favorite/).

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