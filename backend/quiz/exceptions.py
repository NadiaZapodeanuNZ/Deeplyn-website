from config.exceptions import AppException
from rest_framework import status

class InvalidInput(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Invalid input data."
    default_code = "invalid_input"
    
class QuizNotFound(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "Quiz not found."
    default_code = "quiz_not_found"

class AnswerNotFound(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "Answer not found."
    default_code = "answer_not_found"

class AnswerNotOwned(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "You do not have permission to access this answer."
    default_code = "answer_not_owned"


class AnswerAlreadySubmitted(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "This answer has already been submitted and cannot be changed."
    default_code = "answer_already_submitted"


class AnswerTooLong(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Answer text exceeds the maximum character limit for this question."
    default_code = "answer_too_long"


class QuizAlreadyShared(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "This quiz has already been shared with your therapist."
    default_code = "quiz_already_shared"


class QuizHasNoAnswers(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "You need at least one submitted answer to share this quiz."
    default_code = "quiz_has_no_answers"


class NoTherapistConnected(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "You don't have an active therapist to share with."
    default_code = "no_therapist_connected"


class ClientNotConnected(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "This client is not connected to you."
    default_code = "client_not_connected"


class QuestionNotFound(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "Question not found."
    default_code = "question_not_found"


class CannotDeleteQuestion(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "You can only delete questions you created."
    default_code = "cannot_delete_question"


class CannotModifyQuiz(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "You can only modify quizzes you created."
    default_code = "cannot_modify_quiz"


class QuizAlreadyPublished(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "This quiz has already been published and cannot be modified."
    default_code = "quiz_already_published"


class QuizDateConflict(AppException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "A therapist quiz already exists for this client on this date."
    default_code = "quiz_date_conflict"


class NotEnoughQuestions(AppException):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = "Not enough questions in the database. Run seed_quiz_questions."
    default_code = "not_enough_questions"

class DraftNotFound(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "Draft not found."
    default_code = "draft_not_found"