"""
Pydantic schemas for authentication.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, validator


class UserCreate(BaseModel):
    """Schema for user registration."""
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=8)
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not v[0].isupper():
            raise ValueError('Password must start with an uppercase letter')
        if not any(char in '!@#$%^&*()_+-=[]{}|;:,.<>?' for char in v):
            raise ValueError('Password must contain at least one special character')
        return v


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for user response (without password)."""
    id: str
    email: EmailStr
    name: str
    role: str
    premium_status: bool
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema for token response."""
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    """Schema for token payload."""
    sub: Optional[str] = None
    exp: Optional[int] = None


class PasswordResetRequest(BaseModel):
    """Schema for password reset request."""
    email: EmailStr


class PasswordReset(BaseModel):
    """Schema for password reset with token."""
    token: str
    new_password: str = Field(..., min_length=8)

    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not v[0].isupper():
            raise ValueError('Password must start with an uppercase letter')
        if not any(char in '!@#$%^&*()_+-=[]{}|;:,.<>?' for char in v):
            raise ValueError('Password must contain at least one special character')
        return v


class EmailVerificationResend(BaseModel):
    """Schema for resending email verification."""
    email: EmailStr


class OAuthUserCreate(BaseModel):
    """Schema for OAuth user creation."""
    email: EmailStr
    name: str
    provider: str  # google, github, azure-ad
    provider_id: str  # Provider's unique user ID
    picture: Optional[str] = None  # Profile picture URL


class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request."""
    refresh_token: str


class TokenWithRefresh(BaseModel):
    """Schema for token response with refresh token."""
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int  # seconds


class ChangePasswordRequest(BaseModel):
    """Schema for changing user password."""
    current_password: str
    new_password: str = Field(..., min_length=8)

    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not v[0].isupper():
            raise ValueError('Password must start with an uppercase letter')
        if not any(char in '!@#$%^&*()_+-=[]{}|;:,.<>?' for char in v):
            raise ValueError('Password must contain at least one special character')
        return v


class UserPreferencesUpdate(BaseModel):
    """Schema for updating user preferences."""
    language: Optional[str] = None
    timezone: Optional[str] = None
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    marketing_emails: Optional[bool] = None


class UserPreferencesResponse(BaseModel):
    """Schema for user preferences response."""
    language: str
    timezone: str
    email_notifications: bool
    push_notifications: bool
    marketing_emails: bool