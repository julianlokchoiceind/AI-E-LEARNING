"""
Certificate model for course completion
"""
from datetime import datetime
from typing import Optional
from pydantic import Field
from beanie import Document, Indexed
from bson import ObjectId

class Certificate(Document):
    """Certificate model for course completion"""
    
    # Basic fields
    user_id: Indexed(str) = Field(..., description="User who earned the certificate")
    course_id: Indexed(str) = Field(..., description="Course completed")
    enrollment_id: str = Field(..., description="Related enrollment ID")
    
    # Certificate details
    certificate_number: Indexed(str) = Field(..., description="Unique certificate number")
    issue_date: datetime = Field(default_factory=datetime.utcnow)
    expiry_date: Optional[datetime] = Field(None, description="Certificate expiry date if applicable")
    
    # Course completion info
    completion_date: datetime = Field(..., description="When the course was completed")
    final_score: float = Field(..., ge=0, le=100, description="Final course score percentage")
    total_hours: float = Field(..., description="Total hours spent on course")
    
    # Certificate metadata
    issuer_name: str = Field(default="Mr Choi - Heart HT")
    issuer_title: str = Field(default="Director of Education")
    issuer_signature_url: Optional[str] = Field(None, description="URL to issuer signature image")
    
    # Verification
    verification_url: str = Field(..., description="Public URL to verify certificate")
    verification_code: str = Field(..., description="Short verification code")
    blockchain_hash: Optional[str] = Field(None, description="Blockchain verification hash")
    
    # Template customization
    template_id: str = Field(default="default", description="Certificate template to use")
    background_color: str = Field(default="#1e40af", description="Certificate primary color")
    accent_color: str = Field(default="#dbeafe", description="Certificate accent color")
    
    # Status
    is_active: bool = Field(default=True)
    is_public: bool = Field(default=True, description="Whether certificate is publicly viewable")
    revoked_at: Optional[datetime] = Field(None)
    revoke_reason: Optional[str] = Field(None)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "certificates"
        indexes = [
            [("user_id", 1), ("course_id", 1)],  # Compound index for user-course lookup
            [("certificate_number", 1)],  # For unique certificate lookup
            [("verification_code", 1)],  # For quick verification
            [("created_at", -1)]  # For sorting by recent
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "course_id": "507f1f77bcf86cd799439012",
                "certificate_number": "CERT-2025-000001",
                "final_score": 92.5,
                "total_hours": 24.5,
                "verification_code": "ABC123"
            }
        }