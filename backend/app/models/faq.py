"""
FAQ model for frequently asked questions
"""
# Standard library imports
from datetime import datetime
from typing import List, Optional

# Third-party imports
from beanie import Document, Indexed
from pydantic import Field


class FAQ(Document):
    """FAQ model for frequently asked questions"""
    
    # Content
    question: Indexed(str)  # type: ignore
    answer: str
    
    # Organization
    category_id: Optional[str] = None  # Reference to FAQCategory._id
    priority: int = Field(default=0, ge=0, le=100)  # Higher = more important
    
    # Content metadata
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
    
    async def pre_save(self):
        """Generate slug if not provided"""
        if not self.slug:
            # Simple slug generation from question
            slug = self.question.lower()
            # Keep only alphanumeric and spaces
            slug = ''.join(c if c.isalnum() or c == ' ' else '' for c in slug)
            # Replace spaces with hyphens and limit length
            slug = '-'.join(slug.split())[:100]
            self.slug = slug if slug else None
    
    class Settings:
        name = "faqs"
        indexes = [
            "category_id",
            "is_published",
            [("category_id", 1), ("priority", -1)],
            [("is_published", 1), ("view_count", -1)]
        ]
    
    class Config:
        schema_extra = {
            "example": {
                "question": "How does the AI Study Buddy work?",
                "answer": "The AI Study Buddy uses Claude 3.5 Sonnet to provide personalized learning support, answer questions about course content, and help with coding challenges.",
                "category_id": "60f0c88bb9f5d84a2c8e3b1a",
                "priority": 10,
                "is_published": True
            }
        }