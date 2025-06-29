"""
Review schemas for request/response validation
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator

from app.models.review import ReviewStatus
from app.schemas.base import StandardResponse


# Request schemas
class ReviewCreateRequest(BaseModel):
    """Request schema for creating a review"""
    rating: int = Field(..., ge=1, le=5, description="Overall rating")
    title: Optional[str] = Field(None, max_length=200)
    comment: str = Field(..., min_length=10, max_length=2000)
    content_quality: Optional[int] = Field(None, ge=1, le=5)
    instructor_quality: Optional[int] = Field(None, ge=1, le=5)
    value_for_money: Optional[int] = Field(None, ge=1, le=5)
    course_structure: Optional[int] = Field(None, ge=1, le=5)

    @validator('comment')
    def validate_comment(cls, v):
        if len(v.strip()) < 10:
            raise ValueError("Review must be at least 10 characters")
        return v.strip()


class ReviewUpdateRequest(BaseModel):
    """Request schema for updating a review"""
    rating: Optional[int] = Field(None, ge=1, le=5)
    title: Optional[str] = Field(None, max_length=200)
    comment: Optional[str] = Field(None, min_length=10, max_length=2000)
    content_quality: Optional[int] = Field(None, ge=1, le=5)
    instructor_quality: Optional[int] = Field(None, ge=1, le=5)
    value_for_money: Optional[int] = Field(None, ge=1, le=5)
    course_structure: Optional[int] = Field(None, ge=1, le=5)
    edit_reason: Optional[str] = Field(None, max_length=200)


class ReviewVoteRequest(BaseModel):
    """Request schema for voting on review helpfulness"""
    is_helpful: bool


class ReviewReportRequest(BaseModel):
    """Request schema for reporting a review"""
    reason: str = Field(..., min_length=3, max_length=100)
    details: Optional[str] = Field(None, max_length=500)


class InstructorResponseRequest(BaseModel):
    """Request schema for instructor response to review"""
    response: str = Field(..., min_length=10, max_length=1000)


class ReviewModerationRequest(BaseModel):
    """Request schema for moderating reviews (admin)"""
    status: ReviewStatus
    moderation_note: Optional[str] = Field(None, max_length=500)


class ReviewSearchQuery(BaseModel):
    """Query parameters for searching reviews"""
    course_id: Optional[str] = None
    user_id: Optional[str] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    status: Optional[ReviewStatus] = None
    is_verified_purchase: Optional[bool] = None
    sort_by: str = Field("created_at", pattern="^(created_at|rating|helpful_count)$")
    sort_order: str = Field("desc", pattern="^(asc|desc)$")
    page: int = Field(1, ge=1)
    per_page: int = Field(20, ge=1, le=100)


# Response schemas
class ReviewUser(BaseModel):
    """User info in review response"""
    id: str
    name: str
    avatar: Optional[str]
    is_verified_purchase: bool


class Review(BaseModel):
    """Response schema for review"""
    id: str = Field(..., alias="_id")
    course_id: str
    user: ReviewUser
    rating: int
    title: Optional[str]
    comment: str
    content_quality: Optional[int]
    instructor_quality: Optional[int]
    value_for_money: Optional[int]
    course_structure: Optional[int]
    status: ReviewStatus
    helpful_count: int
    unhelpful_count: int
    instructor_response: Optional[str]
    instructor_response_at: Optional[datetime]
    is_edited: bool
    edited_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    user_vote: Optional[bool] = None  # Current user's vote

    class Config:
        populate_by_name = True


class ReviewStats(BaseModel):
    """Course review statistics"""
    total_reviews: int
    average_rating: float
    rating_distribution: Dict[str, int]  # {"5": 10, "4": 5, ...}
    verified_purchase_count: int
    
    # Average sub-ratings
    avg_content_quality: Optional[float]
    avg_instructor_quality: Optional[float]
    avg_value_for_money: Optional[float]
    avg_course_structure: Optional[float]
    
    # Recent reviews sample
    recent_reviews: List[Review]


class ReviewListResponse(BaseModel):
    """Response for paginated review list"""
    items: List[Review]
    total: int
    page: int
    per_page: int
    total_pages: int
    stats: Optional[ReviewStats] = None


class CourseRatingSummary(BaseModel):
    """Brief rating summary for course cards"""
    average_rating: float
    total_reviews: int
    rating_distribution: Dict[str, int]


# Standard responses
ReviewStandardResponse = StandardResponse[Review]
ReviewListStandardResponse = StandardResponse[ReviewListResponse]
ReviewStatsStandardResponse = StandardResponse[ReviewStats]
CourseRatingSummaryStandardResponse = StandardResponse[CourseRatingSummary]