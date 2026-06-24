from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status as http_status
from datetime import timedelta, date
from therapy.models import Session
from therapy.serializers import (SessionReadSerializer,SessionCreateClientSerializer,SessionCreateTherapistSerializer,SessionDeleteConfirmSerializer)
from therapy.exceptions import (SessionNotFound,TooLateToCancel,NoActiveRelation)
from users.exceptions import InvalidInput
from users.models import ClientTherapist
from .utils import (_send_session_request_email_to_therapist,_send_session_created_by_therapist_email,_send_cancellation_email,
_send_session_rejected_email, _send_session_approved_by_therapist_email, _send_session_accepted_by_client_email, _send_session_rejected_by_client_email)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_sessions(request):
    user = request.user

    if user.is_client:
        sessions = Session.objects.select_related('therapist','client').filter(client=user).order_by('date')

    elif user.is_therapist:
        client_id = request.query_params.get('client_id')

        if client_id:
            relation_exists = ClientTherapist.objects.filter(therapist=user,client_id=client_id,status=ClientTherapist.Status.ACTIVE).exists()

            if not relation_exists:
                raise NoActiveRelation()

            sessions = Session.objects.select_related('therapist','client').filter(therapist=user, client_id=client_id).order_by('date')
        else:
            sessions = Session.objects.select_related('therapist','client').filter(therapist=user).order_by('date')

    else:
        return Response({"message": "Unauthorized."}, status=http_status.HTTP_403_FORBIDDEN)

    serializer = SessionReadSerializer(sessions, many=True, context={'request':request})
    return Response(serializer.data,status=http_status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_session(request):
    user = request.user

    if user.is_client:
        serializer = SessionCreateClientSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        relation = ClientTherapist.objects.select_related('therapist').filter(client=user,status=ClientTherapist.Status.ACTIVE).first()

        if not relation:
            raise NoActiveRelation()

        session = Session.objects.create(
            client=user,
            therapist=relation.therapist,
            date=serializer.validated_data['date'],
            session_type=serializer.validated_data['session_type'],
            client_notes=serializer.validated_data.get('client_notes', ''),
            need_to_approve=relation.therapist,
            status=Session.Status.PENDING
        )

        _send_session_request_email_to_therapist(session)

        return Response(
            {"message": "Session request sent. Waiting for therapist approval.",
            "session": SessionReadSerializer(session, context={'request': request}).data
            },
            status=http_status.HTTP_201_CREATED)

    elif user.is_therapist:
        serializer = SessionCreateTherapistSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        client_id = serializer.validated_data['client_id']
        relation = ClientTherapist.objects.select_related('client').filter(
            therapist=user,
            client_id=client_id,
            status=ClientTherapist.Status.ACTIVE).first()

        if not relation:
            raise NoActiveRelation(message="This client is not in your active clients list.")

        session = Session.objects.create(
            client=relation.client,
            therapist=user,
            date=serializer.validated_data['date'],
            session_type=serializer.validated_data['session_type'],
            therapist_notes=serializer.validated_data.get('therapist_notes', ''),
            need_to_approve=relation.client,
            status=Session.Status.PENDING)

        _send_session_created_by_therapist_email(session)

        return Response(
            {"message": "Session proposal sent. Waiting for client approval.",
            "session": SessionReadSerializer(session, context={'request': request}).data
            },
            status=http_status.HTTP_201_CREATED)

    return Response({"message": "Unauthorized."}, status=http_status.HTTP_403_FORBIDDEN)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_session(request, session_id):
    user = request.user

    try:
        session = Session.objects.select_related('therapist', 'client').get(
            id=session_id,
            need_to_approve=user,
            status=Session.Status.PENDING)
    except Session.DoesNotExist:
        raise SessionNotFound()

    session.approve()

    try:
        if user.is_therapist:
            _send_session_approved_by_therapist_email(session)
        else:
            _send_session_accepted_by_client_email(session)
    except Exception:
        pass

    return Response(
        {"message": "Session approved.",
        "session": SessionReadSerializer(session, context={'request': request}).data
        },
        status=http_status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_session(request, session_id):
    user = request.user

    try:
        session = Session.objects.select_related('therapist', 'client').get(
            id=session_id,
            need_to_approve=user,
            status=Session.Status.PENDING)
    except Session.DoesNotExist:
        raise SessionNotFound()

    session.reject()

    try:
        if user.is_therapist:
            _send_session_rejected_email(session)
        else:
            _send_session_rejected_by_client_email(session)
    except Exception:
        pass

    return Response(
        {"message": "Session rejected.",
        "session": SessionReadSerializer(session, context={'request': request}).data
        },
        status=http_status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_session(request, session_id):
    user = request.user

    if user.is_client:
        try:
            session = Session.objects.select_related('therapist','client').get(id=session_id, client=user)
        except Session.DoesNotExist:
            raise SessionNotFound()

    elif user.is_therapist:
        try:
            session = Session.objects.select_related('therapist','client').get(id=session_id, therapist=user)
        except Session.DoesNotExist:
            raise SessionNotFound()

    else:
        return Response({"message": "Unauthorized."}, status=http_status.HTTP_403_FORBIDDEN)

    if session.status == Session.Status.REJECTED:
        raise InvalidInput(message="Rejected sessions cannot be manually deleted.",
                        details={"status": session.status})

    minim_acceptat = date.today() + timedelta(days=2)
    if session.date.date() < minim_acceptat:
        raise TooLateToCancel()

    session_data = SessionDeleteConfirmSerializer(session).data
    _send_cancellation_email(cancelled_by=user, session=session)
    session.delete()

    return Response(
        {"message": "Session cancelled. The other party has been notified.",
        "deleted_session": session_data
        },
        status=http_status.HTTP_200_OK)