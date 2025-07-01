import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Body
from app.models.user import User
from app.models.enrollment import Enrollment, EnrollmentType
from app.core.deps import get_current_user
from app.core.email import email_service
from app.services.enrollment_service import enrollment_service
from app.schemas.enrollment import (
    EnrollmentResponse,
    EnrollmentListResponse,
    EnrollmentCreate,
    MessageResponse
)

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/courses/{course_id}/enroll", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
async def enroll_in_course(
    course_id: str,
    enrollment_data: EnrollmentCreate = Body(default=EnrollmentCreate()),
    current_user: User = Depends(get_current_user)
):
    """Enroll user in a course."""
    try:
        enrollment = await enrollment_service.enroll_user(
            course_id=course_id,
            user_id=str(current_user.id),
            enrollment_type=enrollment_data.enrollment_type or EnrollmentType.FREE,
            payment_id=enrollment_data.payment_id
        )
        
        # Send enrollment confirmation email
        try:
            # Get course details for email
            from app.core.database import get_database
            from bson import ObjectId
            db = get_database()
            course = await db.courses.find_one({"_id": ObjectId(course_id)})
            
            if course:
                await email_service.send_enrollment_confirmation(
                    to_email=current_user.email,
                    name=current_user.name,
                    course_title=course.get("title", "Course"),
                    course_id=course_id
                )
                logger.info(f"Enrollment confirmation email sent to: {current_user.email}")
        except Exception as e:
            logger.error(f"Failed to send enrollment confirmation email: {str(e)}")
            # Don't fail enrollment if email fails
        
        return EnrollmentResponse(
            success=True,
            data=enrollment,
            message="Successfully enrolled in course"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/enrollments", response_model=EnrollmentListResponse, status_code=status.HTTP_200_OK)
async def get_my_enrollments(
    current_user: User = Depends(get_current_user)
):
    """Get all courses user is enrolled in."""
    enrollments = await enrollment_service.get_user_enrollments(str(current_user.id))
    
    return EnrollmentListResponse(
        success=True,
        data=enrollments,
        message=f"Found {len(enrollments)} enrolled courses"
    )

@router.get("/courses/{course_id}/enrollment", response_model=EnrollmentResponse, status_code=status.HTTP_200_OK)
async def get_course_enrollment(
    course_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get enrollment details for a specific course."""
    enrollment = await enrollment_service.get_enrollment(course_id, str(current_user.id))
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not enrolled in this course"
        )
    
    return EnrollmentResponse(
        success=True,
        data=enrollment,
        message="Enrollment retrieved successfully"
    )

@router.delete("/courses/{course_id}/unenroll", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def unenroll_from_course(
    course_id: str,
    current_user: User = Depends(get_current_user)
):
    """Unenroll from a course."""
    try:
        await enrollment_service.unenroll_user(course_id, str(current_user.id))
        
        return MessageResponse(
            success=True,
            message="Successfully unenrolled from course"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/enrollments/{enrollment_id}/certificate", response_model=EnrollmentResponse, status_code=status.HTTP_200_OK)
async def issue_certificate(
    enrollment_id: str,
    current_user: User = Depends(get_current_user)
):
    """Issue certificate for completed course."""
    try:
        # Verify enrollment belongs to user
        enrollment = await Enrollment.get(enrollment_id)
        if not enrollment or enrollment.user_id != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this enrollment"
            )
        
        enrollment = await enrollment_service.issue_certificate(enrollment_id)
        
        return EnrollmentResponse(
            success=True,
            data=enrollment,
            message="Certificate issued successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )