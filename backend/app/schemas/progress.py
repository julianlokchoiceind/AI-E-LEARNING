from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class VideoProgressUpdate(BaseModel):
    watch_percentage: float = Field(..., ge=0, le=100, description="Percentage of video watched")
    current_position: float = Field(..., ge=0, description="Current position in seconds")

class VideoProgressSchema(BaseModel):
    watch_percentage: float
    current_position: float
    total_watch_time: float
    is_completed: bool
    completed_at: Optional[datetime]

class QuizAttemptSchema(BaseModel):
    attempt_number: int
    score: float
    total_questions: int
    correct_answers: int
    time_taken: float
    passed: bool
    answers: List[int]
    attempted_at: datetime

class QuizProgressSchema(BaseModel):
    attempts: List[QuizAttemptSchema]
    best_score: float
    total_attempts: int
    is_passed: bool
    passed_at: Optional[datetime]

class ProgressSchema(BaseModel):
    id: str
    user_id: str
    course_id: str
    lesson_id: str
    video_progress: VideoProgressSchema
    quiz_progress: Optional[QuizProgressSchema]
    is_unlocked: bool
    is_completed: bool
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    last_accessed: datetime
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True
        from_attributes = True

class ProgressResponse(BaseModel):
    success: bool
    data: ProgressSchema
    message: str

class ProgressListResponse(BaseModel):
    success: bool
    data: List[ProgressSchema]
    message: str

class MessageResponse(BaseModel):
    success: bool
    message: str