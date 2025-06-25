"""
Admin endpoints for course approval and management.
Based on CLAUDE.md admin workflows.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.core.deps import get_current_admin
from app.models.user import User
from app.models.course import CourseStatus
from app.schemas.course import CourseResponse, CourseListResponse
from app.schemas.admin import (
    CourseApprovalRequest,
    CourseApprovalResponse,
    AdminDashboardStats,
    PendingReviewResponse
)
from app.services.course_service import CourseService
from app.services.admin_service import AdminService
from app.core.exceptions import NotFoundException, ForbiddenException
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/dashboard/stats", response_model=AdminDashboardStats)
async def get_admin_dashboard_stats(
    current_admin: User = Depends(get_current_admin)
):
    """
    Get admin dashboard statistics.
    
    Returns:
    - Total users, creators, courses
    - Pending reviews count
    - Platform revenue stats
    - Recent activity
    """
    try:
        stats = await AdminService.get_dashboard_stats()
        return stats
    except Exception as e:
        logger.error(f"Error fetching admin stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard stats")


@router.get("/courses/pending-review", response_model=List[PendingReviewResponse])
async def get_pending_review_courses(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_admin: User = Depends(get_current_admin)
):
    """
    Get courses pending review/approval.
    
    Returns courses with status='review' that need admin approval.
    """
    try:
        courses = await AdminService.get_pending_review_courses(page, per_page)
        return courses
    except Exception as e:
        logger.error(f"Error fetching pending courses: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch pending courses")


@router.post("/courses/{course_id}/approve", response_model=CourseApprovalResponse)
async def approve_course(
    course_id: str,
    current_admin: User = Depends(get_current_admin)
):
    """
    Approve a course for publication.
    
    Workflow:
    1. Verify course exists and is in 'review' status
    2. Check course content quality (manual review assumed)
    3. Set status to 'published'
    4. Send notification to creator
    5. Return approval status
    """
    try:
        result = await AdminService.approve_course(course_id, current_admin)
        return result
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error approving course: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to approve course")


@router.post("/courses/{course_id}/reject", response_model=CourseApprovalResponse)
async def reject_course(
    course_id: str,
    rejection: CourseApprovalRequest,
    current_admin: User = Depends(get_current_admin)
):
    """
    Reject a course with feedback.
    
    Workflow:
    1. Verify course exists and is in 'review' status
    2. Add rejection reason/feedback
    3. Set status back to 'draft'
    4. Send notification to creator with feedback
    5. Return rejection status
    """
    try:
        if not rejection.feedback:
            raise HTTPException(
                status_code=400, 
                detail="Feedback is required when rejecting a course"
            )
            
        result = await AdminService.reject_course(
            course_id, 
            rejection.feedback, 
            current_admin
        )
        return result
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error rejecting course: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to reject course")


@router.put("/courses/{course_id}/status")
async def update_course_status(
    course_id: str,
    status: CourseStatus,
    current_admin: User = Depends(get_current_admin)
):
    """
    Directly update course status.
    
    Admin can change course status to:
    - draft: Send back for editing
    - review: Mark for review
    - published: Make publicly available
    - archived: Hide from public view
    """
    try:
        result = await AdminService.update_course_status(course_id, status, current_admin)
        return result
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating course status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update course status")


@router.put("/courses/{course_id}/pricing")
async def update_course_pricing(
    course_id: str,
    is_free: bool,
    price: Optional[float] = None,
    current_admin: User = Depends(get_current_admin)
):
    """
    Update course pricing (admin override).
    
    Admin can:
    - Set any course as free
    - Override course pricing
    - Apply discounts
    """
    try:
        result = await AdminService.update_course_pricing(
            course_id, 
            is_free, 
            price, 
            current_admin
        )
        return result
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating course pricing: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update course pricing")


@router.get("/users/creators", response_model=List[dict])
async def list_content_creators(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_admin: User = Depends(get_current_admin)
):
    """
    List all content creators with their stats.
    
    Returns:
    - Creator info
    - Number of courses created
    - Total students enrolled
    - Revenue generated
    """
    try:
        creators = await AdminService.list_content_creators(page, per_page)
        return creators
    except Exception as e:
        logger.error(f"Error listing creators: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to list creators")


@router.post("/courses/bulk-approve")
async def bulk_approve_courses(
    course_ids: List[str],
    current_admin: User = Depends(get_current_admin)
):
    """
    Bulk approve multiple courses.
    
    Useful for approving multiple courses at once.
    """
    try:
        results = await AdminService.bulk_approve_courses(course_ids, current_admin)
        return results
    except Exception as e:
        logger.error(f"Error bulk approving courses: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to bulk approve courses")