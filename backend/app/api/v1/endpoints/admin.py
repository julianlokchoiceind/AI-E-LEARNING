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


# User Management Endpoints

@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    role: Optional[str] = Query(None, pattern="^(student|creator|admin)$"),
    premium_only: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    current_admin: User = Depends(get_current_admin)
):
    """
    Get user list with pagination.
    
    Workflow:
    1. Verify admin role
    2. Fetch user list with pagination
    3. Include role and premium status
    4. Apply search/filter parameters
    5. Return user management data
    """
    try:
        users = await AdminService.list_users(
            page=page,
            per_page=per_page,
            role=role,
            premium_only=premium_only,
            search=search
        )
        return users
    except Exception as e:
        logger.error(f"Error listing users: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to list users")


@router.put("/users/{user_id}/premium")
async def toggle_user_premium(
    user_id: str,
    is_premium: bool,
    current_admin: User = Depends(get_current_admin)
):
    """
    Toggle user premium status.
    
    Workflow:
    1. Verify admin permissions
    2. Toggle premium status
    3. Update database record
    4. Send notification to user
    5. Return updated status
    """
    try:
        result = await AdminService.update_user_premium_status(
            user_id=user_id,
            is_premium=is_premium,
            admin=current_admin
        )
        return result
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating premium status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update premium status")


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role: str = Query(..., pattern="^(student|creator|admin)$"),
    current_admin: User = Depends(get_current_admin)
):
    """
    Change user role.
    
    Workflow:
    1. Validate admin permissions
    2. Change user role (Student/Creator/Admin)
    3. Update permissions
    4. Log role change event
    5. Return success status
    """
    try:
        result = await AdminService.update_user_role(
            user_id=user_id,
            new_role=role,
            admin=current_admin
        )
        return result
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating user role: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update user role")


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_admin: User = Depends(get_current_admin)
):
    """
    Soft delete user account.
    
    Workflow:
    1. Verify admin permissions
    2. Soft delete user account
    3. Anonymize personal data
    4. Transfer course ownership if creator
    5. Return deletion confirmation
    """
    try:
        result = await AdminService.delete_user(
            user_id=user_id,
            admin=current_admin
        )
        return result
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting user: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete user")


@router.post("/users/bulk-action")
async def bulk_user_action(
    user_ids: List[str],
    action: str = Query(..., pattern="^(delete|update_role|toggle_premium)$"),
    data: Optional[dict] = None,
    current_admin: User = Depends(get_current_admin)
):
    """
    Perform bulk operations on users.
    
    Workflow:
    1. Verify admin permissions
    2. Validate bulk operation (delete, role change, premium toggle)
    3. Process users in batches
    4. Log all changes
    5. Return operation results
    """
    try:
        results = await AdminService.bulk_user_action(
            user_ids=user_ids,
            action=action,
            data=data,
            admin=current_admin
        )
        return results
    except Exception as e:
        logger.error(f"Error in bulk user action: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to perform bulk action")


# Payment Management Endpoints

@router.get("/payments")
async def list_payments(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    current_admin: User = Depends(get_current_admin)
):
    """
    Get payment transactions.
    
    Workflow:
    1. Verify admin role
    2. Fetch payment transactions
    3. Include refund requests and disputes
    4. Apply filters (status, amount, date range)
    5. Return payment management data
    """
    try:
        payments = await AdminService.list_payments(
            page=page,
            per_page=per_page,
            status=status,
            user_id=user_id,
            date_from=date_from,
            date_to=date_to
        )
        return payments
    except Exception as e:
        logger.error(f"Error listing payments: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to list payments")


@router.post("/payments/{payment_id}/refund")
async def refund_payment(
    payment_id: str,
    amount: Optional[float] = None,
    reason: str = Query(...),
    current_admin: User = Depends(get_current_admin)
):
    """
    Process payment refund.
    
    Workflow:
    1. Verify admin permissions
    2. Process refund through payment provider
    3. Update enrollment status
    4. Send refund confirmation
    5. Return refund status
    """
    try:
        result = await AdminService.refund_payment(
            payment_id=payment_id,
            amount=amount,
            reason=reason,
            admin=current_admin
        )
        return result
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error processing refund: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process refund")


# Analytics Endpoints

@router.get("/analytics/revenue")
async def get_revenue_analytics(
    period: str = Query("month", pattern="^(day|week|month|year)$"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    current_admin: User = Depends(get_current_admin)
):
    """
    Get revenue analytics.
    
    Workflow:
    1. Verify admin role
    2. Calculate revenue by period
    3. Include subscription vs one-time sales
    4. Creator revenue sharing data
    5. Return detailed revenue analytics
    """
    try:
        analytics = await AdminService.get_revenue_analytics(
            period=period,
            date_from=date_from,
            date_to=date_to
        )
        return analytics
    except Exception as e:
        logger.error(f"Error fetching revenue analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch revenue analytics")


@router.get("/analytics/users")
async def get_user_analytics(
    current_admin: User = Depends(get_current_admin)
):
    """
    Get user analytics.
    
    Workflow:
    1. Verify admin role
    2. User acquisition and retention metrics
    3. Role distribution and activity
    4. Geographic and demographic data
    5. Return user analytics
    """
    try:
        analytics = await AdminService.get_user_analytics()
        return analytics
    except Exception as e:
        logger.error(f"Error fetching user analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch user analytics")