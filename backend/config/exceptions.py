from rest_framework.exceptions import APIException
from rest_framework import status
import traceback

class AppException(APIException):

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "An error occurred."
    default_code = "error"

    def __init__(self, message=None, code=None, details=None):
        self.message = message or self.default_detail
        self.code = code or self.default_code
        self.details = details or {}
        super().__init__(detail=self.message, code=self.code)
