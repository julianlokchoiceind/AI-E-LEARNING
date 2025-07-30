from typing import List, Optional
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from app.models.user import User
from app.models.progress import Progress
from app.models.enrollment import Enrollment
from app.core.deps import get_current_user, get_current_optional_user
from app.services.progress_service import progress_service
from app.services.certificate_service import CertificateService
from app.schemas.progress import VideoProgressUpdate, ProgressSchema
from app.schemas.base import StandardResponse

logger = logging.getLogger(__name__)

def serialize_progress(progress: Progress) -> dict:
    """Serialize Progress model to dict with proper type conversion"""
    if not progress:
        return {}
    
    # Get the dict representation
    data = progress.dict(exclude={"id", "_id"})
    
    # Add the ID as string
    data["id"] = str(progress.id) if progress.id else None
    
    # Ensure all datetime fields are properly serialized
    for field in ["started_at", "completed_at", "last_accessed", "created_at", "updated_at"]:
        if field in data and data[field]:
            data[field] = data[field].isoformat()
    
    # Handle nested video_progress
    if data.get("video_progress") and hasattr(data["video_progress"], "dict"):
        data["video_progress"] = data["video_progress"].dict()
        if data["video_progress"].get("completed_at"):
            data["video_progress"]["completed_at"] = data["video_progress"]["completed_at"].isoformat()
    
    # Handle nested quiz_progress if present
    if data.get("quiz_progress") and hasattr(data["quiz_progress"], "dict"):
        data["quiz_progress"] = data["quiz_progress"].dict()
        if data["quiz_progress"].get("passed_at"):
            data["quiz_progress"]["passed_at"] = data["quiz_progress"]["passed_at"].isoformat()
            
    return data

router = APIRouter()

@router.post("/lessons/{lesson_id}/start", response_model=StandardResponse[dict], status_code=status.HTTP_200_OK)
async def start_lesson(
    lesson_id: str,
    preview: bool = Query(False, description="Preview mode flag"),
    current_user: User = Depends(get_current_user)
):
    """Start a lesson and create initial progress record."""
    # Skip enrollment check for preview mode
    if preview and current_user.role in ["creator", "admin"]:
        return StandardResponse(
            success=True,
            data={"preview_mode": True, "lesson_id": lesson_id},
            message="Preview mode - Progress not tracked"
        )
    try:
        progress = await progress_service.start_lesson(lesson_id, str(current_user.id))
        return StandardResponse(
            success=True,
            data=serialize_progress(progress),
            message="Lesson started successfully"
        )
    except Exception as e:
        import traceback
        logger.error(f"Error in start_lesson endpoint: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/lessons/{lesson_id}/progress", response_model=StandardResponse[dict], status_code=status.HTTP_200_OK)
async def update_video_progress(
    lesson_id: str,
    update_data: VideoProgressUpdate,
    preview: bool = Query(False, description="Preview mode flag"),
    current_user: User = Depends(get_current_user)
):
    """Update video watching progress for a lesson."""
    # Skip saving in preview mode
    if preview and current_user.role in ["creator", "admin"]:
        return StandardResponse(
            success=True,
            data={"preview_mode": True, "lesson_id": lesson_id},
            message="Preview mode - Progress not saved"
        )
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
        
        return StandardResponse(
            success=True,
            data=serialize_progress(progress),
            message=message
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/lessons/{lesson_id}/complete", response_model=StandardResponse[dict], status_code=status.HTTP_200_OK)
async def complete_lesson(
    lesson_id: str,
    preview: bool = Query(False, description="Preview mode flag"),
    current_user: User = Depends(get_current_user)
):
    """Mark a lesson as completed."""
    # Skip saving in preview mode
    if preview and current_user.role in ["creator", "admin"]:
        return StandardResponse(
            success=True,
            data={"preview_mode": True, "lesson_id": lesson_id},
            message="Preview mode - Completion not saved"
        )
    try:
        progress = await progress_service.complete_lesson(lesson_id, str(current_user.id))
        return StandardResponse(
            success=True,
            data=serialize_progress(progress),
            message="Lesson marked as completed"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/lessons/{lesson_id}/progress", response_model=StandardResponse[dict], status_code=status.HTTP_200_OK)
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
    
    return StandardResponse(
        success=True,
        data=serialize_progress(progress),
        message="Progress retrieved successfully"
    )

@router.get("/courses/{course_id}/progress", response_model=StandardResponse[list], status_code=status.HTTP_200_OK)
async def get_course_progress(
    course_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all lesson progress for a course."""
    progress_list = await progress_service.get_course_progress(course_id, str(current_user.id))
    
    # Serialize each progress object
    serialized_list = [serialize_progress(progress) for progress in progress_list]
    
    return StandardResponse(
        success=True,
        data=serialized_list,
        message="Course progress retrieved successfully"
    )


@router.post("/courses/{course_id}/check-completion", response_model=StandardResponse[dict])
async def check_course_completion(
    course_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Check if course is completed and issue certificate if eligible.
    This endpoint is called when a user completes the final lesson of a course.
    """
    try:
        # Find user's enrollment for this course
        enrollment = await Enrollment.find_one({
            "user_id": str(current_user.id),
            "course_id": course_id,
            "is_active": True
        })
        
        if not enrollment:
            raise HTTPException(
                status_code=404,
                detail="Enrollment not found"
            )
        
        # Check and issue certificate if eligible
        certificate = await CertificateService.check_course_completion_and_issue_certificate(
            user_id=str(current_user.id),
            course_id=course_id,
            enrollment_id=str(enrollment.id)
        )
        
        if certificate:
            # Get detailed certificate
            details = await CertificateService.get_certificate_with_details(str(certificate.id))
            
            return StandardResponse(
                success=True,
                data=details,
                message="Congratulations! Your course completion certificate has been issued."
            )
        else:
            return StandardResponse(
                success=False,
                data={},
                message="Course not yet completed or certificate already issued."
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check course completion: {str(e)}"
        )


@router.post("/lessons/batch", response_model=StandardResponse[list])
async def get_batch_lesson_progress(
    request: dict = Body(...),
    preview: bool = Query(False, description="Preview mode flag"),
    current_user: Optional[User] = Depends(get_current_optional_user)
):
    """
    Get progress for multiple lessons at once.
    
    For preview mode, returns empty progress data.
    For normal mode, requires authentication and returns actual progress.
    """
    lesson_ids = request.get("lesson_ids", [])
    
    if not lesson_ids:
        return StandardResponse(
            success=True,
            data=[],
            message="No lesson IDs provided"
        )
    
    # Preview mode: return empty progress
    if preview:
        return StandardResponse(
            success=True,
            data=[],
            message="Preview mode - No progress data"
        )
    
    # Normal mode: require authentication
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    try:
        progress_list = await progress_service.get_batch_lesson_progress(
            lesson_ids, str(current_user.id)
        )
        return StandardResponse(
            success=True,
            data=progress_list,
            message="Batch progress retrieved successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )