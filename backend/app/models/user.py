"""
User model for MongoDB using Beanie ODM.
Based on CLAUDE.md specifications.
"""
from typing import Optional, List, Dict
from datetime import datetime
from pydantic import EmailStr, Field
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


class Subscription(Document):
    type: SubscriptionType = SubscriptionType.FREE
    status: SubscriptionStatus = SubscriptionStatus.INACTIVE
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False


class Profile(Document):
    avatar: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    website: Optional[str] = None
    title: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    learning_goals: List[str] = Field(default_factory=list)


class Stats(Document):
    courses_enrolled: int = 0
    courses_completed: int = 0
    total_hours_learned: float = 0
    certificates_earned: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    last_active: Optional[datetime] = None


class Preferences(Document):
    language: str = "vi"
    timezone: str = "Asia/Ho_Chi_Minh"
    email_notifications: bool = True
    push_notifications: bool = True
    marketing_emails: bool = False


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