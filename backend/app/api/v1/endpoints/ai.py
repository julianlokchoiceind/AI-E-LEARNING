"""
AI endpoints for chat functionality and educational assistance
Handles PydanticAI integration with Claude 3.5 Sonnet
"""

from typing import Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from app.api.deps import get_current_user
from app.models.user import User
from app.services.ai_service import ai_service
from app.schemas.base import StandardResponse
from app.schemas.ai import (
    AIChatRequest,
    AIChatResponse,
    AIQuizGenerationRequest,
    AIQuizGenerationResponse,
    AISuggestionsRequest,
    AISuggestionsResponse,
    AIHealthCheckResponse,
    ConversationHistory,
    AIErrorResponse
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Request/Response Models
class ChatRequest(BaseModel):
    """Request model for AI chat"""
    message: str = Field(..., min_length=1, max_length=2000, description="User's question or message")
    context: Optional[Dict[str, Any]] = Field(None, description="Context information (course, lesson, etc.)")

class ChatResponse(BaseModel):
    """Response model for AI chat"""
    response: str = Field(..., description="AI assistant's response")
    context: Optional[Dict[str, Any]] = Field(None, description="Context used for the response")
    timestamp: str = Field(..., description="Response timestamp")
    model: str = Field(..., description="AI model used")

class ChatErrorResponse(BaseModel):
    """Error response model for AI chat"""
    error: str = Field(..., description="Error message")
    retry_after: Optional[int] = Field(None, description="Seconds to wait before retry")
    details: Optional[str] = Field(None, description="Additional error details")

class ConversationHistoryResponse(BaseModel):
    """Response model for conversation history"""
    history: list = Field(..., description="List of conversation entries")
    total_count: int = Field(..., description="Total number of conversations")

class QuizGenerationRequest(BaseModel):
    """Request model for quiz generation"""
    lesson_content: str = Field(..., min_length=50, description="Lesson content or transcript")
    difficulty: str = Field("intermediate", description="Difficulty level: beginner, intermediate, advanced")
    num_questions: int = Field(5, ge=1, le=10, description="Number of questions to generate")

class QuizGenerationResponse(BaseModel):
    """Response model for quiz generation"""
    questions: list = Field(..., description="Generated quiz questions")
    total_generated: int = Field(..., description="Number of questions generated")
    difficulty: str = Field(..., description="Difficulty level used")

class HealthCheckResponse(BaseModel):
    """Response model for health check"""
    status: str = Field(..., description="Service health status")
    model: Optional[str] = Field(None, description="AI model information")
    response_received: Optional[bool] = Field(None, description="Whether test response was received")
    timestamp: str = Field(..., description="Health check timestamp")
    error: Optional[str] = Field(None, description="Error details if unhealthy")

class SuggestionsRequest(BaseModel):
    """Request model for contextual suggestions"""
    course_id: Optional[str] = Field(None, description="Current course ID")
    lesson_id: Optional[str] = Field(None, description="Current lesson ID")
    user_level: Optional[str] = Field(None, description="User's learning level")

class SuggestionsResponse(BaseModel):
    """Response model for contextual suggestions"""
    suggestions: list = Field(..., description="List of suggested questions")
    context: Optional[Dict[str, Any]] = Field(None, description="Context used for suggestions")
    timestamp: str = Field(..., description="Generation timestamp")


@router.post("/chat", 
             response_model=StandardResponse[AIChatResponse],
             responses={
                 400: {"model": StandardResponse[AIErrorResponse], "description": "Bad request or rate limit exceeded"},
                 500: {"model": StandardResponse[AIErrorResponse], "description": "Internal server error"}
             })
async def ai_chat(
    request: AIChatRequest,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[AIChatResponse]:
    """
    Chat with AI Study Buddy
    
    Send a message to the AI assistant and get an educational response.
    The AI considers context like current course and lesson to provide relevant help.
    
    - **message**: Your question or message to the AI
    - **context**: Optional context (course_id, lesson_id, user_level, etc.)
    """
    try:
        # Call AI service
        result = await ai_service.chat(
            user_id=str(current_user.id),
            message=request.message,
            context=request.context
        )
        
        # Handle errors from AI service
        if "error" in result:
            error_response = ChatErrorResponse(
                error=result["error"],
                retry_after=result.get("retry_after"),
                details=result.get("details")
            )
            
            if "rate limit" in result["error"].lower():
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=error_response.dict()
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=error_response.dict()
                )
        
        # Return successful response
        return StandardResponse(
            success=True,
            data=AIChatResponse(
                response=result["response"],
                context=result.get("context"),
                timestamp=datetime.fromisoformat(result["timestamp"]),
                model=result["model"],
                from_cache=result.get("from_cache", False)
            ),
            message="AI response generated successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI chat endpoint error: {str(e)}")
        error_response = ChatErrorResponse(
            error="An unexpected error occurred. Please try again.",
            details=str(e) if logger.isEnabledFor(logging.DEBUG) else None
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_response.dict()
        )


@router.get("/conversation-history", response_model=StandardResponse[ConversationHistory])
async def get_conversation_history(
    current_user: User = Depends(get_current_user)
) -> StandardResponse[ConversationHistory]:
    """
    Get conversation history with AI assistant
    
    Retrieve the recent conversation history for context continuity.
    Only the last 10 conversations are stored per user.
    """
    try:
        history = await ai_service.get_conversation_history(str(current_user.id))
        
        # Format history for response
        formatted_history = []
        for entry in history:
            formatted_entry = {
                "timestamp": entry["timestamp"].isoformat(),
                "question": entry["question"],
                "answer": entry["answer"],
                "context": entry.get("context")
            }
            formatted_history.append(formatted_entry)
        
        return StandardResponse(
            success=True,
            data=ConversationHistory(
                user_id=str(current_user.id),
                conversations=formatted_history,
                total_conversations=len(formatted_history)
            ),
            message="Conversation history retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Get conversation history error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve conversation history"
        )


@router.delete("/conversation-history", response_model=StandardResponse[dict])
async def clear_conversation_history(
    current_user: User = Depends(get_current_user)
) -> StandardResponse[dict]:
    """
    Clear conversation history with AI assistant
    
    Remove all stored conversation history for the current user.
    This action cannot be undone.
    """
    try:
        await ai_service.clear_conversation_history(str(current_user.id))
        return StandardResponse(
            success=True,
            data={"cleared": True},
            message="Conversation history cleared successfully"
        )
        
    except Exception as e:
        logger.error(f"Clear conversation history error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear conversation history"
        )


@router.post("/generate-quiz", 
             response_model=StandardResponse[AIQuizGenerationResponse],
             dependencies=[Depends(get_current_user)])
async def generate_quiz_questions(
    request: AIQuizGenerationRequest,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[AIQuizGenerationResponse]:
    """
    Generate quiz questions from lesson content using AI
    
    Use AI to automatically generate quiz questions based on lesson content.
    This endpoint is typically used by content creators to quickly create assessments.
    
    - **lesson_content**: The lesson content or transcript to generate questions from
    - **difficulty**: Question difficulty level (beginner, intermediate, advanced)
    - **num_questions**: Number of questions to generate (1-10)
    
    Note: This feature requires content creator or admin privileges.
    """
    try:
        # Check if user has permissions to generate quizzes
        if current_user.role not in ["creator", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only content creators and admins can generate quiz questions"
            )
        
        # Generate quiz questions using AI
        questions = await ai_service.generate_quiz_questions(
            lesson_content=request.lesson_content,
            difficulty=request.difficulty,
            num_questions=request.num_questions
        )
        
        return StandardResponse(
            success=True,
            data=AIQuizGenerationResponse(
                questions=questions,
                total_questions=len(questions),
                difficulty=request.difficulty,
                generated_at=datetime.utcnow()
            ),
            message="Quiz questions generated successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quiz generation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate quiz questions"
        )


@router.get("/health", response_model=StandardResponse[AIHealthCheckResponse])
async def ai_health_check() -> StandardResponse[AIHealthCheckResponse]:
    """
    Check AI service health
    
    Verify that the AI service is working properly by sending a test query.
    This endpoint can be used for monitoring and troubleshooting.
    """
    try:
        health_data = await ai_service.health_check()
        
        return StandardResponse(
            success=True,
            data=AIHealthCheckResponse(
                status=health_data["status"],
                model=health_data.get("model"),
                response_received=health_data.get("response_received"),
                timestamp=datetime.fromisoformat(health_data["timestamp"]),
                error=health_data.get("error")
            ),
            message="AI service health check completed"
        )
        
    except Exception as e:
        logger.error(f"AI health check error: {str(e)}")
        return StandardResponse(
            success=False,
            data=AIHealthCheckResponse(
                status="unhealthy",
                model="unknown",
                response_received=False,
                error=str(e),
                timestamp=datetime.utcnow()
            ),
            message="AI service health check failed"
        )


@router.post("/suggestions", response_model=StandardResponse[AISuggestionsResponse])
async def get_contextual_suggestions(
    request: AISuggestionsRequest,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[AISuggestionsResponse]:
    """
    Get contextual question suggestions based on current learning context
    
    Generate helpful question suggestions that are relevant to the user's
    current course and lesson context. These can be used to guide learning
    and encourage engagement with the AI assistant.
    
    - **course_id**: Current course ID for context
    - **lesson_id**: Current lesson ID for more specific context
    - **user_level**: User's learning level (beginner, intermediate, advanced)
    """
    try:
        suggestions = await ai_service.generate_contextual_suggestions(
            course_id=request.course_id,
            lesson_id=request.lesson_id,
            user_level=request.user_level
        )
        
        # Build context info for response
        context = {}
        if request.course_id:
            context["course_id"] = request.course_id
        if request.lesson_id:
            context["lesson_id"] = request.lesson_id
        if request.user_level:
            context["user_level"] = request.user_level
        
        return StandardResponse(
            success=True,
            data=AISuggestionsResponse(
                suggestions=suggestions,
                context_level=request.user_level or "intermediate",
                generated_at=datetime.utcnow()
            ),
            message="Suggestions generated successfully"
        )
        
    except Exception as e:
        logger.error(f"Suggestions generation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate suggestions"
        )


# Additional utility endpoints

@router.post("/context", response_model=StandardResponse[dict])
async def set_ai_context(
    context: Dict[str, Any],
    current_user: User = Depends(get_current_user)
) -> StandardResponse[dict]:
    """
    Set AI context for future conversations
    
    This endpoint allows the frontend to set context information
    that will be used in subsequent AI conversations.
    """
    try:
        # In a production system, you might want to validate and store this context
        # For now, we'll just acknowledge the context setting
        logger.info(f"AI context set for user {current_user.id}: {context}")
        
        return StandardResponse(
            success=True,
            data={
                "context_set": True,
                "context_keys": list(context.keys())
            },
            message="AI context set successfully"
        )
        
    except Exception as e:
        logger.error(f"Set AI context error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to set AI context"
        )