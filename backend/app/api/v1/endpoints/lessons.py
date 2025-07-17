"""
Lesson management endpoints.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body, UploadFile, File

from app.models.user import User
from app.models.lesson import Lesson
from app.schemas.lesson import (
    LessonCreate,
    LessonUpdate,
    LessonResponse,
    LessonListResponse,
    LessonReorder,
    VideoUploadResponse,
    MessageResponse,
    ResourceSchema
)
from app.schemas.base import StandardResponse
from app.services.lesson_service import lesson_service
from app.services.course_service import CourseService
from app.api.deps import get_current_user, get_current_optional_user
from app.core.config import get_file_upload_service
from app.utils.file_upload import validate_url_format, get_display_title_from_filename, sanitize_resource_title

router = APIRouter()


def lesson_to_response(lesson_dict: dict) -> LessonResponse:
    """Convert lesson dict to LessonResponse."""
    # Convert Resource objects to ResourceSchema objects for Pydantic validation
    resources = []
    if lesson_dict.get("resources"):
        for resource in lesson_dict["resources"]:
            if hasattr(resource, 'dict'):
                # If it's a Pydantic model, convert to dict first
                resources.append(ResourceSchema(**resource.dict()))
            elif isinstance(resource, dict):
                # If it's already a dict, use it directly
                resources.append(ResourceSchema(**resource))
            else:
                # If it's an object with attributes, convert to dict manually
                resources.append(ResourceSchema(
                    title=resource.title,
                    type=resource.type,
                    url=resource.url,
                    description=resource.description,
                    size=resource.size
                ))
    
    return LessonResponse(
        id=lesson_dict["id"],
        course_id=lesson_dict["course_id"],
        chapter_id=lesson_dict["chapter_id"],
        title=lesson_dict["title"],
        description=lesson_dict["description"],
        order=lesson_dict["order"],
        video=lesson_dict["video"],
        content=lesson_dict["content"],
        resources=resources,
        unlock_conditions=lesson_dict.get("unlock_conditions"),  # Get from dict, can be None
        status=lesson_dict["status"],
        created_at=lesson_dict["created_at"],
        updated_at=lesson_dict["updated_at"]
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
    
    # Convert Lesson object to dict for lesson_to_response
    lesson_dict = {
        "id": str(lesson.id),
        "course_id": str(lesson.course_id),
        "chapter_id": str(lesson.chapter_id),
        "title": lesson.title,
        "description": lesson.description or "",
        "order": lesson.order,
        "video": lesson.video.dict() if lesson.video else None,
        "content": lesson.content,
        "resources": lesson.resources or [],
        "unlock_conditions": lesson.unlock_conditions.dict() if lesson.unlock_conditions else {},
        "status": lesson.status,
        "created_at": lesson.created_at,
        "updated_at": lesson.updated_at
    }
    
    return StandardResponse(
        success=True,
        data=lesson_to_response(lesson_dict),
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
        user_id=str(current_user.id) if current_user else None,
        user_role=current_user.role if current_user else None
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
    
    # 🔧 AUTO-CASCADE: Update parent course timestamp when lesson is updated
    try:
        await CourseService.update_course_timestamp(str(lesson.course_id))
    except Exception as e:
        # Log error but don't fail the lesson update
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to update course timestamp for course {lesson.course_id}: {e}")
    
    # Convert Lesson object to dict for lesson_to_response (same pattern as CREATE)
    lesson_dict = {
        "id": str(lesson.id),
        "course_id": str(lesson.course_id),
        "chapter_id": str(lesson.chapter_id),
        "title": lesson.title,
        "description": lesson.description or "",
        "order": lesson.order,
        "video": lesson.video.dict() if lesson.video else None,
        "content": lesson.content,
        "resources": lesson.resources or [],
        "unlock_conditions": lesson.unlock_conditions.dict() if lesson.unlock_conditions else {},
        "status": lesson.status,
        "created_at": lesson.created_at,
        "updated_at": lesson.updated_at
    }
    
    return StandardResponse(
        success=True,
        data=lesson_to_response(lesson_dict),
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


@router.post("/lessons/{lesson_id}/resources/upload", response_model=StandardResponse[dict])
async def upload_lesson_resource(
    lesson_id: str,
    file: UploadFile = File(...),
    title: Optional[str] = None,
    description: Optional[str] = None,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[dict]:
    """
    Upload a file resource for a lesson.
    
    Requires authentication and appropriate permissions:
    - Content creators can upload resources to their own lessons
    - Admins can upload resources to any lesson
    
    File naming convention: ait-{sanitized-name}.{ext}
    """
    # Check user permissions
    if current_user.role not in ["creator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only content creators and admins can upload resources"
        )
    
    # Get lesson to verify ownership (if creator) or existence
    lesson = await lesson_service.get_lesson_by_id(lesson_id)
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Check lesson ownership for creators (admins can access all lessons)
    if current_user.role == "creator":
        # Get course to check ownership
        course_service = CourseService()
        course = await course_service.get_course_by_id(str(lesson.course_id))
        if not course or str(course.creator_id) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only upload resources to your own lessons"
            )
    
    try:
        # Get file upload service
        upload_service = get_file_upload_service()
        
        # Upload file with ait- prefix naming
        upload_result = await upload_service.upload_file(
            file=file,
            context="lesson-resources",
            custom_filename=file.filename
        )
        
        # Generate display title
        if title:
            display_title = sanitize_resource_title(title)
        else:
            display_title = get_display_title_from_filename(upload_result["filename"])
        
        # Sanitize description
        clean_description = description.strip() if description else None
        
        # Create resource object
        new_resource = {
            "title": display_title,
            "type": "pdf" if upload_result["filename"].endswith(('.pdf',)) else
                   "doc" if upload_result["filename"].endswith(('.doc', '.docx')) else
                   "zip" if upload_result["filename"].endswith(('.zip', '.rar')) else
                   "link",  # Default fallback
            "url": upload_result["url"],
            "description": clean_description,
            "size": upload_result["size"]
        }
        
        # Add resource to lesson
        updated_lesson = await lesson_service.add_resource_to_lesson(
            lesson_id=lesson_id,
            resource=new_resource,
            user_id=str(current_user.id)
        )
        
        return StandardResponse(
            success=True,
            data={
                "resource": new_resource,
                "upload_info": {
                    "filename": upload_result["filename"],
                    "original_filename": upload_result["original_filename"],
                    "size": upload_result["size"],
                    "content_type": upload_result["content_type"]
                },
                "total_resources": len(updated_lesson.resources) if updated_lesson.resources else 1
            },
            message=f"Resource '{display_title}' uploaded successfully"
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload resource: {str(e)}"
        )


@router.post("/lessons/{lesson_id}/resources/url", response_model=StandardResponse[dict])
async def add_lesson_url_resource(
    lesson_id: str,
    url: str = Body(..., embed=True),
    title: str = Body(..., embed=True),
    description: Optional[str] = Body(None, embed=True),
    current_user: User = Depends(get_current_user)
) -> StandardResponse[dict]:
    """
    Add a URL resource to a lesson.
    
    Requires authentication and appropriate permissions:
    - Content creators can add resources to their own lessons
    - Admins can add resources to any lesson
    
    URL validation: Format checking only (no accessibility verification)
    """
    # Check user permissions
    if current_user.role not in ["creator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only content creators and admins can add resources"
        )
    
    # Validate URL format
    is_valid_url, url_error = validate_url_format(url)
    if not is_valid_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=url_error
        )
    
    # Validate title
    if not title or not title.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resource title is required"
        )
    
    # Get lesson to verify ownership (if creator) or existence
    lesson = await lesson_service.get_lesson_by_id(lesson_id)
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Check lesson ownership for creators (admins can access all lessons)
    if current_user.role == "creator":
        # Get course to check ownership
        course_service = CourseService()
        course = await course_service.get_course_by_id(str(lesson.course_id))
        if not course or str(course.creator_id) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only add resources to your own lessons"
            )
    
    try:
        # Sanitize inputs
        clean_title = sanitize_resource_title(title)
        clean_description = description.strip() if description else None
        clean_url = url.strip()
        
        # Create resource object
        new_resource = {
            "title": clean_title,
            "type": "link",
            "url": clean_url,
            "description": clean_description,
            "size": None  # URLs don't have file size
        }
        
        # Add resource to lesson
        updated_lesson = await lesson_service.add_resource_to_lesson(
            lesson_id=lesson_id,
            resource=new_resource,
            user_id=str(current_user.id)
        )
        
        return StandardResponse(
            success=True,
            data={
                "resource": new_resource,
                "total_resources": len(updated_lesson.resources) if updated_lesson.resources else 1
            },
            message=f"URL resource '{clean_title}' added successfully"
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add URL resource: {str(e)}"
        )


@router.delete("/lessons/{lesson_id}/resources/{resource_index}", response_model=StandardResponse[dict])
async def delete_lesson_resource(
    lesson_id: str,
    resource_index: int,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[dict]:
    """
    Delete a resource from a lesson by index.
    
    Requires authentication and appropriate permissions:
    - Content creators can delete resources from their own lessons
    - Admins can delete resources from any lesson
    """
    # Check user permissions
    if current_user.role not in ["creator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only content creators and admins can delete resources"
        )
    
    # Get lesson to verify ownership (if creator) or existence
    lesson = await lesson_service.get_lesson_by_id(lesson_id)
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Check lesson ownership for creators (admins can access all lessons)
    if current_user.role == "creator":
        # Get course to check ownership
        course_service = CourseService()
        course = await course_service.get_course_by_id(str(lesson.course_id))
        if not course or str(course.creator_id) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete resources from your own lessons"
            )
    
    try:
        # Remove resource from lesson
        updated_lesson = await lesson_service.remove_resource_from_lesson(
            lesson_id=lesson_id,
            resource_index=resource_index,
            user_id=str(current_user.id)
        )
        
        return StandardResponse(
            success=True,
            data={
                "total_resources": len(updated_lesson.resources) if updated_lesson.resources else 0
            },
            message="Resource deleted successfully"
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete resource: {str(e)}"
        )


@router.get("/lessons/{lesson_id}/upload-constraints", response_model=StandardResponse[dict])
async def get_upload_constraints(
    lesson_id: str,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[dict]:
    """
    Get file upload constraints for the frontend.
    
    Returns maximum file size, allowed extensions, etc.
    Useful for frontend validation before upload.
    """
    # Basic permission check
    if current_user.role not in ["creator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only content creators and admins can upload resources"
        )
    
    # Get upload service constraints
    upload_service = get_file_upload_service()
    constraints = upload_service.get_upload_constraints()
    
    return StandardResponse(
        success=True,
        data=constraints,
        message="Upload constraints retrieved successfully"
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


@router.post("/lessons/{lesson_id}/validate-status", response_model=StandardResponse[dict])
async def validate_lesson_status_change(
    lesson_id: str,
    new_status: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user)
) -> StandardResponse[dict]:
    """
    Validate if lesson status can be changed.
    
    Returns validation information including warnings and suggested actions.
    """
    if current_user.role not in ["creator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only content creators can validate lesson status"
        )
    
    validation_result = await lesson_service.validate_lesson_status_change(
        lesson_id=lesson_id,
        new_status=new_status
    )
    
    return StandardResponse(
        success=True,
        data=validation_result,
        message="Lesson status validation completed"
    )