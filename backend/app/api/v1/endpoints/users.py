from typing import Dict, Any, Tuple, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
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
from datetime import datetime, timedelta, date
from beanie import PydanticObjectId
from app.core.performance import measure_performance
from app.services.db_optimization import db_optimizer

import csv
import io
import json
import pytz
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

router = APIRouter()

# =============================================================================
# UTILITY FUNCTIONS - Streak Calculation Optimized
# =============================================================================

async def _calculate_learning_streaks(user_id: str, timezone: str = "Asia/Ho_Chi_Minh") -> Tuple[int, int]:
    """
    🔥 Calculate current and longest learning streaks from Progress database.
    Optimized utility function - 100% accurate, single source of truth.
    
    Returns: (current_streak, longest_streak)
    """
    # Get completed lessons from database
    completed_progress = await Progress.find({
        "user_id": user_id,
        "is_completed": True,
        "completed_at": {"$exists": True, "$ne": None}
    }).sort([("completed_at", 1)]).to_list()
    
    if not completed_progress:
        return 0, 0
    
    # Convert to user timezone and extract unique dates
    tz = pytz.timezone(timezone)
    today = datetime.now(tz).date()
    
    active_dates = sorted(set(
        progress.completed_at.astimezone(tz).date()
        for progress in completed_progress
    ))
    
    # Calculate current streak (from today backwards)
    current_streak = _calculate_current_streak(active_dates, today)
    
    # Calculate longest streak ever
    longest_streak = _calculate_longest_streak(active_dates)
    
    return current_streak, longest_streak


def _calculate_current_streak(active_dates: List[date], today: date) -> int:
    """Calculate current streak from today backwards."""
    if not active_dates:
        return 0
    
    latest_date = active_dates[-1]
    days_since = (today - latest_date).days
    
    # Grace period: still active if learned today or yesterday
    if days_since > 1:
        return 0
    
    # Count consecutive days backwards
    streak = 1
    check_date = latest_date - timedelta(days=1)
    
    for i in range(len(active_dates) - 2, -1, -1):
        if active_dates[i] == check_date:
            streak += 1
            check_date -= timedelta(days=1)
        else:
            break
    
    return streak


def _calculate_longest_streak(active_dates: List[date]) -> int:
    """Calculate longest consecutive streak in history."""
    if not active_dates:
        return 0
    
    longest_streak = 1
    current_streak = 1
    
    for i in range(1, len(active_dates)):
        if (active_dates[i] - active_dates[i-1]).days == 1:
            current_streak += 1
            longest_streak = max(longest_streak, current_streak)
        else:
            current_streak = 1
    
    return longest_streak

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
            key=lambda e: e.last_accessed or e.enrolled_at,
            reverse=True
        )[:5]
        
        # Get recent course details
        recent_courses = []
        for enrollment in recent_enrollments:
            course = await Course.get(enrollment.course_id)
            if course:
                # Get the smart continue lesson ID
                from app.services.learn_service import LearnService
                continue_lesson_id = await LearnService._get_smart_continue_lesson_id(
                    enrollment, str(current_user.id), str(course.id)
                )
                
                # Simple time ago calculation
                last_accessed_display = "Never"
                if enrollment.last_accessed:
                    time_diff = datetime.utcnow() - enrollment.last_accessed
                    total_seconds = time_diff.total_seconds()
                    
                    if total_seconds < 60:
                        last_accessed_display = "Just now"
                    elif total_seconds < 3600:  # Less than 1 hour
                        minutes = int(total_seconds // 60)
                        last_accessed_display = f"{minutes} minute{'s' if minutes != 1 else ''} ago"
                    elif total_seconds < 86400:  # Less than 1 day
                        hours = int(total_seconds // 3600)
                        last_accessed_display = f"{hours} hour{'s' if hours != 1 else ''} ago"
                    else:  # 1 day or more
                        days = int(total_seconds // 86400)
                        last_accessed_display = f"{days} day{'s' if days != 1 else ''} ago"
                
                recent_courses.append({
                    "id": str(course.id),
                    "title": course.title,
                    "thumbnail": course.thumbnail,
                    "progress": enrollment.progress.completion_percentage,
                    "last_accessed": enrollment.last_accessed,
                    "last_accessed_display": last_accessed_display,
                    "continue_lesson_id": continue_lesson_id
                })
        
        # Calculate learning streak - Optimized utility functions
        current_streak, longest_streak = await _calculate_learning_streaks(user_id, current_user.preferences.timezone)
        
        # Update user stats - SYNC hoàn toàn với database thực tế
        current_user.stats.courses_enrolled = total_enrolled_courses
        current_user.stats.courses_completed = completed_courses
        current_user.stats.total_hours_learned = total_hours_learned
        current_user.stats.current_streak = current_streak  # ← FIX: Cập nhật current streak
        current_user.stats.longest_streak = longest_streak  # ← FIX: Reset longest streak dựa trên database thực tế
        current_user.stats.last_active = datetime.utcnow()
        
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
                "longest_streak": longest_streak
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

@router.get("/export-progress")
async def export_learning_progress(
    format: str = Query(..., pattern="^(csv|pdf)$", description="Export format: csv or pdf"),
    current_user: User = Depends(get_current_user)
):
    """
    Export user's complete learning progress in CSV or PDF format.
    
    Includes:
    - Course enrollment details
    - Individual lesson progress
    - Quiz scores and attempts
    - Completion dates and watch time
    - Overall statistics
    """
    try:
        user_id = str(current_user.id)
        
        # Get all user enrollments with course details
        enrollments = await Enrollment.find({"user_id": user_id}).to_list()
        
        # Get detailed progress data
        progress_data = []
        total_courses = len(enrollments)
        completed_courses = 0
        total_hours = 0.0
        total_lessons_completed = 0
        
        for enrollment in enrollments:
            # Get course details
            course = await Course.get(enrollment.course_id)
            if not course:
                continue
                
            # Get all progress records for this course
            lesson_progresses = await Progress.find({
                "user_id": user_id,
                "course_id": enrollment.course_id
            }).to_list()
            
            # Calculate course statistics
            course_completed_lessons = sum(1 for p in lesson_progresses if p.is_completed)
            course_total_watch_time = sum(p.video_progress.total_watch_time for p in lesson_progresses) / 3600  # Convert to hours
            course_completion = enrollment.progress.completion_percentage
            
            # Update totals
            if enrollment.progress.is_completed:
                completed_courses += 1
            total_hours += course_total_watch_time
            total_lessons_completed += course_completed_lessons
            
            # Course-level data
            course_data = {
                "type": "course",
                "course_title": course.title,
                "course_category": course.category,
                "course_level": course.level,
                "enrollment_type": enrollment.enrollment_type,
                "enrolled_date": enrollment.enrolled_at.strftime("%Y-%m-%d %H:%M:%S"),
                "completion_percentage": round(course_completion, 1),
                "is_completed": enrollment.progress.is_completed,
                "completed_date": enrollment.progress.completed_at.strftime("%Y-%m-%d %H:%M:%S") if enrollment.progress.completed_at else "Not completed",
                "total_lessons": enrollment.progress.total_lessons,
                "lessons_completed": course_completed_lessons,
                "total_watch_time_hours": round(course_total_watch_time, 2),
                "certificate_issued": enrollment.certificate.is_issued,
                "certificate_date": enrollment.certificate.issued_at.strftime("%Y-%m-%d") if enrollment.certificate.issued_at else "Not issued",
                "last_accessed": enrollment.last_accessed.strftime("%Y-%m-%d %H:%M:%S") if enrollment.last_accessed else "Never"
            }
            progress_data.append(course_data)
            
            # Add lesson-level data
            for lesson_progress in lesson_progresses:
                lesson_data = {
                    "type": "lesson",
                    "course_title": course.title,
                    "lesson_id": lesson_progress.lesson_id,
                    "watch_percentage": round(lesson_progress.video_progress.watch_percentage, 1),
                    "watch_time_minutes": round(lesson_progress.video_progress.total_watch_time / 60, 2),
                    "is_completed": lesson_progress.is_completed,
                    "started_date": lesson_progress.started_at.strftime("%Y-%m-%d %H:%M:%S") if lesson_progress.started_at else "Not started",
                    "completed_date": lesson_progress.completed_at.strftime("%Y-%m-%d %H:%M:%S") if lesson_progress.completed_at else "Not completed",
                    "last_accessed": lesson_progress.last_accessed.strftime("%Y-%m-%d %H:%M:%S"),
                    "quiz_attempts": len(lesson_progress.quiz_progress.attempts) if lesson_progress.quiz_progress else 0,
                    "quiz_best_score": round(lesson_progress.quiz_progress.best_score, 1) if lesson_progress.quiz_progress else "No quiz",
                    "quiz_passed": lesson_progress.quiz_progress.is_passed if lesson_progress.quiz_progress else "No quiz"
                }
                progress_data.append(lesson_data)
        
        # Generate summary statistics
        summary_stats = {
            "export_date": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "user_name": current_user.name,
            "user_email": current_user.email,
            "total_courses_enrolled": total_courses,
            "courses_completed": completed_courses,
            "courses_in_progress": total_courses - completed_courses,
            "total_learning_hours": round(total_hours, 2),
            "total_lessons_completed": total_lessons_completed,
            "current_streak_days": current_user.stats.current_streak,
            "longest_streak_days": current_user.stats.longest_streak,
            "certificates_earned": current_user.stats.certificates_earned,
            "member_since": current_user.created_at.strftime("%Y-%m-%d")
        }
        
        if format == "csv":
            return await generate_csv_export(progress_data, summary_stats, current_user.name)
        elif format == "pdf":
            return await generate_pdf_export(progress_data, summary_stats, current_user.name)
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export progress: {str(e)}"
        )

async def generate_csv_export(progress_data: list, summary_stats: dict, user_name: str):
    """Generate CSV export of learning progress."""
    output = io.StringIO()
    
    # Write summary section
    writer = csv.writer(output)
    writer.writerow(["=== LEARNING PROGRESS EXPORT ==="])
    writer.writerow([])
    writer.writerow(["SUMMARY STATISTICS"])
    writer.writerow(["Export Date", summary_stats["export_date"]])
    writer.writerow(["Student Name", summary_stats["user_name"]])
    writer.writerow(["Email", summary_stats["user_email"]])
    writer.writerow(["Member Since", summary_stats["member_since"]])
    writer.writerow([])
    writer.writerow(["LEARNING STATISTICS"])
    writer.writerow(["Total Courses Enrolled", summary_stats["total_courses_enrolled"]])
    writer.writerow(["Courses Completed", summary_stats["courses_completed"]])
    writer.writerow(["Courses In Progress", summary_stats["courses_in_progress"]])
    writer.writerow(["Total Learning Hours", summary_stats["total_learning_hours"]])
    writer.writerow(["Total Lessons Completed", summary_stats["total_lessons_completed"]])
    writer.writerow(["Current Streak (Days)", summary_stats["current_streak_days"]])
    writer.writerow(["Longest Streak (Days)", summary_stats["longest_streak_days"]])
    writer.writerow(["Certificates Earned", summary_stats["certificates_earned"]])
    writer.writerow([])
    
    # Write course progress section
    writer.writerow(["=== COURSE PROGRESS ==="])
    course_headers = [
        "Course Title", "Category", "Level", "Enrollment Type", "Enrolled Date",
        "Completion %", "Is Completed", "Completed Date", "Total Lessons",
        "Lessons Completed", "Watch Time (Hours)", "Certificate Issued", "Certificate Date", "Last Accessed"
    ]
    writer.writerow(course_headers)
    
    for item in progress_data:
        if item["type"] == "course":
            writer.writerow([
                item["course_title"], item["course_category"], item["course_level"],
                item["enrollment_type"], item["enrolled_date"], item["completion_percentage"],
                item["is_completed"], item["completed_date"], item["total_lessons"],
                item["lessons_completed"], item["total_watch_time_hours"], 
                item["certificate_issued"], item["certificate_date"], item["last_accessed"]
            ])
    
    writer.writerow([])
    
    # Write lesson progress section
    writer.writerow(["=== LESSON PROGRESS ==="])
    lesson_headers = [
        "Course Title", "Lesson ID", "Watch %", "Watch Time (Min)", "Is Completed",
        "Started Date", "Completed Date", "Last Accessed", "Quiz Attempts", "Quiz Best Score", "Quiz Passed"
    ]
    writer.writerow(lesson_headers)
    
    for item in progress_data:
        if item["type"] == "lesson":
            writer.writerow([
                item["course_title"], item["lesson_id"], item["watch_percentage"],
                item["watch_time_minutes"], item["is_completed"], item["started_date"],
                item["completed_date"], item["last_accessed"], item["quiz_attempts"],
                item["quiz_best_score"], item["quiz_passed"]
            ])
    
    output.seek(0)
    
    # Create filename with timestamp
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"learning_progress_{user_name.replace(' ', '_')}_{timestamp}.csv"
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

async def generate_pdf_export(progress_data: list, summary_stats: dict, user_name: str):
    """Generate PDF export of learning progress."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    
    # Build PDF content
    story = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=1  # Center alignment
    )
    story.append(Paragraph("Learning Progress Report", title_style))
    story.append(Spacer(1, 20))
    
    # Summary section
    story.append(Paragraph("Summary Statistics", styles['Heading2']))
    summary_data = [
        ["Export Date", summary_stats["export_date"]],
        ["Student Name", summary_stats["user_name"]],
        ["Email", summary_stats["user_email"]],
        ["Member Since", summary_stats["member_since"]],
        ["", ""],
        ["Total Courses Enrolled", str(summary_stats["total_courses_enrolled"])],
        ["Courses Completed", str(summary_stats["courses_completed"])],
        ["Courses In Progress", str(summary_stats["courses_in_progress"])],
        ["Total Learning Hours", str(summary_stats["total_learning_hours"])],
        ["Total Lessons Completed", str(summary_stats["total_lessons_completed"])],
        ["Current Streak (Days)", str(summary_stats["current_streak_days"])],
        ["Longest Streak (Days)", str(summary_stats["longest_streak_days"])],
        ["Certificates Earned", str(summary_stats["certificates_earned"])]
    ]
    
    summary_table = Table(summary_data, colWidths=[3*inch, 3*inch])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 20))
    
    # Course progress section
    story.append(Paragraph("Course Progress", styles['Heading2']))
    course_data = [["Course Title", "Category", "Level", "Completion %", "Status", "Certificate"]]
    
    for item in progress_data:
        if item["type"] == "course":
            status = "Completed" if item["is_completed"] else "In Progress"
            certificate = "Issued" if item["certificate_issued"] else "Not Issued"
            course_data.append([
                item["course_title"][:30] + "..." if len(item["course_title"]) > 30 else item["course_title"],
                item["course_category"],
                item["course_level"],
                f"{item['completion_percentage']}%",
                status,
                certificate
            ])
    
    if len(course_data) > 1:  # Has data beyond headers
        course_table = Table(course_data, colWidths=[2.5*inch, 1*inch, 1*inch, 0.8*inch, 1*inch, 1*inch])
        course_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ]))
        story.append(course_table)
    else:
        story.append(Paragraph("No course enrollments found.", styles['Normal']))
    
    story.append(Spacer(1, 20))
    
    # Footer
    footer_text = f"Generated on {summary_stats['export_date']} | AI E-Learning Platform"
    story.append(Paragraph(footer_text, styles['Normal']))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    
    # Create filename with timestamp
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"learning_progress_{user_name.replace(' ', '_')}_{timestamp}.pdf"
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/recent-courses", response_model=StandardResponse[list], status_code=status.HTTP_200_OK)
@measure_performance("api.users.recent_courses")
async def get_recent_courses(
    limit: int = Query(default=5, ge=1, le=20),
    current_user: User = Depends(get_current_user)
) -> StandardResponse[list]:
    """Get recently accessed courses with progress information."""
    try:
        # Get all enrollments
        enrollments = await enrollment_service.get_user_enrollments(str(current_user.id))
        
        # Sort by last accessed date
        recent_enrollments = sorted(
            enrollments,
            key=lambda e: e.last_accessed or e.enrolled_at,
            reverse=True
        )[:limit]
        
        # Get course details for recent enrollments
        recent_courses = []
        for enrollment in recent_enrollments:
            course = await Course.get(enrollment.course_id)
            if course:
                recent_courses.append({
                    "id": str(course.id),
                    "title": course.title,
                    "thumbnail": course.thumbnail,
                    "progress": enrollment.progress.completion_percentage,
                    "last_accessed": enrollment.last_accessed,
                    "enrolled_at": enrollment.enrolled_at,
                    "is_completed": enrollment.progress.is_completed
                })
        
        return StandardResponse(
            success=True,
            data=recent_courses,
            message=f"Found {len(recent_courses)} recent courses"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/progress-statistics", response_model=StandardResponse[dict], status_code=status.HTTP_200_OK)
@measure_performance("api.users.progress_statistics")
async def get_progress_statistics(
    current_user: User = Depends(get_current_user)
) -> StandardResponse[dict]:
    """Get detailed learning progress statistics."""
    try:
        # Get all enrollments
        enrollments = await enrollment_service.get_user_enrollments(str(current_user.id))
        
        # Calculate statistics
        total_courses = len(enrollments)
        completed_courses = sum(1 for e in enrollments if e.progress.is_completed)
        in_progress_courses = total_courses - completed_courses
        
        # Calculate total hours and completion rate
        total_hours = sum(e.progress.total_watch_time / 60 for e in enrollments)
        completion_rate = (completed_courses / total_courses * 100) if total_courses > 0 else 0
        
        # Get progress by category
        category_progress = {}
        for enrollment in enrollments:
            course = await Course.get(enrollment.course_id)
            if course:
                category = course.category
                if category not in category_progress:
                    category_progress[category] = {
                        "total": 0,
                        "completed": 0,
                        "in_progress": 0,
                        "hours": 0
                    }
                category_progress[category]["total"] += 1
                if enrollment.progress.is_completed:
                    category_progress[category]["completed"] += 1
                else:
                    category_progress[category]["in_progress"] += 1
                category_progress[category]["hours"] += enrollment.progress.total_watch_time / 60
        
        # Calculate weekly progress
        from datetime import timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_activity = []
        
        # Get progress records from last 7 days
        for enrollment in enrollments:
            if enrollment.last_accessed and enrollment.last_accessed > week_ago:
                recent_activity.append({
                    "date": enrollment.last_accessed.date(),
                    "minutes": enrollment.progress.total_watch_time / 60
                })
        
        statistics = {
            "overview": {
                "total_courses": total_courses,
                "completed_courses": completed_courses,
                "in_progress_courses": in_progress_courses,
                "total_hours_learned": round(total_hours, 1),
                "completion_rate": round(completion_rate, 1),
                "certificates_earned": current_user.stats.certificates_earned,
                "current_streak": current_user.stats.current_streak,
                "longest_streak": current_user.stats.longest_streak
            },
            "category_breakdown": category_progress,
            "recent_activity": recent_activity,
            "member_since": current_user.created_at,
            "last_active": current_user.stats.last_active
        }
        
        return StandardResponse(
            success=True,
            data=statistics,
            message="Progress statistics retrieved successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/debug-streak", response_model=StandardResponse[dict], status_code=status.HTTP_200_OK)
async def debug_streak_calculation(
    current_user: User = Depends(get_current_user)
) -> StandardResponse[dict]:
    """Debug endpoint to check actual streak calculation from database."""
    try:
        
        from app.models.progress import Progress
        import pytz
        
        user_id = str(current_user.id)
        
        # Get all completed progress records
        completed_progress = await Progress.find({
            "user_id": user_id,
            "is_completed": True,
            "completed_at": {"$exists": True, "$ne": None}
        }).sort([("completed_at", 1)]).to_list()
        
        # Get Vietnam timezone
        vietnam_tz = pytz.timezone('Asia/Ho_Chi_Minh')
        today = datetime.now(vietnam_tz).date()
        
        # Group by completion dates
        daily_completions = {}
        for progress in completed_progress:
            vn_time = progress.completed_at.astimezone(vietnam_tz)
            completion_date = vn_time.date()
            
            if completion_date not in daily_completions:
                daily_completions[completion_date] = []
            
            daily_completions[completion_date].append({
                'lesson_id': progress.lesson_id,
                'course_id': progress.course_id,
                'completed_at': vn_time.isoformat()
            })
        
        # Calculate streak using existing utility function
        current_streak, longest_streak = await _calculate_learning_streaks(user_id, current_user.preferences.timezone)
        
        # Prepare debug data
        debug_data = {
            "user_id": user_id,
            "user_name": current_user.name,
            "user_timezone": current_user.preferences.timezone,
            "today": today.isoformat(),
            "total_completed_lessons": len(completed_progress),
            "total_active_days": len(daily_completions),
            "daily_completions": {
                str(date_key): activities 
                for date_key, activities in daily_completions.items()
            },
            "calculated_streak": {"current_streak": current_streak, "longest_streak": longest_streak},
            "stored_in_user": {
                "current_streak": current_user.stats.current_streak,
                "longest_streak": current_user.stats.longest_streak
            }
        }
        
        return StandardResponse(
            success=True,
            data=debug_data,
            message="Streak debug data retrieved successfully"
        )
    except Exception as e:
        import traceback
        return StandardResponse(
            success=False,
            data={"error": str(e), "traceback": traceback.format_exc()},
            message="Debug failed"
        )

@router.get("/certificates", response_model=StandardResponse[list], status_code=status.HTTP_200_OK)
@measure_performance("api.users.certificates")
async def get_my_certificates(
    current_user: User = Depends(get_current_user)
) -> StandardResponse[list]:
    """Get all certificates earned by the user."""
    try:
        # Get all completed enrollments with certificates
        enrollments = await Enrollment.find({
            "user_id": str(current_user.id),
            "certificate.is_issued": True
        }).to_list()
        
        certificates = []
        for enrollment in enrollments:
            course = await Course.get(enrollment.course_id)
            if course:
                certificates.append({
                    "certificate_id": enrollment.certificate.certificate_id,
                    "course_id": str(course.id),
                    "course_title": course.title,
                    "course_thumbnail": course.thumbnail,
                    "issued_at": enrollment.certificate.issued_at,
                    "final_score": enrollment.certificate.final_score,
                    "verification_url": enrollment.certificate.verification_url,
                    "instructor_name": course.creator_name,
                    "course_duration": course.total_duration,
                    "completion_date": enrollment.progress.completed_at
                })
        
        # Sort by issue date (newest first)
        certificates.sort(key=lambda x: x["issued_at"], reverse=True)
        
        return StandardResponse(
            success=True,
            data=certificates,
            message=f"Found {len(certificates)} certificates"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )