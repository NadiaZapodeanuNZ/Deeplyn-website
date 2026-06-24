from rest_framework import serializers
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from datetime import timedelta, date
from therapy.models import Session
from therapy.exceptions import SessionInPast, InvalidSessionDate
from users.exceptions import InvalidInput


class SessionReadSerializer(serializers.ModelSerializer):
    participant_name = serializers.SerializerMethodField()
    session_type_display = serializers.SerializerMethodField()
    participant_photo = serializers.SerializerMethodField()
    need_to_approve_id = serializers.IntegerField(source='need_to_approve.id', allow_null=True, read_only=True)
    client_id = serializers.IntegerField(source='client.id', read_only=True)

    class Meta:
        model = Session
        fields = [
            'id', 'date', 'session_type', 'session_type_display',
            'status', 'participant_name', 'participant_photo',
            'client_notes', 'therapist_notes', 'created_at',
            'need_to_approve_id', 'client_id']
        read_only_fields = fields

    def get_participant_name(self, session):
        user = self.context['request'].user
        if user.is_client:
            return f"{session.therapist.first_name} {session.therapist.last_name}"
        return f"{session.client.first_name} {session.client.last_name}"

    def get_session_type_display(self, session):
        return session.get_session_type_display()

    def get_participant_photo(self, session):
        request = self.context.get('request')
        if request.user.is_client:
            photo = session.therapist.profile_photo
        else:
            photo = session.client.profile_photo

        if photo and request:
            return request.build_absolute_uri(photo.url)
        return None


class SessionCreateClientSerializer(serializers.Serializer):
    date = serializers.CharField()
    session_type = serializers.ChoiceField(choices=Session.SessionType.choices,default=Session.SessionType.VIDEO)
    client_notes = serializers.CharField(required=False,allow_blank=True,max_length=200)

    def validate_date(self, value):
        parsed = parse_datetime(value)
        if not parsed:
            raise InvalidSessionDate()

        if timezone.is_naive(parsed):
            parsed = timezone.make_aware(parsed)

        minim_acceptat = date.today() + timedelta(days=2)
        if parsed.date() < minim_acceptat:
            raise SessionInPast(
                message=f"Session must be at least 2 days from now. "
                        f"Earliest date: {minim_acceptat.strftime('%d %b %Y')}"
            )
        return parsed

    def validate_client_notes(self, value):
        return value.strip() if value else ''


class SessionCreateTherapistSerializer(serializers.Serializer):
    date = serializers.CharField()
    client_id = serializers.IntegerField()
    session_type = serializers.ChoiceField(choices=Session.SessionType.choices,default=Session.SessionType.VIDEO)
    therapist_notes = serializers.CharField(required=False,allow_blank=True,max_length=200)

    def validate_date(self, value):
        parsed = parse_datetime(value)
        if not parsed:
            raise InvalidSessionDate()

        if timezone.is_naive(parsed):
            parsed = timezone.make_aware(parsed)

        minim_acceptat = date.today() + timedelta(days=2)
        if parsed.date() < minim_acceptat:
            raise SessionInPast(
                message=f"Session must be at least 2 days from now. "
                        f"Earliest date: {minim_acceptat.strftime('%d %b %Y')}")
        return parsed

    def validate_therapist_notes(self, value):
        return value.strip() if value else ''

    def validate_client_id(self, value):
        if value <= 0:
            raise InvalidInput(message="Invalid client_id.",details={"field": "client_id"})
        return value


class SessionDeleteConfirmSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ['id', 'date', 'session_type', 'status']
        read_only_fields = fields
