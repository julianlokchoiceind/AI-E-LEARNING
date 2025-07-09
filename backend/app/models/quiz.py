"""
Quiz model for lesson assessments.
"""
from datetime import datetime
from typing import Optional, List
from beanie import Document
from pydantic import BaseModel, Field
from beanie import PydanticObjectId


class QuizQuestion(BaseModel):
    """Individual quiz question within a quiz."""
    question: str = Field(..., min_length=1, max_length=1000)
    options: List[str] = Field(..., min_items=4, max_items=4, description="Multiple choice options")
    correct_answer: int = Field(..., ge=0, le=3, description="Index of correct answer (0-3)")
    explanation: Optional[str] = Field(None, max_length=2000, description="Explanation for the correct answer")
    points: int = Field(default=1, ge=1, description="Points for this question")


class QuizConfig(BaseModel):
    """Configuration settings for quiz behavior."""
    time_limit: Optional[int] = Field(None, ge=1, description="Time limit in minutes (None = no limit)")
    pass_percentage: int = Field(default=70, ge=0, le=100)
    max_attempts: int = Field(default=3, ge=1, description="Maximum attempts allowed")
    shuffle_questions: bool = Field(default=True)
    shuffle_answers: bool = Field(default=True)
    show_correct_answers: bool = Field(default=True)
    immediate_feedback: bool = Field(default=True)


class QuizAttempt(BaseModel):
    """Record of a quiz attempt by a student."""
    user_id: PydanticObjectId
    attempt_number: int = Field(..., ge=1)
    score: int = Field(..., ge=0, le=100, description="Score percentage (0-100)")
    total_questions: int = Field(..., ge=1)
    correct_answers: int = Field(..., ge=0)
    time_taken: Optional[int] = Field(None, ge=0, description="Time taken in seconds")
    passed: bool = Field(..., description="Whether the attempt passed")
    answers: List[int] = Field(..., description="Array of selected answer indexes")
    attempted_at: datetime = Field(default_factory=datetime.utcnow)


class Quiz(Document):
    """Quiz model for lesson assessments."""
    
    # Relationships
    lesson_id: PydanticObjectId = Field(..., description="Lesson this quiz belongs to")
    course_id: PydanticObjectId = Field(..., description="Course for easier querying")
    
    # Basic info
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    
    # Quiz configuration
    config: QuizConfig = Field(default_factory=QuizConfig)
    
    # Questions
    questions: List[QuizQuestion] = Field(..., min_items=1)
    total_points: int = Field(..., ge=1, description="Total points for the quiz")
    
    # Attempt tracking
    attempts: List[QuizAttempt] = Field(default_factory=list)
    
    # Status
    is_active: bool = Field(default=True)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "quizzes"
        indexes = [
            "lesson_id",
            "course_id",
            [("lesson_id", 1)],  # One quiz per lesson
            [("course_id", 1), ("is_active", 1)]
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "lesson_id": "507f1f77bcf86cd799439011",
                "course_id": "507f191e810c19729de860ea",
                "title": "Variables and Data Types Quiz",
                "description": "Test your understanding of Python variables and data types",
                "config": {
                    "time_limit": None,
                    "pass_percentage": 70,
                    "max_attempts": 3,
                    "shuffle_questions": True,
                    "shuffle_answers": True,
                    "show_correct_answers": True,
                    "immediate_feedback": True
                },
                "questions": [
                    {
                        "question": "Which of the following is a valid variable name in Python?",
                        "options": [
                            "_myVariable",
                            "123variable",
                            "my-variable",
                            "class"
                        ],
                        "correct_answer": 0,
                        "explanation": "_myVariable is valid. Variable names cannot start with numbers, contain hyphens, or be reserved keywords.",
                        "points": 1
                    }
                ],
                "total_points": 1,
                "attempts": [],
                "is_active": True
            }
        }


class QuizProgress(Document):
    """Separate document to track user quiz progress efficiently."""
    
    # Relationships
    user_id: PydanticObjectId = Field(..., description="User taking the quiz")
    quiz_id: PydanticObjectId = Field(..., description="Quiz being attempted")
    lesson_id: PydanticObjectId = Field(..., description="Associated lesson")
    course_id: PydanticObjectId = Field(..., description="Associated course")
    
    # Progress tracking
    attempts: List[QuizAttempt] = Field(default_factory=list)
    best_score: int = Field(default=0, ge=0, le=100)
    total_attempts: int = Field(default=0, ge=0)
    is_passed: bool = Field(default=False)
    passed_at: Optional[datetime] = None
    
    # Timestamps
    first_attempt_at: Optional[datetime] = None
    last_attempt_at: Optional[datetime] = None
    
    class Settings:
        name = "quiz_progress"
        indexes = [
            [("user_id", 1), ("quiz_id", 1)],  # Unique per user per quiz
            [("user_id", 1), ("course_id", 1)],
            [("quiz_id", 1), ("is_passed", 1)]
        ]