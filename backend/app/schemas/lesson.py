"""
Pydantic schemas for lesson-related requests and responses.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, HttpUrl
from beanie import PydanticObjectId


class VideoContentSchema(BaseModel):
    """Schema for video content."""
    youtube_url: HttpUrl
    duration: int = Field(..., ge=0, description="Duration in seconds")
    thumbnail: Optional[HttpUrl] = None


class ResourceSchema(BaseModel):
    """Schema for lesson resources."""
    title: str = Field(..., min_length=1, max_length=200)
    type: str = Field(..., pattern="^(pdf|doc|zip|link|other)$")
    url: HttpUrl
    size: Optional[int] = Field(None, ge=0)


class UnlockConditionsSchema(BaseModel):
    """Schema for lesson unlock conditions."""
    previous_lesson_id: Optional[str] = None
    quiz_pass_required: bool = False
    minimum_watch_percentage: int = Field(default=80, ge=0, le=100)


class LessonCreate(BaseModel):
    """Schema for creating a new lesson."""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    order: Optional[int] = Field(None, ge=1, description="Order within chapter, auto-assigned if not provided")
    video: Optional[VideoContentSchema] = None
    content: Optional[str] = None
    resources: List[ResourceSchema] = Field(default_factory=list)
    unlock_conditions: Optional[UnlockConditionsSchema] = None


class LessonUpdate(BaseModel):
    """Schema for updating a lesson."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    order: Optional[int] = Field(None, ge=1)
    video: Optional[VideoContentSchema] = None
    content: Optional[str] = None
    resources: Optional[List[ResourceSchema]] = None
    unlock_conditions: Optional[UnlockConditionsSchema] = None
    status: Optional[str] = Field(None, pattern="^(draft|published)$")


class LessonReorder(BaseModel):
    """Schema for reordering lessons."""
    lesson_orders: List[dict] = Field(..., description="List of {lesson_id, order} pairs")
    
    class Config:
        json_schema_extra = {
            "example": {
                "lesson_orders": [
                    {"lesson_id": "507f1f77bcf86cd799439011", "order": 1},
                    {"lesson_id": "507f191e810c19729de860ea", "order": 2}
                ]
            }
        }


class LessonResponse(BaseModel):
    """Response schema for lesson data."""
    id: str = Field(alias="_id")
    course_id: str
    chapter_id: str
    title: str
    description: Optional[str]
    order: int
    video: Optional[VideoContentSchema]
    content: Optional[str]
    resources: List[ResourceSchema]
    unlock_conditions: UnlockConditionsSchema
    status: str
    created_at: datetime
    updated_at: datetime
    
    # Additional fields for frontend
    is_unlocked: Optional[bool] = None
    is_completed: Optional[bool] = None
    progress_percentage: Optional[int] = None
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "course_id": "507f191e810c19729de860ea",
                "chapter_id": "507f191e810c19729de860eb",
                "title": "Variables and Data Types",
                "description": "Learn about Python variables",
                "order": 1,
                "video": {
                    "youtube_url": "https://www.youtube.com/watch?v=example",
                    "duration": 600,
                    "thumbnail": "https://img.youtube.com/vi/example/maxresdefault.jpg"
                },
                "content": "Lesson content here...",
                "resources": [],
                "unlock_conditions": {
                    "previous_lesson_id": None,
                    "quiz_pass_required": False,
                    "minimum_watch_percentage": 80
                },
                "status": "published",
                "created_at": "2024-06-20T10:00:00Z",
                "updated_at": "2024-06-20T10:00:00Z",
                "is_unlocked": True,
                "is_completed": False,
                "progress_percentage": 0
            }
        }


class LessonListResponse(BaseModel):
    """Response schema for a list of lessons."""
    lessons: List[LessonResponse]
    total: int


class VideoUploadResponse(BaseModel):
    """Response schema for video upload."""
    youtube_url: HttpUrl
    duration: int
    thumbnail: Optional[HttpUrl]
    upload_status: str = Field(..., pattern="^(processing|completed|failed)$")
    message: Optional[str] = None


class MessageResponse(BaseModel):
    """Generic message response."""
    success: bool
    message: str