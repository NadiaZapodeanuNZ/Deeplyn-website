from rest_framework.views import exception_handler as drf_default_handler
from rest_framework.response import Response
from rest_framework import status
from users.exceptions import AppException
import traceback

def custom_exception_handler(exc, context):
    if isinstance(exc, AppException):
        return Response({
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            }
        }, status=exc.status_code)

    response = drf_default_handler(exc, context)

    if response is None:
        traceback.print_exc()
        return Response({
            "error": {
                "code": "internal_server_error",
                "message": "An unexpected error occurred. Please try again later.",
                "details": {},
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    if response.status_code == status.HTTP_400_BAD_REQUEST:
        original_data = response.data

        if isinstance(original_data, dict):
            first_field = next(iter(original_data), None)
            first_message = "Please check the data you submitted."

            if first_field:
                field_messages = original_data[first_field]
                if isinstance(field_messages, list) and field_messages:
                    first_message = str(field_messages[0])
                elif isinstance(field_messages, str):
                    first_message = field_messages

            response.data = {
                "error": {
                    "code": "validation_error",
                    "message": first_message,
                    "details": {
                        "fields": original_data
                    },
                }
            }

    return response