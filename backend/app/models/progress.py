from datetime import datetime
from typing import Optional, List
from beanie import Document
from pydantic import BaseModel, Field

class VideoProgress(BaseModel):
    watch_percentage: float = Field(default=0.0, ge=0, le=100)
    current_position: float = Field(default=0.0, ge=0)  # in seconds
    total_watch_time: float = Field(default=0.0, ge=0)  # in seconds
    is_completed: bool = False
    completed_at: Optional[datetime] = None

class QuizAttempt(BaseModel):
    attempt_number: int
    score: float  # 0-100 percentage
    total_questions: int
    correct_answers: int
    time_taken: float  # in seconds
    passed: bool
    answers: List[int] = []  # Array of selected answer indexes
    attempted_at: datetime = Field(default_factory=datetime.utcnow)

class QuizProgress(BaseModel):
    attempts: List[QuizAttempt] = []
    best_score: float = Field(default=0.0, ge=0, le=100)
    total_attempts: int = 0
    is_passed: bool = False
    passed_at: Optional[datetime] = None

class Progress(Document):
    user_id: str
    course_id: str
    lesson_id: str
    
    # Video progress
    video_progress: VideoProgress = Field(default_factory=VideoProgress)
    
    # Quiz progress (if lesson has quiz)
    quiz_progress: Optional[QuizProgress] = None
    
    # Overall lesson status
    is_unlocked: bool = True  # First lesson is always unlocked
    is_completed: bool = False
    
    # Timestamps
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    last_accessed: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "progress"
        indexes = [
            [("user_id", 1), ("course_id", 1)],
            [("user_id", 1), ("lesson_id", 1)],
            [("course_id", 1), ("lesson_id", 1)]
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user123",
                "course_id": "course456",
                "lesson_id": "lesson789",
                "video_progress": {
                    "watch_percentage": 85.5,
                    "current_position": 1230.5,
                    "total_watch_time": 1500.0,
                    "is_completed": True,
                    "completed_at": "2025-01-20T10:30:00Z"
                },
                "is_unlocked": True,
                "is_completed": True,
                "started_at": "2025-01-20T10:00:00Z",
                "completed_at": "2025-01-20T10:30:00Z"
            }
        }