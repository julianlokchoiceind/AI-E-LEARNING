from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    STUDENT = "student"
    CREATOR = "creator"
    ADMIN = "admin"

class SubscriptionType(str, Enum):
    FREE = "free"
    PRO = "pro"

class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    CANCELLED = "cancelled"
    PAST_DUE = "past_due"

# Profile sub-schemas
class UserProfile(BaseModel):
    avatar: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    facebook: Optional[str] = None
    website: Optional[str] = None
    title: Optional[str] = None
    skills: List[str] = []
    learning_goals: List[str] = []

class UserPreferences(BaseModel):
    language: str = "vi"
    timezone: str = "Asia/Ho_Chi_Minh"
    email_notifications: bool = True
    push_notifications: bool = True
    marketing_emails: bool = False

class UserStats(BaseModel):
    courses_enrolled: int = 0
    courses_completed: int = 0
    total_hours_learned: float = 0
    certificates_earned: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    last_active: Optional[datetime] = None

class Subscription(BaseModel):
    type: SubscriptionType = SubscriptionType.FREE
    status: SubscriptionStatus = SubscriptionStatus.INACTIVE
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False

# Request/Response schemas
class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    profile: Optional[UserProfile] = None
    preferences: Optional[UserPreferences] = None

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: UserRole
    premium_status: bool = False
    is_verified: bool
    profile: UserProfile
    stats: UserStats
    preferences: UserPreferences
    subscription: Subscription
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None

class UserProfileResponse(BaseModel):
    success: bool
    data: UserResponse
    message: str

# Dashboard specific schemas
class DashboardStats(BaseModel):
    total_courses: int
    completed_courses: int
    in_progress_courses: int
    total_hours_learned: float
    current_streak: int
    longest_streak: int

class RecentCourse(BaseModel):
    id: str
    title: str
    thumbnail: Optional[str] = None
    progress: float
    last_accessed: Optional[datetime] = None
    last_accessed_display: Optional[str] = None
    continue_lesson_id: Optional[str] = None

class UpcomingLesson(BaseModel):
    course_id: str
    course_title: str
    lesson_id: Optional[str] = None
    lesson_title: str
    chapter_title: Optional[str] = None
    estimated_time: Optional[int] = None  # in minutes, None if not available
    lesson_order: int = 0

class DashboardUser(BaseModel):
    id: str
    name: str
    email: EmailStr
    avatar: Optional[str] = None
    role: UserRole
    premium_status: bool

class DashboardData(BaseModel):
    user: DashboardUser
    stats: DashboardStats
    recent_courses: List[RecentCourse]
    upcoming_lessons: List[UpcomingLesson]
    certificates_earned: int

class UserDashboardResponse(BaseModel):
    success: bool
    data: DashboardData
    message: str

# For listing users (admin)
class UserListResponse(BaseModel):
    success: bool
    data: List[UserResponse]
    message: str
    total: int
    page: int
    limit: int