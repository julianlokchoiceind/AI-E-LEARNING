"""
Lesson model for course content.
"""
from datetime import datetime
from typing import Optional, List, Dict
from beanie import Document, Link
from pydantic import BaseModel, Field, HttpUrl
from beanie import PydanticObjectId


class VideoContent(BaseModel):
    """Video content information for a lesson."""
    youtube_url: HttpUrl = Field(..., description="YouTube video URL")
    duration: int = Field(..., ge=0, description="Video duration in seconds")
    thumbnail: Optional[HttpUrl] = Field(None, description="Video thumbnail URL")


class Resource(BaseModel):
    """Additional resource for a lesson."""
    title: str = Field(..., min_length=1, max_length=200)
    type: str = Field(..., pattern="^(pdf|doc|zip|link|other)$")
    url: HttpUrl
    size: Optional[int] = Field(None, ge=0, description="File size in bytes")


class UnlockConditions(BaseModel):
    """Conditions for unlocking a lesson."""
    previous_lesson_id: Optional[PydanticObjectId] = None
    quiz_pass_required: bool = Field(default=False)
    minimum_watch_percentage: int = Field(default=80, ge=0, le=100)


class Lesson(Document):
    """Lesson model representing a learning unit within a chapter."""
    
    # Relationships
    course_id: PydanticObjectId = Field(..., description="Course this lesson belongs to")
    chapter_id: PydanticObjectId = Field(..., description="Chapter this lesson belongs to")
    
    # Basic info
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    
    # Lesson organization
    order: int = Field(..., ge=1, description="Order within the chapter")
    
    # Video content
    video: Optional[VideoContent] = None
    
    # Additional content
    content: Optional[str] = Field(None, description="Rich text content/notes")
    resources: List[Resource] = Field(default_factory=list)
    
    # Sequential learning
    unlock_conditions: UnlockConditions = Field(default_factory=UnlockConditions)
    
    # Lesson status
    status: str = Field(default="draft", pattern="^(draft|published)$")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "lessons"
        indexes = [
            "course_id",
            "chapter_id",
            [("chapter_id", 1), ("order", 1)],  # Compound index for ordering
            [("course_id", 1), ("chapter_id", 1)]
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "course_id": "507f1f77bcf86cd799439011",
                "chapter_id": "507f191e810c19729de860ea",
                "title": "Variables and Data Types",
                "description": "Learn about Python variables and basic data types",
                "order": 1,
                "video": {
                    "youtube_url": "https://www.youtube.com/watch?v=example",
                    "duration": 600,
                    "thumbnail": "https://img.youtube.com/vi/example/maxresdefault.jpg"
                },
                "content": "In this lesson, we'll explore...",
                "resources": [
                    {
                        "title": "Lesson Notes",
                        "type": "pdf",
                        "url": "https://example.com/notes.pdf",
                        "size": 1024000
                    }
                ],
                "unlock_conditions": {
                    "previous_lesson_id": None,
                    "quiz_pass_required": False,
                    "minimum_watch_percentage": 80
                },
                "status": "published"
            }
        }