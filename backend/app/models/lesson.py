"""Lesson model placeholder."""
from datetime import datetime
from pydantic import Field
from beanie import Document, PydanticObjectId


class Lesson(Document):
    course_id: PydanticObjectId
    chapter_id: PydanticObjectId
    title: str
    description: str = ""
    order: int
    video_url: str = ""
    duration: int = 0
    status: str = "draft"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "lessons"