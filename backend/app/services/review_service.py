"""
Review service for business logic
"""
from datetime import datetime
from typing import List, Optional, Dict
from beanie import PydanticObjectId

from app.models.review import Review, ReviewStatus, ReviewVote, ReviewReport
from app.models.user import User
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.schemas.review import (
    ReviewCreateRequest,
    ReviewUpdateRequest,
    ReviewVoteRequest,
    ReviewReportRequest,
    InstructorResponseRequest,
    ReviewModerationRequest,
    ReviewSearchQuery
)


class ReviewService:
    async def create_review(
        self,
        course_id: str,
        user: User,
        review_data: ReviewCreateRequest
    ) -> Review:
        """Create a new review"""
        # Check if user is enrolled
        enrollment = await Enrollment.find_one({
            "user_id": str(user.id),
            "course_id": course_id,
            "is_active": True
        })
        
        if not enrollment:
            raise ValueError("You must be enrolled in the course to review it")
        
        # Check if user already reviewed this course
        existing_review = await Review.find_one({
            "user_id": str(user.id),
            "course_id": course_id
        })
        
        if existing_review:
            raise ValueError("You have already reviewed this course")
        
        # Check if user completed the course
        is_verified = enrollment.progress.get("is_completed", False)
        
        # Create review
        review = Review(
            course_id=course_id,
            user_id=str(user.id),
            enrollment_id=str(enrollment.id),
            user_name=user.name,
            user_avatar=getattr(user, 'avatar', None),
            is_verified_purchase=is_verified,
            rating=review_data.rating,
            title=review_data.title,
            comment=review_data.comment,
            content_quality=review_data.content_quality,
            instructor_quality=review_data.instructor_quality,
            value_for_money=review_data.value_for_money,
            course_structure=review_data.course_structure,
            status=ReviewStatus.APPROVED  # Auto-approve for now
        )
        
        await review.insert()
        
        # Update course rating statistics
        await self._update_course_stats(course_id)
        
        return review

    async def get_review(self, review_id: str) -> Optional[Review]:
        """Get a review by ID"""
        return await Review.get(review_id)

    async def get_reviews(
        self,
        query: ReviewSearchQuery,
        current_user: Optional[User] = None
    ) -> Dict:
        """Get reviews with filtering and pagination"""
        # Build filter
        filter_dict = {"status": ReviewStatus.APPROVED}
        
        if query.course_id:
            filter_dict["course_id"] = query.course_id
        if query.user_id:
            filter_dict["user_id"] = query.user_id
        if query.rating:
            filter_dict["rating"] = query.rating
        if query.is_verified_purchase is not None:
            filter_dict["is_verified_purchase"] = query.is_verified_purchase
        
        # Count total
        total = await Review.find(filter_dict).count()
        
        # Sort
        sort_field = query.sort_by
        if query.sort_order == "desc":
            sort_field = f"-{sort_field}"
        
        # Fetch paginated results
        skip = (query.page - 1) * query.per_page
        reviews = await Review.find(filter_dict).sort(sort_field).skip(skip).limit(query.per_page).to_list()
        
        # Add user vote info if user is authenticated
        if current_user:
            review_ids = [str(r.id) for r in reviews]
            user_votes = await ReviewVote.find({
                "review_id": {"$in": review_ids},
                "user_id": str(current_user.id)
            }).to_list()
            
            vote_map = {v.review_id: v.is_helpful for v in user_votes}
            
            # Convert to response format
            review_dicts = []
            for review in reviews:
                review_dict = review.dict()
                review_dict["user"] = {
                    "id": review.user_id,
                    "name": review.user_name,
                    "avatar": review.user_avatar,
                    "is_verified_purchase": review.is_verified_purchase
                }
                review_dict["user_vote"] = vote_map.get(str(review.id))
                review_dicts.append(review_dict)
        else:
            review_dicts = [self._format_review(r) for r in reviews]
        
        # Get stats if requesting course reviews
        stats = None
        if query.course_id and query.page == 1:
            stats = await self.get_course_stats(query.course_id)
        
        return {
            "items": review_dicts,
            "total": total,
            "page": query.page,
            "per_page": query.per_page,
            "total_pages": (total + query.per_page - 1) // query.per_page,
            "stats": stats
        }

    async def update_review(
        self,
        review_id: str,
        user: User,
        update_data: ReviewUpdateRequest
    ) -> Optional[Review]:
        """Update a review"""
        review = await Review.get(review_id)
        if not review:
            return None
        
        # Check ownership
        if str(review.user_id) != str(user.id):
            raise ValueError("You can only edit your own reviews")
        
        # Update fields
        update_dict = update_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            if field != "edit_reason":
                setattr(review, field, value)
        
        review.is_edited = True
        review.edited_at = datetime.utcnow()
        review.edit_reason = update_data.edit_reason
        review.update_timestamps()
        
        await review.save()
        
        # Update course stats if rating changed
        if "rating" in update_dict:
            await self._update_course_stats(review.course_id)
        
        return review

    async def delete_review(
        self,
        review_id: str,
        user: User
    ) -> bool:
        """Delete a review"""
        review = await Review.get(review_id)
        if not review:
            return False
        
        # Check ownership or admin
        if str(review.user_id) != str(user.id) and user.role != "admin":
            raise ValueError("Unauthorized to delete this review")
        
        course_id = review.course_id
        await review.delete()
        
        # Update course stats
        await self._update_course_stats(course_id)
        
        return True

    async def vote_review(
        self,
        review_id: str,
        user: User,
        vote_data: ReviewVoteRequest
    ) -> Review:
        """Vote on review helpfulness"""
        review = await Review.get(review_id)
        if not review:
            raise ValueError("Review not found")
        
        # Check if already voted
        existing_vote = await ReviewVote.find_one({
            "review_id": review_id,
            "user_id": str(user.id)
        })
        
        if existing_vote:
            # Update vote
            if existing_vote.is_helpful != vote_data.is_helpful:
                # Change vote
                if existing_vote.is_helpful:
                    review.helpful_count -= 1
                    review.unhelpful_count += 1
                else:
                    review.helpful_count += 1
                    review.unhelpful_count -= 1
                
                existing_vote.is_helpful = vote_data.is_helpful
                await existing_vote.save()
            # else: same vote, no change
        else:
            # New vote
            vote = ReviewVote(
                review_id=review_id,
                user_id=str(user.id),
                is_helpful=vote_data.is_helpful
            )
            await vote.insert()
            
            if vote_data.is_helpful:
                review.helpful_count += 1
            else:
                review.unhelpful_count += 1
        
        await review.save()
        return review

    async def report_review(
        self,
        review_id: str,
        user: User,
        report_data: ReviewReportRequest
    ) -> bool:
        """Report a review for moderation"""
        review = await Review.get(review_id)
        if not review:
            raise ValueError("Review not found")
        
        # Check if already reported by this user
        existing_report = await ReviewReport.find_one({
            "review_id": review_id,
            "reported_by": str(user.id)
        })
        
        if existing_report:
            raise ValueError("You have already reported this review")
        
        # Create report
        report = ReviewReport(
            review_id=review_id,
            reported_by=str(user.id),
            reason=report_data.reason,
            details=report_data.details
        )
        await report.insert()
        
        # Increment report count
        review.report_count += 1
        
        # Auto-flag if too many reports
        if review.report_count >= 3:
            review.status = ReviewStatus.FLAGGED
        
        await review.save()
        return True

    async def respond_to_review(
        self,
        review_id: str,
        user: User,
        response_data: InstructorResponseRequest
    ) -> Review:
        """Add instructor response to review"""
        review = await Review.get(review_id)
        if not review:
            raise ValueError("Review not found")
        
        # Verify user is course creator
        course = await Course.get(review.course_id)
        if not course or str(course.creator_id) != str(user.id):
            raise ValueError("Only course creator can respond to reviews")
        
        review.instructor_response = response_data.response
        review.instructor_response_at = datetime.utcnow()
        review.update_timestamps()
        
        await review.save()
        return review

    async def moderate_review(
        self,
        review_id: str,
        admin: User,
        moderation_data: ReviewModerationRequest
    ) -> Review:
        """Moderate a review (admin only)"""
        if admin.role != "admin":
            raise ValueError("Only admins can moderate reviews")
        
        review = await Review.get(review_id)
        if not review:
            raise ValueError("Review not found")
        
        review.status = moderation_data.status
        review.moderation_note = moderation_data.moderation_note
        review.moderated_by = str(admin.id)
        review.moderated_at = datetime.utcnow()
        review.update_timestamps()
        
        await review.save()
        
        # Update course stats if status changed
        if moderation_data.status != ReviewStatus.APPROVED:
            await self._update_course_stats(review.course_id)
        
        return review

    async def get_course_stats(self, course_id: str) -> Dict:
        """Get review statistics for a course"""
        # Aggregate review stats
        pipeline = [
            {"$match": {"course_id": course_id, "status": ReviewStatus.APPROVED}},
            {"$group": {
                "_id": None,
                "total_reviews": {"$sum": 1},
                "average_rating": {"$avg": "$rating"},
                "verified_purchase_count": {
                    "$sum": {"$cond": ["$is_verified_purchase", 1, 0]}
                },
                "rating_counts": {
                    "$push": "$rating"
                },
                "avg_content_quality": {"$avg": "$content_quality"},
                "avg_instructor_quality": {"$avg": "$instructor_quality"},
                "avg_value_for_money": {"$avg": "$value_for_money"},
                "avg_course_structure": {"$avg": "$course_structure"}
            }}
        ]
        
        results = await Review.aggregate(pipeline).to_list(1)
        
        if not results:
            return {
                "total_reviews": 0,
                "average_rating": 0,
                "rating_distribution": {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0},
                "verified_purchase_count": 0,
                "recent_reviews": []
            }
        
        stats = results[0]
        
        # Calculate rating distribution
        rating_distribution = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
        for rating in stats.get("rating_counts", []):
            rating_distribution[str(rating)] += 1
        
        # Get recent reviews
        recent_reviews = await Review.find({
            "course_id": course_id,
            "status": ReviewStatus.APPROVED
        }).sort("-created_at").limit(5).to_list()
        
        return {
            "total_reviews": stats["total_reviews"],
            "average_rating": round(stats["average_rating"], 1) if stats["average_rating"] else 0,
            "rating_distribution": rating_distribution,
            "verified_purchase_count": stats["verified_purchase_count"],
            "avg_content_quality": stats.get("avg_content_quality"),
            "avg_instructor_quality": stats.get("avg_instructor_quality"),
            "avg_value_for_money": stats.get("avg_value_for_money"),
            "avg_course_structure": stats.get("avg_course_structure"),
            "recent_reviews": [self._format_review(r) for r in recent_reviews]
        }

    async def _update_course_stats(self, course_id: str):
        """Update course rating statistics"""
        stats = await self.get_course_stats(course_id)
        
        # Update course model
        course = await Course.get(course_id)
        if course:
            course.stats["average_rating"] = stats["average_rating"]
            course.stats["total_reviews"] = stats["total_reviews"]
            await course.save()

    def _format_review(self, review: Review) -> Dict:
        """Format review for response"""
        return {
            "_id": str(review.id),
            "course_id": review.course_id,
            "user": {
                "id": review.user_id,
                "name": review.user_name,
                "avatar": review.user_avatar,
                "is_verified_purchase": review.is_verified_purchase
            },
            "rating": review.rating,
            "title": review.title,
            "comment": review.comment,
            "content_quality": review.content_quality,
            "instructor_quality": review.instructor_quality,
            "value_for_money": review.value_for_money,
            "course_structure": review.course_structure,
            "status": review.status,
            "helpful_count": review.helpful_count,
            "unhelpful_count": review.unhelpful_count,
            "instructor_response": review.instructor_response,
            "instructor_response_at": review.instructor_response_at,
            "is_edited": review.is_edited,
            "edited_at": review.edited_at,
            "created_at": review.created_at,
            "updated_at": review.updated_at
        }