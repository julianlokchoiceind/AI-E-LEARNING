"""Quiz model placeholder."""
from datetime import datetime
from pydantic import Field
from beanie import Document, PydanticObjectId


class Quiz(Document):
    lesson_id: PydanticObjectId
    course_id: PydanticObjectId
    title: str
    description: str = ""
    questions: list = Field(default_factory=list)
    pass_percentage: float = 70
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "quizzes"