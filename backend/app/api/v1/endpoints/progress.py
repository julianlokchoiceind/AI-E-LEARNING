from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Body
from app.models.user import User
from app.models.progress import Progress
from app.core.deps import get_current_user
from app.services.progress_service import progress_service
from app.schemas.progress import (
    ProgressResponse,
    ProgressListResponse,
    VideoProgressUpdate,
    MessageResponse
)

router = APIRouter()

@router.post("/lessons/{lesson_id}/start", response_model=ProgressResponse, status_code=status.HTTP_200_OK)
async def start_lesson(
    lesson_id: str,
    current_user: User = Depends(get_current_user)
):
    """Start a lesson and create initial progress record."""
    try:
        progress = await progress_service.start_lesson(lesson_id, str(current_user.id))
        return ProgressResponse(
            success=True,
            data=progress,
            message="Lesson started successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/lessons/{lesson_id}/progress", response_model=ProgressResponse, status_code=status.HTTP_200_OK)
async def update_video_progress(
    lesson_id: str,
    update_data: VideoProgressUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update video watching progress for a lesson."""
    try:
        progress = await progress_service.update_video_progress(
            lesson_id,
            str(current_user.id),
            update_data.watch_percentage,
            update_data.current_position
        )
        
        message = "Progress updated"
        if progress.is_completed:
            message = "Lesson completed! Next lesson unlocked."
        
        return ProgressResponse(
            success=True,
            data=progress,
            message=message
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/lessons/{lesson_id}/complete", response_model=ProgressResponse, status_code=status.HTTP_200_OK)
async def complete_lesson(
    lesson_id: str,
    current_user: User = Depends(get_current_user)
):
    """Mark a lesson as completed."""
    try:
        progress = await progress_service.complete_lesson(lesson_id, str(current_user.id))
        return ProgressResponse(
            success=True,
            data=progress,
            message="Lesson marked as completed"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/lessons/{lesson_id}/progress", response_model=ProgressResponse, status_code=status.HTTP_200_OK)
async def get_lesson_progress(
    lesson_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get user's progress for a specific lesson."""
    progress = await progress_service.get_lesson_progress(lesson_id, str(current_user.id))
    
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Progress not found"
        )
    
    return ProgressResponse(
        success=True,
        data=progress,
        message="Progress retrieved successfully"
    )

@router.get("/courses/{course_id}/progress", response_model=ProgressListResponse, status_code=status.HTTP_200_OK)
async def get_course_progress(
    course_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all lesson progress for a course."""
    progress_list = await progress_service.get_course_progress(course_id, str(current_user.id))
    
    return ProgressListResponse(
        success=True,
        data=progress_list,
        message="Course progress retrieved successfully"
    )