"""
Course management endpoints.
Based on CLAUDE.md course workflows.
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
import logging
from app.core.deps import get_current_user, get_current_user_optional
from app.models.user import User
from app.models.course import CourseCategory, CourseLevel, CourseStatus
from app.schemas.course import (
    CourseCreate,
    CourseUpdate,
    CourseResponse,
    CourseListResponse,
    CourseCreateResponse
)
from app.services.course_service import CourseService
from app.core.exceptions import NotFoundException, ForbiddenException, BadRequestException


router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("", response_model=CourseCreateResponse, status_code=201)
async def create_course(
    current_user: User = Depends(get_current_user)
):
    """
    Create a new course with auto-generated title.
    
    Course Creation Workflow:
    1. Course is created with temporary name: "Untitled Course #1 (250125)"
    2. Auto-redirect to /courses/:id/edit
    3. Course editor displays with inline name editing
    
    Only content creators and admins can create courses.
    """
    try:
        result = await CourseService.create_course(current_user)
        return result
    except ForbiddenException as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create course")


@router.get("", response_model=CourseListResponse)
async def list_courses(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    category: Optional[CourseCategory] = None,
    level: Optional[CourseLevel] = None,
    search: Optional[str] = None,
    is_free: Optional[bool] = None,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    List courses with filters and pagination.
    
    Query parameters:
    - page: Page number (default: 1)
    - per_page: Items per page (default: 20, max: 100)
    - category: Filter by category (programming, ai-fundamentals, etc.)
    - level: Filter by level (beginner, intermediate, advanced)
    - search: Search in title and description
    - is_free: Filter free/paid courses
    
    Only published courses are shown by default.
    """
    try:
        # Only show unpublished courses to their creators or admins
        status = CourseStatus.PUBLISHED
        creator_id = None
        
        if current_user:
            if current_user.role == "admin":
                # Admin can see all courses, pass status as None to see all
                status = None
            elif current_user.role == "creator":
                # Creators can see their own unpublished courses
                creator_id = str(current_user.id)
                status = None
        
        result = await CourseService.list_courses(
            page=page,
            per_page=per_page,
            category=category,
            level=level,
            search=search,
            status=status,
            creator_id=creator_id,
            is_free=is_free
        )
        
        # Convert courses to response format with access info
        courses_with_access = []
        for course in result["courses"]:
            course_dict = course.dict()
            
            # Convert ObjectId fields to strings
            course_dict["id"] = str(course_dict.get("id", ""))
            course_dict["creator_id"] = str(course_dict.get("creator_id", ""))
            
            # Check access for each course
            access_info = await CourseService.check_course_access(course, current_user)
            course_dict.update(access_info)
            
            courses_with_access.append(CourseResponse(**course_dict))
        
        return CourseListResponse(
            courses=courses_with_access,
            total=result["total"],
            page=result["page"],
            per_page=result["per_page"],
            total_pages=result["total_pages"]
        )
    except Exception as e:
        logger.error(f"Error listing courses: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to list courses")


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Get course details by ID.
    
    Returns course information with access status based on:
    1. Free course → Access for everyone
    2. Premium user → Access to all courses
    3. Pro subscription → Full access
    4. Purchased course → Access granted
    5. None of above → No access
    """
    try:
        # Get course
        course = await CourseService.get_course(course_id, current_user)
        
        # Convert to dict for response
        course_dict = course.dict()
        
        # Convert ObjectId fields to strings
        course_dict["id"] = str(course_dict.get("id", ""))
        course_dict["creator_id"] = str(course_dict.get("creator_id", ""))
        
        # Check access
        access_info = await CourseService.check_course_access(course, current_user)
        course_dict.update(access_info)
        
        # TODO: Add progress percentage when Progress model is implemented
        course_dict["progress_percentage"] = 0
        
        return CourseResponse(**course_dict)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get course")


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: str,
    course_update: CourseUpdate,
    current_user: User = Depends(get_current_user)
):
    """
    Update course details.
    
    Only course creator or admin can update.
    Supports partial updates.
    """
    try:
        # Update course
        course = await CourseService.update_course(course_id, course_update, current_user)
        
        # Convert to response format
        course_dict = course.dict()
        access_info = await CourseService.check_course_access(course, current_user)
        course_dict.update(access_info)
        
        return CourseResponse(**course_dict)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ForbiddenException as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update course")


@router.delete("/{course_id}")
async def delete_course(
    course_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete (archive) a course.
    
    Only course creator or admin can delete.
    Courses are soft-deleted by setting status to 'archived'.
    """
    try:
        result = await CourseService.delete_course(course_id, current_user)
        return result
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ForbiddenException as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to delete course")