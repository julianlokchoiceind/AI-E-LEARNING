"""
Base schemas for standardized API responses.
Following FastAPI + Pydantic best practices for consistent API structure.
"""
from typing import Generic, TypeVar, Optional
from pydantic import BaseModel

# Type variable for generic response data
T = TypeVar("T")


class StandardResponse(BaseModel, Generic[T]):
    """
    Standard API response format for all endpoints.
    
    Attributes:
        success: Indicates if the operation was successful
        data: The actual response data (can be None for errors)
        message: Human-readable message about the operation
    """
    success: bool
    data: Optional[T] = None
    message: str

    class Config:
        # Allow arbitrary types for flexibility
        arbitrary_types_allowed = True
        # Provide example for API documentation
        schema_extra = {
            "example": {
                "success": True,
                "data": {"id": "123", "name": "Example"},
                "message": "Operation completed successfully"
            }
        }


class ErrorResponse(BaseModel):
    """
    Standard error response format.
    Used when success=False in StandardResponse.
    """
    success: bool = False
    data: None = None
    message: str
    error_code: Optional[str] = None
    details: Optional[dict] = None

    class Config:
        schema_extra = {
            "example": {
                "success": False,
                "data": None,
                "message": "Operation failed",
                "error_code": "VALIDATION_ERROR",
                "details": {"field": "email", "error": "Invalid email format"}
            }
        }