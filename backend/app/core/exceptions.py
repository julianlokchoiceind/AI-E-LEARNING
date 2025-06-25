"""
Custom exceptions for the application.
"""


class BaseException(Exception):
    """Base exception for all custom exceptions"""
    pass


class NotFoundException(BaseException):
    """Raised when a resource is not found"""
    pass


class ForbiddenException(BaseException):
    """Raised when user doesn't have permission to access a resource"""
    pass


class BadRequestException(BaseException):
    """Raised when request data is invalid"""
    pass


class UnauthorizedException(BaseException):
    """Raised when user is not authenticated"""
    pass


class ConflictException(BaseException):
    """Raised when there's a conflict with existing data"""
    pass


class ValidationException(BaseException):
    """Raised when validation fails"""
    pass


class ServiceUnavailableException(BaseException):
    """Raised when a service is temporarily unavailable"""
    pass


# Aliases for backward compatibility
NotFoundError = NotFoundException
ForbiddenError = ForbiddenException
BadRequestError = BadRequestException
UnauthorizedError = UnauthorizedException
ConflictError = ConflictException
ValidationError = ValidationException