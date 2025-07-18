"""
Analytics endpoints for content creators
Provides insights on course performance, student engagement, and revenue
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.core.deps import get_current_user
from app.models.user import User
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.progress import Progress
from app.models.payment import Payment
from app.schemas.base import StandardResponse
from app.core.database import get_database
import logging
from bson import ObjectId

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/creator/overview", response_model=StandardResponse[Dict[str, Any]])
async def get_creator_overview(
    time_range: str = Query("30days", description="Time range: 7days, 30days, 90days, all"),
    current_user: User = Depends(get_current_user)
) -> StandardResponse[Dict[str, Any]]:
    """
    Get creator analytics overview
    
    Returns high-level metrics for content creators including:
    - Total courses and students
    - Revenue statistics
    - Engagement metrics
    - Recent activity
    """
    try:
        # Verify user is a creator or admin
        if current_user.role not in ["creator", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only content creators and admins can access analytics"
            )
        
        # Calculate date range
        end_date = datetime.utcnow()
        if time_range == "7days":
            start_date = end_date - timedelta(days=7)
        elif time_range == "30days":
            start_date = end_date - timedelta(days=30)
        elif time_range == "90days":
            start_date = end_date - timedelta(days=90)
        else:
            start_date = None
        
        # Get creator's courses
        courses = await Course.find(Course.creator_id == str(current_user.id)).to_list()
        course_ids = [str(course.id) for course in courses]
        
        # Get total enrollments
        enrollment_query = {"course_id": {"$in": course_ids}}
        if start_date:
            enrollment_query["enrolled_at"] = {"$gte": start_date}
        total_enrollments = await get_database().enrollments.count_documents(enrollment_query)
        
        # Get active students (accessed in last 7 days)
        active_students_query = {
            "course_id": {"$in": course_ids},
            "last_accessed": {"$gte": datetime.utcnow() - timedelta(days=7)}
        }
        active_students = await get_database().enrollments.count_documents(active_students_query)
        
        # Calculate revenue
        payment_query = {
            "course_id": {"$in": course_ids},
            "status": "completed"
        }
        if start_date:
            payment_query["created_at"] = {"$gte": start_date}
        
        payments = await get_database().payments.find(payment_query).to_list(None)
        total_revenue = sum(payment.get("amount", 0) for payment in payments)
        
        # Get completion rate
        completed_enrollments = await get_database().enrollments.count_documents({
            "course_id": {"$in": course_ids},
            "progress.is_completed": True
        })
        
        completion_rate = (completed_enrollments / total_enrollments * 100) if total_enrollments > 0 else 0
        
        # Get average rating
        total_rating = 0
        total_reviews = 0
        for course in courses:
            if hasattr(course, "stats") and course.stats:
                total_rating += course.stats.get("average_rating", 0) * course.stats.get("total_reviews", 0)
                total_reviews += course.stats.get("total_reviews", 0)
        
        average_rating = (total_rating / total_reviews) if total_reviews > 0 else 0
        
        # Recent activity
        recent_enrollments = await get_database().enrollments.find({
            "course_id": {"$in": course_ids}
        }).sort("enrolled_at", -1).limit(5).to_list(5)
        
        recent_activity = []
        for enrollment in recent_enrollments:
            user = await get_database().users.find_one({"_id": ObjectId(enrollment["user_id"])})
            course = next((c for c in courses if str(c.id) == enrollment["course_id"]), None)
            if user and course:
                recent_activity.append({
                    "type": "enrollment",
                    "user_name": user.get("name", "Unknown"),
                    "course_title": course.title,
                    "timestamp": enrollment["enrolled_at"].isoformat()
                })
        
        return StandardResponse(
            success=True,
            data={
                "overview": {
                    "total_courses": len(courses),
                    "total_students": total_enrollments,
                    "active_students": active_students,
                    "total_revenue": total_revenue,
                    "average_rating": round(average_rating, 1),
                    "completion_rate": round(completion_rate, 1)
                },
                "recent_activity": recent_activity,
                "time_range": time_range
            },
            message="Creator overview retrieved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get creator overview error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve analytics overview"
        )


@router.get("/creator/courses/{course_id}", response_model=StandardResponse[Dict[str, Any]])
async def get_course_analytics(
    course_id: str,
    time_range: str = Query("30days", description="Time range: 7days, 30days, 90days, all"),
    current_user: User = Depends(get_current_user)
) -> StandardResponse[Dict[str, Any]]:
    """
    Get detailed analytics for a specific course
    
    Returns:
    - Enrollment trends
    - Student progress distribution
    - Lesson completion rates
    - Revenue breakdown
    - Student demographics
    """
    try:
        # Verify course ownership
        course = await Course.find_one(Course.id == course_id)
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        if str(course.creator_id) != str(current_user.id) and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this course's analytics"
            )
        
        # Calculate date range
        end_date = datetime.utcnow()
        if time_range == "7days":
            start_date = end_date - timedelta(days=7)
            date_format = "%Y-%m-%d"
        elif time_range == "30days":
            start_date = end_date - timedelta(days=30)
            date_format = "%Y-%m-%d"
        elif time_range == "90days":
            start_date = end_date - timedelta(days=90)
            date_format = "%Y-%m-%d"
        else:
            start_date = None
            date_format = "%Y-%m"
        
        # Get enrollments
        enrollment_query = {"course_id": course_id}
        if start_date:
            enrollment_query["enrolled_at"] = {"$gte": start_date}
        
        enrollments = await get_database().enrollments.find(enrollment_query).to_list(None)
        
        # Enrollment trends
        enrollment_trends = {}
        for enrollment in enrollments:
            date_key = enrollment["enrolled_at"].strftime(date_format)
            enrollment_trends[date_key] = enrollment_trends.get(date_key, 0) + 1
        
        # Sort and format enrollment trends
        enrollment_data = [
            {"date": date, "enrollments": count}
            for date, count in sorted(enrollment_trends.items())
        ]
        
        # Progress distribution
        progress_distribution = {
            "not_started": 0,
            "in_progress": 0,
            "completed": 0
        }
        
        for enrollment in enrollments:
            progress = enrollment.get("progress", {})
            if progress.get("is_completed"):
                progress_distribution["completed"] += 1
            elif progress.get("lessons_completed", 0) > 0:
                progress_distribution["in_progress"] += 1
            else:
                progress_distribution["not_started"] += 1
        
        # Lesson completion rates
        lesson_stats = await get_database().progress.aggregate([
            {"$match": {"course_id": course_id}},
            {"$group": {
                "_id": "$lesson_id",
                "total_students": {"$sum": 1},
                "completed": {"$sum": {"$cond": ["$is_completed", 1, 0]}}
            }}
        ]).to_list(None)
        
        lesson_completion = []
        for stat in lesson_stats:
            completion_rate = (stat["completed"] / stat["total_students"] * 100) if stat["total_students"] > 0 else 0
            lesson_completion.append({
                "lesson_id": stat["_id"],
                "completion_rate": round(completion_rate, 1),
                "total_students": stat["total_students"]
            })
        
        # Revenue analytics
        payments = await get_database().payments.find({
            "course_id": course_id,
            "status": "completed"
        }).to_list(None)
        
        total_revenue = sum(payment.get("amount", 0) for payment in payments)
        payment_count = len(payments)
        average_price = (total_revenue / payment_count) if payment_count > 0 else 0
        
        # Student engagement metrics
        total_watch_time = 0
        average_progress = 0
        
        for enrollment in enrollments:
            progress = enrollment.get("progress", {})
            total_watch_time += progress.get("total_watch_time", 0)
            average_progress += progress.get("completion_percentage", 0)
        
        average_progress = (average_progress / len(enrollments)) if enrollments else 0
        average_watch_time = (total_watch_time / len(enrollments)) if enrollments else 0
        
        return StandardResponse(
            success=True,
            data={
                "course": {
                    "id": course_id,
                    "title": course.title,
                    "total_enrollments": len(enrollments)
                },
                "enrollment_trends": enrollment_data,
                "progress_distribution": progress_distribution,
                "lesson_completion": sorted(lesson_completion, key=lambda x: x["completion_rate"]),
                "revenue": {
                    "total": total_revenue,
                    "average_price": round(average_price, 2),
                    "total_sales": payment_count
                },
                "engagement": {
                    "average_progress": round(average_progress, 1),
                    "average_watch_time": round(average_watch_time / 60, 1),  # Convert to hours
                    "completion_rate": round(progress_distribution["completed"] / len(enrollments) * 100, 1) if enrollments else 0
                },
                "time_range": time_range
            },
            message="Course analytics retrieved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get course analytics error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve course analytics"
        )


@router.get("/creator/students", response_model=StandardResponse[Dict[str, Any]])
async def get_student_analytics(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user)
) -> StandardResponse[Dict[str, Any]]:
    """
    Get analytics about students enrolled in creator's courses
    
    Returns:
    - Student list with progress
    - Engagement metrics
    - Learning patterns
    """
    try:
        # Verify user is a creator
        if current_user.role not in ["creator", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only content creators can access student analytics"
            )
        
        # Get creator's courses
        courses = await Course.find(Course.creator_id == str(current_user.id)).to_list()
        course_ids = [str(course.id) for course in courses]
        course_map = {str(course.id): course for course in courses}
        
        # Get all enrollments for creator's courses
        enrollments = await get_database().enrollments.find({
            "course_id": {"$in": course_ids}
        }).skip(offset).limit(limit).to_list(limit)
        
        # Get unique student IDs
        student_ids = list(set(enrollment["user_id"] for enrollment in enrollments))
        
        # Get student information
        students = await get_database().users.find({
            "_id": {"$in": [ObjectId(sid) for sid in student_ids]}
        }).to_list(None)
        
        student_map = {str(student["_id"]): student for student in students}
        
        # Build student analytics
        student_analytics = []
        
        for student_id in student_ids:
            student = student_map.get(student_id)
            if not student:
                continue
            
            # Get all enrollments for this student in creator's courses
            student_enrollments = [e for e in enrollments if e["user_id"] == student_id]
            
            # Calculate metrics
            total_courses = len(student_enrollments)
            completed_courses = sum(1 for e in student_enrollments if e.get("progress", {}).get("is_completed"))
            total_progress = sum(e.get("progress", {}).get("completion_percentage", 0) for e in student_enrollments)
            average_progress = (total_progress / total_courses) if total_courses > 0 else 0
            
            # Get last activity
            last_activity = max(
                (e.get("progress", {}).get("last_accessed", e["enrolled_at"]) for e in student_enrollments),
                default=None
            )
            
            student_analytics.append({
                "student": {
                    "id": student_id,
                    "name": student.get("name", "Unknown"),
                    "email": student.get("email", ""),
                    "joined_date": student.get("created_at", datetime.utcnow()).isoformat()
                },
                "metrics": {
                    "courses_enrolled": total_courses,
                    "courses_completed": completed_courses,
                    "average_progress": round(average_progress, 1),
                    "last_activity": last_activity.isoformat() if last_activity else None
                },
                "courses": [
                    {
                        "course_id": e["course_id"],
                        "course_title": course_map.get(e["course_id"], {}).title if e["course_id"] in course_map else "Unknown",
                        "progress": e.get("progress", {}).get("completion_percentage", 0),
                        "enrolled_at": e["enrolled_at"].isoformat()
                    }
                    for e in student_enrollments
                ]
            })
        
        # Sort by most active students
        student_analytics.sort(key=lambda x: x["metrics"]["average_progress"], reverse=True)
        
        # Get total count
        total_count = await get_database().enrollments.count_documents({
            "course_id": {"$in": course_ids}
        })
        
        return StandardResponse(
            success=True,
            data={
                "students": student_analytics,
                "pagination": {
                    "total": total_count,
                    "limit": limit,
                    "offset": offset,
                    "has_more": offset + limit < total_count
                }
            },
            message="Student analytics retrieved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get student analytics error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve student analytics"
        )


@router.get("/creator/revenue", response_model=StandardResponse[Dict[str, Any]])
async def get_revenue_analytics(
    time_range: str = Query("30days", description="Time range: 7days, 30days, 90days, year"),
    current_user: User = Depends(get_current_user)
) -> StandardResponse[Dict[str, Any]]:
    """
    Get detailed revenue analytics for content creator
    
    Returns:
    - Revenue trends over time
    - Revenue by course
    - Payment methods breakdown
    - Subscription vs one-time payments
    """
    try:
        # Verify user is a creator
        if current_user.role not in ["creator", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only content creators can access revenue analytics"
            )
        
        # Get creator's courses
        courses = await Course.find(Course.creator_id == str(current_user.id)).to_list()
        course_ids = [str(course.id) for course in courses]
        course_map = {str(course.id): course for course in courses}
        
        # Calculate date range
        end_date = datetime.utcnow()
        if time_range == "7days":
            start_date = end_date - timedelta(days=7)
            group_format = "%Y-%m-%d"
        elif time_range == "30days":
            start_date = end_date - timedelta(days=30)
            group_format = "%Y-%m-%d"
        elif time_range == "90days":
            start_date = end_date - timedelta(days=90)
            group_format = "%Y-%m-%d"
        elif time_range == "year":
            start_date = end_date - timedelta(days=365)
            group_format = "%Y-%m"
        else:
            start_date = end_date - timedelta(days=30)
            group_format = "%Y-%m-%d"
        
        # Get payments
        payment_query = {
            "course_id": {"$in": course_ids},
            "status": "completed",
            "created_at": {"$gte": start_date}
        }
        
        payments = await get_database().payments.find(payment_query).to_list(None)
        
        # Revenue trends
        revenue_trends = {}
        for payment in payments:
            date_key = payment["created_at"].strftime(group_format)
            revenue_trends[date_key] = revenue_trends.get(date_key, 0) + payment.get("amount", 0)
        
        revenue_data = [
            {"date": date, "revenue": amount}
            for date, amount in sorted(revenue_trends.items())
        ]
        
        # Revenue by course
        revenue_by_course = {}
        for payment in payments:
            course_id = payment.get("course_id")
            if course_id in course_map:
                course_title = course_map[course_id].title
                revenue_by_course[course_title] = revenue_by_course.get(course_title, 0) + payment.get("amount", 0)
        
        # Payment type breakdown
        payment_types = {
            "course_purchase": 0,
            "subscription": 0
        }
        
        for payment in payments:
            payment_type = payment.get("type", "course_purchase")
            payment_types[payment_type] = payment_types.get(payment_type, 0) + 1
        
        # Calculate totals
        total_revenue = sum(payment.get("amount", 0) for payment in payments)
        total_transactions = len(payments)
        average_transaction = (total_revenue / total_transactions) if total_transactions > 0 else 0
        
        # Month-over-month growth
        if time_range in ["30days", "90days", "year"]:
            current_month_revenue = sum(
                payment.get("amount", 0) for payment in payments
                if payment["created_at"] >= datetime.utcnow().replace(day=1)
            )
            
            last_month_start = (datetime.utcnow().replace(day=1) - timedelta(days=1)).replace(day=1)
            last_month_end = datetime.utcnow().replace(day=1)
            last_month_revenue = sum(
                payment.get("amount", 0) for payment in payments
                if last_month_start <= payment["created_at"] < last_month_end
            )
            
            growth_rate = ((current_month_revenue - last_month_revenue) / last_month_revenue * 100) if last_month_revenue > 0 else 0
        else:
            growth_rate = 0
        
        return StandardResponse(
            success=True,
            data={
                "summary": {
                    "total_revenue": total_revenue,
                    "total_transactions": total_transactions,
                    "average_transaction": round(average_transaction, 2),
                    "growth_rate": round(growth_rate, 1)
                },
                "revenue_trends": revenue_data,
                "revenue_by_course": [
                    {"course": course, "revenue": revenue}
                    for course, revenue in sorted(revenue_by_course.items(), key=lambda x: x[1], reverse=True)
                ],
                "payment_types": payment_types,
                "time_range": time_range
            },
            message="Revenue analytics retrieved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get revenue analytics error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve revenue analytics"
        )


@router.post("/creator/export/{report_type}", response_model=StandardResponse[Dict[str, Any]])
async def export_analytics_report(
    report_type: str,
    time_range: str = Query("30days", description="Time range for the report"),
    format: str = Query("csv", description="Export format: csv or json"),
    current_user: User = Depends(get_current_user)
) -> StandardResponse[Dict[str, Any]]:
    """
    Export analytics data in various formats
    
    Report types:
    - overview: General creator statistics
    - courses: Detailed course analytics
    - students: Student engagement data
    - revenue: Financial reports
    """
    try:
        # Verify user is a creator
        if current_user.role not in ["creator", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only content creators can export analytics"
            )
        
        # Validate report type
        valid_report_types = ["overview", "courses", "students", "revenue"]
        if report_type not in valid_report_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid report type. Must be one of: {', '.join(valid_report_types)}"
            )
        
        # For now, return a mock response
        # In production, this would generate actual CSV/JSON files
        
        return StandardResponse(
            success=True,
            data={
                "download_url": f"/api/v1/analytics/download/{report_type}_{time_range}.{format}",
                "expires_at": (datetime.utcnow() + timedelta(hours=1)).isoformat(),
                "format": format,
                "report_type": report_type
            },
            message="Analytics export generated successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Export analytics error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export analytics"
        )