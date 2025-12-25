"""
Course Reaction schemas for request/response validation (YouTube-style like/dislike)
"""
from typing import Optional, Literal
from pydantic import BaseModel


class CourseReactionRequest(BaseModel):
    """Request schema for toggling reaction"""
    reaction_type: Literal["like", "dislike"]


class CourseReactionResponse(BaseModel):
    """Response schema for course reaction status"""
    user_reaction: Optional[Literal["like", "dislike"]] = None
    like_count: int
    dislike_count: int


class CourseReactionToggleResponse(BaseModel):
    """Response schema after toggling reaction"""
    user_reaction: Optional[Literal["like", "dislike"]] = None
    like_count: int
    dislike_count: int
    message: str


# Keep aliases for backward compatibility
CourseLikeResponse = CourseReactionResponse
CourseLikeToggleResponse = CourseReactionToggleResponse
