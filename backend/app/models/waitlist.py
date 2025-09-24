"""
Waitlist model for MongoDB using Beanie ODM.
"""
from typing import Optional, Annotated
from datetime import datetime
from pydantic import EmailStr, Field
from beanie import Document, Indexed


class Waitlist(Document):
    """Waitlist entry document"""
    email: Annotated[EmailStr, Indexed(unique=True)]  # Prevent duplicate emails
    created_at: datetime = Field(default_factory=datetime.utcnow)
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

    class Settings:
        name = "waitlist"
        indexes = [
            "email",
            "created_at"
        ]