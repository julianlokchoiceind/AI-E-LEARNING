"""
Course Review and Rating model
"""
from datetime import datetime
from typing import List, Optional
from enum import Enum
from beanie import Document, Indexed, Link
from pydantic import Field, validator

from app.models.user import User
from app.models.course import Course


class ReviewStatus(str, Enum):
    """Review status"""
    PENDING = "pending"      # Awaiting moderation
    APPROVED = "approved"    # Published and visible
    REJECTED = "rejected"    # Rejected by admin
    FLAGGED = "flagged"      # Flagged for review


class Review(Document):
    """Course review and rating model"""
    # References
    course_id: str = Field(..., description="Course being reviewed")
    user_id: str = Field(..., description="User who wrote the review")
    enrollment_id: Optional[str] = Field(None, description="Related enrollment")
    
    # User info (denormalized for performance)
    user_name: str = Field(..., description="Reviewer name")
    user_avatar: Optional[str] = Field(None, description="Reviewer avatar URL")
    is_verified_purchase: bool = Field(default=False, description="User completed the course")
    
    # Rating (1-5 stars)
    rating: int = Field(..., ge=1, le=5, description="Star rating")
    
    # Review content
    title: Optional[str] = Field(None, max_length=200, description="Review title")
    comment: str = Field(..., min_length=10, max_length=2000, description="Review text")
    
    # Sub-ratings (optional detailed ratings)
    content_quality: Optional[int] = Field(None, ge=1, le=5)
    creator_quality: Optional[int] = Field(None, ge=1, le=5)
    value_for_money: Optional[int] = Field(None, ge=1, le=5)
    course_structure: Optional[int] = Field(None, ge=1, le=5)
    
    # Moderation
    status: ReviewStatus = Field(default=ReviewStatus.PENDING)
    moderation_note: Optional[str] = Field(None, description="Admin notes")
    moderated_by: Optional[str] = Field(None, description="Admin who moderated")
    moderated_at: Optional[datetime] = None
    
    # Engagement metrics
    helpful_count: int = Field(default=0, ge=0, description="Users who found helpful")
    unhelpful_count: int = Field(default=0, ge=0, description="Users who found unhelpful")
    report_count: int = Field(default=0, ge=0, description="Number of reports")
    
    # Response from creator
    creator_response: Optional[str] = Field(None, max_length=1000)
    creator_response_at: Optional[datetime] = None
    
    # Edit history
    is_edited: bool = Field(default=False)
    edited_at: Optional[datetime] = None
    edit_reason: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "reviews"
        indexes = [
            "course_id",
            "user_id",
            "status",
            "rating",
            [("course_id", 1), ("status", 1), ("created_at", -1)],
            [("course_id", 1), ("rating", -1)],
            "created_at"
        ]

    @validator('comment')
    def validate_comment(cls, v):
        """Validate comment content"""
        if len(v.strip()) < 10:
            raise ValueError("Review comment must be at least 10 characters")
        return v.strip()

    def update_timestamps(self):
        """Update the updated_at timestamp"""
        self.updated_at = datetime.utcnow()


class ReviewVote(Document):
    """Track user votes on review helpfulness"""
    review_id: str = Field(..., description="Review being voted on")
    user_id: str = Field(..., description="User who voted")
    is_helpful: bool = Field(..., description="True if helpful, False if not")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "review_votes"
        indexes = [
            [("review_id", 1), ("user_id", 1)],
            "user_id"
        ]


class ReviewReport(Document):
    """Track review reports for moderation"""
    review_id: str = Field(..., description="Review being reported")
    reported_by: str = Field(..., description="User who reported")
    reason: str = Field(..., description="Report reason")
    details: Optional[str] = Field(None, max_length=500)
    status: str = Field(default="pending", description="pending/reviewed/resolved")
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolution_note: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "review_reports"
        indexes = [
            "review_id",
            "reported_by",
            "status",
            "created_at"
        ]