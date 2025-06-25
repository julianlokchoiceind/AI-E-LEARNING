"""
Pydantic schemas for chapter-related requests and responses.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from beanie import PydanticObjectId


class ChapterCreate(BaseModel):
    """Schema for creating a new chapter."""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    order: Optional[int] = Field(None, ge=1, description="Order within the course, auto-assigned if not provided")


class ChapterUpdate(BaseModel):
    """Schema for updating a chapter."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    order: Optional[int] = Field(None, ge=1)
    status: Optional[str] = Field(None, pattern="^(draft|published)$")


class ChapterReorder(BaseModel):
    """Schema for reordering chapters."""
    chapter_orders: List[dict] = Field(..., description="List of {chapter_id, order} pairs")
    
    class Config:
        json_schema_extra = {
            "example": {
                "chapter_orders": [
                    {"chapter_id": "507f1f77bcf86cd799439011", "order": 1},
                    {"chapter_id": "507f191e810c19729de860ea", "order": 2}
                ]
            }
        }


class ChapterResponse(BaseModel):
    """Response schema for chapter data."""
    id: str
    course_id: str
    title: str
    description: Optional[str]
    order: int
    lesson_count: int
    total_duration: int
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "course_id": "507f191e810c19729de860ea",
                "title": "Introduction to Python",
                "description": "Learn the basics of Python programming",
                "order": 1,
                "lesson_count": 5,
                "total_duration": 120,
                "status": "published",
                "created_at": "2024-06-20T10:00:00Z",
                "updated_at": "2024-06-20T10:00:00Z"
            }
        }


class ChapterListResponse(BaseModel):
    """Response schema for a list of chapters."""
    chapters: List[ChapterResponse]
    total: int


class ChapterWithLessonsResponse(BaseModel):
    """Response schema for chapter data with lessons included."""
    id: str
    course_id: str
    title: str
    description: Optional[str]
    order: int
    lesson_count: int
    total_duration: int
    status: str
    created_at: datetime
    updated_at: datetime
    lessons: List[dict] = []  # Include lessons
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "course_id": "507f191e810c19729de860ea",
                "title": "Introduction to Python",
                "description": "Learn the basics of Python programming",
                "order": 1,
                "lesson_count": 5,
                "total_duration": 120,
                "status": "published",
                "created_at": "2024-06-20T10:00:00Z",
                "updated_at": "2024-06-20T10:00:00Z",
                "lessons": [
                    {
                        "_id": "507f1f77bcf86cd799439012",
                        "title": "Setting up Python",
                        "order": 1,
                        "video_duration": 600,
                        "has_quiz": True
                    }
                ]
            }
        }


class ChapterWithLessonsListResponse(BaseModel):
    """Response schema for a list of chapters with lessons."""
    chapters: List[ChapterWithLessonsResponse]
    total: int