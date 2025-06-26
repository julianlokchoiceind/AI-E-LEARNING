"""
Chapter management endpoints.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status

from app.models.user import User
from app.models.chapter import Chapter
from app.models.course import Course
from app.schemas.chapter import (
    ChapterCreate,
    ChapterUpdate,
    ChapterResponse,
    ChapterListResponse,
    ChapterReorder,
    ChapterWithLessonsResponse,
    ChapterWithLessonsListResponse
)
from app.schemas.base import StandardResponse
from app.services.chapter_service import chapter_service
from app.api.deps import get_current_user, get_current_optional_user

router = APIRouter()


@router.post("/courses/{course_id}/chapters", response_model=StandardResponse[ChapterResponse])
async def create_chapter(
    course_id: str,
    chapter_data: ChapterCreate,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[ChapterResponse]:
    """
    Create a new chapter in a course.
    
    Requires authentication and course creator permissions.
    """
    if current_user.role not in ["creator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only content creators can create chapters"
        )
    
    chapter = await chapter_service.create_chapter(
        course_id=course_id,
        chapter_data=chapter_data,
        user_id=str(current_user.id)
    )
    
    return StandardResponse(
        success=True,
        data=ChapterResponse(
            id=str(chapter.id),
            course_id=str(chapter.course_id),
            title=chapter.title,
            description=chapter.description,
            order=chapter.order,
            lesson_count=chapter.lesson_count,
            total_duration=chapter.total_duration,
            status=chapter.status,
            created_at=chapter.created_at,
            updated_at=chapter.updated_at
        ),
        message="Chapter created successfully"
    )


@router.get("/courses/{course_id}/chapters", response_model=StandardResponse[ChapterListResponse])
async def get_course_chapters(
    course_id: str,
    current_user: Optional[User] = Depends(get_current_optional_user)
) -> StandardResponse[ChapterListResponse]:
    """
    Get all chapters for a course.
    
    Public endpoint - no authentication required.
    """
    chapters = await chapter_service.get_chapters_by_course(
        course_id=course_id,
        user_id=str(current_user.id) if current_user else None
    )
    
    chapter_responses = [
        ChapterResponse(
            id=str(chapter.id),
            course_id=str(chapter.course_id),
            title=chapter.title,
            description=chapter.description,
            order=chapter.order,
            lesson_count=chapter.lesson_count,
            total_duration=chapter.total_duration,
            status=chapter.status,
            created_at=chapter.created_at,
            updated_at=chapter.updated_at
        )
        for chapter in chapters
    ]
    
    return StandardResponse(
        success=True,
        data=ChapterListResponse(
            chapters=chapter_responses,
            total=len(chapter_responses)
        ),
        message="Chapters retrieved successfully"
    )


@router.get("/chapters/{chapter_id}", response_model=StandardResponse[ChapterResponse])
async def get_chapter_detail(
    chapter_id: str,
    current_user: Optional[User] = Depends(get_current_optional_user)
) -> StandardResponse[ChapterResponse]:
    """
    Get chapter details.
    
    Public endpoint - no authentication required.
    """
    chapter = await chapter_service.get_chapter_detail(
        chapter_id=chapter_id,
        user_id=str(current_user.id) if current_user else None
    )
    
    return StandardResponse(
        success=True,
        data=ChapterResponse(
            id=str(chapter.id),
            course_id=str(chapter.course_id),
            title=chapter.title,
            description=chapter.description,
            order=chapter.order,
            lesson_count=chapter.lesson_count,
            total_duration=chapter.total_duration,
            status=chapter.status,
            created_at=chapter.created_at,
            updated_at=chapter.updated_at
        ),
        message="Chapter details retrieved successfully"
    )


@router.patch("/chapters/{chapter_id}", response_model=StandardResponse[ChapterResponse])
async def update_chapter(
    chapter_id: str,
    chapter_update: ChapterUpdate,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[ChapterResponse]:
    """
    Update a chapter.
    
    Requires authentication and course creator permissions.
    """
    if current_user.role not in ["creator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only content creators can update chapters"
        )
    
    chapter = await chapter_service.update_chapter(
        chapter_id=chapter_id,
        chapter_update=chapter_update,
        user_id=str(current_user.id)
    )
    
    return StandardResponse(
        success=True,
        data=ChapterResponse(
            id=str(chapter.id),
            course_id=str(chapter.course_id),
            title=chapter.title,
            description=chapter.description,
            order=chapter.order,
            lesson_count=chapter.lesson_count,
            total_duration=chapter.total_duration,
            status=chapter.status,
            created_at=chapter.created_at,
            updated_at=chapter.updated_at
        ),
        message="Chapter details retrieved successfully"
    )


@router.delete("/chapters/{chapter_id}", response_model=StandardResponse[dict])
async def delete_chapter(
    chapter_id: str,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[dict]:
    """
    Delete a chapter and all its lessons.
    
    Requires authentication and course creator permissions.
    """
    if current_user.role not in ["creator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only content creators can delete chapters"
        )
    
    result = await chapter_service.delete_chapter(
        chapter_id=chapter_id,
        user_id=str(current_user.id)
    )
    
    return StandardResponse(
        success=True,
        data=result,
        message="Chapter deleted successfully"
    )


@router.put("/courses/{course_id}/chapters/reorder", response_model=StandardResponse[ChapterListResponse])
async def reorder_chapters(
    course_id: str,
    reorder_data: ChapterReorder,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[ChapterListResponse]:
    """
    Reorder chapters within a course.
    
    Requires authentication and course creator permissions.
    """
    if current_user.role not in ["creator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only content creators can reorder chapters"
        )
    
    chapters = await chapter_service.reorder_chapters(
        course_id=course_id,
        reorder_data=reorder_data,
        user_id=str(current_user.id)
    )
    
    chapter_responses = [
        ChapterResponse(
            id=str(chapter.id),
            course_id=str(chapter.course_id),
            title=chapter.title,
            description=chapter.description,
            order=chapter.order,
            lesson_count=chapter.lesson_count,
            total_duration=chapter.total_duration,
            status=chapter.status,
            created_at=chapter.created_at,
            updated_at=chapter.updated_at
        )
        for chapter in chapters
    ]
    
    return StandardResponse(
        success=True,
        data=ChapterListResponse(
            chapters=chapter_responses,
            total=len(chapter_responses)
        ),
        message="Chapters retrieved successfully"
    )

@router.get("/courses/{course_id}/chapters-with-lessons", response_model=StandardResponse[ChapterWithLessonsListResponse])
async def get_course_chapters_with_lessons(
    course_id: str,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[ChapterWithLessonsListResponse]:
    """
    Get all chapters for a course with lessons included.
    
    Requires authentication. Used for course builder.
    """
    # Verify user has access to edit this course
    course = await Course.get(course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    if str(course.creator_id) != str(current_user.id) and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to edit this course"
        )
    
    chapters = await chapter_service.get_chapters_with_lessons(course_id)
    
    chapter_responses = [
        ChapterWithLessonsResponse(
            id=str(chapter.id),
            course_id=str(chapter.course_id),
            title=chapter.title,
            description=chapter.description,
            order=chapter.order,
            lesson_count=chapter.lesson_count,
            total_duration=chapter.total_duration,
            status=chapter.status,
            created_at=chapter.created_at,
            updated_at=chapter.updated_at,
            lessons=[
                {
                    "_id": str(lesson.id),
                    "title": lesson.title,
                    "description": lesson.description,
                    "order": lesson.order,
                    "video_duration": lesson.video.duration if lesson.video else 0,
                    "has_quiz": lesson.has_quiz,
                    "is_free_preview": getattr(lesson, 'is_free_preview', False),
                    "is_completed": False,  # Will be populated based on user progress
                    "is_locked": False  # Will be calculated based on sequential learning
                }
                for lesson in getattr(chapter, 'lessons', [])
            ]
        )
        for chapter in chapters
    ]
    
    return StandardResponse(
        success=True,
        data=ChapterWithLessonsListResponse(
            chapters=chapter_responses,
            total=len(chapter_responses)
        ),
        message="Chapters with lessons retrieved successfully"
    )