"""
Chapter management endpoints.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from beanie import PydanticObjectId

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
from app.core.deps import get_current_user, get_current_optional_user

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
    course = await Course.get(PydanticObjectId(course_id))
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
            id=chapter["id"],
            course_id=chapter["course_id"],
            title=chapter["title"],
            description=chapter["description"],
            order=chapter["order"],
            lesson_count=chapter["lesson_count"],
            total_duration=chapter["total_duration"],
            status=chapter["status"],
            created_at=chapter["created_at"],
            updated_at=chapter["updated_at"],
            lessons=[
                {
                    "id": lesson["id"],  # Use standard 'id' field (service provides both _id and id)
                    "title": lesson["title"],
                    "description": lesson["description"],
                    "order": lesson["order"],
                    "video": {
                        "url": lesson.get("video_url", ""),
                        "youtube_id": lesson.get("youtube_id", ""),
                        "duration": lesson.get("video_duration", 0)
                    },
                    "has_quiz": lesson["has_quiz"],
                    "status": lesson.get("status", "draft"),  # Include lesson status
                    "content": lesson.get("content", ""),
                    "is_free_preview": False,  # Default value
                    "is_completed": False,  # Will be populated based on user progress
                    "is_locked": False,  # Will be calculated based on sequential learning
                    "chapter_id": chapter["id"]  # Add chapter_id for navigation
                }
                for lesson in chapter.get("lessons", [])
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


@router.get("/courses/{course_id}/chapters-with-lessons-public", response_model=StandardResponse[ChapterWithLessonsListResponse])
async def get_course_chapters_with_lessons_public(
    course_id: str,
    current_user: Optional[User] = Depends(get_current_optional_user)
) -> StandardResponse[ChapterWithLessonsListResponse]:
    """
    Get all chapters for a course with lessons included - PUBLIC endpoint.
    
    Used for learning interface. No authentication required for preview mode.
    Returns published chapters and lessons only.
    """
    # Check if course exists and is published
    from bson import ObjectId
    try:
        course_obj_id = ObjectId(course_id) if isinstance(course_id, str) else course_id
        course = await Course.get(course_obj_id)
    except:
        course = None
        
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Allow access to unpublished courses in preview mode or for creator/admin
    if course.status != "published":
        # Check if user has permission to view unpublished content
        is_creator_or_admin = current_user and (str(course.creator_id) == str(current_user.id) or current_user.role == "admin")
        if not is_creator_or_admin:
            # In preview mode (no auth), we still want to show the course structure
            # The actual lesson access will be controlled separately
            pass  # Allow preview access to see course structure
    
    chapters = await chapter_service.get_chapters_with_lessons(course_id)
    
    # For preview mode, show all content regardless of status
    # This allows testing the full learning experience
    # In production, unpublished content would still be restricted by enrollment checks
    
    # Only filter content if NOT in preview mode and NOT the course creator/admin
    preview_param = current_user is None  # If no user, assume preview mode
    is_creator_or_admin = current_user and (str(course.creator_id) == str(current_user.id) or current_user.role == "admin")
    
    # Skip filtering for preview mode or creator/admin access
    if not preview_param and not is_creator_or_admin:
        # Regular user access - only show published content
        filtered_chapters = []
        for chapter in chapters:
            if chapter.get("status") == "published":
                # Filter lessons to only published ones
                published_lessons = [
                    lesson for lesson in chapter.get("lessons", []) 
                    if lesson.get("status") == "published"
                ]
                if published_lessons:  # Only include chapter if it has published lessons
                    chapter_copy = chapter.copy()
                    chapter_copy["lessons"] = published_lessons
                    filtered_chapters.append(chapter_copy)
        chapters = filtered_chapters
    
    chapter_responses = [
        ChapterWithLessonsResponse(
            id=chapter["id"],
            course_id=chapter["course_id"],
            title=chapter["title"],
            description=chapter["description"],
            order=chapter["order"],
            lesson_count=len(chapter.get("lessons", [])),  # Count filtered lessons
            total_duration=chapter["total_duration"],
            status=chapter["status"],
            created_at=chapter["created_at"],
            updated_at=chapter["updated_at"],
            lessons=[
                {
                    "id": lesson["id"],
                    "title": lesson["title"],
                    "description": lesson["description"],
                    "order": lesson["order"],
                    "video": {
                        "url": lesson.get("video_url", ""),
                        "youtube_id": lesson.get("youtube_id", ""),
                        "duration": lesson.get("video_duration", 0)
                    },
                    "has_quiz": lesson["has_quiz"],
                    "status": lesson.get("status", "draft"),
                    "is_free_preview": lesson.get("is_free_preview", False),
                    "is_completed": False,  # Will be populated based on user progress
                    "is_locked": True,  # Default to locked, frontend will calculate based on progress
                    "chapter_id": chapter["id"]  # Add chapter_id for navigation
                }
                for lesson in chapter.get("lessons", [])
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