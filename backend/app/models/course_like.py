"""
Course Like/Dislike model for tracking user reactions on courses.
"""
from datetime import datetime
from typing import Literal
from beanie import Document
from pydantic import Field


class CourseReaction(Document):
    """Tracks user likes and dislikes on courses (YouTube-style)"""
    course_id: str = Field(..., description="Course being reacted to")
    user_id: str = Field(..., description="User who reacted")
    reaction_type: Literal["like", "dislike"] = Field(..., description="Type of reaction")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "course_reactions"
        indexes = [
            "course_id",
            "user_id",
            "reaction_type",
            [("course_id", 1), ("user_id", 1)],  # Compound index for unique constraint
        ]


# Keep alias for backward compatibility
CourseLike = CourseReaction
