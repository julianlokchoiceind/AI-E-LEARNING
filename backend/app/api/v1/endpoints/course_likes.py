"""
Course Reaction API endpoints (YouTube-style like/dislike)
"""
from typing import Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, status

from app.models.user import User
from app.schemas.base import StandardResponse
from app.schemas.course_like import (
    CourseReactionRequest,
    CourseReactionResponse,
    CourseReactionToggleResponse
)
from app.services.course_like_service import course_reaction_service
from app.core.deps import get_current_user, get_current_optional_user

router = APIRouter()


@router.post("/courses/{course_id}/react", response_model=StandardResponse[CourseReactionToggleResponse])
async def toggle_course_reaction(
    course_id: str,
    request: CourseReactionRequest,
    current_user: User = Depends(get_current_user)
):
    """Toggle reaction (like/dislike) for a course - YouTube style"""
    try:
        result = await course_reaction_service.toggle_reaction(
            course_id,
            current_user,
            request.reaction_type
        )
        return StandardResponse(
            success=True,
            data=result,
            message=result["message"]
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to toggle reaction: {str(e)}"
        )


@router.get("/courses/{course_id}/react", response_model=StandardResponse[CourseReactionResponse])
async def get_course_reaction_status(
    course_id: str,
    current_user: Optional[User] = Depends(get_current_optional_user)
):
    """Get reaction status and counts for a course"""
    try:
        user_id = str(current_user.id) if current_user else None
        result = await course_reaction_service.get_reaction_status(course_id, user_id)
        return StandardResponse(
            success=True,
            data=result,
            message="Reaction status retrieved"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get reaction status: {str(e)}"
        )
