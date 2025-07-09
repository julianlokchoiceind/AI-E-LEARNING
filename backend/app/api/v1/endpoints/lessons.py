"""
Lesson management endpoints.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body

from app.models.user import User
from app.models.lesson import Lesson
from app.schemas.lesson import (
    LessonCreate,
    LessonUpdate,
    LessonResponse,
    LessonListResponse,
    LessonReorder,
    VideoUploadResponse,
    MessageResponse
)
from app.schemas.base import StandardResponse
from app.services.lesson_service import lesson_service
from app.api.deps import get_current_user, get_current_optional_user

router = APIRouter()


def lesson_to_response(lesson: Lesson) -> LessonResponse:
    """Convert Lesson model to LessonResponse."""
    return LessonResponse(
        id=str(lesson.id),
        course_id=str(lesson.course_id),
        chapter_id=str(lesson.chapter_id),
        title=lesson.title,
        description=lesson.description,
        order=lesson.order,
        video=lesson.video.dict() if lesson.video else None,
        content=lesson.content,
        resources=lesson.resources,
        unlock_conditions=lesson.unlock_conditions.dict() if lesson.unlock_conditions else None,
        status=lesson.status,
        created_at=lesson.created_at,
        updated_at=lesson.updated_at
    )


@router.post("/chapters/{chapter_id}/lessons", response_model=StandardResponse[LessonResponse])
async def create_lesson(
    chapter_id: str,
    lesson_data: LessonCreate,
    course_id: str,  # Pass as query parameter
    current_user: User = Depends(get_current_user)
) -> StandardResponse[LessonResponse]:
    """
    Create a new lesson in a chapter.
    
    Requires authentication and course creator permissions.
    """
    if current_user.role not in ["creator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only content creators can create lessons"
        )
    
    lesson = await lesson_service.create_lesson(
        course_id=course_id,
        chapter_id=chapter_id,
        lesson_data=lesson_data,
        user_id=str(current_user.id)
    )
    
    return StandardResponse(
        success=True,
        data=lesson_to_response(lesson),
        message="Lesson created successfully"
    )


@router.get("/chapters/{chapter_id}/lessons", response_model=StandardResponse[LessonListResponse])
async def get_chapter_lessons(
    chapter_id: str,
    current_user: Optional[User] = Depends(get_current_optional_user)
) -> StandardResponse[LessonListResponse]:
    """
    Get all lessons for a chapter.
    
    Public endpoint - no authentication required.
    """
    lessons = await lesson_service.get_lessons_by_chapter(
        chapter_id=chapter_id,
        user_id=str(current_user.id) if current_user else None
    )
    
    lesson_responses = [lesson_to_response(lesson) for lesson in lessons]
    
    return StandardResponse(
        success=True,
        data=LessonListResponse(
            lessons=lesson_responses,
            total=len(lesson_responses)
        ),
        message="Lessons retrieved successfully"
    )


@router.get("/courses/{course_id}/lessons", response_model=StandardResponse[LessonListResponse])
async def get_course_lessons(
    course_id: str,
    current_user: Optional[User] = Depends(get_current_optional_user)
) -> StandardResponse[LessonListResponse]:
    """
    Get all lessons for a course.
    
    Public endpoint - no authentication required.
    """
    lessons = await lesson_service.get_lessons_by_course(
        course_id=course_id,
        user_id=str(current_user.id) if current_user else None
    )
    
    lesson_responses = [lesson_to_response(lesson) for lesson in lessons]
    
    return StandardResponse(
        success=True,
        data=LessonListResponse(
            lessons=lesson_responses,
            total=len(lesson_responses)
        ),
        message="Lessons retrieved successfully"
    )


@router.get("/lessons/{lesson_id}", response_model=StandardResponse[LessonResponse])
async def get_lesson_detail(
    lesson_id: str,
    current_user: Optional[User] = Depends(get_current_optional_user)
) -> StandardResponse[LessonResponse]:
    """
    Get lesson details.
    
    Public endpoint for published lessons - authentication optional.
    """
    lesson = await lesson_service.get_lesson_detail(
        lesson_id=lesson_id,
        user_id=str(current_user.id) if current_user else None
    )
    
    return StandardResponse(
        success=True,
        data=lesson_to_response(lesson),
        message="Lesson details retrieved successfully"
    )


@router.patch("/lessons/{lesson_id}", response_model=StandardResponse[LessonResponse])
async def update_lesson(
    lesson_id: str,
    lesson_update: LessonUpdate,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[LessonResponse]:
    """
    Update a lesson.
    
    Requires authentication and course creator permissions.
    """
    if current_user.role not in ["creator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only content creators can update lessons"
        )
    
    lesson = await lesson_service.update_lesson(
        lesson_id=lesson_id,
        lesson_update=lesson_update,
        user_id=str(current_user.id)
    )
    
    return StandardResponse(
        success=True,
        data=lesson_to_response(lesson),
        message="Lesson updated successfully"
    )


@router.delete("/lessons/{lesson_id}", response_model=StandardResponse[dict])
async def delete_lesson(
    lesson_id: str,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[dict]:
    """
    Delete a lesson.
    
    Requires authentication and course creator permissions.
    """
    if current_user.role not in ["creator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only content creators can delete lessons"
        )
    
    result = await lesson_service.delete_lesson(
        lesson_id=lesson_id,
        user_id=str(current_user.id)
    )
    
    return StandardResponse(
        success=True,
        data=result,
        message="Lesson deleted successfully"
    )


@router.put("/chapters/{chapter_id}/lessons/reorder", response_model=StandardResponse[LessonListResponse])
async def reorder_lessons(
    chapter_id: str,
    reorder_data: LessonReorder,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[LessonListResponse]:
    """
    Reorder lessons within a chapter.
    
    Requires authentication and course creator permissions.
    """
    if current_user.role not in ["creator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only content creators can reorder lessons"
        )
    
    lessons = await lesson_service.reorder_lessons(
        chapter_id=chapter_id,
        reorder_data=reorder_data,
        user_id=str(current_user.id)
    )
    
    lesson_responses = [lesson_to_response(lesson) for lesson in lessons]
    
    return StandardResponse(
        success=True,
        data=LessonListResponse(
            lessons=lesson_responses,
            total=len(lesson_responses)
        ),
        message="Lessons retrieved successfully"
    )


@router.post("/lessons/{lesson_id}/video", response_model=StandardResponse[VideoUploadResponse])
async def upload_lesson_video(
    lesson_id: str,
    video_data: dict,  # In real implementation, this would be file upload
    current_user: User = Depends(get_current_user)
) -> StandardResponse[VideoUploadResponse]:
    """
    Upload video for a lesson.
    
    Requires authentication and course creator permissions.
    In production, this would handle actual file upload to CDN/storage.
    """
    if current_user.role not in ["creator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only content creators can upload videos"
        )
    
    # For now, just update the lesson with video URL
    # In production, this would:
    # 1. Upload video to storage (S3, etc.)
    # 2. Process video (transcode, generate thumbnail)
    # 3. Update lesson with video metadata
    
    lesson = await lesson_service.upload_video(
        lesson_id=lesson_id,
        video_data=video_data,
        user_id=str(current_user.id)
    )
    
    return StandardResponse(
        success=True,
        data=VideoUploadResponse(
            youtube_url=lesson.video.youtube_url,
            duration=lesson.video.duration,
            thumbnail=lesson.video.thumbnail,
            upload_status="completed",
            message="Video uploaded successfully"
        ),
        message="Video uploaded successfully"
    )


@router.post("/{lesson_id}/reorder", response_model=StandardResponse[dict], status_code=status.HTTP_200_OK)
async def reorder_lessons(
    lesson_id: str,
    new_order: int = Body(..., embed=True),
    current_user: User = Depends(get_current_user)
) -> StandardResponse[dict]:
    """
    Reorder a lesson within its chapter.
    
    Requires authentication and course creator permissions.
    """
    if current_user.role not in ["creator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only content creators can reorder lessons"
        )
    
    await lesson_service.reorder_lesson(
        lesson_id=lesson_id,
        new_order=new_order,
        user_id=str(current_user.id)
    )
    
    return StandardResponse(
        success=True,
        data={"lesson_id": lesson_id, "new_order": new_order},
        message="Lesson order updated successfully"
    )