"""
FAQ schemas for API endpoints
"""
# Standard library imports
from datetime import datetime
from typing import List, Optional

# Third-party imports
from pydantic import BaseModel, Field, validator, root_validator

# Local imports
from app.schemas.base import PyObjectId, StandardResponse


class FAQBase(BaseModel):
    """Base FAQ schema"""
    question: str = Field(..., min_length=1, max_length=500)
    answer: str = Field(..., min_length=1, max_length=5000)
    category_id: Optional[str] = None  # Reference to FAQCategory._id
    priority: int = Field(default=0, ge=0, le=100)
    related_faqs: List[str] = Field(default_factory=list, max_items=5)
    is_published: bool = Field(default=True)
    slug: Optional[str] = Field(None, pattern="^[a-z0-9-]+$")
    
    @validator('slug')
    def validate_slug(cls, v, values):
        """Generate slug if not provided"""
        # Treat empty string as None for auto-generation
        if (not v or v == '') and 'question' in values:
            # Simple slug generation
            slug = values['question'].lower()
            slug = ''.join(c if c.isalnum() or c == ' ' else '' for c in slug)
            slug = '-'.join(slug.split())[:100]
            return slug if slug else None  # Return None if slug is empty after processing
        return v


class FAQCreate(FAQBase):
    """Schema for creating FAQ"""
    pass


class FAQUpdate(BaseModel):
    """Schema for updating FAQ"""
    question: Optional[str] = Field(None, min_length=1, max_length=500)
    answer: Optional[str] = Field(None, min_length=1, max_length=5000)
    category_id: Optional[str] = None  # Reference to FAQCategory._id
    priority: Optional[int] = Field(None, ge=0, le=100)
    related_faqs: Optional[List[str]] = Field(None, max_items=5)
    is_published: Optional[bool] = None
    slug: Optional[str] = Field(None, pattern="^[a-z0-9-]+$")


class FAQResponse(FAQBase):
    """FAQ response schema"""
    id: PyObjectId
    view_count: int = 0
    helpful_votes: int = 0
    unhelpful_votes: int = 0
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True
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
    category: Optional[str] = None  # Category ID for filtering
    is_published: Optional[bool] = True
    page: int = Field(1, ge=1)
    per_page: int = Field(20, ge=1, le=100)
    sort_by: str = Field("priority", pattern="^(priority|view_count|created_at)$")
    sort_order: str = Field("desc", pattern="^(asc|desc)$")


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
    action: str = Field(..., pattern="^(create|publish|unpublish|delete)$")
    faq_ids: Optional[List[str]] = None  # Required for publish/unpublish/delete
    faqs_data: Optional[List[FAQCreate]] = None  # Required for create

    @root_validator(skip_on_failure=True)
    def validate_required_fields(cls, values):
        action = values.get('action')
        if action in ['publish', 'unpublish', 'delete']:
            if not values.get('faq_ids'):
                raise ValueError('faq_ids required for publish/unpublish/delete actions')
        elif action == 'create':
            if not values.get('faqs_data'):
                raise ValueError('faqs_data required for create action')
        return values


# Response types using StandardResponse
FAQCreateResponse = StandardResponse[FAQResponse]
FAQUpdateResponse = StandardResponse[FAQResponse]
FAQListStandardResponse = StandardResponse[FAQListResponse]
FAQDeleteResponse = StandardResponse[dict]
FAQVoteStandardResponse = StandardResponse[FAQVoteResponse]
FAQBulkActionResponse = StandardResponse[dict]