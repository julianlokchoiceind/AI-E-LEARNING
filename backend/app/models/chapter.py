"""
Chapter model for course content organization.
"""
from datetime import datetime
from typing import Optional
from beanie import Document, Link
from pydantic import BaseModel, Field
from beanie import PydanticObjectId


class Chapter(Document):
    """Chapter model representing a section within a course."""
    
    # Relationships
    course_id: PydanticObjectId = Field(..., description="Course this chapter belongs to")
    
    # Basic info
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    
    # Chapter organization
    order: int = Field(..., ge=1, description="Order within the course")
    
    # Chapter metrics
    lesson_count: int = Field(default=0, ge=0)
    total_duration: int = Field(default=0, ge=0, description="Total duration in minutes")
    
    # Chapter status
    status: str = Field(default="draft", pattern="^(draft|published)$")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "chapters"
        indexes = [
            "course_id",
            [("course_id", 1), ("order", 1)]  # Compound index for ordering
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "course_id": "507f1f77bcf86cd799439011",
                "title": "Introduction to Python",
                "description": "Learn the basics of Python programming",
                "order": 1,
                "lesson_count": 5,
                "total_duration": 120,
                "status": "published"
            }
        }