"""
Learn page schemas for consolidated API endpoint.
Following existing codebase patterns for StandardResponse format and serialization.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.base import PyObjectId


class VideoProgressSchema(BaseModel):
    """Video progress tracking data schema."""
    watch_percentage: float = Field(default=0.0, ge=0.0, le=100.0)
    current_position: float = Field(default=0.0, ge=0.0)
    total_watch_time: float = Field(default=0.0, ge=0.0)  # Changed from int to float
    is_completed: bool = Field(default=False)
    completed_at: Optional[datetime] = None


class QuizProgressSchema(BaseModel):
    """Quiz progress tracking data schema."""
    attempts: int = Field(default=0, ge=0)
    best_score: float = Field(default=0.0, ge=0.0, le=100.0)
    is_passed: bool = Field(default=False)
    last_attempt_at: Optional[datetime] = None


class LessonProgressSchema(BaseModel):
    """Individual lesson progress schema."""
    lesson_id: str
    is_unlocked: bool = Field(default=False)
    is_completed: bool = Field(default=False)
    video_progress: VideoProgressSchema
    quiz_progress: Optional[QuizProgressSchema] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class VideoContentSchema(BaseModel):
    """Video content schema for lessons."""
    youtube_url: Optional[str] = None
    duration: Optional[int] = None  # Duration in seconds
    thumbnail_url: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None


class ResourceSchema(BaseModel):
    """Lesson resource schema."""
    title: str
    url: str
    type: str = Field(default="link")  # link, pdf, doc, etc.
    description: Optional[str] = None


class LessonSchema(BaseModel):
    """Lesson data schema for learn page."""
    id: str  # Remove alias since service returns 'id' directly
    title: str
    description: Optional[str] = None
    order: int
    video: Optional[VideoContentSchema] = None
    content: Optional[str] = None
    resources: List[ResourceSchema] = Field(default_factory=list)
    has_quiz: bool = Field(default=False)
    quiz_required: bool = Field(default=False)
    status: str = Field(default="draft")
    created_at: datetime
    updated_at: datetime
    
    # Progress data (injected based on user)
    progress: Optional[LessonProgressSchema] = None

    class Config:
        allow_population_by_field_name = True


class ChapterSchema(BaseModel):
    """Chapter data schema with lessons."""
    id: str  # Remove alias since service returns 'id' directly
    title: str
    description: Optional[str] = None
    order: int
    lessons: List[LessonSchema] = Field(default_factory=list)
    total_lessons: int = Field(default=0)
    completed_lessons: int = Field(default=0)
    status: str = Field(default="draft")
    created_at: datetime
    updated_at: datetime

    class Config:
        allow_population_by_field_name = True


class CourseProgressSchema(BaseModel):
    """Course-level progress summary."""
    total_lessons: int = Field(default=0)
    completed_lessons: int = Field(default=0)
    completion_percentage: float = Field(default=0.0, ge=0.0, le=100.0)
    is_completed: bool = Field(default=False)
    current_lesson_id: Optional[str] = None
    continue_lesson_id: Optional[str] = None  # For "Continue Learning" button
    last_accessed: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class EnrollmentSchema(BaseModel):
    """User enrollment data schema."""
    id: str  # Remove alias since service returns 'id' directly
    user_id: str
    course_id: str
    is_active: bool = Field(default=True)
    enrolled_at: datetime
    progress: CourseProgressSchema
    access_type: str = Field(default="full")  # full, preview, trial
    expires_at: Optional[datetime] = None

    class Config:
        allow_population_by_field_name = True


class CourseSchema(BaseModel):
    """Course data schema for learn page."""
    id: str  # Remove alias since service returns 'id' directly
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    total_lessons: int = Field(default=0)
    total_duration: int = Field(default=0)  # Total duration in minutes
    difficulty_level: str = Field(default="beginner")
    category: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    status: str = Field(default="draft")
    is_free: bool = Field(default=False)
    sequential_learning_enabled: bool = Field(default=True)
    created_at: datetime
    updated_at: datetime

    class Config:
        allow_population_by_field_name = True


class NavigationInfoSchema(BaseModel):
    """Navigation context for current lesson."""
    current_lesson_order: int
    total_lessons_in_chapter: int
    current_chapter_order: int
    total_chapters: int
    previous_lesson_id: Optional[str] = None
    next_lesson_id: Optional[str] = None
    can_navigate_previous: bool = Field(default=False)
    can_navigate_next: bool = Field(default=False)


class LearnPageResponse(BaseModel):
    """
    Consolidated response schema for learn page API endpoint.
    Replaces 7 individual API calls with single comprehensive response.
    """
    # Core data
    course: CourseSchema
    current_lesson: LessonSchema
    chapters: List[ChapterSchema]
    
    # User-specific data (None for unauthenticated users)
    enrollment: Optional[EnrollmentSchema] = None
    user_progress: Optional[Dict[str, LessonProgressSchema]] = None  # lesson_id -> progress
    
    # Navigation and context
    navigation: NavigationInfoSchema
    
    # Computed properties
    is_preview_mode: bool = Field(default=True)  # False if user is enrolled
    total_watch_time_minutes: float = Field(default=0.0)  # User's total watch time
    
    # Cache metadata
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    data_sources: List[str] = Field(default_factory=list)  # For debugging which services were called

    class Config:
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "course": {
                    "id": "507f1f77bcf86cd799439011",
                    "title": "Advanced Python Programming",
                    "description": "Master advanced Python concepts",
                    "total_lessons": 25,
                    "total_duration": 480,
                    "difficulty_level": "advanced",
                    "status": "published",
                    "is_free": False
                },
                "current_lesson": {
                    "id": "507f1f77bcf86cd799439012",
                    "title": "Decorators and Context Managers",
                    "order": 3,
                    "video": {
                        "youtube_url": "https://www.youtube.com/watch?v=example",
                        "duration": 1200
                    },
                    "progress": {
                        "lesson_id": "507f1f77bcf86cd799439012",
                        "is_unlocked": True,
                        "is_completed": False,
                        "video_progress": {
                            "watch_percentage": 35.0,
                            "current_position": 420.5,
                            "is_completed": False
                        }
                    }
                },
                "chapters": [],
                "enrollment": {
                    "id": "507f1f77bcf86cd799439013",
                    "user_id": "507f1f77bcf86cd799439014",
                    "course_id": "507f1f77bcf86cd799439011",
                    "is_active": True,
                    "progress": {
                        "total_lessons": 25,
                        "completed_lessons": 8,
                        "completion_percentage": 32.0,
                        "current_lesson_id": "507f1f77bcf86cd799439012"
                    }
                },
                "navigation": {
                    "current_lesson_order": 3,
                    "total_lessons_in_chapter": 8,
                    "current_chapter_order": 1,
                    "total_chapters": 4,
                    "can_navigate_next": True
                },
                "is_preview_mode": False,
                "total_watch_time_minutes": 240
            }
        }


class UpdateProgressRequest(BaseModel):
    """Request schema for updating lesson progress."""
    lesson_id: str
    watch_percentage: float = Field(ge=0.0, le=100.0)
    current_position: float = Field(ge=0.0)
    total_watch_time: Optional[int] = Field(default=None, ge=0)
    
    class Config:
        schema_extra = {
            "example": {
                "lesson_id": "507f1f77bcf86cd799439012",
                "watch_percentage": 75.5,
                "current_position": 906.3,
                "total_watch_time": 1800
            }
        }


class ProgressUpdateResponse(BaseModel):
    """Response schema for progress updates."""
    updated: bool
    lesson_completed: bool = Field(default=False)
    course_completed: bool = Field(default=False)
    next_lesson_unlocked: Optional[str] = None
    updated_progress: LessonProgressSchema
    
    class Config:
        schema_extra = {
            "example": {
                "updated": True,
                "lesson_completed": False,
                "course_completed": False,
                "next_lesson_unlocked": None,
                "updated_progress": {
                    "lesson_id": "507f1f77bcf86cd799439012",
                    "is_unlocked": True,
                    "is_completed": False,
                    "video_progress": {
                        "watch_percentage": 75.5,
                        "current_position": 906.3,
                        "is_completed": False
                    }
                }
            }
        }