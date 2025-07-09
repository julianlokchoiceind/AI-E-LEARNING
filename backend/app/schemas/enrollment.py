from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.enrollment import EnrollmentType

class EnrollmentCreate(BaseModel):
    enrollment_type: Optional[EnrollmentType] = None
    payment_id: Optional[str] = None

class CourseProgressSchema(BaseModel):
    lessons_completed: int
    total_lessons: int
    completion_percentage: float
    total_watch_time: float
    current_lesson_id: Optional[str]
    is_completed: bool
    completed_at: Optional[datetime]

class CertificateSchema(BaseModel):
    is_issued: bool
    issued_at: Optional[datetime]
    certificate_id: Optional[str]
    final_score: Optional[float]
    verification_url: Optional[str]

class EnrollmentSchema(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    course_id: str
    enrollment_type: EnrollmentType
    payment_id: Optional[str]
    progress: CourseProgressSchema
    certificate: CertificateSchema
    is_active: bool
    expires_at: Optional[datetime]
    enrolled_at: datetime
    last_accessed: Optional[datetime]
    updated_at: datetime
    
    class Config:
        populate_by_name = True
        from_attributes = True

class EnrollmentResponse(BaseModel):
    success: bool
    data: EnrollmentSchema
    message: str

class EnrollmentListResponse(BaseModel):
    success: bool
    data: List[EnrollmentSchema]
    message: str

class MessageResponse(BaseModel):
    success: bool
    message: str