"""
Course Reaction service for like/dislike business logic (YouTube-style)
"""
from typing import Optional, Dict, Literal
from datetime import datetime

from app.models.course_like import CourseReaction
from app.models.course import Course
from app.models.user import User


class CourseReactionService:
    async def toggle_reaction(
        self,
        course_id: str,
        user: User,
        reaction_type: Literal["like", "dislike"]
    ) -> Dict:
        """Toggle reaction (like/dislike) for a course - YouTube style behavior"""
        user_id = str(user.id)

        # Check if course exists
        course = await Course.find_one({"_id": course_id})
        if not course:
            from beanie import PydanticObjectId
            course = await Course.get(PydanticObjectId(course_id))

        if not course:
            raise ValueError("Course not found")

        # Check if user already has a reaction
        existing_reaction = await CourseReaction.find_one({
            "course_id": course_id,
            "user_id": user_id
        })

        if existing_reaction:
            if existing_reaction.reaction_type == reaction_type:
                # Same reaction - toggle off (remove)
                await existing_reaction.delete()
                user_reaction = None
                message = f"Reaction removed"
            else:
                # Different reaction - switch
                existing_reaction.reaction_type = reaction_type
                existing_reaction.created_at = datetime.utcnow()
                await existing_reaction.save()
                user_reaction = reaction_type
                message = f"Changed to {reaction_type}"
        else:
            # No existing reaction - create new
            new_reaction = CourseReaction(
                course_id=course_id,
                user_id=user_id,
                reaction_type=reaction_type,
                created_at=datetime.utcnow()
            )
            await new_reaction.insert()
            user_reaction = reaction_type
            message = f"Course {reaction_type}d"

        # Update course stats
        await self._update_course_stats(course_id)

        # Get updated counts
        like_count = await self.get_reaction_count(course_id, "like")
        dislike_count = await self.get_reaction_count(course_id, "dislike")

        return {
            "user_reaction": user_reaction,
            "like_count": like_count,
            "dislike_count": dislike_count,
            "message": message
        }

    async def get_reaction_status(
        self,
        course_id: str,
        user_id: Optional[str] = None
    ) -> Dict:
        """Get reaction status and counts for a course"""
        user_reaction = None

        if user_id:
            existing_reaction = await CourseReaction.find_one({
                "course_id": course_id,
                "user_id": user_id
            })
            if existing_reaction:
                user_reaction = existing_reaction.reaction_type

        like_count = await self.get_reaction_count(course_id, "like")
        dislike_count = await self.get_reaction_count(course_id, "dislike")

        return {
            "user_reaction": user_reaction,
            "like_count": like_count,
            "dislike_count": dislike_count
        }

    async def get_reaction_count(
        self,
        course_id: str,
        reaction_type: Literal["like", "dislike"]
    ) -> int:
        """Get count for a specific reaction type"""
        return await CourseReaction.find({
            "course_id": course_id,
            "reaction_type": reaction_type
        }).count()

    async def _update_course_stats(self, course_id: str) -> None:
        """Update course stats with current like/dislike counts"""
        from beanie import PydanticObjectId

        like_count = await self.get_reaction_count(course_id, "like")
        dislike_count = await self.get_reaction_count(course_id, "dislike")

        course = await Course.find_one({"_id": course_id})
        if not course:
            try:
                course = await Course.get(PydanticObjectId(course_id))
            except:
                pass

        if course:
            if course.stats is None:
                from app.models.course import CourseStats
                course.stats = CourseStats()

            course.stats.total_likes = like_count
            course.stats.total_dislikes = dislike_count
            await course.save()


# Singleton instance
course_reaction_service = CourseReactionService()

# Keep alias for backward compatibility
course_like_service = course_reaction_service
