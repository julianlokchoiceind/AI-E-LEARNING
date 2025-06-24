"""Chapter model placeholder."""
from datetime import datetime
from pydantic import Field
from beanie import Document, PydanticObjectId


class Chapter(Document):
    course_id: PydanticObjectId
    title: str
    description: str = ""
    order: int
    total_lessons: int = 0
    total_duration: int = 0
    status: str = "draft"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "chapters"