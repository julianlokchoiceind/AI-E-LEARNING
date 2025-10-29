"""
Admin service for course approval and platform management.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from beanie import PydanticObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.database import get_database
from app.models.course import Course, CourseStatus
from app.models.user import User, UserRole, UserStatus
from app.core.exceptions import NotFoundException, ForbiddenException
from app.schemas.admin import (
    CourseApprovalResponse,
    AdminDashboardStats,
    PendingReviewResponse,
    CreatorStats,
    BulkApprovalResult
)
from app.core.email import EmailService as email_service
from app.services.token_blacklist_service import token_blacklist_service
import logging

logger = logging.getLogger(__name__)


class AdminService:
    """Service for admin operations."""
    
    @staticmethod
    async def get_dashboard_stats() -> Dict[str, Any]:
        """Get comprehensive admin dashboard statistics."""
        try:
            # Get database instance
            db = get_database()
            
            # Get current time for date comparisons
            now = datetime.now(timezone.utc)
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            week_start = now - timedelta(days=now.weekday())
            month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            # User statistics
            total_users = await db.users.count_documents({})
            total_students = await db.users.count_documents({"role": UserRole.STUDENT})
            total_creators = await db.users.count_documents({"role": UserRole.CREATOR})
            total_admins = await db.users.count_documents({"role": UserRole.ADMIN})
            new_users_today = await db.users.count_documents({
                "created_at": {"$gte": today_start}
            })
            new_users_this_week = await db.users.count_documents({
                "created_at": {"$gte": week_start}
            })
            
            # Course statistics
            total_courses = await db.courses.count_documents({})
            published_courses = await db.courses.count_documents({"status": CourseStatus.PUBLISHED})
            draft_courses = await db.courses.count_documents({"status": CourseStatus.DRAFT})
            pending_review_courses = await db.courses.count_documents({"status": CourseStatus.REVIEW})
            archived_courses = await db.courses.count_documents({"status": CourseStatus.ARCHIVED})
            coming_soon_courses = await db.courses.count_documents({"status": CourseStatus.COMING_SOON})
            
            # Enrollment statistics
            total_enrollments = await db.enrollments.count_documents({})
            active_enrollments = await db.enrollments.count_documents({"is_active": True})
            completed_courses = await db.enrollments.count_documents({
                "progress.is_completed": True
            })
            
            # Revenue statistics (aggregate from payments collection)
            revenue_pipeline = [
                {"$match": {"status": "completed", "type": {"$ne": "refund"}}},
                {"$group": {
                    "_id": None,
                    "total": {"$sum": "$amount"}
                }}
            ]
            total_revenue_result = await db.payments.aggregate(revenue_pipeline).to_list(1)
            total_revenue = total_revenue_result[0]["total"] if total_revenue_result else 0.0
            
            # Revenue this month
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
            revenue_this_month = month_revenue_result[0]["total"] if month_revenue_result else 0.0
            
            # Revenue today
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
            revenue_today = today_revenue_result[0]["total"] if today_revenue_result else 0.0
            
            # Average course price
            avg_price_pipeline = [
                {"$match": {"pricing.is_free": False, "status": CourseStatus.PUBLISHED}},
                {"$group": {
                    "_id": None,
                    "avg_price": {"$avg": "$pricing.price"}
                }}
            ]
            avg_price_result = await db.courses.aggregate(avg_price_pipeline).to_list(1)
            average_course_price = avg_price_result[0]["avg_price"] if avg_price_result else 0.0
            
            # Activity statistics
            active_users_today = await db.users.count_documents({
                "stats.last_active": {"$gte": today_start}
            })
            active_users_this_week = await db.users.count_documents({
                "stats.last_active": {"$gte": week_start}
            })
            
            # Lessons completed today
            lessons_completed_today = await db.progress.count_documents({
                "video_progress.completed_at": {"$gte": today_start}
            })
            
            # Recent activity (last 5 of each)
            recent_registrations = await db.users.find(
                {},
                {"name": 1, "email": 1, "created_at": 1, "role": 1}
            ).sort("created_at", -1).limit(5).to_list(5)
            
            recent_course_submissions = await db.courses.find(
                {"status": CourseStatus.REVIEW},
                {"title": 1, "creator_name": 1, "created_at": 1}
            ).sort("created_at", -1).limit(5).to_list(5)
            
            recent_enrollments = await db.enrollments.aggregate([
                {"$sort": {"enrolled_at": -1}},
                {"$limit": 5},
                {"$lookup": {
                    "from": "users",
                    "localField": "user_id",
                    "foreignField": "_id",
                    "as": "user"
                }},
                {"$lookup": {
                    "from": "courses",
                    "localField": "course_id",
                    "foreignField": "_id",
                    "as": "course"
                }},
                {"$project": {
                    "user_name": {"$arrayElemAt": ["$user.name", 0]},
                    "course_title": {"$arrayElemAt": ["$course.title", 0]},
                    "enrolled_at": 1
                }}
            ]).to_list(5)
            
            # Convert ObjectIds to strings - Fixed conversion
            for reg in recent_registrations:
                reg["id"] = str(reg["_id"])
                reg.pop("_id", None)  # Remove _id after conversion
            for course in recent_course_submissions:
                course["id"] = str(course["_id"])
                course.pop("_id", None)  # Remove _id after conversion
            for enr in recent_enrollments:
                enr["id"] = str(enr["_id"])
                enr.pop("_id", None)  # Remove _id after conversion
            
            return {
                "total_users": total_users,
                "total_students": total_students,
                "total_creators": total_creators,
                "total_admins": total_admins,
                "new_users_today": new_users_today,
                "new_users_this_week": new_users_this_week,
                "total_courses": total_courses,
                "published_courses": published_courses,
                "draft_courses": draft_courses,
                "pending_review_courses": pending_review_courses,
                "archived_courses": archived_courses,
                "coming_soon_courses": coming_soon_courses,
                "total_enrollments": total_enrollments,
                "active_enrollments": active_enrollments,
                "completed_courses": completed_courses,
                "total_revenue": total_revenue,
                "revenue_this_month": revenue_this_month,
                "revenue_today": revenue_today,
                "average_course_price": average_course_price,
                "active_users_today": active_users_today,
                "active_users_this_week": active_users_this_week,
                "lessons_completed_today": lessons_completed_today,
                "recent_registrations": recent_registrations,
                "recent_course_submissions": recent_course_submissions,
                "recent_enrollments": recent_enrollments
            }
        except Exception as e:
            logger.error(f"Error getting dashboard stats: {str(e)}")
            raise
    
    @staticmethod
    async def get_pending_review_courses(page: int, per_page: int) -> List[PendingReviewResponse]:
        """Get courses pending review."""
        try:
            db = get_database()
            skip = (page - 1) * per_page
            
            courses = await db.courses.find(
                {"status": CourseStatus.REVIEW}
            ).sort("created_at", -1).skip(skip).limit(per_page).to_list(per_page)
            
            result = []
            for course in courses:
                result.append(PendingReviewResponse(
                    id=str(course["_id"]),
                    title=course["title"],
                    description=course["description"],
                    creator_id=str(course["creator_id"]),
                    creator_name=course.get("creator_name", "Unknown"),
                    created_at=course["created_at"],
                    submitted_for_review_at=course.get("updated_at", course["created_at"]),
                    category=course["category"],
                    level=course["level"],
                    total_chapters=course.get("total_chapters", 0),
                    total_lessons=course.get("total_lessons", 0),
                    total_duration=course.get("total_duration", 0),
                    pricing=course.get("pricing", {}),
                    preview_url=f"/courses/{course['_id']}"
                ))
            
            return result
        except Exception as e:
            logger.error(f"Error getting pending courses: {str(e)}")
            raise
    
    @staticmethod
    async def approve_course(course_id: str, admin: User) -> Dict[str, Any]:
        """Approve a course for publication."""
        try:
            db = get_database()
            # Find course
            course = await db.courses.find_one({"_id": ObjectId(course_id)})
            if not course:
                raise NotFoundException(f"Course not found: {course_id}")

            # Check if course is in review status
            if course["status"] != CourseStatus.REVIEW:
                return {
                    "success": False,
                    "message": f"Course is not in review status. Current status: {course['status']}",
                    "course_id": course_id,
                    "status": course["status"]
                }
            
            # Update course status to published
            now = datetime.now(timezone.utc)
            result = await db.courses.update_one(
                {"_id": ObjectId(course_id)},
                {
                    "$set": {
                        "status": CourseStatus.PUBLISHED,
                        "published_at": now,
                        "updated_at": now,
                        "approved_by": str(admin.id),
                        "approval_notes": f"Approved by {admin.name}"
                    }
                }
            )
            
            if result.modified_count == 0:
                raise Exception("Failed to update course status")
            
            # Send notification email to creator
            creator = await db.users.find_one({"_id": course["creator_id"]})
            if creator:
                try:
                    await email_service.send_course_approval_email(
                        to_email=creator["email"],
                        creator_name=creator["name"],
                        course_title=course["title"],
                        course_id=course_id
                    )
                    logger.info(f"Course approval email sent to: {creator['email']}")
                except Exception as e:
                    logger.error(f"Failed to send approval email: {str(e)}")
            
            return {
                "success": True,
                "message": "Course approved successfully",
                "course_id": course_id,
                "status": CourseStatus.PUBLISHED,
                "approved_by": str(admin.id),
                "approved_at": now
            }
        except Exception as e:
            logger.error(f"Error approving course: {str(e)}")
            raise
    
    @staticmethod
    async def reject_course(course_id: str, feedback: str, admin: User) -> Dict[str, Any]:
        """Reject a course with feedback."""
        try:
            db = get_database()
            # Find course
            course = await db.courses.find_one({"_id": ObjectId(course_id)})
            if not course:
                raise NotFoundException(f"Course not found: {course_id}")

            # Check if course is in review status
            if course["status"] != CourseStatus.REVIEW:
                return {
                    "success": False,
                    "message": f"Course is not in review status. Current status: {course['status']}",
                    "course_id": course_id,
                    "status": course["status"]
                }
            
            # Update course status back to draft
            now = datetime.now(timezone.utc)
            result = await db.courses.update_one(
                {"_id": ObjectId(course_id)},
                {
                    "$set": {
                        "status": CourseStatus.DRAFT,
                        "updated_at": now,
                        "rejection_feedback": feedback,
                        "rejected_by": str(admin.id),
                        "rejected_at": now
                    }
                }
            )
            
            if result.modified_count == 0:
                raise Exception("Failed to update course status")
            
            # Send notification email to creator
            creator = await db.users.find_one({"_id": course["creator_id"]})
            if creator:
                try:
                    await email_service.send_course_rejection_email(
                        to_email=creator["email"],
                        creator_name=creator["name"],
                        course_title=course["title"],
                        reason=feedback,
                        course_id=course_id
                    )
                    logger.info(f"Course rejection email sent to: {creator['email']}")
                except Exception as e:
                    logger.error(f"Failed to send rejection email: {str(e)}")
            
            return {
                "success": True,
                "message": "Course rejected with feedback",
                "course_id": course_id,
                "status": CourseStatus.DRAFT,
                "feedback": feedback
            }
        except Exception as e:
            logger.error(f"Error rejecting course: {str(e)}")
            raise
    
    @staticmethod
    async def update_course_status(course_id: str, status: CourseStatus, admin: User) -> Dict[str, Any]:
        """Update course status directly."""
        try:
            db = get_database()
            # Find course
            course = await db.courses.find_one({"_id": ObjectId(course_id)})
            if not course:
                raise NotFoundException(f"Course not found: {course_id}")
            
            # Update status
            update_data = {
                "status": status,
                "updated_at": datetime.now(timezone.utc)
            }
            
            # Add published_at if publishing
            if status == CourseStatus.PUBLISHED and course["status"] != CourseStatus.PUBLISHED:
                update_data["published_at"] = datetime.now(timezone.utc)
            
            result = await db.courses.update_one(
                {"_id": ObjectId(course_id)},
                {"$set": update_data}
            )
            
            if result.modified_count == 0:
                return {
                    "success": False,
                    "message": "No changes made"
                }
            
            return {
                "success": True,
                "message": f"Course status updated to {status}",
                "course_id": course_id,
                "status": status
            }
        except Exception as e:
            logger.error(f"Error updating course status: {str(e)}")
            raise
    
    @staticmethod
    async def update_course_pricing(
        course_id: str, 
        is_free: bool, 
        price: Optional[float], 
        admin: User
    ) -> Dict[str, Any]:
        """Update course pricing (admin override)."""
        try:
            db = get_database()
            # Find course
            course = await db.courses.find_one({"_id": ObjectId(course_id)})
            if not course:
                raise NotFoundException(f"Course not found: {course_id}")
            
            # Update pricing
            pricing_update = {
                "pricing.is_free": is_free,
                "updated_at": datetime.now(timezone.utc)
            }
            
            if not is_free and price is not None:
                pricing_update["pricing.price"] = price
            elif is_free:
                pricing_update["pricing.price"] = 0
            
            result = await db.courses.update_one(
                {"_id": ObjectId(course_id)},
                {"$set": pricing_update}
            )
            
            if result.modified_count == 0:
                return {
                    "success": False,
                    "message": "No changes made"
                }
            
            return {
                "success": True,
                "message": "Course pricing updated",
                "course_id": course_id,
                "is_free": is_free,
                "price": price if not is_free else 0
            }
        except Exception as e:
            logger.error(f"Error updating course pricing: {str(e)}")
            raise
    
    @staticmethod
    async def list_content_creators(page: int, per_page: int) -> List[Dict[str, Any]]:
        """List content creators with their statistics."""
        try:
            db = get_database()
            skip = (page - 1) * per_page
            
            # Get creators
            creators = await db.users.find(
                {"role": UserRole.CREATOR}
            ).sort("created_at", -1).skip(skip).limit(per_page).to_list(per_page)
            
            result = []
            for creator in creators:
                creator_id = creator["_id"]
                
                # Get creator's course stats
                course_stats = await db.courses.aggregate([
                    {"$match": {"creator_id": creator_id}},
                    {"$group": {
                        "_id": None,
                        "total_courses": {"$sum": 1},
                        "published_courses": {
                            "$sum": {"$cond": [{"$eq": ["$status", CourseStatus.PUBLISHED]}, 1, 0]}
                        },
                        "total_students": {"$sum": "$stats.total_enrollments"},
                        "total_revenue": {"$sum": "$stats.total_revenue"},
                        "avg_rating": {"$avg": "$stats.average_rating"}
                    }}
                ]).to_list(1)
                
                stats = course_stats[0] if course_stats else {
                    "total_courses": 0,
                    "published_courses": 0,
                    "total_students": 0,
                    "total_revenue": 0,
                    "avg_rating": 0
                }
                
                result.append({
                    "user_id": str(creator_id),
                    "name": creator["name"],
                    "email": creator["email"],
                    "total_courses": stats["total_courses"],
                    "published_courses": stats["published_courses"],
                    "total_students": stats["total_students"] or 0,
                    "total_revenue": stats["total_revenue"] or 0,
                    "average_rating": stats["avg_rating"] or 0,
                    "created_at": creator["created_at"],
                    "last_active": creator.get("stats", {}).get("last_active")
                })
            
            return result
        except Exception as e:
            logger.error(f"Error listing creators: {str(e)}")
            raise
    
    @staticmethod
    async def bulk_approve_courses(course_ids: List[str], admin: User) -> Dict[str, Any]:
        """Bulk approve multiple courses."""
        try:
            approved = []
            failed = []

            for course_id in course_ids:
                try:
                    result = await AdminService.approve_course(course_id, admin)
                    if result["success"]:
                        approved.append(course_id)
                    else:
                        failed.append({course_id: result["message"]})
                except Exception as e:
                    failed.append({course_id: str(e)})

            return {
                "total_processed": len(course_ids),
                "approved": approved,
                "failed": failed,
                "message": f"Approved {len(approved)} courses, {len(failed)} failed"
            }
        except Exception as e:
            logger.error(f"Error in bulk approval: {str(e)}")
            raise
    
    # User Management Methods
    
    @staticmethod
    def get_user_status_display(user: Dict[str, Any]) -> str:
        """
        Smart Backend: Calculate exact display text for user status.
        Follows hierarchy: Deactivated > Role > Premium > Subscription > Free
        """
        # Deactivated status (highest priority)
        if user.get("status") == "deactivated":
            return "Deactivated"

        role = user.get("role")

        # Role-based status (highest priority after deactivated)
        if role == "admin":
            return "Administrator"
        elif role == "creator":
            return "Content Creator"

        # Subscription-based status for students
        if user.get("premium_status"):
            return "Premium Access"  # Admin-granted
        elif user.get("subscription", {}).get("stripe_subscription_id"):
            return "Pro Subscriber"  # Paid subscription
        else:
            return "Free User"


    @staticmethod
    async def list_users(
        page: int = 1,
        per_page: int = 20,
        role: Optional[str] = None,
        premium_only: Optional[bool] = None,
        search: Optional[str] = None
    ) -> Dict[str, Any]:
        """List users with filters and pagination."""
        try:
            skip = (page - 1) * per_page
            
            # Build query
            query = {}
            if role:
                query["role"] = role
            if premium_only is not None:
                query["premium_status"] = premium_only
            if search:
                query["$or"] = [
                    {"name": {"$regex": search, "$options": "i"}},
                    {"email": {"$regex": search, "$options": "i"}}
                ]
            
            # Get total count
            db = get_database()
            total_count = await db.users.count_documents(query)
            
            # Get users
            users = await db.users.find(query).sort("created_at", -1).skip(skip).limit(per_page).to_list(per_page)
            
            # Format response with Smart Backend logic
            formatted_users = []
            for user in users:
                user_data = {
                    "id": str(user["_id"]),
                    "name": user["name"],
                    "email": user["email"],
                    "role": user["role"],
                    "status": user.get("status", "active"),
                    "premium_status": user.get("premium_status", False),
                    "subscription": user.get("subscription"),
                    "created_at": user["created_at"],
                    "last_login": user.get("last_login"),
                    "stats": user.get("stats"),
                    # Smart Backend: Pre-calculated status for Dumb Frontend
                    "status_display": AdminService.get_user_status_display(user),
                    # Additional field for active/deactivated display
                    "activity_status": "Deactivated" if user.get("status") == "deactivated" else "Active",
                    # Deletion metadata (for soft-deleted users)
                    "is_deleted": user.get("is_deleted", False),
                    "deleted_at": user.get("deleted_at"),
                    "deleted_by": user.get("deleted_by"),
                    "deleted_by_name": user.get("deleted_by_name"),
                    "deletion_reason": user.get("deletion_reason"),
                    "original_email": user.get("original_email"),
                    "original_name": user.get("original_name")
                }
                formatted_users.append(user_data)

            return {
                "users": formatted_users,
                "total_count": total_count,
                "page": page,
                "per_page": per_page,
                "total_pages": (total_count + per_page - 1) // per_page
            }
        except Exception as e:
            logger.error(f"Error listing users: {str(e)}")
            raise
    
    @staticmethod
    async def update_user_premium_status(
        user_id: str,
        is_premium: bool,
        admin: User
    ) -> Dict[str, Any]:
        """Update user premium status."""
        try:
            db = get_database()
            user = await db.users.find_one({"_id": ObjectId(user_id)})
            if not user:
                raise NotFoundException(f"User not found: {user_id}")
            
            # Update ONLY premium status - DO NOT modify subscription object
            # Premium status is independent of subscription data
            update_data = {
                "premium_status": is_premium,
                "updated_at": datetime.now(timezone.utc)
            }

            result = await db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )
            
            if result.modified_count == 0:
                return {
                    "success": False,
                    "message": "No changes made"
                }
            
            # Send notification
            try:
                await email_service.send_premium_status_change(
                    user["email"],
                    user["name"],
                    is_premium
                )
            except Exception as e:
                logger.error(f"Failed to send premium status email: {str(e)}")
            
            return {
                "success": True,
                "message": f"User premium status updated to {is_premium}",
                "user_id": user_id,
                "premium_status": is_premium
            }
        except Exception as e:
            logger.error(f"Error updating premium status: {str(e)}")
            raise
    
    @staticmethod
    async def update_user_role(
        user_id: str,
        new_role: str,
        admin: User
    ) -> Dict[str, Any]:
        """Update user role."""
        try:
            db = get_database()
            user = await db.users.find_one({"_id": ObjectId(user_id)})
            if not user:
                raise NotFoundException(f"User not found: {user_id}")
            
            old_role = user["role"]
            
            # Update role
            result = await db.users.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "role": new_role,
                        "updated_at": datetime.now(timezone.utc)
                    }
                }
            )
            
            if result.modified_count == 0:
                return {
                    "success": False,
                    "message": "No changes made"
                }
            
            # Log role change
            logger.info(f"User {user_id} role changed from {old_role} to {new_role} by {admin.id}")
            
            return {
                "success": True,
                "message": f"User role updated to {new_role}",
                "user_id": user_id,
                "old_role": old_role,
                "new_role": new_role
            }
        except Exception as e:
            logger.error(f"Error updating user role: {str(e)}")
            raise
    
    @staticmethod
    async def delete_user(user_id: str, admin: User) -> Dict[str, Any]:
        """Hard delete user account and all related data."""
        try:
            SUPER_ADMIN = "julian.lok88@icloud.com"

            db = get_database()
            user = await db.users.find_one({"_id": ObjectId(user_id)})
            if not user:
                raise NotFoundException(f"User not found: {user_id}")

            # SUPER ADMIN PROTECTION
            # Protection 1: Nobody can delete super admin
            if user["email"] == SUPER_ADMIN:
                return {
                    "success": False,
                    "message": "Cannot delete super administrator account"
                }

            # Protection 2: Only super admin can delete other admins
            if user["role"] == "admin" and admin.email != SUPER_ADMIN:
                return {
                    "success": False,
                    "message": "Only super administrator can delete admin accounts"
                }

            # Conditional Smart Delete: Check if user has important data
            # Check for payments (legal requirement to keep)
            has_payments = await db.payments.count_documents({"user_id": user_id}) > 0

            # Check for certificates (educational credentials cannot be revoked)
            has_certificates = await db.certificates.count_documents({
                "user_id": user_id,
                "is_active": True
            }) > 0

            if has_payments or has_certificates:
                # SOFT DELETE: User has important data - anonymize and deactivate
                logger.info(f"📦 SOFT DELETE: User has payments ({has_payments}) or certificates ({has_certificates}) - performing soft delete with anonymization")

                result = await db.users.update_one(
                    {"_id": ObjectId(user_id)},
                    {"$set": {
                        "status": UserStatus.DEACTIVATED.value,
                        "is_deleted": True,
                        "deleted_at": datetime.now(timezone.utc),
                        "deleted_by": str(admin.id),
                        "deleted_by_name": admin.name,
                        "deletion_reason": "admin_action",
                        "original_email": user["email"],
                        "original_name": user["name"],
                        "name": "Deleted User",
                        "email": f"deleted_{user_id}_{user['email']}",
                        "profile": {},  # Clear profile data
                        "updated_at": datetime.now(timezone.utc)
                    }}
                )

                if result.modified_count == 0:
                    return {
                        "success": False,
                        "message": "Failed to soft delete user"
                    }

                logger.info(f"✅ SOFT DELETE: Successfully soft deleted and anonymized user {user_id}")
                return {
                    "success": True,
                    "action": "soft_deleted",
                    "message": "User account deactivated and anonymized (has payments or certificates)",
                    "user_id": user_id
                }

            # HARD DELETE: User has no important data - safe to remove completely
            logger.info(f"🗑️ HARD DELETE: User has no payments/certificates - performing complete deletion")

            # 1. Transfer course ownership if creator (before deleting user)
            if user["role"] == "creator":
                await db.courses.update_many(
                    {"creator_id": ObjectId(user_id)},
                    {"$set": {
                        "creator_id": admin.id,
                        "creator_name": "Platform Admin",
                        "updated_at": datetime.now(timezone.utc)
                    }}
                )

            # 2. Delete ALL learning progress data
            await db.progress.delete_many({"user_id": user_id})
            await db.quiz_progress.delete_many({"user_id": user_id})

            # 3. Delete enrollments
            await db.enrollments.delete_many({"user_id": user_id})

            # 4. Delete reviews and engagement
            await db.reviews.delete_many({"user_id": user_id})
            await db.review_votes.delete_many({"user_id": user_id})
            await db.review_reports.delete_many({"reported_by": user_id})

            # 5. Delete support tickets
            await db.support_tickets.delete_many({"user_id": user_id})
            await db.ticket_messages.delete_many({"sender_id": user_id})

            # 6. Delete the user account itself
            result = await db.users.delete_one({"_id": ObjectId(user_id)})

            if result.deleted_count == 0:
                return {
                    "success": False,
                    "message": "Failed to delete user from database"
                }

            logger.info(f"✅ HARD DELETE: Successfully deleted user {user_id} and all related data")
            return {
                "success": True,
                "action": "hard_deleted",
                "message": "User account permanently deleted",
                "user_id": user_id
            }
        except Exception as e:
            logger.error(f"Error deleting user: {str(e)}")
            raise
    
    @staticmethod
    async def bulk_user_action(
        user_ids: List[str],
        action: str,
        data: Optional[dict],
        admin: User
    ) -> Dict[str, Any]:
        """Perform bulk actions on users - Following FAQ pattern for delete, individual for others."""
        try:
            if action == "delete":
                # BULK DELETE with individual validation for super admin protection
                SUPER_ADMIN = "julian.lok88@icloud.com"

                deleted = []
                deactivated = []
                failed = []

                for user_id in user_ids:
                    try:
                        # Validate ObjectId
                        ObjectId(user_id)

                        # Get user details for validation
                        db = get_database()
                        user = await db.users.find_one({"_id": ObjectId(user_id)})

                        if not user:
                            failed.append({
                                "user_id": user_id,
                                "error": "User not found"
                            })
                            continue

                        # Apply same protection as individual delete
                        # Protection 1: Nobody can delete super admin
                        if user["email"] == SUPER_ADMIN:
                            failed.append({
                                "user_id": user_id,
                                "error": "Cannot delete super administrator account"
                            })
                            continue

                        # Protection 2: Only super admin can delete other admins
                        if user["role"] == "admin" and admin.email != SUPER_ADMIN:
                            failed.append({
                                "user_id": user_id,
                                "error": "Only super administrator can delete admin accounts"
                            })
                            continue

                        # Use individual delete function for consistent logic
                        result = await AdminService.delete_user(user_id, admin)
                        if result["success"]:
                            if result.get("action") == "deactivated":
                                deactivated.append(user_id)
                            else:
                                deleted.append(user_id)
                        else:
                            failed.append({
                                "user_id": user_id,
                                "error": result["message"]
                            })

                    except Exception as e:
                        failed.append({
                            "user_id": user_id,
                            "error": f"Invalid user ID or error: {str(e)}"
                        })

                total_processed = len(deleted) + len(deactivated)
                has_failures = len(failed) > 0

                if total_processed == 0 and has_failures:
                    return {
                        "success": False,
                        "message": "All operations failed",
                        "deleted": deleted,
                        "deactivated": deactivated,
                        "failed": failed,
                        "total_processed": total_processed
                    }
                else:
                    # Build message parts (mirroring course bulk delete pattern)
                    message_parts = []
                    if len(deleted) > 0:
                        message_parts.append(f"{len(deleted)} deleted")
                    if len(deactivated) > 0:
                        message_parts.append(f"{len(deactivated)} deactivated")
                    if len(failed) > 0:
                        message_parts.append(f"{len(failed)} failed")

                    message = ", ".join(message_parts) if message_parts else "No operations performed"

                    return {
                        "success": True,
                        "message": message,
                        "deleted": deleted,
                        "deactivated": deactivated,
                        "failed": failed,
                        "total_processed": total_processed
                    }
            else:
                # For other actions, keep individual processing
                successful = []
                failed = []

                for user_id in user_ids:
                    try:
                        if action == "update_role" and data and "role" in data:
                            await AdminService.update_user_role(user_id, data["role"], admin)
                            successful.append(user_id)
                        elif action == "toggle_premium" and data and "premium" in data:
                            await AdminService.update_user_premium_status(user_id, data["premium"], admin)
                            successful.append(user_id)
                        elif action == "deactivate":
                            # Check super admin protection
                            db = get_database()
                            user = await db.users.find_one({"_id": ObjectId(user_id)})
                            if user and user["email"] == "julian.lok88@icloud.com":
                                raise ValueError("Cannot deactivate super administrator account")

                            # Deactivate user regardless of enrollments
                            await db.users.update_one(
                                {"_id": ObjectId(user_id)},
                                {"$set": {"status": UserStatus.DEACTIVATED.value, "updated_at": datetime.now(timezone.utc)}}
                            )

                            # Blacklist all tokens for deactivated user
                            await token_blacklist_service.blacklist_all_user_tokens(str(user_id))
                            logger.info(f"🔒 Blacklisted all tokens for deactivated user: {user_id}")

                            successful.append(user_id)
                        elif action == "reactivate":
                            # Check super admin protection
                            db = get_database()
                            user = await db.users.find_one({"_id": ObjectId(user_id)})
                            if user and user["email"] == "julian.lok88@icloud.com":
                                raise ValueError("Cannot reactivate super administrator account")

                            # Check if user was soft-deleted
                            is_soft_deleted = user.get("is_deleted", False)

                            if is_soft_deleted:
                                # Restore soft-deleted user: Restore original data
                                logger.info(f"🔄 RESTORING SOFT-DELETED USER: {user_id}")

                                # Restore original email and name
                                original_email = user.get("original_email")
                                original_name = user.get("original_name")

                                if not original_email or not original_name:
                                    raise ValueError("Cannot restore user: Original data not found")

                                await db.users.update_one(
                                    {"_id": ObjectId(user_id)},
                                    {"$set": {
                                        "status": UserStatus.ACTIVE.value,
                                        "is_deleted": False,
                                        "email": original_email,
                                        "name": original_name,
                                        "updated_at": datetime.now(timezone.utc)
                                    }, "$unset": {
                                        "deleted_at": "",
                                        "deleted_by": "",
                                        "deleted_by_name": "",
                                        "deletion_reason": "",
                                        "original_email": "",
                                        "original_name": ""
                                    }}
                                )
                                logger.info(f"✅ Restored user {user_id}: {original_email}")
                            else:
                                # Regular reactivation (just change status)
                                await db.users.update_one(
                                    {"_id": ObjectId(user_id)},
                                    {"$set": {"status": UserStatus.ACTIVE.value, "updated_at": datetime.now(timezone.utc)}}
                                )

                            # Clear blacklist entries for reactivated user
                            result = await db.blacklisted_tokens.delete_many({
                                "user_id": str(user_id),
                                "all_tokens": True
                            })
                            logger.info(f"🔓 Removed {result.deleted_count} blacklist entries for reactivated user: {user_id}")

                            successful.append(user_id)
                        else:
                            raise ValueError(f"Invalid action or missing data: {action}")

                        # Note: successful.append(user_id) is now handled within each action branch
                    except Exception as e:
                        failed.append({"user_id": user_id, "error": str(e)})

                return {
                    "success": True,
                    "message": f"Processed {len(successful)} users successfully",
                    "successful": successful,
                    "failed": failed,
                    "total_processed": len(user_ids)
                }
        except Exception as e:
            logger.error(f"Error in bulk user action: {str(e)}")
            raise

    @staticmethod
    async def bulk_course_action(
        course_ids: List[str],
        action: str,
        admin: User
    ) -> Dict[str, Any]:
        """Perform bulk actions on courses - Following FAQ pattern with HARD DELETE"""
        try:
            if action == "delete":
                # Convert string IDs to ObjectIds for query
                from app.models.course import Course
                from bson import ObjectId

                # Filter valid ObjectIds
                object_ids = []
                invalid_ids = []

                for course_id in course_ids:
                    try:
                        object_ids.append(PydanticObjectId(course_id))
                    except Exception:
                        invalid_ids.append(course_id)

                if not object_ids:
                    return {
                        "success": False,
                        "message": "No valid course IDs provided",
                        "successful": [],
                        "failed": invalid_ids,
                        "total_processed": 0
                    }

                # Process each course - archive if has enrollments, delete if not
                from app.models.enrollment import Enrollment
                deleted = []
                archived = []
                failed = []

                for i, object_id in enumerate(object_ids):
                    course_id = course_ids[i] if i < len(course_ids) else str(object_id)

                    try:
                        # Get course
                        course = await Course.find_one({"_id": object_id})
                        if not course:
                            failed.append({
                                "id": course_id,
                                "reason": "Course not found"
                            })
                            continue

                        # Check for active enrollments
                        enrollment_count = await Enrollment.find({
                            "course_id": str(object_id),
                            "is_active": True
                        }).count()

                        if enrollment_count > 0:
                            # Archive instead of fail
                            course.status = CourseStatus.ARCHIVED
                            await course.save()
                            archived.append(course_id)
                        else:
                            # Delete if no enrollments
                            await course.delete()
                            deleted.append(course_id)

                    except Exception as e:
                        failed.append({
                            "id": course_id,
                            "reason": f"Error: {str(e)}"
                        })

                # Add invalid IDs to failed list
                for invalid_id in invalid_ids:
                    failed.append({
                        "id": invalid_id,
                        "reason": "Invalid course ID"
                    })

                total_processed = len(deleted) + len(archived)
                has_failures = len(failed) > 0

                if total_processed == 0 and has_failures:
                    # All operations failed
                    return {
                        "success": False,
                        "message": "All operations failed",
                        "deleted": deleted,
                        "archived": archived,
                        "failed": failed,
                        "total_processed": total_processed
                    }
                else:
                    # Success (either complete or partial)
                    message_parts = []
                    if len(deleted) > 0:
                        message_parts.append(f"{len(deleted)} deleted")
                    if len(archived) > 0:
                        message_parts.append(f"{len(archived)} archived")
                    if len(failed) > 0:
                        message_parts.append(f"{len(failed)} failed")

                    message = "Processed: " + ", ".join(message_parts)

                    return {
                        "success": True,
                        "message": message,
                        "deleted": deleted,
                        "archived": archived,
                        "failed": failed,
                        "total_processed": total_processed
                    }
            else:
                raise ValueError(f"Invalid action: {action}")

        except Exception as e:
            logger.error(f"Error in bulk course action: {str(e)}")
            raise

    # Payment Management Methods
    
    @staticmethod
    async def list_payments(
        page: int = 1,
        per_page: int = 20,
        status: Optional[str] = None,
        user_id: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None
    ) -> Dict[str, Any]:
        """List payments with filters."""
        try:
            db = get_database()
            skip = (page - 1) * per_page
            
            # Build query
            query = {}
            if status:
                query["status"] = status
            if user_id:
                query["user_id"] = ObjectId(user_id)
            if date_from or date_to:
                date_query = {}
                if date_from:
                    date_query["$gte"] = datetime.fromisoformat(date_from)
                if date_to:
                    date_query["$lte"] = datetime.fromisoformat(date_to)
                query["created_at"] = date_query
            
            # Get total count
            total_count = await db.payments.count_documents(query)
            
            # Get payments
            payments = await db.payments.find(query).sort("created_at", -1).skip(skip).limit(per_page).to_list(per_page)
            
            return {
                "payments": [
                    {
                        "id": str(payment["_id"]),
                        "user_id": str(payment["user_id"]),
                        "type": payment["type"],
                        "amount": payment["amount"],
                        "currency": payment.get("currency", "USD"),
                        "status": payment["status"],
                        "provider": payment["provider"],
                        "course_id": str(payment["course_id"]) if payment.get("course_id") else None,
                        "created_at": payment["created_at"],
                        "paid_at": payment.get("paid_at")
                    }
                    for payment in payments
                ],
                "total_count": total_count,
                "page": page,
                "per_page": per_page,
                "total_pages": (total_count + per_page - 1) // per_page
            }
        except Exception as e:
            logger.error(f"Error listing payments: {str(e)}")
            raise
    
    @staticmethod
    async def refund_payment(
        payment_id: str,
        amount: Optional[float],
        reason: str,
        admin: User
    ) -> Dict[str, Any]:
        """Process payment refund."""
        try:
            db = get_database()
            
            payment = await db.payments.find_one({"_id": ObjectId(payment_id)})
            if not payment:
                raise NotFoundException(f"Payment not found: {payment_id}")
            
            # For now, we'll simulate the refund process
            # In production, this would integrate with Stripe/payment provider
            refund_amount = amount or payment["amount"]
            
            # Update payment status
            result = await db.payments.update_one(
                {"_id": ObjectId(payment_id)},
                {
                    "$set": {
                        "status": "refunded",
                        "refunded_at": datetime.now(timezone.utc),
                        "refund_amount": refund_amount,
                        "refund_reason": reason,
                        "refunded_by": str(admin.id)
                    }
                }
            )
            
            if result.modified_count == 0:
                return {
                    "success": False,
                    "message": "Failed to process refund"
                }
            
            # Update enrollment status if this was a course purchase
            if payment.get("course_id"):
                await db.enrollments.update_one(
                    {
                        "user_id": payment["user_id"],
                        "course_id": payment["course_id"]
                    },
                    {
                        "$set": {
                            "is_active": False,
                            "refunded_at": datetime.now(timezone.utc)
                        }
                    }
                )
            
            return {
                "success": True,
                "message": "Payment refunded successfully",
                "payment_id": payment_id,
                "refund_amount": refund_amount,
                "status": "refunded"
            }
        except Exception as e:
            logger.error(f"Error processing refund: {str(e)}")
            raise
    
    # Analytics Methods
    
    @staticmethod
    async def get_revenue_analytics(
        period: str = "month",
        date_from: Optional[str] = None,
        date_to: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get revenue analytics."""
        try:
            db = get_database()
            # Calculate date range
            now = datetime.now(timezone.utc)
            if period == "day":
                start_date = now - timedelta(days=1)
            elif period == "week":
                start_date = now - timedelta(weeks=1)
            elif period == "year":
                start_date = now - timedelta(days=365)
            else:  # month
                start_date = now - timedelta(days=30)
            
            if date_from:
                start_date = datetime.fromisoformat(date_from)
            if date_to:
                end_date = datetime.fromisoformat(date_to)
            else:
                end_date = now
            
            # Revenue by type
            revenue_pipeline = [
                {
                    "$match": {
                        "status": "completed",
                        "created_at": {"$gte": start_date, "$lte": end_date}
                    }
                },
                {
                    "$group": {
                        "_id": "$type",
                        "total": {"$sum": "$amount"},
                        "count": {"$sum": 1}
                    }
                }
            ]
            
            revenue_by_type = await db.payments.aggregate(revenue_pipeline).to_list(10)
            
            # Daily revenue
            daily_pipeline = [
                {
                    "$match": {
                        "status": "completed",
                        "created_at": {"$gte": start_date, "$lte": end_date}
                    }
                },
                {
                    "$group": {
                        "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                        "total": {"$sum": "$amount"},
                        "count": {"$sum": 1}
                    }
                },
                {"$sort": {"_id": 1}}
            ]
            
            daily_revenue = await db.payments.aggregate(daily_pipeline).to_list(100)
            
            # Total revenue
            total_revenue = sum(item["total"] for item in revenue_by_type)
            
            # Calculate growth percentage compared to previous period
            prev_period_start = start_date - (end_date - start_date)
            prev_revenue_pipeline = [
                {
                    "$match": {
                        "status": "completed",
                        "type": {"$ne": "refund"},
                        "created_at": {"$gte": prev_period_start, "$lt": start_date}
                    }
                },
                {
                    "$group": {
                        "_id": None,
                        "total": {"$sum": "$amount"}
                    }
                }
            ]
            prev_revenue_result = await db.payments.aggregate(prev_revenue_pipeline).to_list(1)
            prev_total_revenue = prev_revenue_result[0]["total"] if prev_revenue_result else 0.0
            
            growth_percentage = 0
            if prev_total_revenue > 0:
                growth_percentage = round(((total_revenue - prev_total_revenue) / prev_total_revenue) * 100, 2)
            
            # Get subscription vs course sales breakdown
            subscription_revenue = 0
            course_sales = 0
            for item in revenue_by_type:
                if item["_id"] == "subscription":
                    subscription_revenue = item["total"]
                elif item["_id"] == "course_purchase":
                    course_sales = item["total"]
            
            return {
                "period": period,
                "date_range": {
                    "from": start_date.isoformat(),
                    "to": end_date.isoformat()
                },
                "total_revenue": total_revenue,
                "total_monthly": total_revenue,  # For frontend compatibility
                "subscription_revenue": subscription_revenue,
                "course_sales": course_sales,
                "growth_percentage": growth_percentage,
                "revenue_by_type": revenue_by_type,
                "daily_revenue": daily_revenue,
                "currency": "USD"
            }
        except Exception as e:
            logger.error(f"Error getting revenue analytics: {str(e)}")
            raise
    
    @staticmethod
    async def get_user_analytics() -> Dict[str, Any]:
        """Get user analytics."""
        try:
            db = get_database()
            # User stats by role
            role_pipeline = [
                {"$group": {
                    "_id": "$role",
                    "count": {"$sum": 1}
                }}
            ]
            users_by_role = await db.users.aggregate(role_pipeline).to_list(10)
            
            # User growth over time (last 30 days)
            thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
            growth_pipeline = [
                {"$match": {"created_at": {"$gte": thirty_days_ago}}},
                {"$group": {
                    "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                    "count": {"$sum": 1}
                }},
                {"$sort": {"_id": 1}}
            ]
            user_growth = await db.users.aggregate(growth_pipeline).to_list(30)
            
            # Active users (last 7 days)
            seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
            active_users = await db.users.count_documents({
                "stats.last_active": {"$gte": seven_days_ago}
            })
            
            # Premium users
            premium_users = await db.users.count_documents({"premium_status": True})
            pro_subscribers = await db.users.count_documents({
                "subscription.status": "active",
                "subscription.type": "pro"
            })
            
            return {
                "total_users": await db.users.count_documents({}),
                "users_by_role": users_by_role,
                "user_growth": user_growth,
                "active_users_7d": active_users,
                "premium_users": premium_users,
                "pro_subscribers": pro_subscribers
            }
        except Exception as e:
            logger.error(f"Error getting user analytics: {str(e)}")
            raise
    
    @staticmethod
    async def get_user_growth_analytics(period: str = "month") -> Dict[str, Any]:
        """Get user growth analytics."""
        try:
            db = get_database()
            now = datetime.now(timezone.utc)
            
            # Calculate date range based on period
            if period == "day":
                start_date = now - timedelta(days=7)  # Last 7 days
                group_format = "%Y-%m-%d %H:00"  # Hourly
            elif period == "week":
                start_date = now - timedelta(weeks=4)  # Last 4 weeks
                group_format = "%Y-%m-%d"  # Daily
            elif period == "year":
                start_date = now - timedelta(days=365)  # Last year
                group_format = "%Y-%m"  # Monthly
            else:  # month
                start_date = now - timedelta(days=30)  # Last 30 days
                group_format = "%Y-%m-%d"  # Daily
            
            # User growth over time
            growth_pipeline = [
                {"$match": {"created_at": {"$gte": start_date}}},
                {"$group": {
                    "_id": {"$dateToString": {"format": group_format, "date": "$created_at"}},
                    "count": {"$sum": 1}
                }},
                {"$sort": {"_id": 1}}
            ]
            
            user_growth = await db.users.aggregate(growth_pipeline).to_list(1000)
            
            # Growth rate calculation
            total_before = await db.users.count_documents({"created_at": {"$lt": start_date}})
            total_after = await db.users.count_documents({"created_at": {"$gte": start_date}})
            growth_rate = (total_after / total_before * 100) if total_before > 0 else 0
            
            # User retention (users who were active in the period)
            active_users = await db.users.count_documents({
                "stats.last_active": {"$gte": start_date}
            })
            
            total_users = await db.users.count_documents({})
            retention_rate = (active_users / total_users * 100) if total_users > 0 else 0
            
            return {
                "period": period,
                "date_range": {
                    "from": start_date.isoformat(),
                    "to": now.isoformat()
                },
                "user_growth": user_growth,
                "total_new_users": total_after,
                "growth_rate": round(growth_rate, 2),
                "retention_rate": round(retention_rate, 2),
                "active_users": active_users,
                "total_users": total_users
            }
        except Exception as e:
            logger.error(f"Error getting user growth analytics: {str(e)}")
            raise
    
    @staticmethod
    async def list_all_courses(
        page: int = 1,
        per_page: int = 20,
        status: Optional[str] = None,
        search: Optional[str] = None,
        category: Optional[str] = None,
        level: Optional[str] = None,
        creator_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """List all courses for admin management with comprehensive filtering."""
        try:
            db = get_database()
            skip = (page - 1) * per_page
            
            # Build query
            query = {}
            
            # Status filter
            if status:
                query["status"] = status
            
            # Search filter (title, description)
            if search:
                query["$or"] = [
                    {"title": {"$regex": search, "$options": "i"}},
                    {"description": {"$regex": search, "$options": "i"}},
                    {"creator_name": {"$regex": search, "$options": "i"}}
                ]
            
            # Category filter
            if category:
                query["category"] = category
            
            # Level filter  
            if level:
                query["level"] = level
            
            # Creator filter
            if creator_id:
                query["creator_id"] = ObjectId(creator_id)
            
            # Get total count
            total_count = await db.courses.count_documents(query)
            
            # Get courses with creator info
            courses_pipeline = [
                {"$match": query},
                {"$lookup": {
                    "from": "users",
                    "localField": "creator_id", 
                    "foreignField": "_id",
                    "as": "creator_info"
                }},
                {"$lookup": {
                    "from": "enrollments",
                    "localField": "_id",
                    "foreignField": "course_id",
                    "as": "enrollments"
                }},
                {"$addFields": {
                    "creator_name": {"$arrayElemAt": ["$creator_info.name", 0]},
                    "creator_email": {"$arrayElemAt": ["$creator_info.email", 0]},
                    "total_enrollments_actual": {"$size": "$enrollments"},
                    "active_enrollments": {
                        "$size": {
                            "$filter": {
                                "input": "$enrollments",
                                "cond": {"$eq": ["$$this.is_active", True]}
                            }
                        }
                    }
                }},
                {"$sort": {"created_at": -1}},
                {"$skip": skip},
                {"$limit": per_page},
                {"$project": {
                    "creator_info": 0,
                    "enrollments": 0
                }}
            ]
            
            courses = await db.courses.aggregate(courses_pipeline).to_list(per_page)
            
            # Format course data for admin view
            formatted_courses = []
            for course in courses:
                # Calculate completion rate
                completion_rate = 0
                if course.get("active_enrollments", 0) > 0:
                    # Get completed enrollments
                    completed_count = await db.enrollments.count_documents({
                        "course_id": course["_id"],
                        "progress.is_completed": True
                    })
                    completion_rate = round((completed_count / course.get("active_enrollments", 1)) * 100, 2)
                
                # Get recent activity
                recent_enrollments = await db.enrollments.count_documents({
                    "course_id": course["_id"],
                    "enrolled_at": {"$gte": datetime.now(timezone.utc) - timedelta(days=30)}
                })
                
                # Calculate revenue
                total_revenue = 0
                if not course.get("pricing", {}).get("is_free", True):
                    revenue_result = await db.payments.aggregate([
                        {
                            "$match": {
                                "course_id": course["_id"],
                                "status": "completed",
                                "type": "course_purchase"
                            }
                        },
                        {
                            "$group": {
                                "_id": None,
                                "total": {"$sum": "$amount"}
                            }
                        }
                    ]).to_list(1)
                    total_revenue = revenue_result[0]["total"] if revenue_result else 0
                
                formatted_course = {
                    "id": str(course["_id"]),
                    "title": course["title"],
                    "description": course["description"],
                    "short_description": course.get("short_description"),
                    "slug": course.get("slug", ""),
                    "category": course["category"],
                    "level": course["level"],
                    "language": course.get("language", "vi"),
                    "status": course["status"],
                    
                    # Creator information
                    "creator_id": str(course["creator_id"]),
                    "creator_name": course.get("creator_name", "Unknown"),
                    "creator_email": course.get("creator_email", ""),
                    
                    # Content structure
                    "total_chapters": course.get("total_chapters", 0),
                    "total_lessons": course.get("total_lessons", 0),
                    "total_duration": course.get("total_duration", 0),
                    
                    # Pricing information
                    "pricing": {
                        "is_free": course.get("pricing", {}).get("is_free", True),
                        "price": course.get("pricing", {}).get("price", 0),
                        "currency": course.get("pricing", {}).get("currency", "USD"),
                        "discount_price": course.get("pricing", {}).get("discount_price"),
                        "discount_expires": course.get("pricing", {}).get("discount_expires")
                    },
                    
                    # Statistics
                    "stats": {
                        "total_enrollments": course.get("total_enrollments_actual", 0),
                        "active_students": course.get("active_enrollments", 0),
                        "completion_rate": completion_rate,
                        "average_rating": course.get("stats", {}).get("average_rating", 0),
                        "total_reviews": course.get("stats", {}).get("total_reviews", 0),
                        "total_revenue": total_revenue,
                        "recent_enrollments_30d": recent_enrollments
                    },
                    
                    # Timestamps
                    "created_at": course["created_at"],
                    "updated_at": course["updated_at"],
                    "published_at": course.get("published_at"),
                    
                    # Admin-specific fields
                    "approved_by": course.get("approved_by"),
                    "approval_notes": course.get("approval_notes"),
                    "rejection_feedback": course.get("rejection_feedback"),
                    "rejected_by": course.get("rejected_by"),
                    "rejected_at": course.get("rejected_at"),
                    
                    # Media
                    "thumbnail": course.get("thumbnail"),
                    "preview_video": course.get("preview_video"),
                    
                    # SEO
                    "seo": course.get("seo", {}),
                    
                    # Admin actions available
                    "admin_actions": {
                        "can_approve": course["status"] == CourseStatus.REVIEW,
                        "can_reject": course["status"] == CourseStatus.REVIEW,
                        "can_archive": course["status"] == CourseStatus.PUBLISHED,
                        "can_publish": course["status"] in [CourseStatus.DRAFT, CourseStatus.REVIEW],
                        "can_edit_pricing": True,
                        "can_delete": course.get("active_enrollments", 0) == 0
                    }
                }
                
                formatted_courses.append(formatted_course)
            
            # Get summary statistics
            stats_pipeline = [
                {"$match": query},
                {"$group": {
                    "_id": "$status",
                    "count": {"$sum": 1},
                    "total_revenue": {
                        "$sum": {
                            "$cond": [
                                {"$eq": ["$pricing.is_free", False]},
                                {"$multiply": ["$stats.total_enrollments", "$pricing.price"]},
                                0
                            ]
                        }
                    }
                }}
            ]
            
            summary_stats = await db.courses.aggregate(stats_pipeline).to_list(10)
            
            # Calculate total statistics
            total_revenue = sum(stat.get("total_revenue", 0) for stat in summary_stats)
            status_counts = {stat["_id"]: stat["count"] for stat in summary_stats}
            
            return {
                "courses": formatted_courses,
                "total": total_count,
                "page": page,
                "per_page": per_page,
                "total_pages": (total_count + per_page - 1) // per_page,
                "summary": {
                    "total_courses": total_count,
                    "status_breakdown": {
                        "draft": status_counts.get(CourseStatus.DRAFT, 0),
                        "review": status_counts.get(CourseStatus.REVIEW, 0),
                        "published": status_counts.get(CourseStatus.PUBLISHED, 0),
                        "archived": status_counts.get(CourseStatus.ARCHIVED, 0),
                        "coming_soon": status_counts.get(CourseStatus.COMING_SOON, 0)
                    },
                    "total_revenue": total_revenue,
                    "filters_applied": {
                        "status": status,
                        "search": search,
                        "category": category,
                        "level": level,
                        "creator_id": creator_id
                    }
                }
            }
        except Exception as e:
            logger.error(f"Error listing courses for admin: {str(e)}")
            raise

    @staticmethod
    async def get_system_health() -> Dict[str, Any]:
        """Get system health metrics."""
        try:
            db = get_database()
            now = datetime.now(timezone.utc)
            
            # Database connection status
            try:
                # Test database connection
                await db.command("ping")
                db_status = "healthy"
            except Exception:
                db_status = "unhealthy"
            
            # Calculate system metrics
            total_users = await db.users.count_documents({})
            total_courses = await db.courses.count_documents({})
            total_enrollments = await db.enrollments.count_documents({})
            
            # Active sessions (users active in last hour)
            one_hour_ago = now - timedelta(hours=1)
            active_sessions = await db.users.count_documents({
                "stats.last_active": {"$gte": one_hour_ago}
            })
            
            # Recent errors (if we had an errors collection)
            # For now, we'll return mock data
            error_rate = 0.1  # 0.1% error rate
            
            # Storage usage (mock data - in production, this would check actual storage)
            storage_used_gb = round(total_courses * 0.5 + total_enrollments * 0.001, 2)
            storage_limit_gb = 100
            storage_percentage = round((storage_used_gb / storage_limit_gb) * 100, 2)
            
            # Pending support tickets (mock data - would check support tickets collection)
            pending_tickets = 3
            
            # Last backup time (mock data - would check actual backup logs)
            last_backup = (now - timedelta(hours=2)).isoformat()
            
            return {
                "status": "healthy" if db_status == "healthy" else "degraded",
                "timestamp": now.isoformat(),
                "services": {
                    "database": {
                        "status": db_status,
                        "latency_ms": 5
                    },
                    "api": {
                        "status": "healthy",
                        "uptime_percentage": 99.9
                    },
                    "storage": {
                        "status": "healthy",
                        "used_gb": storage_used_gb,
                        "limit_gb": storage_limit_gb,
                        "percentage_used": storage_percentage
                    }
                },
                "metrics": {
                    "active_sessions": active_sessions,
                    "total_users": total_users,
                    "total_courses": total_courses,
                    "total_enrollments": total_enrollments,
                    "error_rate": error_rate,
                    "avg_response_time": 127  # milliseconds
                },
                "alerts": {
                    "pending_tickets": pending_tickets,
                    "critical_errors": 0,
                    "warnings": 0
                },
                "maintenance": {
                    "last_backup": last_backup,
                    "next_scheduled": (now + timedelta(hours=10)).isoformat()
                }
            }
        except Exception as e:
            logger.error(f"Error getting system health: {str(e)}")
            # Return degraded status if we can't get metrics
            return {
                "status": "degraded",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "error": str(e),
                "services": {
                    "database": {"status": "unknown"},
                    "api": {"status": "degraded"},
                    "storage": {"status": "unknown"}
                }
            }

    @staticmethod
    async def get_course_statistics() -> Dict[str, Any]:
        """Get course statistics for dashboard Quick Stats (independent from pagination)."""
        try:
            db = get_database()
            
            # Get total counts from database - NOT from current page
            total_courses = await db.courses.count_documents({})
            pending_review = await db.courses.count_documents({"status": "review"})
            published = await db.courses.count_documents({"status": "published"})
            rejected = await db.courses.count_documents({"status": "rejected"})
            free_courses = await db.courses.count_documents({"pricing.is_free": True})
            
            return {
                "total_courses": total_courses,
                "pending_review": pending_review,
                "published": published,
                "rejected": rejected,
                "free_courses": free_courses
            }
        except Exception as e:
            logger.error(f"Error getting course statistics: {str(e)}")
            raise