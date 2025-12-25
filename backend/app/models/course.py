"""
Course model for MongoDB using Beanie ODM.
Based on CLAUDE.md specifications.
"""
from typing import Optional, List
from datetime import datetime
from pydantic import Field, BaseModel
from beanie import Document, Indexed, PydanticObjectId
from enum import Enum


class CourseCategory(str, Enum):
    ML_BASICS = "ml-basics"
    DEEP_LEARNING = "deep-learning"
    NLP = "nlp"
    COMPUTER_VISION = "computer-vision"
    GENERATIVE_AI = "generative-ai"
    AI_ETHICS = "ai-ethics"
    AI_IN_BUSINESS = "ai-in-business"


class CourseLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class CourseStatus(str, Enum):
    DRAFT = "draft"
    REVIEW = "review"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    COMING_SOON = "coming_soon"


class Pricing(BaseModel):
    is_free: bool = False
    price: float = 0
    currency: str = "USD"
    discount_price: Optional[float] = None
    discount_expires: Optional[datetime] = None


class CourseStats(BaseModel):
    total_enrollments: int = 0
    active_students: int = 0
    completion_rate: float = 0
    average_rating: float = 0
    total_reviews: int = 0
    total_revenue: float = 0
    total_likes: int = 0
    total_dislikes: int = 0


class SEO(BaseModel):
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    keywords: List[str] = Field(default_factory=list)


class Course(Document):
    # Basic information
    title: str
    description: str
    short_description: Optional[str] = None
    slug: Indexed(str, unique=True)
    
    # Course metadata
    category: CourseCategory
    level: CourseLevel
    language: str = "vi"
    
    # Creator information
    creator_id: PydanticObjectId
    creator_name: Optional[str] = None
    
    # Course content
    thumbnail: Optional[str] = None
    preview_video: Optional[str] = None
    syllabus: List[str] = Field(default_factory=list)
    prerequisites: List[str] = Field(default_factory=list)
    target_audience: List[str] = Field(default_factory=list)
    
    # Pricing
    pricing: Pricing = Field(default_factory=Pricing)
    
    # Course structure
    total_chapters: int = 0
    total_lessons: int = 0
    total_duration: int = 0  # in minutes

    # Learning mode
    sequential_learning_enabled: bool = True  # Default to sequential learning

    # Course status
    status: CourseStatus = CourseStatus.DRAFT
    published_at: Optional[datetime] = None
    
    # Statistics
    stats: CourseStats = Field(default_factory=CourseStats)
    
    # SEO and marketing
    seo: SEO = Field(default_factory=SEO)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "courses"
        indexes = [
            "creator_id",
            "category",
            "level",
            "status",
            "pricing.is_free",
            "created_at"
        ]