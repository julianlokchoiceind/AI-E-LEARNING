"""Progress model placeholder."""
from datetime import datetime
from pydantic import Field
from beanie import Document, PydanticObjectId


class Progress(Document):
    user_id: PydanticObjectId
    course_id: PydanticObjectId
    lesson_id: PydanticObjectId
    watch_percentage: float = 0
    is_completed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "progress"