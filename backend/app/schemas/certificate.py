"""
Certificate schemas for API
"""
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class CertificateBase(BaseModel):
    """Base certificate schema"""
    final_score: float = Field(..., ge=0, le=100)
    total_hours: float = Field(..., gt=0)


class CertificateCreate(CertificateBase):
    """Schema for certificate creation (mostly internal)"""
    template_id: Optional[str] = "default"
    background_color: Optional[str] = "#1e40af"
    accent_color: Optional[str] = "#dbeafe"


class CertificateUpdate(BaseModel):
    """Schema for certificate updates"""
    is_public: Optional[bool] = None
    template_id: Optional[str] = None
    background_color: Optional[str] = None
    accent_color: Optional[str] = None


class CertificateInDB(CertificateBase):
    """Certificate schema with database fields"""
    id: str
    user_id: str
    course_id: str
    enrollment_id: str
    certificate_number: str
    issue_date: datetime
    expiry_date: Optional[datetime] = None
    completion_date: datetime
    issuer_name: str
    issuer_title: str
    issuer_signature_url: Optional[str] = None
    verification_url: str
    verification_code: str
    blockchain_hash: Optional[str] = None
    template_id: str
    background_color: str
    accent_color: str
    is_active: bool
    is_public: bool
    revoked_at: Optional[datetime] = None
    revoke_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        from_attributes = True


class CertificateWithDetails(CertificateInDB):
    """Certificate with course and user details"""
    course_title: str
    course_description: str
    course_level: str
    course_category: str
    course_creator: str
    user_name: str
    user_email: str


class CertificateVerification(BaseModel):
    """Certificate verification response"""
    is_valid: bool
    certificate: Optional[CertificateWithDetails] = None
    message: str


class CertificateGenerateRequest(BaseModel):
    """Request to generate a certificate"""
    enrollment_id: str
    template_id: Optional[str] = "default"


class CertificateListResponse(BaseModel):
    """Response for certificate list"""
    items: list[CertificateWithDetails]
    total: int
    page: int
    per_page: int
    total_pages: int


class CertificateStats(BaseModel):
    """User certificate statistics"""
    total_certificates: int
    courses_completed: int
    total_hours_learned: float
    average_score: float
    certificates_by_category: Dict[str, int]
    certificates_by_year: Dict[int, int]


class LinkedInShareData(BaseModel):
    """Data for LinkedIn certificate sharing"""
    certificate_url: str
    share_text: str
    organization_name: str = "AI E-Learning Platform"
    issue_date: str
    certificate_id: str
    
    
class CertificateRevoke(BaseModel):
    """Request to revoke a certificate"""
    reason: str = Field(..., min_length=10, max_length=500)
    

class CertificateStandardResponse(BaseModel):
    """Standard response for certificate operations"""
    success: bool
    data: Optional[CertificateWithDetails] = None
    message: str