"""
FAQ model for frequently asked questions
"""
# Standard library imports
from datetime import datetime
from enum import Enum
from typing import List, Optional

# Third-party imports
from beanie import Document, Indexed
from pydantic import Field


class FAQCategory(str, Enum):
    """FAQ categories"""
    GENERAL = "general"
    PRICING = "pricing"
    LEARNING = "learning"
    TECHNICAL = "technical"
    CREATOR = "creator"
    ADMIN = "admin"


class FAQ(Document):
    """FAQ model for frequently asked questions"""
    
    # Content
    question: Indexed(str)  # type: ignore
    answer: str
    
    # Organization
    category: FAQCategory = Field(default=FAQCategory.GENERAL)
    priority: int = Field(default=0, ge=0, le=100)  # Higher = more important
    
    # Content metadata
    tags: List[str] = Field(default_factory=list)
    related_faqs: List[str] = Field(default_factory=list)  # FAQ IDs
    
    # Analytics
    view_count: int = Field(default=0, ge=0)
    helpful_votes: int = Field(default=0, ge=0)
    unhelpful_votes: int = Field(default=0, ge=0)
    
    # Status
    is_published: bool = Field(default=True)
    
    # SEO
    slug: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "faqs"
        indexes = [
            "category",
            "is_published",
            [("category", 1), ("priority", -1)],
            [("is_published", 1), ("view_count", -1)]
        ]
    
    class Config:
        schema_extra = {
            "example": {
                "question": "How does the AI Study Buddy work?",
                "answer": "The AI Study Buddy uses Claude 3.5 Sonnet to provide personalized learning support, answer questions about course content, and help with coding challenges.",
                "category": "learning",
                "priority": 10,
                "tags": ["ai", "study-buddy", "learning-support"],
                "is_published": True
            }
        }