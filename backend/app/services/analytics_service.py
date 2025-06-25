"""
Analytics service for course and creator metrics.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.database import db
from app.models.course import CourseStatus
from app.schemas.analytics import (
    CreatorAnalytics,
    CourseAnalytics,
    DailyStats,
    StudentAnalytics
)
import logging

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Service for analytics operations."""
    
    @staticmethod
    def _get_date_range(time_range: str) -> tuple[datetime, datetime]:
        """Get start and end dates based on time range."""
        end_date = datetime.now(timezone.utc)
        
        if time_range == "7days":
            start_date = end_date - timedelta(days=7)
        elif time_range == "30days":
            start_date = end_date - timedelta(days=30)
        elif time_range == "90days":
            start_date = end_date - timedelta(days=90)
        else:  # all
            start_date = datetime(2020, 1, 1, tzinfo=timezone.utc)
            
        return start_date, end_date
    
    @staticmethod
    async def get_creator_analytics(creator_id: str, time_range: str) -> CreatorAnalytics:
        """Get comprehensive analytics for a content creator."""
        try:
            start_date, end_date = AnalyticsService._get_date_range(time_range)
            creator_oid = ObjectId(creator_id)
            
            # Get all creator's courses
            courses = await db.courses.find(
                {"creator_id": creator_oid}
            ).to_list(None)
            
            course_ids = [c["_id"] for c in courses]
            published_courses = sum(1 for c in courses if c["status"] == CourseStatus.PUBLISHED)
            
            # Calculate total stats
            total_students = sum(c.get("stats", {}).get("total_enrollments", 0) for c in courses)
            total_revenue = sum(c.get("stats", {}).get("total_revenue", 0) for c in courses)
            
            # Average rating
            rated_courses = [c for c in courses if c.get("stats", {}).get("total_reviews", 0) > 0]
            average_rating = (
                sum(c.get("stats", {}).get("average_rating", 0) for c in rated_courses) / len(rated_courses)
                if rated_courses else 0
            )
            
            # Period-specific stats
            period_enrollments = await db.enrollments.count_documents({
                "course_id": {"$in": course_ids},
                "enrolled_at": {"$gte": start_date, "$lte": end_date}
            })
            
            # Revenue this period
            period_revenue_result = await db.payments.aggregate([
                {
                    "$match": {
                        "course_id": {"$in": course_ids},
                        "status": "completed",
                        "type": "course_purchase",
                        "created_at": {"$gte": start_date, "$lte": end_date}
                    }
                },
                {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
            ]).to_list(1)
            revenue_this_period = period_revenue_result[0]["total"] if period_revenue_result else 0
            
            # Active students (accessed course in period)
            active_students = await db.progress.distinct(
                "user_id",
                {
                    "course_id": {"$in": course_ids},
                    "last_accessed": {"$gte": start_date, "$lte": end_date}
                }
            )
            
            # Completion rate
            total_enrollments = await db.enrollments.count_documents({
                "course_id": {"$in": course_ids}
            })
            completed_enrollments = await db.enrollments.count_documents({
                "course_id": {"$in": course_ids},
                "progress.is_completed": True
            })
            completion_rate = (completed_enrollments / total_enrollments * 100) if total_enrollments > 0 else 0
            
            # Top courses
            top_courses = []
            for course in sorted(courses, key=lambda c: c.get("stats", {}).get("total_revenue", 0), reverse=True)[:5]:
                top_courses.append({
                    "id": str(course["_id"]),
                    "title": course["title"],
                    "students": course.get("stats", {}).get("total_enrollments", 0),
                    "revenue": course.get("stats", {}).get("total_revenue", 0),
                    "rating": course.get("stats", {}).get("average_rating", 0)
                })
            
            # Watch time stats
            watch_time_result = await db.progress.aggregate([
                {
                    "$match": {
                        "course_id": {"$in": course_ids},
                        "last_accessed": {"$gte": start_date, "$lte": end_date}
                    }
                },
                {
                    "$group": {
                        "_id": None,
                        "total_watch_time": {"$sum": "$video_progress.total_watch_time"},
                        "lessons_completed": {
                            "$sum": {"$cond": ["$video_progress.is_completed", 1, 0]}
                        }
                    }
                }
            ]).to_list(1)
            
            total_watch_time = watch_time_result[0]["total_watch_time"] / 60 if watch_time_result else 0  # Convert to minutes
            lessons_completed = watch_time_result[0]["lessons_completed"] if watch_time_result else 0
            average_watch_time = total_watch_time / len(active_students) if active_students else 0
            
            # Quiz stats
            quiz_stats = await db.progress.aggregate([
                {
                    "$match": {
                        "course_id": {"$in": course_ids},
                        "quiz_progress.is_passed": True,
                        "quiz_progress.passed_at": {"$gte": start_date, "$lte": end_date}
                    }
                },
                {"$count": "quizzes_passed"}
            ]).to_list(1)
            quizzes_passed = quiz_stats[0]["quizzes_passed"] if quiz_stats else 0
            
            # Daily stats for charts
            daily_stats = []
            current_date = start_date
            while current_date <= end_date:
                next_date = current_date + timedelta(days=1)
                
                # Get stats for this day
                day_enrollments = await db.enrollments.count_documents({
                    "course_id": {"$in": course_ids},
                    "enrolled_at": {"$gte": current_date, "$lt": next_date}
                })
                
                day_completions = await db.enrollments.count_documents({
                    "course_id": {"$in": course_ids},
                    "progress.completed_at": {"$gte": current_date, "$lt": next_date}
                })
                
                day_revenue_result = await db.payments.aggregate([
                    {
                        "$match": {
                            "course_id": {"$in": course_ids},
                            "status": "completed",
                            "created_at": {"$gte": current_date, "$lt": next_date}
                        }
                    },
                    {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
                ]).to_list(1)
                day_revenue = day_revenue_result[0]["total"] if day_revenue_result else 0
                
                daily_stats.append(DailyStats(
                    date=current_date,
                    enrollments=day_enrollments,
                    completions=day_completions,
                    revenue=day_revenue,
                    watch_time_minutes=0,  # Could be calculated if needed
                    active_students=0  # Could be calculated if needed
                ))
                
                current_date = next_date
            
            return CreatorAnalytics(
                total_courses=len(courses),
                published_courses=published_courses,
                total_students=total_students,
                active_students=len(active_students),
                total_revenue=total_revenue,
                average_rating=average_rating,
                completion_rate=completion_rate,
                revenue_this_period=revenue_this_period,
                students_this_period=len(active_students),
                enrollments_this_period=period_enrollments,
                top_courses=top_courses,
                average_watch_time=average_watch_time,
                total_watch_time=total_watch_time,
                lessons_completed=lessons_completed,
                quizzes_passed=quizzes_passed,
                daily_stats=daily_stats,
                time_range=time_range,
                start_date=start_date,
                end_date=end_date
            )
        except Exception as e:
            logger.error(f"Error getting creator analytics: {str(e)}")
            raise
    
    @staticmethod
    async def get_course_analytics(course_id: str, time_range: str) -> CourseAnalytics:
        """Get comprehensive analytics for a specific course."""
        try:
            start_date, end_date = AnalyticsService._get_date_range(time_range)
            course_oid = ObjectId(course_id)
            
            # Get course details
            course = await db.courses.find_one({"_id": course_oid})
            if not course:
                raise ValueError(f"Course not found: {course_id}")
            
            # Total stats
            total_enrollments = course.get("stats", {}).get("total_enrollments", 0)
            total_revenue = course.get("stats", {}).get("total_revenue", 0)
            average_rating = course.get("stats", {}).get("average_rating", 0)
            total_reviews = course.get("stats", {}).get("total_reviews", 0)
            
            # Period enrollments
            period_enrollments = await db.enrollments.count_documents({
                "course_id": course_oid,
                "enrolled_at": {"$gte": start_date, "$lte": end_date}
            })
            
            # Active students
            active_students = await db.progress.distinct(
                "user_id",
                {
                    "course_id": course_oid,
                    "last_accessed": {"$gte": start_date, "$lte": end_date}
                }
            )
            
            # Completed students
            completed_students = await db.enrollments.count_documents({
                "course_id": course_oid,
                "progress.is_completed": True
            })
            completion_rate = (completed_students / total_enrollments * 100) if total_enrollments > 0 else 0
            
            # Revenue this period
            period_revenue_result = await db.payments.aggregate([
                {
                    "$match": {
                        "course_id": course_oid,
                        "status": "completed",
                        "created_at": {"$gte": start_date, "$lte": end_date}
                    }
                },
                {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
            ]).to_list(1)
            revenue_this_period = period_revenue_result[0]["total"] if period_revenue_result else 0
            
            # Average progress
            progress_result = await db.enrollments.aggregate([
                {"$match": {"course_id": course_oid}},
                {"$group": {
                    "_id": None,
                    "avg_progress": {"$avg": "$progress.completion_percentage"}
                }}
            ]).to_list(1)
            average_progress = progress_result[0]["avg_progress"] if progress_result else 0
            
            # Watch time
            watch_time_result = await db.progress.aggregate([
                {"$match": {"course_id": course_oid}},
                {"$group": {
                    "_id": None,
                    "total_watch_time": {"$sum": "$video_progress.total_watch_time"}
                }}
            ]).to_list(1)
            total_watch_time = watch_time_result[0]["total_watch_time"] / 60 if watch_time_result else 0  # Minutes
            average_watch_time = total_watch_time / total_enrollments if total_enrollments > 0 else 0
            
            # Lesson completion rates
            lessons = await db.lessons.find({"course_id": course_oid}).to_list(None)
            lesson_completion_rates = []
            
            for lesson in lessons:
                completed = await db.progress.count_documents({
                    "lesson_id": lesson["_id"],
                    "video_progress.is_completed": True
                })
                total = await db.progress.count_documents({"lesson_id": lesson["_id"]})
                
                lesson_completion_rates.append({
                    "lesson_id": str(lesson["_id"]),
                    "lesson_title": lesson["title"],
                    "completion_rate": (completed / total * 100) if total > 0 else 0
                })
            
            # Quiz pass rates
            quizzes = await db.quizzes.find({"course_id": course_oid}).to_list(None)
            quiz_pass_rates = []
            
            for quiz in quizzes:
                quiz_attempts = await db.progress.aggregate([
                    {"$match": {"lesson_id": quiz["lesson_id"]}},
                    {"$unwind": "$quiz_progress.attempts"},
                    {"$group": {
                        "_id": None,
                        "total_attempts": {"$sum": 1},
                        "passed_attempts": {
                            "$sum": {"$cond": ["$quiz_progress.attempts.passed", 1, 0]}
                        },
                        "avg_score": {"$avg": "$quiz_progress.attempts.score"}
                    }}
                ]).to_list(1)
                
                if quiz_attempts:
                    stats = quiz_attempts[0]
                    pass_rate = (stats["passed_attempts"] / stats["total_attempts"] * 100) if stats["total_attempts"] > 0 else 0
                    quiz_pass_rates.append({
                        "quiz_id": str(quiz["_id"]),
                        "quiz_title": quiz["title"],
                        "pass_rate": pass_rate,
                        "average_score": stats["avg_score"] or 0
                    })
            
            # Daily stats
            daily_stats = []
            current_date = start_date
            while current_date <= end_date:
                next_date = current_date + timedelta(days=1)
                
                day_enrollments = await db.enrollments.count_documents({
                    "course_id": course_oid,
                    "enrolled_at": {"$gte": current_date, "$lt": next_date}
                })
                
                day_completions = await db.enrollments.count_documents({
                    "course_id": course_oid,
                    "progress.completed_at": {"$gte": current_date, "$lt": next_date}
                })
                
                day_revenue_result = await db.payments.aggregate([
                    {
                        "$match": {
                            "course_id": course_oid,
                            "status": "completed",
                            "created_at": {"$gte": current_date, "$lt": next_date}
                        }
                    },
                    {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
                ]).to_list(1)
                day_revenue = day_revenue_result[0]["total"] if day_revenue_result else 0
                
                daily_stats.append(DailyStats(
                    date=current_date,
                    enrollments=day_enrollments,
                    completions=day_completions,
                    revenue=day_revenue,
                    watch_time_minutes=0,
                    active_students=0
                ))
                
                current_date = next_date
            
            return CourseAnalytics(
                course_id=course_id,
                course_title=course["title"],
                total_enrollments=total_enrollments,
                active_students=len(active_students),
                completed_students=completed_students,
                completion_rate=completion_rate,
                average_rating=average_rating,
                total_reviews=total_reviews,
                total_revenue=total_revenue,
                revenue_this_period=revenue_this_period,
                average_progress=average_progress,
                average_watch_time=average_watch_time,
                total_watch_time=total_watch_time,
                lesson_completion_rates=lesson_completion_rates,
                quiz_pass_rates=quiz_pass_rates,
                student_countries=[],  # Would need to join with user data
                student_levels={"beginner": 0, "intermediate": 0, "advanced": 0},  # Would need user data
                daily_stats=daily_stats,
                time_range=time_range,
                start_date=start_date,
                end_date=end_date
            )
        except Exception as e:
            logger.error(f"Error getting course analytics: {str(e)}")
            raise