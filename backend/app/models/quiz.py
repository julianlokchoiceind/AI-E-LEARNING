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
    type: str = Field(default="multiple_choice", pattern="^(multiple_choice|true_false)$", description="Question type")
    options: List[str] = Field(..., min_items=2, max_items=4, description="Answer options (2 for T/F, 4 for MC)")
    correct_answer: int = Field(..., ge=0, le=3, description="Index of correct answer")
    explanation: Optional[str] = Field(None, max_length=2000, description="Explanation for the correct answer")
    points: int = Field(default=1, ge=1, description="Points for this question")


class QuizConfig(BaseModel):
    """Configuration settings for quiz behavior."""
    time_limit: Optional[int] = Field(None, ge=1, description="Time limit in minutes (None = no limit)")
    pass_percentage: int = Field(default=70, ge=0, le=100)
    shuffle_questions: bool = Field(default=True)
    shuffle_answers: bool = Field(default=True)



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
    
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "quizzes"
        indexes = [
            "lesson_id",
            "course_id",
            [("lesson_id", 1)],  # One quiz per lesson
            [("course_id", 1)]
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
                    "shuffle_questions": True,
                    "shuffle_answers": True
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
                "total_points": 1
            }
        }


class QuizProgress(Document):
    """Simple document to track quiz completion status."""
    
    # Relationships
    user_id: PydanticObjectId = Field(..., description="User taking the quiz")
    quiz_id: PydanticObjectId = Field(..., description="Quiz being attempted")
    lesson_id: PydanticObjectId = Field(..., description="Associated lesson")
    course_id: PydanticObjectId = Field(..., description="Associated course")
    
    # Simple completion tracking
    is_completed: bool = Field(default=False, description="Whether quiz has been completed")
    score: Optional[int] = Field(None, ge=0, le=100, description="Final score percentage")
    answers: Optional[List[int]] = Field(None, description="Selected answer indexes")
    passed: Optional[bool] = Field(None, description="Whether the quiz was passed")
    time_taken: Optional[int] = Field(None, ge=0, description="Time taken in seconds")
    completed_at: Optional[datetime] = Field(None, description="When quiz was completed")
    
    # Auto-save fields for cross-device resume (Week 9 feature)
    saved_answers: Optional[List[int]] = Field(None, description="Saved answers during quiz")
    current_question_index: Optional[int] = Field(None, description="Current question index")
    is_in_progress: bool = Field(default=False, description="Quiz in progress")
    last_saved_at: Optional[datetime] = Field(None, description="Last auto-save time")
    
    class Settings:
        name = "quiz_progress"
        indexes = [
            [("user_id", 1), ("quiz_id", 1)],  # Unique per user per quiz
            [("user_id", 1), ("course_id", 1)],
            [("quiz_id", 1), ("is_passed", 1)]
        ]