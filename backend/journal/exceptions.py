from config.exceptions import AppException 
from rest_framework import status



# ----------Exceptions for Base64----------

# class InvalidFieldTypeBase64(AppException):
#     status_code = status.HTTP_400_BAD_REQUEST
#     default_detail = "Invalid field type! This field type must be Base64!"
#     default_code = "invalid_field_type"

# # ----------------Other Exceptions----------
# class InvalidLengthIV(AppException):
#     status_code = status.HTTP_400_BAD_REQUEST
#     default_detail = "Invalid length of IV"
#     default_code = "invalid_iv_length"
class InvalidLength(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Invalid length!"
    default_code = "invalid_length"

class NotValidIntensity(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Invalid intensity! Please enter a value in multiples of 0.5!"
    default_code = "not_valid_intensity"

class NotValidSource(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Invalid source!"
    default_code = "not_valid_source"

class MixedEmotionSource(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Select only one emotion input method for this note: MANUAL or AUTOMATICALLY."
    default_code = "mixed_emotion_source"

class InvalidNumberOfEmotions(AppException):
    status_code = status.HTTP_406_NOT_ACCEPTABLE
    default_detail = "Choose the top 3 dominant emotions and their intensities"
    default_code = "invalid_number_of_emotions"

class InvalidNoneSource(AppException):
    status_code = status.HTTP_406_NOT_ACCEPTABLE
    default_detail = "Select MANUAL or TRANSFORMER to add emotions."
    default_code = "too_many_emotions"

class NotUniqueEmotions(AppException):
    status_code =status.HTTP_406_NOT_ACCEPTABLE
    default_detail = "Choose 3 different emotions!"
    default_code = "not_unique_emotions"
    

class JournalNotFound(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "Journal not found for this user."
    default_code = "journal_not_found"


# ---------------Exeptions on frontend-----------
class InvalidFrontendRequestUpdate(AppException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY 
    default_detail = "Error on frontend-side"
    default_code = "invalid_frontend_request_update"

class AllFieldsRequired(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "All fields are required."
    default_code = "all_fields_required"
    
# class EmotionsRequiredAfterEdit(AppException):
#     status_code = status.HTTP_400_BAD_REQUEST
#     default_detail = "This note had emotions attached. Please re-select emotions after editing."
#     default_code = "emotions_required_after_edit"

# class NoteNotFound(AppException):
#     status_code = status.HTTP_404_NOT_FOUND
#     default_detail = "The note you are looking for does not exist."
#     default_code = "note_not_found"

# class NoteNotOwned(AppException):
#     status_code = status.HTTP_403_FORBIDDEN
#     default_detail = "You do not have permission to access this note."
#     default_code = "note_not_owned"

# class NoteContentTooLong(AppException):
#     status_code = status.HTTP_400_BAD_REQUEST
#     default_detail = "Note content cannot exceed 1500 characters."
#     default_code = "note_content_too_long"

# class TooManyEmotions(AppException):
#     status_code = status.HTTP_400_BAD_REQUEST
#     default_detail = "A note can have a maximum of 3 emotions."
#     default_code = "too_many_emotions"

# class EmotionNotFound(AppException):
#     status_code = status.HTTP_404_NOT_FOUND
#     default_detail = "The selected emotion does not exist."
#     default_code = "emotion_not_found"

# class EmotionAlreadyExists(AppException):
#     status_code = status.HTTP_409_CONFLICT
#     default_detail = "This emotion has already been added to the note."
#     default_code = "emotion_already_exists"

# class MixedEmotionSources(AppException):
#     status_code = status.HTTP_400_BAD_REQUEST
#     default_detail = "You cannot mix manual and AI emotions on the same note."
#     default_code = "mixed_emotion_sources"

# class InvalidIntensityValue(AppException):
#     status_code = status.HTTP_400_BAD_REQUEST
#     default_detail = "Intensity must be a multiple of 0.5 between 1.0 and 10.0."
#     default_code = "invalid_intensity_value"