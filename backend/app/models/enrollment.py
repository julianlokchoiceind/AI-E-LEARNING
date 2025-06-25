from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import BaseModel, Field
from enum import Enum

class EnrollmentType(str, Enum):
    FREE = "free"
    PURCHASED = "purchased"
    SUBSCRIPTION = "subscription"
    ADMIN_GRANTED = "admin_granted"

class CourseProgress(BaseModel):
    lessons_completed: int = 0
    total_lessons: int = 0
    completion_percentage: float = Field(default=0.0, ge=0, le=100)
    total_watch_time: float = 0.0  # in minutes
    current_lesson_id: Optional[str] = None
    is_completed: bool = False
    completed_at: Optional[datetime] = None

class Certificate(BaseModel):
    is_issued: bool = False
    issued_at: Optional[datetime] = None
    certificate_id: Optional[str] = None  # Unique certificate identifier
    final_score: Optional[float] = None  # Overall course score
    verification_url: Optional[str] = None

class Enrollment(Document):
    user_id: str
    course_id: str
    
    # Enrollment details
    enrollment_type: EnrollmentType
    payment_id: Optional[str] = None  # For purchased courses
    
    # Progress tracking
    progress: CourseProgress = Field(default_factory=CourseProgress)
    
    # Certificate
    certificate: Certificate = Field(default_factory=Certificate)
    
    # Access control
    is_active: bool = True
    expires_at: Optional[datetime] = None  # For time-limited access
    
    enrolled_at: datetime = Field(default_factory=datetime.utcnow)
    last_accessed: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "enrollments"
        indexes = [
            [("user_id", 1), ("course_id", 1)],  # Unique compound index
            [("course_id", 1)],
            [("enrolled_at", -1)]
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user123",
                "course_id": "course456",
                "enrollment_type": "purchased",
                "payment_id": "pay_789",
                "progress": {
                    "lessons_completed": 5,
                    "total_lessons": 10,
                    "completion_percentage": 50.0,
                    "total_watch_time": 180.5,
                    "current_lesson_id": "lesson_5",
                    "is_completed": False
                },
                "certificate": {
                    "is_issued": False
                },
                "is_active": True,
                "enrolled_at": "2025-01-20T10:00:00Z"
            }
        }