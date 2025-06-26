"""
Admin service for course approval and platform management.
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
        """Get comprehensive admin dashboard statistics."""
        try:
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
            
            # Convert ObjectIds to strings
            for reg in recent_registrations:
                reg["_id"] = str(reg["_id"])
            for course in recent_course_submissions:
                course["_id"] = str(course["_id"])
            for enr in recent_enrollments:
                enr["_id"] = str(enr["_id"])
            
            return AdminDashboardStats(
                total_users=total_users,
                total_students=total_students,
                total_creators=total_creators,
                total_admins=total_admins,
                new_users_today=new_users_today,
                new_users_this_week=new_users_this_week,
                total_courses=total_courses,
                published_courses=published_courses,
                draft_courses=draft_courses,
                pending_review_courses=pending_review_courses,
                archived_courses=archived_courses,
                total_enrollments=total_enrollments,
                active_enrollments=active_enrollments,
                completed_courses=completed_courses,
                total_revenue=total_revenue,
                revenue_this_month=revenue_this_month,
                revenue_today=revenue_today,
                average_course_price=average_course_price,
                active_users_today=active_users_today,
                active_users_this_week=active_users_this_week,
                lessons_completed_today=lessons_completed_today,
                recent_registrations=recent_registrations,
                recent_course_submissions=recent_course_submissions,
                recent_enrollments=recent_enrollments
            )
        except Exception as e:
            logger.error(f"Error getting dashboard stats: {str(e)}")
            raise
    
    @staticmethod
    async def get_pending_review_courses(page: int, per_page: int) -> List[PendingReviewResponse]:
        """Get courses pending review."""
        try:
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
    async def approve_course(course_id: str, admin: User) -> CourseApprovalResponse:
        """Approve a course for publication."""
        try:
            # Find course
            course = await db.courses.find_one({"_id": ObjectId(course_id)})
            if not course:
                raise NotFoundException(f"Course not found: {course_id}")
            
            # Check if course is in review status
            if course["status"] != CourseStatus.REVIEW:
                return CourseApprovalResponse(
                    success=False,
                    message=f"Course is not in review status. Current status: {course['status']}",
                    course_id=course_id,
                    status=course["status"]
                )
            
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
            
            return CourseApprovalResponse(
                success=True,
                message="Course approved successfully",
                course_id=course_id,
                status=CourseStatus.PUBLISHED,
                approved_by=str(admin.id),
                approved_at=now
            )
        except Exception as e:
            logger.error(f"Error approving course: {str(e)}")
            raise
    
    @staticmethod
    async def reject_course(course_id: str, feedback: str, admin: User) -> CourseApprovalResponse:
        """Reject a course with feedback."""
        try:
            # Find course
            course = await db.courses.find_one({"_id": ObjectId(course_id)})
            if not course:
                raise NotFoundException(f"Course not found: {course_id}")
            
            # Check if course is in review status
            if course["status"] != CourseStatus.REVIEW:
                return CourseApprovalResponse(
                    success=False,
                    message=f"Course is not in review status. Current status: {course['status']}",
                    course_id=course_id,
                    status=course["status"]
                )
            
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
            
            return CourseApprovalResponse(
                success=True,
                message="Course rejected with feedback",
                course_id=course_id,
                status=CourseStatus.DRAFT,
                feedback=feedback
            )
        except Exception as e:
            logger.error(f"Error rejecting course: {str(e)}")
            raise
    
    @staticmethod
    async def update_course_status(course_id: str, status: CourseStatus, admin: User) -> Dict[str, Any]:
        """Update course status directly."""
        try:
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
    async def bulk_approve_courses(course_ids: List[str], admin: User) -> BulkApprovalResult:
        """Bulk approve multiple courses."""
        try:
            approved = []
            failed = []
            
            for course_id in course_ids:
                try:
                    result = await AdminService.approve_course(course_id, admin)
                    if result.success:
                        approved.append(course_id)
                    else:
                        failed.append({course_id: result.message})
                except Exception as e:
                    failed.append({course_id: str(e)})
            
            return BulkApprovalResult(
                total_processed=len(course_ids),
                approved=approved,
                failed=failed,
                message=f"Approved {len(approved)} courses, {len(failed)} failed"
            )
        except Exception as e:
            logger.error(f"Error in bulk approval: {str(e)}")
            raise
    
    # User Management Methods
    
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
            total_count = await User.find(query).count()
            
            # Get users
            users = await User.find(query).sort("-created_at").skip(skip).limit(per_page).to_list()
            
            # Format response
            return {
                "users": [
                    {
                        "id": str(user.id),
                        "name": user.name,
                        "email": user.email,
                        "role": user.role,
                        "premium_status": user.premium_status,
                        "subscription": user.subscription,
                        "created_at": user.created_at,
                        "last_login": user.last_login,
                        "stats": user.stats
                    }
                    for user in users
                ],
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
            user = await User.get(user_id)
            if not user:
                raise NotFoundException(f"User not found: {user_id}")
            
            user.premium_status = is_premium
            user.updated_at = datetime.utcnow()
            await user.save()
            
            # Send notification
            try:
                await EmailService.send_premium_status_change(
                    user.email,
                    user.name,
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
            user = await User.get(user_id)
            if not user:
                raise NotFoundException(f"User not found: {user_id}")
            
            old_role = user.role
            user.role = new_role
            user.updated_at = datetime.utcnow()
            await user.save()
            
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
        """Soft delete user account."""
        try:
            user = await User.get(user_id)
            if not user:
                raise NotFoundException(f"User not found: {user_id}")
            
            # Anonymize user data
            user.email = f"deleted_{user_id}@deleted.com"
            user.name = f"Deleted User {user_id[:8]}"
            user.password = "DELETED"
            user.is_active = False
            user.deleted_at = datetime.utcnow()
            user.deleted_by = str(admin.id)
            await user.save()
            
            # Transfer course ownership if creator
            if user.role == "creator":
                await Course.find({"creator_id": user.id}).update_many(
                    {"$set": {"creator_id": admin.id, "creator_name": "Platform Admin"}}
                )
            
            return {
                "success": True,
                "message": "User account deleted",
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
        """Perform bulk actions on users."""
        try:
            successful = []
            failed = []
            
            for user_id in user_ids:
                try:
                    if action == "delete":
                        await AdminService.delete_user(user_id, admin)
                    elif action == "update_role" and data and "role" in data:
                        await AdminService.update_user_role(user_id, data["role"], admin)
                    elif action == "toggle_premium" and data and "premium" in data:
                        await AdminService.update_user_premium_status(user_id, data["premium"], admin)
                    else:
                        raise ValueError(f"Invalid action or missing data: {action}")
                    
                    successful.append(user_id)
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
            from app.models.payment import Payment
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
            total_count = await Payment.find(query).count()
            
            # Get payments
            payments = await Payment.find(query).sort("-created_at").skip(skip).limit(per_page).to_list()
            
            return {
                "payments": [
                    {
                        "id": str(payment.id),
                        "user_id": str(payment.user_id),
                        "type": payment.type,
                        "amount": payment.amount,
                        "currency": payment.currency,
                        "status": payment.status,
                        "provider": payment.provider,
                        "course_id": str(payment.course_id) if payment.course_id else None,
                        "created_at": payment.created_at,
                        "paid_at": payment.paid_at
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
            from app.models.payment import Payment
            from app.services.payment_service import PaymentService
            
            payment = await Payment.get(payment_id)
            if not payment:
                raise NotFoundException(f"Payment not found: {payment_id}")
            
            # Process refund through payment service
            result = await PaymentService.process_refund(
                payment,
                amount,
                reason,
                admin
            )
            
            return result
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
            
            return {
                "period": period,
                "date_range": {
                    "from": start_date.isoformat(),
                    "to": end_date.isoformat()
                },
                "total_revenue": total_revenue,
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