"""
FAQ Category service for managing FAQ categories.
Following the FAQ service pattern from CLAUDE.md specifications.
Smart backend - handles all business logic and data formatting.
"""
# Standard library imports
from datetime import datetime
from typing import Dict, List, Optional

# Third-party imports
from beanie import PydanticObjectId
from fastapi import HTTPException

# Local imports
from app.models.faq_category import FAQCategory
from app.models.faq import FAQ
from app.schemas.faq_category import FAQCategoryCreate, FAQCategoryUpdate


class FAQCategoryService:
    """Service for managing FAQ categories - Smart backend logic"""
    
    async def create_category(self, category_data: FAQCategoryCreate) -> Dict:
        """Create a new FAQ category with validation"""
        # Check slug uniqueness
        existing_slug = await FAQCategory.find_one({"slug": category_data.slug})
        if existing_slug:
            raise HTTPException(
                status_code=400,
                detail="Category with this slug already exists"
            )
        
        # Check name uniqueness
        existing_name = await FAQCategory.find_one({
            "name": {"$regex": f"^{category_data.name}$", "$options": "i"}
        })
        if existing_name:
            raise HTTPException(
                status_code=400,
                detail="Category with this name already exists"
            )
        
        # Create category
        category = FAQCategory(**category_data.dict())
        await category.save()
        
        return self._format_category(category)
    
    async def list_categories(
        self, 
        is_active: Optional[bool] = None,
        include_stats: bool = True
    ) -> Dict:
        """List categories with smart backend statistics calculation"""
        # Build filter
        filter_dict = {}
        if is_active is not None:
            filter_dict["is_active"] = is_active
        
        # Fetch categories ordered by order, then name
        categories = await FAQCategory.find(filter_dict).sort([
            ("order", 1), 
            ("name", 1)
        ]).to_list()
        
        # Format categories with stats if requested
        formatted_categories = []
        for category in categories:
            cat_dict = self._format_category(category)
            
            if include_stats:
                # Smart backend: calculate statistics
                faq_count = await FAQ.find({
                    "category_id": str(category.id),
                    "is_published": True
                }).count()
                
                total_views = 0
                if faq_count > 0:
                    # Calculate total views across all FAQs in category
                    faqs = await FAQ.find({
                        "category_id": str(category.id),
                        "is_published": True
                    }).to_list()
                    total_views = sum(faq.view_count for faq in faqs)
                
                cat_dict["faq_count"] = faq_count
                cat_dict["total_views"] = total_views
                cat_dict["has_faqs"] = faq_count > 0
            
            formatted_categories.append(cat_dict)
        
        # Calculate totals
        total = len(formatted_categories)
        active_count = len([c for c in formatted_categories if c["is_active"]])
        inactive_count = total - active_count
        
        return {
            "categories": formatted_categories,
            "total": total,
            "active_count": active_count,
            "inactive_count": inactive_count
        }
    
    async def get_category(self, category_id: str) -> Dict:
        """Get single category by ID"""
        category = await self._get_category_or_404(category_id)
        return self._format_category(category)
    
    async def update_category(
        self, 
        category_id: str, 
        update_data: FAQCategoryUpdate
    ) -> Dict:
        """Update category with validation"""
        category = await self._get_category_or_404(category_id)
        
        # Check slug uniqueness if changed
        if update_data.slug and update_data.slug != category.slug:
            existing = await FAQCategory.find_one({
                "slug": update_data.slug,
                "_id": {"$ne": category.id}
            })
            if existing:
                raise HTTPException(
                    status_code=400,
                    detail="Slug already exists"
                )
        
        # Check name uniqueness if changed
        if update_data.name and update_data.name.lower() != category.name.lower():
            existing = await FAQCategory.find_one({
                "name": {"$regex": f"^{update_data.name}$", "$options": "i"},
                "_id": {"$ne": category.id}
            })
            if existing:
                raise HTTPException(
                    status_code=400,
                    detail="Category name already exists"
                )
        
        # Update fields
        update_dict = update_data.dict(exclude_unset=True)
        update_dict["updated_at"] = datetime.utcnow()
        
        await category.update({"$set": update_dict})
        
        # Return updated category
        updated_category = await self._get_category_or_404(category_id)
        return self._format_category(updated_category)
    
    async def delete_category(self, category_id: str) -> Dict:
        """Delete category with FAQ dependency check"""
        category = await self._get_category_or_404(category_id)
        
        # Check if category has FAQs
        faq_count = await FAQ.find({"category_id": category_id}).count()
        if faq_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete category with {faq_count} FAQs. Please reassign FAQs first."
            )
        
        # Delete category
        await category.delete()
        
        return {
            "success": True,
            "message": f"Category '{category.name}' has been deleted successfully"
        }
    
    async def get_category_with_faqs(self, category_id: str) -> Dict:
        """Get category with its FAQs - smart backend aggregation"""
        category = await self._get_category_or_404(category_id)
        
        # Fetch published FAQs in this category
        faqs = await FAQ.find({
            "category_id": category_id,
            "is_published": True
        }).sort([("priority", -1), ("created_at", -1)]).to_list()
        
        # Format response
        response = self._format_category(category)
        response["faqs"] = [self._format_faq(faq) for faq in faqs]
        response["faq_count"] = len(faqs)
        
        return response
    
    async def reorder_categories(self, category_orders: List[Dict]) -> Dict:
        """Bulk update category order - smart backend"""
        # Validate all categories exist first
        for item in category_orders:
            try:
                category = await FAQCategory.get(PydanticObjectId(item["id"]))
                if not category:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Category {item['id']} not found"
                    )
            except (ValueError, Exception) as e:
                if isinstance(e, HTTPException):
                    raise
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid category ID format: {item['id']}"
                )
        
        # Bulk update orders using Beanie's update method
        for order_item in category_orders:
            category = await FAQCategory.get(PydanticObjectId(order_item["id"]))
            category.order = order_item["order"]
            await category.save()
        
        return {
            "success": True,
            "message": f"Updated order for {len(category_orders)} categories"
        }
    
    def _format_category(self, category: FAQCategory) -> Dict:
        """Smart backend: convert _id to id and format response"""
        return {
            "id": str(category.id),
            "name": category.name,
            "slug": category.slug,
            "description": category.description,
            "platform_context": category.platform_context,
            "order": category.order,
            "is_active": category.is_active,
            "faq_count": category.faq_count,
            "total_views": category.total_views,
            "created_at": category.created_at.isoformat(),
            "updated_at": category.updated_at.isoformat()
        }
    
    def _format_faq(self, faq: FAQ) -> Dict:
        """Format FAQ for response - smart backend conversion"""
        faq_dict = faq.dict(exclude={"id"})
        faq_dict["id"] = str(faq.id)
        return faq_dict
    
    async def _get_category_or_404(self, category_id: str) -> FAQCategory:
        """Get category or raise 404 - helper method"""
        try:
            category = await FAQCategory.get(PydanticObjectId(category_id))
            if not category:
                raise HTTPException(
                    status_code=404,
                    detail="FAQ category not found"
                )
            return category
        except (ValueError, Exception) as e:
            if isinstance(e, HTTPException):
                raise
            raise HTTPException(
                status_code=404,
                detail="FAQ category not found"
            )
    
    async def bulk_action(self, category_ids: List[str], action: str) -> Dict:
        """
        Perform bulk actions on FAQ categories
        Actions: activate, deactivate, delete
        """
        if not category_ids:
            return {
                "success": False,
                "message": "No categories provided",
                "affected": 0
            }
        
        affected = 0
        errors = []
        
        for category_id in category_ids:
            try:
                if action == "activate":
                    category = await FAQCategory.get(category_id)
                    if category and not category.is_active:
                        category.is_active = True
                        await category.save()
                        affected += 1
                        
                elif action == "deactivate":
                    category = await FAQCategory.get(category_id)
                    if category and category.is_active:
                        category.is_active = False
                        await category.save()
                        affected += 1
                        
                elif action == "delete":
                    # Check if category has FAQs
                    category = await FAQCategory.get(category_id)
                    if category:
                        if category.faq_count > 0:
                            errors.append(f"Category '{category.name}' has {category.faq_count} FAQs and cannot be deleted")
                            continue
                        
                        await category.delete()
                        affected += 1
                        
            except Exception as e:
                errors.append(f"Error processing category {category_id}: {str(e)}")
        
        # Prepare response message
        action_past = {
            "activate": "activated",
            "deactivate": "deactivated", 
            "delete": "deleted"
        }.get(action, action)
        
        message = f"Successfully {action_past} {affected} categories"
        if errors:
            message += f". {len(errors)} errors occurred"
        
        return {
            "success": True,
            "message": message,
            "affected": affected,
            "errors": errors if errors else None
        }