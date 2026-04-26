from rest_framework.views import exception_handler
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    # If it's a Django ValidationError (like from our model state machine)
    if isinstance(exc, DjangoValidationError):
        if hasattr(exc, 'message_dict'):
            return Response({
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": exc.message_dict
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # If it's a list or directly contains code/message dict from our custom raise
        error_detail = exc.message if hasattr(exc, 'message') else str(exc)
        code = "VALIDATION_ERROR"
        
        if isinstance(error_detail, dict) and "code" in error_detail:
            code = error_detail["code"]
            error_detail = error_detail.get("message", "")
        elif hasattr(exc, 'error_dict') and 'code' in exc.error_dict:
            code = exc.error_dict['code'][0].message
        
        # Check if the exception message contains our custom dict string
        if isinstance(exc.args, tuple) and len(exc.args) > 0 and isinstance(exc.args[0], dict):
            error_dict = exc.args[0]
            code = error_dict.get('code', 'VALIDATION_ERROR')
            error_detail = error_dict.get('message', str(error_dict))

        return Response({
            "error": {
                "code": code,
                "message": error_detail
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    if response is not None:
        # Standardize DRF errors
        return Response({
            "error": {
                "code": response.status_code,
                "message": response.data
            }
        }, status=response.status_code)

    return response
