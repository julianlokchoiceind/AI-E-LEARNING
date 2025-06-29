"""
FAQ API endpoints
"""
# Standard library imports
from typing import List

# Third-party imports
from fastapi import APIRouter, Depends, Query

# Local imports
from app.api.deps import get_admin_user, get_current_user
from app.models.user import User
from app.schemas.faq import (
    FAQBulkAction,
    FAQBulkActionResponse,
    FAQCreate,
    FAQCreateResponse,
    FAQDeleteResponse,
    FAQListStandardResponse,
    FAQSearchQuery,
    FAQUpdate,
    FAQUpdateResponse,
    FAQVoteRequest,
    FAQVoteStandardResponse
)
from app.services.faq_service import faq_service

router = APIRouter()


@router.get("", response_model=FAQListStandardResponse)
async def get_faqs(
    q: str = Query(None, description="Search query"),
    category: str = Query(None, description="Filter by category"),
    tags: List[str] = Query(None, description="Filter by tags"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sort_by: str = Query("priority", pattern="^(priority|view_count|created_at)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$")
):
    """
    Get all published FAQs with optional search and filters
    """
    query = FAQSearchQuery(
        q=q,
        category=category,
        tags=tags,
        is_published=True,
        page=page,
        per_page=per_page,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    result = await faq_service.search_faqs(query)
    
    return FAQListStandardResponse(
        success=True,
        data=result,
        message="FAQs retrieved successfully"
    )


@router.get("/categories", response_model=dict)
async def get_faq_categories():
    """
    Get FAQ categories with count
    """
    from app.models.faq import FAQ, FAQCategory
    
    categories = []
    for category in FAQCategory:
        count = await FAQ.find({
            "category": category.value,
            "is_published": True
        }).count()
        
        categories.append({
            "value": category.value,
            "label": category.value.replace("_", " ").title(),
            "count": count
        })
    
    return {
        "success": True,
        "data": categories,
        "message": "Categories retrieved successfully"
    }


@router.get("/popular", response_model=FAQListStandardResponse)
async def get_popular_faqs(
    limit: int = Query(10, ge=1, le=50)
):
    """
    Get most viewed FAQs
    """
    faqs = await faq_service.get_popular_faqs(limit)
    
    return FAQListStandardResponse(
        success=True,
        data={
            "items": faqs,
            "total": len(faqs),
            "page": 1,
            "per_page": limit
        },
        message="Popular FAQs retrieved successfully"
    )


@router.get("/search", response_model=FAQListStandardResponse)
async def search_faqs(
    query_params: FAQSearchQuery = Depends()
):
    """
    Search FAQs with advanced filters
    """
    result = await faq_service.search_faqs(query_params)
    
    return FAQListStandardResponse(
        success=True,
        data=result,
        message="Search results retrieved successfully"
    )


@router.post("", response_model=FAQCreateResponse)
async def create_faq(
    faq_data: FAQCreate,
    current_user: User = Depends(get_admin_user)
):
    """
    Create a new FAQ (Admin only)
    """
    faq = await faq_service.create_faq(faq_data)
    
    return FAQCreateResponse(
        success=True,
        data=faq,
        message="FAQ created successfully"
    )


@router.get("/{faq_id}", response_model=FAQCreateResponse)
async def get_faq(faq_id: str):
    """
    Get FAQ by ID and increment view count
    """
    faq = await faq_service.get_faq(faq_id)
    
    return FAQCreateResponse(
        success=True,
        data=faq,
        message="FAQ retrieved successfully"
    )


@router.get("/{faq_id}/related", response_model=FAQListStandardResponse)
async def get_related_faqs(faq_id: str):
    """
    Get FAQs related to the given FAQ
    """
    faqs = await faq_service.get_related_faqs(faq_id)
    
    return FAQListStandardResponse(
        success=True,
        data={
            "items": faqs,
            "total": len(faqs),
            "page": 1,
            "per_page": len(faqs)
        },
        message="Related FAQs retrieved successfully"
    )


@router.put("/{faq_id}", response_model=FAQUpdateResponse)
async def update_faq(
    faq_id: str,
    update_data: FAQUpdate,
    current_user: User = Depends(get_admin_user)
):
    """
    Update FAQ (Admin only)
    """
    faq = await faq_service.update_faq(faq_id, update_data)
    
    return FAQUpdateResponse(
        success=True,
        data=faq,
        message="FAQ updated successfully"
    )


@router.delete("/{faq_id}", response_model=FAQDeleteResponse)
async def delete_faq(
    faq_id: str,
    current_user: User = Depends(get_admin_user)
):
    """
    Delete FAQ (Admin only)
    """
    result = await faq_service.delete_faq(faq_id)
    
    return FAQDeleteResponse(
        success=True,
        data=result,
        message="FAQ deleted successfully"
    )


@router.post("/{faq_id}/vote", response_model=FAQVoteStandardResponse)
async def vote_faq(
    faq_id: str,
    vote_data: FAQVoteRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Vote on FAQ helpfulness (authenticated users)
    """
    result = await faq_service.vote_faq(faq_id, vote_data.is_helpful)
    
    return FAQVoteStandardResponse(
        success=True,
        data=result,
        message=result["message"]
    )


@router.post("/bulk-action", response_model=FAQBulkActionResponse)
async def bulk_action_faqs(
    bulk_data: FAQBulkAction,
    current_user: User = Depends(get_admin_user)
):
    """
    Perform bulk actions on FAQs (Admin only)
    """
    result = await faq_service.bulk_action(bulk_data.faq_ids, bulk_data.action)
    
    return FAQBulkActionResponse(
        success=True,
        data=result,
        message=result["message"]
    )