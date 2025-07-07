"""
User model for MongoDB using Beanie ODM.
Based on CLAUDE.md specifications.
"""
from typing import Optional, List, Dict
from datetime import datetime
from pydantic import EmailStr, Field, BaseModel
from beanie import Document, Indexed
from enum import Enum


class UserRole(str, Enum):
    STUDENT = "student"
    CREATOR = "creator" 
    ADMIN = "admin"


class SubscriptionType(str, Enum):
    FREE = "free"
    PRO = "pro"


class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    CANCELLED = "cancelled"
    PAST_DUE = "past_due"


class Subscription(BaseModel):
    type: SubscriptionType = SubscriptionType.FREE
    status: SubscriptionStatus = SubscriptionStatus.INACTIVE
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False


class Profile(BaseModel):
    avatar: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    website: Optional[str] = None
    title: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    learning_goals: List[str] = Field(default_factory=list)


class Stats(BaseModel):
    courses_enrolled: int = 0
    courses_completed: int = 0
    total_hours_learned: float = 0
    certificates_earned: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    last_active: Optional[datetime] = None


class Preferences(BaseModel):
    language: str = "vi"
    timezone: str = "Asia/Ho_Chi_Minh"
    email_notifications: bool = True
    push_notifications: bool = True
    marketing_emails: bool = False


class OnboardingStep(str, Enum):
    WELCOME = "welcome"
    LEARNING_PATH = "learning_path" 
    PROFILE_SETUP = "profile_setup"
    COURSE_RECOMMENDATIONS = "course_recommendations"
    PLATFORM_TOUR = "platform_tour"
    COMPLETED = "completed"


class LearningPath(str, Enum):
    PROGRAMMING_BASICS = "programming_basics"
    AI_FUNDAMENTALS = "ai_fundamentals"
    MACHINE_LEARNING = "machine_learning"
    AI_TOOLS = "ai_tools"
    PRODUCTION_AI = "production_ai"
    FULL_STACK = "full_stack"


class SkillLevel(str, Enum):
    COMPLETE_BEGINNER = "complete_beginner"
    SOME_PROGRAMMING = "some_programming"
    EXPERIENCED_DEVELOPER = "experienced_developer"
    AI_FAMILIAR = "ai_familiar"


class TimeCommitment(str, Enum):
    CASUAL = "casual"  # 1-3 hours/week
    REGULAR = "regular"  # 4-8 hours/week
    INTENSIVE = "intensive"  # 8+ hours/week


class Onboarding(BaseModel):
    is_completed: bool = False
    current_step: OnboardingStep = OnboardingStep.WELCOME
    skipped: bool = False
    completed_at: Optional[datetime] = None
    steps_completed: List[str] = Field(default_factory=list)
    
    # Learning preferences collected during onboarding
    selected_paths: List[LearningPath] = Field(default_factory=list)
    skill_level: Optional[SkillLevel] = None
    time_commitment: Optional[TimeCommitment] = None
    learning_goals: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    career_goals: List[str] = Field(default_factory=list)
    
    # Progress tracking
    steps_completed: List[OnboardingStep] = Field(default_factory=list)
    started_at: Optional[datetime] = None


class User(Document):
    # Authentication fields
    email: Indexed(EmailStr, unique=True)
    password: str  # Hashed with bcrypt
    name: str
    
    # Role and access
    role: UserRole = UserRole.STUDENT
    premium_status: bool = False
    is_verified: bool = False
    
    # Verification and reset tokens
    verification_token: Optional[str] = None
    verification_token_expires: Optional[datetime] = None
    reset_password_token: Optional[str] = None
    reset_password_expires: Optional[datetime] = None
    
    # Subscription details
    subscription: Subscription = Field(default_factory=Subscription)
    
    # Profile information
    profile: Profile = Field(default_factory=Profile)
    
    # Learning statistics
    stats: Stats = Field(default_factory=Stats)
    
    # User preferences
    preferences: Preferences = Field(default_factory=Preferences)
    
    # Onboarding progress
    onboarding: Onboarding = Field(default_factory=Onboarding)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    
    class Settings:
        name = "users"
        indexes = [
            "email",
            "role",
            "premium_status",
            "subscription.status",
            "created_at"
        ]
    
    class Config:
        schema_extra = {
            "example": {
                "email": "student@example.com",
                "name": "Nguyen Van A",
                "role": "student",
                "premium_status": False,
                "is_verified": True
            }
        }