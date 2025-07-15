"""
Admin-related schemas.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from app.models.course import CourseStatus


class CourseApprovalRequest(BaseModel):
    """Schema for course approval/rejection request."""
    feedback: Optional[str] = None
    notes: Optional[str] = None


class CourseApprovalResponse(BaseModel):
    """Schema for course approval response."""
    success: bool
    message: str
    course_id: str
    status: CourseStatus
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    feedback: Optional[str] = None


class AdminDashboardStats(BaseModel):
    """Admin dashboard statistics."""
    # User stats
    total_users: int
    total_students: int
    total_creators: int
    total_admins: int
    new_users_today: int
    new_users_this_week: int
    
    # Course stats
    total_courses: int
    published_courses: int
    draft_courses: int
    pending_review_courses: int
    archived_courses: int
    
    # Enrollment stats
    total_enrollments: int
    active_enrollments: int
    completed_courses: int
    
    # Revenue stats
    total_revenue: float
    revenue_this_month: float
    revenue_today: float
    average_course_price: float
    
    # Activity stats
    active_users_today: int
    active_users_this_week: int
    lessons_completed_today: int
    
    # Recent activity
    recent_registrations: List[Dict[str, Any]]
    recent_course_submissions: List[Dict[str, Any]]
    recent_enrollments: List[Dict[str, Any]]


class PendingReviewResponse(BaseModel):
    """Course pending review response."""
    id: str
    title: str
    description: str
    creator_id: str
    creator_name: str
    created_at: datetime
    submitted_for_review_at: datetime
    category: str
    level: str
    total_chapters: int
    total_lessons: int
    total_duration: int
    pricing: Dict[str, Any]
    preview_url: Optional[str] = None


class CreatorStats(BaseModel):
    """Content creator statistics."""
    user_id: str
    name: str
    email: str
    total_courses: int
    published_courses: int
    total_students: int
    total_revenue: float
    average_rating: float
    created_at: datetime
    last_active: Optional[datetime] = None


class BulkApprovalResult(BaseModel):
    """Result of bulk course approval."""
    total_processed: int
    approved: List[str]
    failed: List[Dict[str, str]]  # course_id: error_message
    message: str


class AdminCoursesQuery(BaseModel):
    """Query parameters for admin courses list with pagination."""
    search: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    page: int = 1
    per_page: int = 20


class CourseStatistics(BaseModel):
    """Course statistics for dashboard Quick Stats."""
    total_courses: int
    pending_review: int
    published: int
    rejected: int
    free_courses: int