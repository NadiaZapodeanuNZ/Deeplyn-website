from config.exceptions import AppException
from rest_framework import status


class SessionNotFound(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "Session not found."
    default_code = "session_not_found"


class SessionNotOwned(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "You do not have permission to access this session."
    default_code = "session_not_owned"


class SessionInPast(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Session date must be in the future."
    default_code = "session_in_past"


class InvalidSessionDate(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Invalid date format. Use ISO format: 2026-05-30T10:00:00"
    default_code = "invalid_session_date"


class TooLateToCancel(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Sessions can only be cancelled at least 2 days in advance."
    default_code = "too_late_to_cancel"


class NoActiveRelation(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "No active therapist relationship found."
    default_code = "no_active_relation"


class ClientIdRequired(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "client_id is required when a therapist creates or lists sessions."
    default_code = "client_id_required"