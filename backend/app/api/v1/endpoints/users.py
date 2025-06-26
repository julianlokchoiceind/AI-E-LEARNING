from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.user import User
from app.models.enrollment import Enrollment
from app.models.progress import Progress
from app.models.course import Course
from app.core.deps import get_current_user
from app.services.enrollment_service import enrollment_service
from app.services.progress_service import progress_service
from app.schemas.user import UserResponse, UserProfileUpdate, DashboardData
from app.schemas.enrollment import EnrollmentListResponse
from app.schemas.base import StandardResponse
from datetime import datetime, timedelta
from beanie import PydanticObjectId
from app.core.performance import measure_performance
from app.services.db_optimization import db_optimizer

router = APIRouter()

@router.get("/me", response_model=StandardResponse[UserResponse], status_code=status.HTTP_200_OK)
async def get_my_profile(
    current_user: User = Depends(get_current_user)
) -> StandardResponse[UserResponse]:
    """Get current user's profile information."""
    user_data = UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        name=current_user.name,
        role=current_user.role,
        premium_status=current_user.premium_status,
        is_verified=current_user.is_verified,
        profile=current_user.profile,
        stats=current_user.stats,
        preferences=current_user.preferences,
        subscription=current_user.subscription,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        last_login=current_user.last_login
    )
    return StandardResponse(
        success=True,
        data=user_data,
        message="Profile retrieved successfully"
    )

@router.put("/me", response_model=StandardResponse[UserResponse], status_code=status.HTTP_200_OK)
async def update_my_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[UserResponse]:
    """Update current user's profile."""
    try:
        # Update profile fields
        if profile_data.name:
            current_user.name = profile_data.name
        
        if profile_data.profile:
            # Update profile nested fields
            if profile_data.profile.bio is not None:
                current_user.profile.bio = profile_data.profile.bio
            if profile_data.profile.location is not None:
                current_user.profile.location = profile_data.profile.location
            if profile_data.profile.linkedin is not None:
                current_user.profile.linkedin = profile_data.profile.linkedin
            if profile_data.profile.github is not None:
                current_user.profile.github = profile_data.profile.github
            if profile_data.profile.website is not None:
                current_user.profile.website = profile_data.profile.website
            if profile_data.profile.title is not None:
                current_user.profile.title = profile_data.profile.title
            if profile_data.profile.skills is not None:
                current_user.profile.skills = profile_data.profile.skills
            if profile_data.profile.learning_goals is not None:
                current_user.profile.learning_goals = profile_data.profile.learning_goals
        
        if profile_data.preferences:
            # Update preferences
            if profile_data.preferences.language is not None:
                current_user.preferences.language = profile_data.preferences.language
            if profile_data.preferences.timezone is not None:
                current_user.preferences.timezone = profile_data.preferences.timezone
            if profile_data.preferences.email_notifications is not None:
                current_user.preferences.email_notifications = profile_data.preferences.email_notifications
            if profile_data.preferences.push_notifications is not None:
                current_user.preferences.push_notifications = profile_data.preferences.push_notifications
            if profile_data.preferences.marketing_emails is not None:
                current_user.preferences.marketing_emails = profile_data.preferences.marketing_emails
        
        current_user.updated_at = datetime.utcnow()
        await current_user.save()
        
        user_data = UserResponse(
            id=str(current_user.id),
            email=current_user.email,
            name=current_user.name,
            role=current_user.role,
            premium_status=current_user.premium_status,
            is_verified=current_user.is_verified,
            profile=current_user.profile,
            stats=current_user.stats,
            preferences=current_user.preferences,
            subscription=current_user.subscription,
            created_at=current_user.created_at,
            updated_at=current_user.updated_at,
            last_login=current_user.last_login
        )
        return StandardResponse(
            success=True,
            data=user_data,
            message="Profile updated successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/dashboard", response_model=StandardResponse[DashboardData], status_code=status.HTTP_200_OK)
@measure_performance("api.users.dashboard")
async def get_dashboard_data(
    current_user: User = Depends(get_current_user)
) -> StandardResponse[DashboardData]:
    """Get user dashboard data with aggregated statistics."""
    try:
        user_id = str(current_user.id)
        
        # Get all enrollments
        enrollments = await enrollment_service.get_user_enrollments(user_id)
        
        # Calculate stats
        total_enrolled_courses = len(enrollments)
        completed_courses = sum(1 for e in enrollments if e.progress.is_completed)
        in_progress_courses = total_enrolled_courses - completed_courses
        
        # Calculate total hours learned across all enrollments
        total_hours_learned = sum(e.progress.total_watch_time / 60 for e in enrollments)
        
        # Get recent courses (last 5 accessed)
        recent_enrollments = sorted(
            enrollments,
            key=lambda e: e.progress.last_accessed or e.enrolled_at,
            reverse=True
        )[:5]
        
        # Get recent course details
        recent_courses = []
        for enrollment in recent_enrollments:
            course = await Course.get(enrollment.course_id)
            if course:
                recent_courses.append({
                    "id": str(course.id),
                    "title": course.title,
                    "thumbnail": course.thumbnail,
                    "progress": enrollment.progress.completion_percentage,
                    "last_accessed": enrollment.progress.last_accessed
                })
        
        # Calculate learning streak (simplified version)
        # Check if user has learned in the last 24 hours
        current_streak = 0
        if enrollments:
            latest_activity = max(
                (e.progress.last_accessed or e.enrolled_at for e in enrollments),
                default=datetime.utcnow()
            )
            if latest_activity and (datetime.utcnow() - latest_activity) < timedelta(days=1):
                current_streak = current_user.stats.current_streak + 1
            else:
                current_streak = 0
        
        # Update user stats
        current_user.stats.courses_enrolled = total_enrolled_courses
        current_user.stats.courses_completed = completed_courses
        current_user.stats.total_hours_learned = total_hours_learned
        current_user.stats.current_streak = current_streak
        current_user.stats.last_active = datetime.utcnow()
        
        if current_streak > current_user.stats.longest_streak:
            current_user.stats.longest_streak = current_streak
        
        await current_user.save()
        
        # Get upcoming lessons (next lesson in each in-progress course)
        upcoming_lessons = []
        for enrollment in enrollments:
            if not enrollment.progress.is_completed:
                # This is a simplified version - in production, you'd get the actual next lesson
                course = await Course.get(enrollment.course_id)
                if course:
                    upcoming_lessons.append({
                        "course_id": str(course.id),
                        "course_title": course.title,
                        "lesson_title": "Next lesson in course",  # Simplified
                        "estimated_time": 15  # minutes
                    })
        
        # Prepare dashboard data
        dashboard_data = {
            "user": {
                "id": str(current_user.id),
                "name": current_user.name,
                "email": current_user.email,
                "avatar": current_user.profile.avatar,
                "role": current_user.role,
                "premium_status": current_user.premium_status
            },
            "stats": {
                "total_courses": total_enrolled_courses,
                "completed_courses": completed_courses,
                "in_progress_courses": in_progress_courses,
                "total_hours_learned": round(total_hours_learned, 1),
                "current_streak": current_streak,
                "longest_streak": current_user.stats.longest_streak
            },
            "recent_courses": recent_courses,
            "upcoming_lessons": upcoming_lessons[:3],  # Limit to 3
            "certificates_earned": current_user.stats.certificates_earned
        }
        
        return StandardResponse(
            success=True,
            data=DashboardData(**dashboard_data),
            message="Dashboard data retrieved successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/my-courses", response_model=StandardResponse[list], status_code=status.HTTP_200_OK)
async def get_my_courses_with_progress(
    current_user: User = Depends(get_current_user)
) -> StandardResponse[list]:
    """Get all enrolled courses with detailed progress information."""
    try:
        from app.schemas.enrollment import EnrollmentSchema
        
        # Get enrollments with course details
        enrollments = await enrollment_service.get_user_enrollments_with_courses(str(current_user.id))
        
        return StandardResponse(
            success=True,
            data=enrollments,
            message=f"Found {len(enrollments)} enrolled courses"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )