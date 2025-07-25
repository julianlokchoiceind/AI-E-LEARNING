"""
Course schemas for API requests and responses.
Based on CLAUDE.md specifications.
"""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from beanie import PydanticObjectId
from app.models.course import CourseCategory, CourseLevel, CourseStatus, Pricing


class CourseCreate(BaseModel):
    """Schema for creating a new course - minimal fields required"""
    # Temporary title will be generated automatically
    # All other fields are optional for quick creation
    pass


class CourseUpdate(BaseModel):
    """Schema for updating course details"""
    title: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    category: Optional[CourseCategory] = None
    level: Optional[CourseLevel] = None
    language: Optional[str] = None
    thumbnail: Optional[str] = None
    preview_video: Optional[str] = None
    syllabus: Optional[List[str]] = None
    prerequisites: Optional[List[str]] = None
    target_audience: Optional[List[str]] = None
    # Pricing update (admin/creator only)
    pricing: Optional[Pricing] = None
    # Admin only fields
    status: Optional[CourseStatus] = None


class PricingResponse(BaseModel):
    """Pricing information in response"""
    is_free: bool
    price: float
    currency: str
    discount_price: Optional[float] = None
    discount_expires: Optional[datetime] = None


class CourseStatsResponse(BaseModel):
    """Course statistics in response"""
    total_enrollments: int
    active_students: int
    completion_rate: float
    average_rating: float
    total_reviews: int
    total_revenue: float


class CourseResponse(BaseModel):
    """Complete course response schema"""
    id: str
    title: str
    description: str
    short_description: Optional[str]
    slug: str
    category: CourseCategory
    level: CourseLevel
    language: str
    creator_id: str
    creator_name: Optional[str]
    thumbnail: Optional[str]
    preview_video: Optional[str]
    syllabus: List[str]
    prerequisites: List[str]
    target_audience: List[str]
    pricing: PricingResponse
    total_chapters: int
    total_lessons: int
    total_duration: int
    status: CourseStatus
    published_at: Optional[datetime]
    stats: CourseStatsResponse
    created_at: datetime
    updated_at: datetime
    
    # Additional fields based on user access
    is_enrolled: Optional[bool] = False
    has_access: Optional[bool] = False
    progress_percentage: Optional[float] = 0
    continue_lesson_id: Optional[str] = None
    
    class Config:
        populate_by_name = True


class CourseListResponse(BaseModel):
    """Course list response with pagination"""
    courses: List[CourseResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class CourseCreateResponse(BaseModel):
    """Response after creating a course"""
    id: str  # Remove alias since service returns 'id' directly
    redirect_url: str
    message: str
    
    class Config:
        json_encoders = {
            PydanticObjectId: str
        }