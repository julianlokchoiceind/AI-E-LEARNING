"""
Certificate API endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
import io

from app.models.user import User
from app.models.enrollment import Enrollment
from app.models.certificate import Certificate
from app.core.deps import get_current_user, get_current_admin
from app.services.certificate_service import CertificateService
from app.schemas.certificate import (
    CertificateGenerateRequest,
    CertificateUpdate,
    CertificateRevoke,
    CertificateVerification,
    CertificateStats,
    LinkedInShareData,
    CertificateWithDetails
)
from app.schemas.base import StandardResponse

router = APIRouter()


@router.post("/generate", response_model=StandardResponse[dict])
async def generate_certificate(
    request: CertificateGenerateRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate a certificate for completed course.
    Only available to enrolled users who have completed the course.
    """
    try:
        # Get enrollment
        enrollment = await Enrollment.get(request.enrollment_id)
        if not enrollment:
            raise HTTPException(status_code=404, detail="Enrollment not found")
        
        # Verify ownership
        if enrollment.user_id != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not your enrollment")
        
        # Check and issue certificate
        certificate = await CertificateService.check_course_completion_and_issue_certificate(
            user_id=str(current_user.id),
            course_id=enrollment.course_id,
            enrollment_id=request.enrollment_id
        )
        
        if not certificate:
            raise HTTPException(
                status_code=400, 
                detail="Course not completed or certificate already issued"
            )
        
        # Get detailed certificate
        details = await CertificateService.get_certificate_with_details(str(certificate.id))
        
        return StandardResponse(
            success=True,
            data=details,
            message="Certificate generated successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/my-certificates", response_model=StandardResponse[dict])
async def get_my_certificates(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user)
):
    """Get all certificates earned by the current user"""
    try:
        skip = (page - 1) * per_page
        
        # Get certificates
        certificates = await CertificateService.get_user_certificates(
            user_id=str(current_user.id),
            skip=skip,
            limit=per_page
        )
        
        # Get total count
        total = await Certificate.find({
            "user_id": str(current_user.id),
            "is_active": True
        }).count()
        
        total_pages = (total + per_page - 1) // per_page
        
        return StandardResponse(
            success=True,
            data={
                "items": certificates,
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": total_pages
            },
            message="Certificates retrieved successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/my-stats", response_model=StandardResponse[dict])
async def get_my_certificate_stats(
    current_user: User = Depends(get_current_user)
):
    """Get certificate statistics for the current user"""
    try:
        stats = await CertificateService.get_user_certificate_stats(
            user_id=str(current_user.id)
        )
        return StandardResponse(
            success=True,
            data=stats,
            message="Certificate statistics retrieved successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/verify/{verification_code}", response_model=StandardResponse[dict])
async def verify_certificate(verification_code: str):
    """
    Verify a certificate by its verification code.
    This is a public endpoint for certificate verification.
    """
    try:
        verification = await CertificateService.verify_certificate(verification_code)
        return StandardResponse(
            success=True,
            data=verification,
            message="Certificate verification completed"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{certificate_id}", response_model=StandardResponse[dict])
async def get_certificate(
    certificate_id: str,
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get certificate details by ID"""
    try:
        certificate = await CertificateService.get_certificate_with_details(certificate_id)
        if not certificate:
            raise HTTPException(status_code=404, detail="Certificate not found")
        
        # Check if certificate is public or belongs to user
        if not certificate.is_public:
            if not current_user or str(current_user.id) != certificate.user_id:
                raise HTTPException(status_code=403, detail="Certificate is private")
        
        return StandardResponse(
            success=True,
            data=certificate,
            message="Certificate retrieved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{certificate_id}", response_model=StandardResponse[dict])
async def update_certificate(
    certificate_id: str,
    update_data: CertificateUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update certificate settings (privacy, template, colors)"""
    try:
        certificate = await CertificateService.update_certificate(
            certificate_id=certificate_id,
            user_id=str(current_user.id),
            update_data=update_data
        )
        
        if not certificate:
            raise HTTPException(status_code=404, detail="Certificate not found")
        
        # Get detailed certificate
        details = await CertificateService.get_certificate_with_details(str(certificate.id))
        
        return StandardResponse(
            success=True,
            data=details,
            message="Certificate updated successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{certificate_id}/linkedin", response_model=StandardResponse[dict])
async def get_linkedin_share_data(
    certificate_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get data for sharing certificate on LinkedIn"""
    try:
        # Verify certificate belongs to user
        certificate = await Certificate.get(certificate_id)
        if not certificate:
            raise HTTPException(status_code=404, detail="Certificate not found")
        
        if certificate.user_id != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not your certificate")
        
        share_data = await CertificateService.generate_linkedin_share_data(certificate_id)
        return StandardResponse(
            success=True,
            data=share_data.dict(),
            message="LinkedIn share data retrieved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{certificate_id}/download")
async def download_certificate(
    certificate_id: str,
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Download certificate as PDF.
    Public if certificate is public, otherwise requires authentication.
    """
    try:
        certificate = await Certificate.get(certificate_id)
        if not certificate:
            raise HTTPException(status_code=404, detail="Certificate not found")
        
        # Check access
        if not certificate.is_public:
            if not current_user or str(current_user.id) != certificate.user_id:
                raise HTTPException(status_code=403, detail="Certificate is private")
        
        # Generate PDF
        pdf_content = await CertificateService.generate_certificate_pdf(certificate_id)
        
        # Return PDF
        return StreamingResponse(
            io.BytesIO(pdf_content),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=certificate_{certificate.certificate_number}.pdf"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Admin endpoints
@router.post("/admin/revoke/{certificate_id}", response_model=StandardResponse[dict])
async def revoke_certificate(
    certificate_id: str,
    revoke_data: CertificateRevoke,
    current_admin: User = Depends(get_current_admin)
):
    """
    Revoke a certificate (Admin only).
    This action cannot be undone.
    """
    try:
        certificate = await CertificateService.revoke_certificate(
            certificate_id=certificate_id,
            admin_id=str(current_admin.id),
            reason=revoke_data.reason
        )
        
        if not certificate:
            raise HTTPException(status_code=404, detail="Certificate not found")
        
        return StandardResponse(
            success=True,
            data=None,
            message="Certificate revoked successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/all", response_model=StandardResponse[dict])
async def get_all_certificates(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user_id: Optional[str] = None,
    course_id: Optional[str] = None,
    current_admin: User = Depends(get_current_admin)
):
    """Get all certificates with filtering (Admin only)"""
    try:
        skip = (page - 1) * per_page
        
        # Build filter
        filter_dict = {}
        if user_id:
            filter_dict["user_id"] = user_id
        if course_id:
            filter_dict["course_id"] = course_id
        
        # Get certificates
        certificates = await Certificate.find(filter_dict).sort("-created_at").skip(skip).limit(per_page).to_list()
        
        # Get details for each
        detailed_certs = []
        for cert in certificates:
            details = await CertificateService.get_certificate_with_details(str(cert.id))
            if details:
                detailed_certs.append(details)
        
        # Get total count
        total = await Certificate.find(filter_dict).count()
        total_pages = (total + per_page - 1) // per_page
        
        return StandardResponse(
            success=True,
            data={
                "items": detailed_certs,
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": total_pages
            },
            message="Certificates retrieved successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))