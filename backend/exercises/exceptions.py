from config.exceptions import AppException
from rest_framework import status

class ExerciseNotFound(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "Exercise not found."
    default_code = "exercise_not_found"

class CompletionNotFound(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "Exercise completion not found."
    default_code = "completion_not_found"

class CannotModifyExercise(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "You cannot modify an exercise that has already been shared with a client."
    default_code = "cannot_modify_exercise"

class InvalidInput(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Invalid input data."
    default_code = "invalid_input"

class ClientNotConnected(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "This client is not connected to you."
    default_code = "client_not_connected"

class CompletionAlreadyShared(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "This exercise completion has already been shared with your therapist."
    default_code = "completion_already_shared"

class NoTherapistConnected(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "You don't have an active therapist to share with."
    default_code = "no_therapist_connected"