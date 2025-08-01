"""
Quiz schemas for API validation.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from beanie import PydanticObjectId


class QuizQuestionBase(BaseModel):
    """Base schema for quiz questions."""
    question: str = Field(..., min_length=1, max_length=1000)
    options: List[str] = Field(..., min_items=4, max_items=4, description="Multiple choice options")
    correct_answer: int = Field(..., ge=0, le=3, description="Index of correct answer (0-3)")
    explanation: Optional[str] = Field(None, max_length=2000)
    points: int = Field(default=1, ge=1)
    
    @validator('options')
    def validate_options(cls, v):
        if len(set(v)) != len(v):
            raise ValueError("Options must be unique")
        return v


class QuizQuestionCreate(QuizQuestionBase):
    """Schema for creating a quiz question."""
    pass


class QuizQuestionResponse(QuizQuestionBase):
    """Schema for returning quiz question (hides correct answer for students)."""
    correct_answer: Optional[int] = None  # Hidden from students
    explanation: Optional[str] = None  # Hidden until after attempt


class QuizConfigBase(BaseModel):
    """Base schema for quiz configuration."""
    time_limit: Optional[int] = Field(None, ge=1, description="Time limit in minutes")
    pass_percentage: int = Field(default=70, ge=0, le=100)
    max_attempts: int = Field(default=3, ge=1)
    shuffle_questions: bool = Field(default=True)
    shuffle_answers: bool = Field(default=True)
    show_correct_answers: bool = Field(default=True)
    immediate_feedback: bool = Field(default=True)


class QuizBase(BaseModel):
    """Base schema for quiz."""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    config: QuizConfigBase = Field(default_factory=QuizConfigBase)


class QuizCreate(QuizBase):
    """Schema for creating a quiz."""
    lesson_id: PydanticObjectId
    course_id: PydanticObjectId
    questions: List[QuizQuestionCreate] = Field(..., min_items=1)


class QuizUpdate(BaseModel):
    """Schema for updating a quiz."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    config: Optional[QuizConfigBase] = None
    questions: Optional[List[QuizQuestionCreate]] = Field(None, min_items=1)
    is_active: Optional[bool] = None


class QuizInDB(QuizBase):
    """Schema for quiz in database."""
    id: PydanticObjectId
    lesson_id: PydanticObjectId
    course_id: PydanticObjectId
    questions: List[QuizQuestionBase]
    total_points: int
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True


class QuizResponse(QuizBase):
    """Schema for returning quiz to students (questions without answers)."""
    id: PydanticObjectId
    lesson_id: PydanticObjectId
    course_id: PydanticObjectId
    questions: List[QuizQuestionResponse]
    total_points: int
    is_active: bool = True
    created_at: datetime
    
    class Config:
        populate_by_name = True


class QuizAnswerSubmit(BaseModel):
    """Schema for submitting quiz answers."""
    answers: List[int] = Field(..., description="Array of selected answer indexes")
    time_taken: Optional[int] = Field(None, ge=0, description="Time taken in seconds")


class QuizAttemptResult(BaseModel):
    """Schema for quiz attempt result."""
    attempt_number: int
    score: int = Field(..., ge=0, le=100)
    total_questions: int
    correct_answers: int
    passed: bool
    time_taken: Optional[int] = None
    questions_feedback: List[dict] = Field(..., description="Feedback for each question")
    attempted_at: datetime


class QuizProgressResponse(BaseModel):
    """Schema for user's quiz progress."""
    quiz_id: PydanticObjectId
    lesson_id: PydanticObjectId
    course_id: PydanticObjectId
    attempts: List[QuizAttemptResult]
    best_score: int = Field(default=0, ge=0, le=100)
    total_attempts: int = Field(default=0, ge=0)
    is_passed: bool = Field(default=False)
    passed_at: Optional[datetime] = None
    can_retry: bool = Field(..., description="Whether user can retry the quiz")
    
    class Config:
        json_schema_extra = {
            "example": {
                "quiz_id": "507f1f77bcf86cd799439011",
                "lesson_id": "507f191e810c19729de860ea",
                "course_id": "507f1f77bcf86cd799439012",
                "attempts": [
                    {
                        "attempt_number": 1,
                        "score": 60,
                        "total_questions": 5,
                        "correct_answers": 3,
                        "passed": False,
                        "time_taken": 300,
                        "questions_feedback": [
                            {
                                "question_index": 0,
                                "is_correct": True,
                                "selected_answer": 0,
                                "correct_answer": 0
                            }
                        ],
                        "attempted_at": "2025-01-20T10:30:00Z"
                    }
                ],
                "best_score": 60,
                "total_attempts": 1,
                "is_passed": False,
                "passed_at": None,
                "can_retry": True
            }
        }