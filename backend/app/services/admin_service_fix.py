"""
Admin service for course approval and platform management.
Fixed version with better error handling for empty collections.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.database import db
from app.models.course import Course, CourseStatus
from app.models.user import User, UserRole
from app.core.exceptions import NotFoundException, ForbiddenException
from app.schemas.admin import (
    CourseApprovalResponse,
    AdminDashboardStats,
    PendingReviewResponse,
    CreatorStats,
    BulkApprovalResult
)
from app.core.email import email_service
import logging

logger = logging.getLogger(__name__)


class AdminService:
    """Service for admin operations."""
    
    @staticmethod
    async def get_dashboard_stats() -> AdminDashboardStats:
        """Get comprehensive admin dashboard statistics with error handling."""
        # Initialize with default values
        stats_data = {
            "total_users": 0,
            "total_students": 0,
            "total_creators": 0,
            "total_admins": 0,
            "new_users_today": 0,
            "new_users_this_week": 0,
            "total_courses": 0,
            "published_courses": 0,
            "draft_courses": 0,
            "pending_review_courses": 0,
            "archived_courses": 0,
            "total_enrollments": 0,
            "active_enrollments": 0,
            "completed_courses": 0,
            "total_revenue": 0.0,
            "revenue_this_month": 0.0,
            "revenue_today": 0.0,
            "average_course_price": 0.0,
            "active_users_today": 0,
            "active_users_this_week": 0,
            "lessons_completed_today": 0,
            "recent_registrations": [],
            "recent_course_submissions": [],
            "recent_enrollments": []
        }
        
        try:
            # Get current time for date comparisons
            now = datetime.now(timezone.utc)
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            week_start = now - timedelta(days=now.weekday())
            month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            # User statistics - wrap each in try/except
            try:
                stats_data["total_users"] = await db.users.count_documents({})
                stats_data["total_students"] = await db.users.count_documents({"role": UserRole.STUDENT})
                stats_data["total_creators"] = await db.users.count_documents({"role": UserRole.CREATOR})
                stats_data["total_admins"] = await db.users.count_documents({"role": UserRole.ADMIN})
                stats_data["new_users_today"] = await db.users.count_documents({
                    "created_at": {"$gte": today_start}
                })
                stats_data["new_users_this_week"] = await db.users.count_documents({
                    "created_at": {"$gte": week_start}
                })
            except Exception as e:
                logger.warning(f"Error fetching user stats: {str(e)}")
            
            # Course statistics
            try:
                stats_data["total_courses"] = await db.courses.count_documents({})
                stats_data["published_courses"] = await db.courses.count_documents({"status": CourseStatus.PUBLISHED})
                stats_data["draft_courses"] = await db.courses.count_documents({"status": CourseStatus.DRAFT})
                stats_data["pending_review_courses"] = await db.courses.count_documents({"status": CourseStatus.REVIEW})
                stats_data["archived_courses"] = await db.courses.count_documents({"status": CourseStatus.ARCHIVED})
            except Exception as e:
                logger.warning(f"Error fetching course stats: {str(e)}")
            
            # Enrollment statistics
            try:
                stats_data["total_enrollments"] = await db.enrollments.count_documents({})
                stats_data["active_enrollments"] = await db.enrollments.count_documents({"is_active": True})
                stats_data["completed_courses"] = await db.enrollments.count_documents({
                    "progress.is_completed": True
                })
            except Exception as e:
                logger.warning(f"Error fetching enrollment stats: {str(e)}")
            
            # Revenue statistics - handle empty collections
            try:
                revenue_pipeline = [
                    {"$match": {"status": "completed", "type": {"$ne": "refund"}}},
                    {"$group": {
                        "_id": None,
                        "total": {"$sum": "$amount"}
                    }}
                ]
                total_revenue_result = await db.payments.aggregate(revenue_pipeline).to_list(1)
                if total_revenue_result and len(total_revenue_result) > 0:
                    stats_data["total_revenue"] = total_revenue_result[0].get("total", 0.0)
            except Exception as e:
                logger.warning(f"Error fetching total revenue: {str(e)}")
            
            # Revenue this month
            try:
                month_revenue_pipeline = [
                    {"$match": {
                        "status": "completed",
                        "type": {"$ne": "refund"},
                        "created_at": {"$gte": month_start}
                    }},
                    {"$group": {
                        "_id": None,
                        "total": {"$sum": "$amount"}
                    }}
                ]
                month_revenue_result = await db.payments.aggregate(month_revenue_pipeline).to_list(1)
                if month_revenue_result and len(month_revenue_result) > 0:
                    stats_data["revenue_this_month"] = month_revenue_result[0].get("total", 0.0)
            except Exception as e:
                logger.warning(f"Error fetching monthly revenue: {str(e)}")
            
            # Revenue today
            try:
                today_revenue_pipeline = [
                    {"$match": {
                        "status": "completed",
                        "type": {"$ne": "refund"},
                        "created_at": {"$gte": today_start}
                    }},
                    {"$group": {
                        "_id": None,
                        "total": {"$sum": "$amount"}
                    }}
                ]
                today_revenue_result = await db.payments.aggregate(today_revenue_pipeline).to_list(1)
                if today_revenue_result and len(today_revenue_result) > 0:
                    stats_data["revenue_today"] = today_revenue_result[0].get("total", 0.0)
            except Exception as e:
                logger.warning(f"Error fetching today's revenue: {str(e)}")
            
            # Average course price
            try:
                if stats_data["total_courses"] > 0:
                    avg_price_pipeline = [
                        {"$match": {"pricing.is_free": False}},
                        {"$group": {
                            "_id": None,
                            "avg_price": {"$avg": "$pricing.price"}
                        }}
                    ]
                    avg_price_result = await db.courses.aggregate(avg_price_pipeline).to_list(1)
                    if avg_price_result and len(avg_price_result) > 0:
                        stats_data["average_course_price"] = avg_price_result[0].get("avg_price", 0.0) or 0.0
            except Exception as e:
                logger.warning(f"Error fetching average course price: {str(e)}")
            
            # Active users - safe aggregation
            try:
                active_today_count = await db.users.count_documents({
                    "stats.last_active": {"$gte": today_start}
                })
                stats_data["active_users_today"] = active_today_count
                
                active_week_count = await db.users.count_documents({
                    "stats.last_active": {"$gte": week_start}
                })
                stats_data["active_users_this_week"] = active_week_count
            except Exception as e:
                logger.warning(f"Error fetching active users: {str(e)}")
            
            # Lessons completed today - simplified
            try:
                lessons_today = await db.progress.count_documents({
                    "video_progress.completed_at": {"$gte": today_start}
                })
                stats_data["lessons_completed_today"] = lessons_today
            except Exception as e:
                logger.warning(f"Error fetching lesson completions: {str(e)}")
            
            # Recent registrations - safe fetch
            try:
                recent_users = await db.users.find(
                    {},
                    {"_id": 1, "name": 1, "email": 1, "created_at": 1}
                ).sort("created_at", -1).limit(5).to_list(5)
                
                stats_data["recent_registrations"] = [
                    {
                        "_id": str(user["_id"]),
                        "name": user.get("name", "Unknown"),
                        "email": user.get("email", ""),
                        "created_at": user.get("created_at")
                    }
                    for user in recent_users
                ]
            except Exception as e:
                logger.warning(f"Error fetching recent registrations: {str(e)}")
            
            # Recent course submissions - safe fetch
            try:
                recent_courses = await db.courses.find(
                    {"status": CourseStatus.REVIEW},
                    {"_id": 1, "title": 1, "creator_name": 1, "created_at": 1}
                ).sort("created_at", -1).limit(5).to_list(5)
                
                stats_data["recent_course_submissions"] = [
                    {
                        "_id": str(course["_id"]),
                        "title": course.get("title", "Untitled"),
                        "creator_name": course.get("creator_name", "Unknown"),
                        "created_at": course.get("created_at")
                    }
                    for course in recent_courses
                ]
            except Exception as e:
                logger.warning(f"Error fetching recent course submissions: {str(e)}")
            
            # Recent enrollments - safe fetch
            try:
                recent_enrollments = await db.enrollments.find(
                    {},
                    {"_id": 1, "user_id": 1, "course_id": 1, "enrolled_at": 1}
                ).sort("enrolled_at", -1).limit(5).to_list(5)
                
                # Simple enrollment list without lookups for now
                stats_data["recent_enrollments"] = [
                    {
                        "_id": str(enr["_id"]),
                        "user_name": "User",  # Simplified
                        "course_title": "Course",  # Simplified
                        "enrolled_at": enr.get("enrolled_at")
                    }
                    for enr in recent_enrollments
                ]
            except Exception as e:
                logger.warning(f"Error fetching recent enrollments: {str(e)}")
            
            return AdminDashboardStats(**stats_data)
            
        except Exception as e:
            logger.error(f"Critical error in get_dashboard_stats: {str(e)}")
            # Return safe defaults
            return AdminDashboardStats(**stats_data)