"""
AI schemas for structured input/output with PydanticAI
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class QuestionDifficulty(str, Enum):
    """Question difficulty levels"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class QuizQuestionType(str, Enum):
    """Quiz question types"""
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    FILL_BLANK = "fill_blank"

class StudentLevel(str, Enum):
    """Student learning levels"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate" 
    ADVANCED = "advanced"
    EXPERT = "expert"

# Request schemas
class AIChatRequest(BaseModel):
    """Request for AI chat"""
    message: str = Field(..., min_length=1, max_length=2000)
    context: Optional[Dict[str, Any]] = None

class AIQuizGenerationRequest(BaseModel):
    """Request for AI quiz generation"""
    lesson_content: str = Field(..., min_length=10, max_length=10000)
    difficulty: QuestionDifficulty = QuestionDifficulty.INTERMEDIATE
    num_questions: int = Field(5, ge=1, le=20)
    question_type: QuizQuestionType = QuizQuestionType.MULTIPLE_CHOICE

class AISuggestionsRequest(BaseModel):
    """Request for AI contextual suggestions"""
    course_id: Optional[str] = None
    lesson_id: Optional[str] = None
    user_level: Optional[StudentLevel] = StudentLevel.INTERMEDIATE

# Response schemas
class AIChatResponse(BaseModel):
    """Response from AI chat"""
    response: str
    context: Optional[Dict[str, Any]] = None
    timestamp: datetime
    model: str
    from_cache: bool = False
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class QuizOption(BaseModel):
    """Quiz option structure"""
    text: str
    is_correct: bool = False

class GeneratedQuizQuestion(BaseModel):
    """Generated quiz question structure"""
    question: str = Field(..., min_length=10, max_length=500)
    options: List[QuizOption] = Field(..., min_items=2, max_items=6)
    correct_answer_index: int = Field(..., ge=0)
    explanation: str = Field(..., min_length=10, max_length=500)
    difficulty: QuestionDifficulty
    points: int = Field(1, ge=1, le=10)

class AIQuizGenerationResponse(BaseModel):
    """Response from AI quiz generation"""
    questions: List[GeneratedQuizQuestion]
    total_questions: int
    difficulty: QuestionDifficulty
    generated_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class AISuggestionsResponse(BaseModel):
    """Response from AI suggestions"""
    suggestions: List[str] = Field(..., max_items=6)
    context_level: StudentLevel
    generated_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class AIHealthCheckResponse(BaseModel):
    """Response from AI health check"""
    status: str
    model: str
    response_received: bool
    error: Optional[str] = None
    timestamp: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Learning context schemas
class LearningContext(BaseModel):
    """Learning context for AI interactions"""
    course_id: Optional[str] = None
    lesson_id: Optional[str] = None
    chapter_id: Optional[str] = None
    user_level: Optional[StudentLevel] = None
    user_language: str = Field("en", pattern="^(en|vi)$")
    session_history: List[Dict[str, str]] = Field(default_factory=list, max_items=10)

class ConversationEntry(BaseModel):
    """Single conversation entry"""
    timestamp: datetime
    question: str
    answer: str
    context: Optional[LearningContext] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ConversationHistory(BaseModel):
    """Conversation history response"""
    user_id: str
    conversations: List[ConversationEntry]
    total_conversations: int

# Error responses
class AIErrorResponse(BaseModel):
    """Error response from AI service"""
    error: str
    details: Optional[str] = None
    retry_after: Optional[int] = None  # seconds

# Learning analytics schemas  
class AIUsageStats(BaseModel):
    """AI usage statistics"""
    user_id: str
    total_messages: int
    messages_today: int
    messages_this_hour: int
    last_interaction: Optional[datetime] = None
    favorite_topics: List[str] = Field(default_factory=list)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class AILearningInsights(BaseModel):
    """AI-generated learning insights"""
    user_id: str
    strengths: List[str]
    areas_for_improvement: List[str]
    recommended_next_topics: List[str]
    learning_pace: str  # "slow", "moderate", "fast"
    engagement_level: str  # "low", "medium", "high"
    generated_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }