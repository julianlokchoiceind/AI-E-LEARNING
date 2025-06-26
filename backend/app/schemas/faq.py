"""
FAQ schemas for API endpoints
"""
# Standard library imports
from datetime import datetime
from typing import List, Optional

# Third-party imports
from pydantic import BaseModel, Field, validator

# Local imports
from app.models.faq import FAQCategory
from app.schemas.base import PyObjectId, StandardResponse


class FAQBase(BaseModel):
    """Base FAQ schema"""
    question: str = Field(..., min_length=5, max_length=500)
    answer: str = Field(..., min_length=10, max_length=5000)
    category: FAQCategory = Field(default=FAQCategory.GENERAL)
    priority: int = Field(default=0, ge=0, le=100)
    tags: List[str] = Field(default_factory=list, max_items=10)
    related_faqs: List[str] = Field(default_factory=list, max_items=5)
    is_published: bool = Field(default=True)
    slug: Optional[str] = Field(None, regex="^[a-z0-9-]+$")
    
    @validator('tags')
    def validate_tags(cls, v):
        """Validate tags"""
        return [tag.lower().strip() for tag in v if tag.strip()]
    
    @validator('slug')
    def validate_slug(cls, v, values):
        """Generate slug if not provided"""
        if not v and 'question' in values:
            # Simple slug generation
            slug = values['question'].lower()
            slug = ''.join(c if c.isalnum() or c == ' ' else '' for c in slug)
            slug = '-'.join(slug.split())[:100]
            return slug
        return v


class FAQCreate(FAQBase):
    """Schema for creating FAQ"""
    pass


class FAQUpdate(BaseModel):
    """Schema for updating FAQ"""
    question: Optional[str] = Field(None, min_length=5, max_length=500)
    answer: Optional[str] = Field(None, min_length=10, max_length=5000)
    category: Optional[FAQCategory] = None
    priority: Optional[int] = Field(None, ge=0, le=100)
    tags: Optional[List[str]] = Field(None, max_items=10)
    related_faqs: Optional[List[str]] = Field(None, max_items=5)
    is_published: Optional[bool] = None
    slug: Optional[str] = Field(None, regex="^[a-z0-9-]+$")


class FAQResponse(FAQBase):
    """FAQ response schema"""
    id: PyObjectId = Field(alias="_id")
    view_count: int = 0
    helpful_votes: int = 0
    unhelpful_votes: int = 0
    created_at: datetime
    updated_at: datetime
    
    class Config:
        allow_population_by_field_name = True
        json_encoders = {
            PyObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class FAQListResponse(BaseModel):
    """Response for FAQ list"""
    items: List[FAQResponse]
    total: int
    page: int = 1
    per_page: int = 20
    
    class Config:
        json_encoders = {
            PyObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class FAQSearchQuery(BaseModel):
    """FAQ search query parameters"""
    q: Optional[str] = Field(None, description="Search query")
    category: Optional[FAQCategory] = None
    tags: Optional[List[str]] = None
    is_published: Optional[bool] = True
    page: int = Field(1, ge=1)
    per_page: int = Field(20, ge=1, le=100)
    sort_by: str = Field("priority", regex="^(priority|view_count|created_at)$")
    sort_order: str = Field("desc", regex="^(asc|desc)$")


class FAQVoteRequest(BaseModel):
    """Request for voting on FAQ helpfulness"""
    is_helpful: bool


class FAQVoteResponse(BaseModel):
    """Response after voting"""
    success: bool
    message: str
    helpful_votes: int
    unhelpful_votes: int


class FAQBulkAction(BaseModel):
    """Bulk action on FAQs"""
    faq_ids: List[str]
    action: str = Field(..., regex="^(publish|unpublish|delete)$")


# Response types using StandardResponse
FAQCreateResponse = StandardResponse[FAQResponse]
FAQUpdateResponse = StandardResponse[FAQResponse]
FAQListStandardResponse = StandardResponse[FAQListResponse]
FAQDeleteResponse = StandardResponse[dict]
FAQVoteStandardResponse = StandardResponse[FAQVoteResponse]
FAQBulkActionResponse = StandardResponse[dict]