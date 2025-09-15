"""
Certificate service for managing course completion certificates
"""
import os
import hashlib
import secrets
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from beanie import PydanticObjectId

from app.models.certificate import Certificate
from app.models.enrollment import Enrollment
from app.models.course import Course
from app.models.user import User
from app.schemas.certificate import (
    CertificateCreate,
    CertificateUpdate,
    CertificateWithDetails,
    CertificateVerification,
    CertificateStats,
    LinkedInShareData
)
from app.core.exceptions import NotFoundError, BadRequestError, ForbiddenError

logger = logging.getLogger(__name__)


class CertificateService:
    """Service for certificate operations"""
    
    @staticmethod
    async def generate_certificate_number() -> str:
        """Generate unique certificate number"""
        year = datetime.utcnow().year
        # Get count of certificates this year
        count = await Certificate.find(
            {"certificate_number": {"$regex": f"^CERT-{year}-"}}
        ).count()
        
        return f"CERT-{year}-{str(count + 1).zfill(6)}"
    
    @staticmethod
    def generate_verification_code() -> str:
        """Generate short verification code"""
        return secrets.token_urlsafe(6)[:8].upper()
    
    @staticmethod
    async def create_certificate(
        user_id: str,
        course_id: str,
        enrollment_id: str,
        final_score: float,
        total_hours: float,
        template_id: str = "default"
    ) -> Certificate:
        """Create a new certificate for course completion"""
        
        # Verify enrollment exists and is completed
        enrollment = await Enrollment.get(PydanticObjectId(enrollment_id))
        
        if not enrollment or enrollment.user_id != user_id or enrollment.course_id != course_id or not enrollment.progress.is_completed:
            raise NotFoundError("Completed enrollment not found")
        
        # Check if certificate already exists
        existing = await Certificate.find_one({
            "user_id": user_id,
            "course_id": course_id,
            "is_active": True
        })
        
        if existing:
            raise BadRequestError("Certificate already issued for this course")
        
        # Get course details
        course = await Course.get(course_id)
        if not course:
            raise NotFoundError("Course not found")
        
        # Generate certificate details
        certificate_number = await CertificateService.generate_certificate_number()
        verification_code = CertificateService.generate_verification_code()
        
        # Create verification URL
        verification_url = f"https://ai-elearning.com/verify/{verification_code}"
        
        # Create certificate
        certificate = Certificate(
            user_id=user_id,
            course_id=course_id,
            enrollment_id=enrollment_id,
            certificate_number=certificate_number,
            completion_date=enrollment.progress.completed_at or datetime.utcnow(),
            final_score=final_score,
            total_hours=total_hours,
            verification_url=verification_url,
            verification_code=verification_code,
            template_id=template_id
        )
        
        await certificate.insert()
        
        # Update enrollment with certificate info
        enrollment.certificate.is_issued = True
        enrollment.certificate.issued_at = datetime.utcnow()
        enrollment.certificate.certificate_id = certificate_number
        enrollment.certificate.final_score = final_score
        enrollment.certificate.verification_url = verification_url
        await enrollment.save()
        
        # Send certificate email
        try:
            from app.core.email import email_service
            certificate_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/certificates/{certificate.id}"
            await email_service.send_certificate_email(
                to_email=user.email,
                name=user.name,
                course_title=course.title,
                certificate_url=certificate_url
            )
            logger.info(f"Certificate email sent to {user.email}")
        except Exception as e:
            logger.error(f"Failed to send certificate email: {str(e)}")
            # Don't fail certificate generation if email fails
        
        return certificate
    
    @staticmethod
    async def get_certificate(certificate_id: str) -> Optional[Certificate]:
        """Get certificate by ID"""
        return await Certificate.get(certificate_id)
    
    @staticmethod
    async def get_certificate_with_details(
        certificate_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get certificate with course and user details"""
        certificate = await Certificate.get(certificate_id)
        if not certificate:
            return None

        # Get course and user details
        course = await Course.get(certificate.course_id)
        user = await User.get(certificate.user_id)

        if not course or not user:
            return None

        # Convert certificate to dictionary and add details
        cert_dict = certificate.model_dump()
        cert_dict.update({
            "course_title": course.title,
            "course_description": course.description,
            "course_level": course.level,
            "course_category": course.category,
            "course_creator": course.creator_name,
            "user_name": user.name,
            "user_email": user.email
        })
        return cert_dict
    
    @staticmethod
    async def verify_certificate(
        verification_code: str
    ) -> Dict[str, Any]:
        """Verify certificate by code"""
        certificate = await Certificate.find_one({
            "verification_code": verification_code
        })

        if not certificate:
            return {
                "is_valid": False,
                "message": "Certificate not found"
            }

        if not certificate.is_active:
            return {
                "is_valid": False,
                "message": "Certificate has been revoked"
            }

        if certificate.expiry_date and certificate.expiry_date < datetime.utcnow():
            return {
                "is_valid": False,
                "message": "Certificate has expired"
            }

        # Get full details
        details = await CertificateService.get_certificate_with_details(
            str(certificate.id)
        )

        return {
            "is_valid": True,
            "certificate": details,
            "message": "Certificate is valid"
        }
    
    @staticmethod
    async def get_user_certificates(
        user_id: str,
        skip: int = 0,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get all certificates for a user"""
        certificates = await Certificate.find(
            {"user_id": user_id, "is_active": True}
        ).sort("-created_at").skip(skip).limit(limit).to_list()
        
        # Get details for each certificate
        detailed_certs = []
        for cert in certificates:
            details = await CertificateService.get_certificate_with_details(
                str(cert.id)
            )
            if details:
                detailed_certs.append(details)
        
        return detailed_certs
    
    @staticmethod
    async def get_user_certificate_stats(user_id: str) -> Dict[str, Any]:
        """Get certificate statistics for a user"""
        certificates = await Certificate.find({
            "user_id": user_id,
            "is_active": True
        }).to_list()

        if not certificates:
            return {
                "total_certificates": 0,
                "courses_completed": 0,
                "total_hours_learned": 0,
                "average_score": 0,
                "certificates_by_category": {},
                "certificates_by_year": {}
            }
        
        # Calculate stats
        total_hours = sum(cert.total_hours for cert in certificates)
        average_score = sum(cert.final_score for cert in certificates) / len(certificates)
        
        # Group by category and year
        certificates_by_category: Dict[str, int] = {}
        certificates_by_year: Dict[int, int] = {}
        
        for cert in certificates:
            # Get course for category
            course = await Course.get(cert.course_id)
            if course:
                category = course.category
                certificates_by_category[category] = certificates_by_category.get(category, 0) + 1
            
            # Group by year
            year = cert.issue_date.year
            certificates_by_year[year] = certificates_by_year.get(year, 0) + 1
        
        return {
            "total_certificates": len(certificates),
            "courses_completed": len(set(cert.course_id for cert in certificates)),
            "total_hours_learned": total_hours,
            "average_score": average_score,
            "certificates_by_category": certificates_by_category,
            "certificates_by_year": certificates_by_year
        }
    
    @staticmethod
    async def update_certificate(
        certificate_id: str,
        user_id: str,
        update_data: CertificateUpdate
    ) -> Optional[Certificate]:
        """Update certificate settings"""
        certificate = await Certificate.get(certificate_id)
        if not certificate:
            return None
        
        # Verify ownership
        if certificate.user_id != user_id:
            raise ForbiddenError("You can only update your own certificates")
        
        # Update fields
        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(certificate, field, value)
        
        certificate.updated_at = datetime.utcnow()
        await certificate.save()
        
        return certificate
    
    @staticmethod
    async def revoke_certificate(
        certificate_id: str,
        admin_id: str,
        reason: str
    ) -> Optional[Certificate]:
        """Revoke a certificate (admin only)"""
        certificate = await Certificate.get(certificate_id)
        if not certificate:
            return None
        
        certificate.is_active = False
        certificate.revoked_at = datetime.utcnow()
        certificate.revoke_reason = reason
        certificate.updated_at = datetime.utcnow()
        
        await certificate.save()
        
        # Update enrollment
        enrollment = await Enrollment.get(PydanticObjectId(certificate.enrollment_id))
        if enrollment:
            enrollment.certificate.is_issued = False
            await enrollment.save()
        
        return certificate
    
    @staticmethod
    async def generate_linkedin_share_data(
        certificate_id: str
    ) -> Dict[str, Any]:
        """Generate data for LinkedIn certificate sharing"""
        certificate = await CertificateService.get_certificate_with_details(certificate_id)
        if not certificate:
            raise NotFoundError("Certificate not found")

        share_text = (
            f"I'm excited to share that I've completed '{certificate['course_title']}' "
            f"on AI E-Learning Platform with a score of {certificate['final_score']}%! "
            f"#OnlineLearning #CertificateOfCompletion #AI #MachineLearning"
        )

        return {
            "certificate_url": certificate["verification_url"],
            "share_text": share_text,
            "issue_date": certificate["issue_date"].strftime("%B %Y"),
            "certificate_id": certificate["certificate_number"]
        }
    
    @staticmethod
    async def generate_certificate_pdf(certificate_id: str) -> bytes:
        """Generate PDF version of certificate"""
        # This would integrate with a PDF generation library
        # For now, returning placeholder
        # In production, use libraries like ReportLab or WeasyPrint
        return b"PDF content would be generated here"
    
    @staticmethod
    async def check_course_completion_and_issue_certificate(
        user_id: str,
        course_id: str,
        enrollment_id: str
    ) -> Optional[Certificate]:
        """Check if course is completed and issue certificate if eligible"""
        enrollment = await Enrollment.get(PydanticObjectId(enrollment_id))
        
        if enrollment and (enrollment.user_id != user_id or enrollment.course_id != course_id):
            enrollment = None
        
        if not enrollment:
            return None
        
        # Check if course is completed
        if enrollment.progress.completion_percentage < 100:
            return None
        
        # Check if certificate already issued
        if enrollment.certificate.is_issued:
            existing = await Certificate.find_one({
                "enrollment_id": enrollment_id,
                "is_active": True
            })
            return existing
        
        # Calculate final score from quiz attempts
        # For now, using a simple average
        final_score = 85.0  # This would be calculated from actual quiz scores
        
        # Create certificate
        certificate = await CertificateService.create_certificate(
            user_id=user_id,
            course_id=course_id,
            enrollment_id=enrollment_id,
            final_score=final_score,
            total_hours=enrollment.progress.total_watch_time / 3600  # Convert to hours
        )
        
        return certificate