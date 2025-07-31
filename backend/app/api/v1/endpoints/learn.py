"""
Learn page API endpoints - Smart Backend consolidation.
Single endpoint replacing 7 frontend API calls for optimal performance.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer

from app.schemas.base import StandardResponse
from app.schemas.learn import LearnPageResponse, UpdateProgressRequest, ProgressUpdateResponse
from app.services.learn_service import learn_service
from app.core.deps import get_current_user_optional, get_current_user
from app.models.user import User

router = APIRouter()
security = HTTPBearer(auto_error=False)


@router.get(
    "/{course_id}/{lesson_id}",
    response_model=StandardResponse[LearnPageResponse],
    summary="Get consolidated learn page data",
    description="""
    **Smart Backend Endpoint** - Consolidates 7 API calls into 1 optimized request.
    
    Replaces these frontend calls:
    - Course details
    - Current lesson details  
    - Chapters with lessons
    - User enrollment status
    - Progress data for all lessons
    - Navigation context
    - User statistics
    
    **Performance Benefits:**
    - Reduces loading states from 4 to 1
    - Eliminates network waterfall effects
    - Provides atomic data consistency
    - Optimizes database queries with parallel fetching
    
    **Cache Strategy:**
    - Uses REALTIME cache config (staleTime: 0)
    - Invalidated by progress updates and course changes
    - Supports both authenticated and guest users
    
    **Business Logic:**
    - Handles course/lesson access permissions
    - Calculates progress percentages consistently  
    - Provides navigation context (prev/next lessons)
    - Applies sequential learning unlock rules
    """
)
async def get_learn_page_data(
    course_id: str,
    lesson_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional)
) -> StandardResponse[LearnPageResponse]:
    """
    Get all learn page data in single optimized API call.
    Smart Backend: Consolidates data fetching with parallel processing.
    """
    try:
        # Extract user ID if authenticated
        user_id = str(current_user.id) if current_user else None
        
        # Fetch consolidated learn page data
        learn_data = await learn_service.get_learn_page_data(
            course_id=course_id,
            lesson_id=lesson_id,
            user_id=user_id
        )
        
        # Success response with metadata
        return StandardResponse[LearnPageResponse](
            success=True,
            data=learn_data,
            message="Learn page data loaded successfully"
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions (404, 403, etc.)
        raise
    except Exception as e:
        # Log unexpected errors for monitoring
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Unexpected error in get_learn_page_data: {str(e)}", exc_info=True)
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load learn page data. Please try again."
        )


@router.put(
    "/{course_id}/progress",
    response_model=StandardResponse[ProgressUpdateResponse],
    summary="Update lesson progress",
    description="""
    **Smart Backend Progress Update** - Handles video progress with business logic.
    
    **Features:**
    - Debounced progress updates (5 second intervals)
    - Automatic lesson completion at 80% threshold
    - Sequential lesson unlocking
    - Course completion calculation
    - Optimistic UI support
    
    **Cache Invalidation:**
    - Invalidates learn page cache for immediate updates
    - Updates enrollment progress statistics
    - Triggers course completion notifications
    
    **Business Rules:**
    - Only enrolled users can update progress
    - Progress is capped at 100%
    - Lesson completion triggers next lesson unlock
    - Course completion updates user statistics
    """
)
async def update_lesson_progress(
    course_id: str,
    progress_data: UpdateProgressRequest,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[ProgressUpdateResponse]:
    """
    Update lesson watching progress with smart backend processing.
    Handles business logic for completion, unlocking, and notifications.
    """
    try:
        # Update progress using smart backend service
        progress_response = await learn_service.update_lesson_progress(
            course_id=course_id,
            user_id=str(current_user.id),
            progress_data=progress_data
        )
        
        # Build success message based on progress state
        message = "Progress updated successfully"
        if progress_response.lesson_completed:
            message = "Lesson completed! Next lesson unlocked."
        elif progress_response.course_completed:
            message = "Congratulations! Course completed!"
        
        return StandardResponse[ProgressUpdateResponse](
            success=True,
            data=progress_response,
            message=message
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions (403, 404, etc.)
        raise
    except Exception as e:
        # Log unexpected errors for monitoring
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Unexpected error in update_lesson_progress: {str(e)}", exc_info=True)
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update progress. Please try again."
        )


@router.get(
    "/{course_id}/{lesson_id}/health",
    summary="Health check for learn page endpoint",
    description="Simple health check to verify learn page API availability"
)
async def learn_page_health_check(course_id: str, lesson_id: str):
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "endpoint": "learn_page",
        "course_id": course_id,
        "lesson_id": lesson_id,
        "timestamp": "2025-01-31T00:00:00Z"
    }


# Export router for inclusion in main API
__all__ = ["router"]