"""
FAQ Category schemas for API requests and responses.
Following the Course schema pattern from CLAUDE.md specifications.
NO enum imports to prevent backend crashes.
"""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, validator


class FAQCategoryCreate(BaseModel):
    """Schema for creating a new FAQ category"""
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    order: int = Field(default=0, ge=0)
    is_active: bool = Field(default=True)
    
    @validator('slug')
    def validate_slug(cls, v):
        """Ensure slug is URL-friendly"""
        import re
        if not re.match(r'^[a-z0-9-]+$', v):
            raise ValueError('Slug must contain only lowercase letters, numbers and hyphens')
        return v
    
    @validator('name')
    def validate_name(cls, v):
        """Ensure name is not empty"""
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()


class FAQCategoryUpdate(BaseModel):
    """Schema for updating FAQ category - all fields optional"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    slug: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    order: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None
    
    @validator('slug')
    def validate_slug(cls, v):
        """Ensure slug is URL-friendly"""
        if v is None:
            return v
        import re
        if not re.match(r'^[a-z0-9-]+$', v):
            raise ValueError('Slug must contain only lowercase letters, numbers and hyphens')
        return v
    
    @validator('name')
    def validate_name(cls, v):
        """Ensure name is not empty"""
        if v is None:
            return v
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()


class FAQCategoryResponse(BaseModel):
    """Complete FAQ category response schema"""
    id: str
    name: str
    slug: str
    description: Optional[str]
    order: int
    is_active: bool
    faq_count: int = 0  # Number of FAQs in this category
    total_views: int = 0  # Total views across all FAQs
    created_at: datetime
    updated_at: datetime


class FAQCategoryListResponse(BaseModel):
    """Response schema for listing FAQ categories"""
    categories: List[FAQCategoryResponse]
    total: int
    active_count: int = 0
    inactive_count: int = 0


class FAQCategoryWithFAQsResponse(BaseModel):
    """Response schema for category with its FAQs"""
    id: str
    name: str
    slug: str
    description: Optional[str]
    order: int
    is_active: bool
    faq_count: int
    faqs: List[dict] = []  # Will contain FAQ data
    created_at: datetime
    updated_at: datetime


class StandardResponse(BaseModel):
    """Standard API response format"""
    success: bool
    data: Optional[dict] = None
    message: str
    errors: Optional[List[str]] = None