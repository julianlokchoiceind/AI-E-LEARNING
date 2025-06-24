"""Enrollment model placeholder."""
from datetime import datetime
from pydantic import Field
from beanie import Document, PydanticObjectId


class Enrollment(Document):
    user_id: PydanticObjectId
    course_id: PydanticObjectId
    enrollment_type: str = "free"
    is_active: bool = True
    enrolled_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "enrollments"