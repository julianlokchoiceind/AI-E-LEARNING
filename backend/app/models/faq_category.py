"""
FAQ Category model for MongoDB using Beanie ODM.
Following the Course model pattern from CLAUDE.md specifications.
"""
from typing import Optional
from datetime import datetime
from pydantic import Field, validator
from beanie import Document, Indexed


class FAQCategory(Document):
    """FAQ Category model for organizing FAQs"""
    
    # Basic information
    name: Indexed(str)  # Display name (e.g., "General", "Pricing")
    slug: Indexed(str, unique=True)  # URL-friendly identifier (e.g., "general", "pricing")
    description: Optional[str] = None
    
    # Display control
    order: int = Field(default=0, ge=0)  # Order for display (0 = first)
    is_active: bool = Field(default=True)  # Whether to show publicly
    
    # Statistics (calculated by backend)
    faq_count: int = Field(default=0, ge=0)  # Number of FAQs in this category
    total_views: int = Field(default=0, ge=0)  # Total views across all FAQs
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @validator('slug')
    def validate_slug(cls, v):
        """Ensure slug is URL-friendly"""
        import re
        if not re.match(r'^[a-z0-9-]+$', v):
            raise ValueError('Slug must contain only lowercase letters, numbers and hyphens')
        return v
    
    @validator('name')
    def validate_name(cls, v):
        """Ensure name is not empty and reasonable length"""
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        if len(v.strip()) > 100:
            raise ValueError('Name cannot exceed 100 characters')
        return v.strip()
    
    class Settings:
        name = "faq_categories"
        indexes = [
            "is_active",
            [("is_active", 1), ("order", 1)],
            [("is_active", 1), ("name", 1)]
        ]
    
    class Config:
        schema_extra = {
            "example": {
                "name": "General Questions",
                "slug": "general",
                "description": "General questions about the platform and services",
                "order": 0,
                "is_active": True
            }
        }