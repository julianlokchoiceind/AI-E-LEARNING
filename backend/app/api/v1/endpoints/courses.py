"""
Course management endpoints.
Based on CLAUDE.md course workflows.
"""
from typing import Optional
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, Query, HTTPException, status
import logging
from app.core.deps import get_current_user, get_current_user_optional
from app.core.database import db
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
from app.services.analytics_service import AnalyticsService
from app.core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from app.schemas.analytics import CreatorAnalytics, CourseAnalytics
from app.schemas.base import StandardResponse


router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("", response_model=StandardResponse[CourseCreateResponse], status_code=201)
async def create_course(
    current_user: User = Depends(get_current_user)
) -> StandardResponse[CourseCreateResponse]:
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
        return StandardResponse(
            success=True,
            data=result,
            message="Course created successfully. Redirecting to editor..."
        )
    except ForbiddenException as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create course")


@router.get("", response_model=StandardResponse[CourseListResponse])
async def list_courses(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    category: Optional[CourseCategory] = None,
    level: Optional[CourseLevel] = None,
    search: Optional[str] = None,
    is_free: Optional[bool] = None,
    current_user: Optional[User] = Depends(get_current_user_optional)
) -> StandardResponse[CourseListResponse]:
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
        
        return StandardResponse(
            success=True,
            data=CourseListResponse(
                courses=courses_with_access,
                total=result["total"],
                page=result["page"],
                per_page=result["per_page"],
                total_pages=result["total_pages"]
            ),
            message="Courses retrieved successfully"
        )
    except Exception as e:
        logger.error(f"Error listing courses: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to list courses")


@router.get("/{course_id}", response_model=StandardResponse[CourseResponse])
async def get_course(
    course_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional)
) -> StandardResponse[CourseResponse]:
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
        
        return StandardResponse(
            success=True,
            data=CourseResponse(**course_dict),
            message="Course details retrieved successfully"
        )
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get course")


@router.put("/{course_id}", response_model=StandardResponse[CourseResponse])
async def update_course(
    course_id: str,
    course_update: CourseUpdate,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[CourseResponse]:
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
        
        return StandardResponse(
            success=True,
            data=CourseResponse(**course_dict),
            message="Course updated successfully"
        )
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ForbiddenException as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update course")


@router.delete("/{course_id}", response_model=StandardResponse[dict])
async def delete_course(
    course_id: str,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[dict]:
    """
    Delete (archive) a course.
    
    Only course creator or admin can delete.
    Courses are soft-deleted by setting status to 'archived'.
    """
    try:
        result = await CourseService.delete_course(course_id, current_user)
        return StandardResponse(
            success=True,
            data=result,
            message="Course deleted successfully"
        )
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ForbiddenException as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to delete course")


@router.post("/{course_id}/submit-for-review", response_model=StandardResponse[dict])
async def submit_course_for_review(
    course_id: str,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[dict]:
    """
    Submit course for admin review before publishing.
    
    Course must be:
    - In draft status
    - Have at least one chapter with lessons
    - Have required fields filled
    
    Only course creator can submit.
    """
    try:
        # Check permissions
        course = await CourseService.get_course(course_id, current_user)
        
        if str(course.creator_id) != str(current_user.id) and current_user.role != "admin":
            raise ForbiddenException("Only the course creator can submit for review")
        
        # Validate course is ready
        if course.status != CourseStatus.DRAFT:
            return StandardResponse(
                success=False,
                data=None,
                message=f"Course must be in draft status to submit for review. Current status: {course.status}"
            )
        
        # Check if course has content
        chapters_count = await db.chapters.count_documents({"course_id": ObjectId(course_id)})
        if chapters_count == 0:
            return StandardResponse(
                success=False,
                data=None,
                message="Course must have at least one chapter before submitting for review"
            )
        
        # Check if chapters have lessons
        lessons_count = await db.lessons.count_documents({"course_id": ObjectId(course_id)})
        if lessons_count == 0:
            return StandardResponse(
                success=False,
                data=None,
                message="Course must have at least one lesson before submitting for review"
            )
        
        # Update status to review
        result = await CourseService.update_course(
            course_id,
            CourseUpdate(status=CourseStatus.REVIEW),
            current_user
        )
        
        # TODO: Send notification to admins about new course for review
        
        return StandardResponse(
            success=True,
            data={
                "course_id": course_id,
                "status": CourseStatus.REVIEW
            },
            message="Course submitted for review successfully"
        )
        
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ForbiddenException as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Error submitting course for review: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit course for review")


@router.post("/{course_id}/publish", response_model=StandardResponse[dict])
async def publish_course(
    course_id: str,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[dict]:
    """
    Directly publish a course (admin only).
    
    Skips the review process.
    """
    try:
        if current_user.role != "admin":
            raise ForbiddenException("Only admins can directly publish courses")
        
        # Update status to published
        result = await CourseService.update_course(
            course_id,
            CourseUpdate(
                status=CourseStatus.PUBLISHED,
                published_at=datetime.now(timezone.utc)
            ),
            current_user
        )
        
        return StandardResponse(
            success=True,
            data={
                "course_id": course_id,
                "status": CourseStatus.PUBLISHED
            },
            message="Course published successfully"
        )
        
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ForbiddenException as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Error publishing course: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to publish course")


@router.get("/creator/analytics", response_model=StandardResponse[CreatorAnalytics])
async def get_creator_analytics(
    time_range: str = Query("30days", regex="^(7days|30days|90days|all)$"),
    current_user: User = Depends(get_current_user)
) -> StandardResponse[CreatorAnalytics]:
    """
    Get analytics for content creator.
    
    Time ranges:
    - 7days: Last 7 days
    - 30days: Last 30 days (default)
    - 90days: Last 90 days
    - all: All time
    
    Only content creators and admins can access.
    """
    try:
        if current_user.role not in ["creator", "admin"]:
            raise ForbiddenException("Only creators can access analytics")
            
        analytics = await AnalyticsService.get_creator_analytics(
            creator_id=str(current_user.id),
            time_range=time_range
        )
        return StandardResponse(
            success=True,
            data=analytics,
            message="Creator analytics retrieved successfully"
        )
    except ForbiddenException as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching creator analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch analytics")


@router.get("/{course_id}/analytics", response_model=StandardResponse[CourseAnalytics])
async def get_course_analytics(
    course_id: str,
    time_range: str = Query("30days", regex="^(7days|30days|90days|all)$"),
    current_user: User = Depends(get_current_user)
) -> StandardResponse[CourseAnalytics]:
    """
    Get analytics for a specific course.
    
    Only course creator or admin can access.
    """
    try:
        # Verify course exists and user has permission
        course = await CourseService.get_course(course_id, current_user)
        
        # Check permission
        if current_user.role != "admin" and str(course.creator_id) != str(current_user.id):
            raise ForbiddenException("You don't have permission to view analytics for this course")
        
        analytics = await AnalyticsService.get_course_analytics(
            course_id=course_id,
            time_range=time_range
        )
        return StandardResponse(
            success=True,
            data=analytics,
            message="Course analytics retrieved successfully"
        )
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ForbiddenException as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching course analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch analytics")