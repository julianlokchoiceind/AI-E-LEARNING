"""
Review API endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.models.user import User
from app.models.review import ReviewStatus, ReviewVote
from app.schemas.review import (
    ReviewCreateRequest,
    ReviewUpdateRequest,
    ReviewVoteRequest,
    ReviewReportRequest,
    CreatorResponseRequest,
    ReviewModerationRequest,
    ReviewSearchQuery
)
from app.schemas.base import StandardResponse
from app.services.review_service import ReviewService
from app.core.deps import get_current_user, get_admin_user, get_current_optional_user

router = APIRouter()
review_service = ReviewService()


@router.post("/courses/{course_id}/reviews", response_model=StandardResponse[dict])
async def create_review(
    course_id: str,
    review_data: ReviewCreateRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a review for a course"""
    try:
        review = await review_service.create_review(course_id, current_user, review_data)
        return StandardResponse(
            success=True,
            data=review_service._format_review(review),
            message="Review submitted successfully"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create review: {str(e)}"
        )


@router.get("/courses/{course_id}/reviews", response_model=StandardResponse[dict])
async def get_course_reviews(
    course_id: str,
    rating: Optional[int] = Query(None, ge=1, le=5),
    is_verified_purchase: Optional[bool] = None,
    sort_by: str = Query("created_at", pattern="^(created_at|rating|helpful_count)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: Optional[User] = Depends(get_current_optional_user)
):
    """Get reviews for a course"""
    try:
        query = ReviewSearchQuery(
            course_id=course_id,
            rating=rating,
            is_verified_purchase=is_verified_purchase,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            per_page=per_page
        )
        
        result = await review_service.get_reviews(query, current_user)
        return StandardResponse(
            success=True,
            data=result,
            message="Reviews retrieved successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch reviews: {str(e)}"
        )


@router.get("/courses/{course_id}/reviews/stats", response_model=StandardResponse[dict])
async def get_course_review_stats(course_id: str):
    """Get review statistics for a course"""
    try:
        stats = await review_service.get_course_stats(course_id)
        return StandardResponse(
            success=True,
            data=stats,
            message="Review statistics retrieved successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch review stats: {str(e)}"
        )


@router.get("/users/{user_id}/reviews", response_model=StandardResponse[dict])
async def get_user_reviews(
    user_id: str,
    sort_by: str = Query("created_at", pattern="^(created_at|rating|helpful_count)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: Optional[User] = Depends(get_current_optional_user)
):
    """Get reviews by a specific user"""
    try:
        query = ReviewSearchQuery(
            user_id=user_id,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            per_page=per_page
        )
        
        result = await review_service.get_reviews(query, current_user)
        return StandardResponse(
            success=True,
            data=result,
            message="User reviews retrieved successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch user reviews: {str(e)}"
        )


@router.get("/{review_id}", response_model=StandardResponse[dict])
async def get_review(
    review_id: str,
    current_user: Optional[User] = Depends(get_current_optional_user)
):
    """Get a specific review"""
    try:
        review = await review_service.get_review(review_id)
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        review_dict = review_service._format_review(review)
        
        # Add user vote if authenticated
        if current_user:
            vote = await ReviewVote.find_one({
                "review_id": review_id,
                "user_id": str(current_user.id)
            })
            review_dict["user_vote"] = vote.is_helpful if vote else None
        
        return StandardResponse(
            success=True,
            data=review_dict,
            message="Review retrieved successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch review: {str(e)}"
        )


@router.put("/{review_id}", response_model=StandardResponse[dict])
async def update_review(
    review_id: str,
    update_data: ReviewUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """Update a review"""
    try:
        review = await review_service.update_review(review_id, current_user, update_data)
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        return StandardResponse(
            success=True,
            data=review_service._format_review(review),
            message="Review updated successfully"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update review: {str(e)}"
        )


@router.delete("/{review_id}", response_model=StandardResponse[dict])
async def delete_review(
    review_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a review"""
    try:
        success = await review_service.delete_review(review_id, current_user)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        return StandardResponse(
            success=True,
            data=None,
            message="Review deleted successfully"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete review: {str(e)}"
        )


@router.post("/{review_id}/vote", response_model=StandardResponse[dict])
async def vote_review(
    review_id: str,
    vote_data: ReviewVoteRequest,
    current_user: User = Depends(get_current_user)
):
    """Vote on review helpfulness"""
    try:
        review = await review_service.vote_review(review_id, current_user, vote_data)
        return StandardResponse(
            success=True,
            data=review_service._format_review(review),
            message="Vote recorded successfully"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to vote: {str(e)}"
        )


@router.post("/{review_id}/report", response_model=StandardResponse[dict])
async def report_review(
    review_id: str,
    report_data: ReviewReportRequest,
    current_user: User = Depends(get_current_user)
):
    """Report a review for moderation"""
    try:
        success = await review_service.report_review(review_id, current_user, report_data)
        return StandardResponse(
            success=True,
            data=None,
            message="Review reported successfully"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to report review: {str(e)}"
        )


@router.post("/{review_id}/respond", response_model=StandardResponse[dict])
async def respond_to_review(
    review_id: str,
    response_data: CreatorResponseRequest,
    current_user: User = Depends(get_current_user)
):
    """Add creator response to review"""
    try:
        review = await review_service.respond_to_review(review_id, current_user, response_data)
        return StandardResponse(
            success=True,
            data=review_service._format_review(review),
            message="Response added successfully"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to add response: {str(e)}"
        )


@router.put("/{review_id}/moderate", response_model=StandardResponse[dict])
async def moderate_review(
    review_id: str,
    moderation_data: ReviewModerationRequest,
    current_user: User = Depends(get_admin_user)
):
    """Moderate a review (admin only)"""
    try:
        review = await review_service.moderate_review(review_id, current_user, moderation_data)
        return StandardResponse(
            success=True,
            data=review_service._format_review(review),
            message="Review moderated successfully"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to moderate review: {str(e)}"
        )