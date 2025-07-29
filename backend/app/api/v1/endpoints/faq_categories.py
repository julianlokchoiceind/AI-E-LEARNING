"""
FAQ Categories API endpoints
Following the FAQ endpoints pattern from CLAUDE.md specifications.
"""
# Standard library imports
from typing import List, Optional

# Third-party imports
from fastapi import APIRouter, Depends, Query, HTTPException

# Local imports
from app.core.deps import get_admin_user, get_current_user
from app.models.user import User
from app.schemas.faq_category import (
    FAQCategoryCreate,
    FAQCategoryUpdate,
    FAQCategoryResponse,
    FAQCategoryListResponse,
    FAQCategoryWithFAQsResponse
)
from app.schemas.base import StandardResponse
from app.services.faq_category_service import FAQCategoryService

router = APIRouter()
service = FAQCategoryService()


@router.get("", response_model=StandardResponse)
async def list_categories(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    include_stats: bool = Query(True, description="Include FAQ counts and statistics")
):
    """
    Get all FAQ categories (public endpoint)
    For public use, only returns active categories by default
    """
    # For public API, default to active categories only
    if is_active is None:
        is_active = True
    
    result = await service.list_categories(is_active=is_active, include_stats=include_stats)
    
    return StandardResponse(
        success=True,
        data=result,
        message="FAQ categories retrieved successfully"
    )


@router.get("/admin", response_model=StandardResponse)
async def list_categories_admin(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    include_stats: bool = Query(True, description="Include FAQ counts and statistics"),
    current_user: User = Depends(get_admin_user)
):
    """
    Get all FAQ categories (admin endpoint)
    Returns both active and inactive categories
    """
    result = await service.list_categories(is_active=is_active, include_stats=include_stats)
    
    return StandardResponse(
        success=True,
        data=result,
        message="FAQ categories retrieved successfully"
    )


@router.get("/{category_id}", response_model=StandardResponse)
async def get_category(category_id: str):
    """
    Get single FAQ category by ID (public endpoint)
    """
    result = await service.get_category(category_id)
    
    return StandardResponse(
        success=True,
        data=result,
        message="FAQ category retrieved successfully"
    )


@router.get("/{category_id}/faqs", response_model=StandardResponse)
async def get_category_with_faqs(category_id: str):
    """
    Get FAQ category with its FAQs (public endpoint)
    """
    result = await service.get_category_with_faqs(category_id)
    
    return StandardResponse(
        success=True,
        data=result,
        message="FAQ category with FAQs retrieved successfully"
    )


@router.post("", response_model=StandardResponse)
async def create_category(
    category_data: FAQCategoryCreate,
    current_user: User = Depends(get_admin_user)
):
    """
    Create new FAQ category (admin only)
    """
    result = await service.create_category(category_data)
    
    return StandardResponse(
        success=True,
        data=result,
        message="FAQ category created successfully"
    )


@router.put("/{category_id}", response_model=StandardResponse)
async def update_category(
    category_id: str,
    category_data: FAQCategoryUpdate,
    current_user: User = Depends(get_admin_user)
):
    """
    Update FAQ category (admin only)
    """
    result = await service.update_category(category_id, category_data)
    
    return StandardResponse(
        success=True,
        data=result,
        message="FAQ category updated successfully"
    )


@router.delete("/{category_id}", response_model=StandardResponse)
async def delete_category(
    category_id: str,
    current_user: User = Depends(get_admin_user)
):
    """
    Delete FAQ category (admin only)
    Cannot delete if category has FAQs
    """
    result = await service.delete_category(category_id)
    
    return StandardResponse(
        success=True,
        data=result,
        message=result["message"]
    )


@router.post("/reorder", response_model=StandardResponse)
async def reorder_categories(
    category_orders: List[dict],
    current_user: User = Depends(get_admin_user)
):
    """
    Bulk update category order (admin only)
    Expects: [{"id": "category_id", "order": 0}, ...]
    """
    # Validate input format
    for item in category_orders:
        if "id" not in item or "order" not in item:
            raise HTTPException(
                status_code=400,
                detail="Each item must have 'id' and 'order' fields"
            )
        if not isinstance(item["order"], int) or item["order"] < 0:
            raise HTTPException(
                status_code=400,
                detail="Order must be a non-negative integer"
            )
    
    result = await service.reorder_categories(category_orders)
    
    return StandardResponse(
        success=True,
        data=result,
        message=result["message"]
    )