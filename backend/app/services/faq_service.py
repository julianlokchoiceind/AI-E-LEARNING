"""
FAQ service for managing frequently asked questions
"""
# Standard library imports
import re
from datetime import datetime
from typing import Dict, List, Optional

# Third-party imports
from beanie import PydanticObjectId
from fastapi import HTTPException

# Local imports
from app.models.faq import FAQ, FAQCategory
from app.schemas.faq import FAQCreate, FAQUpdate, FAQSearchQuery


class FAQService:
    """Service for managing FAQs"""
    
    async def create_faq(self, faq_data: FAQCreate) -> FAQ:
        """Create a new FAQ"""
        # Check if similar question exists
        existing = await FAQ.find_one({
            "question": {"$regex": re.escape(faq_data.question), "$options": "i"}
        })
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail="A similar FAQ already exists"
            )
        
        # Create FAQ
        faq = FAQ(**faq_data.dict())
        await faq.save()
        
        return faq
    
    async def get_faq(self, faq_id: str) -> FAQ:
        """Get FAQ by ID"""
        faq = await FAQ.get(faq_id)
        if not faq:
            raise HTTPException(
                status_code=404,
                detail="FAQ not found"
            )
        
        # Increment view count
        faq.view_count += 1
        await faq.save()
        
        return faq
    
    async def update_faq(self, faq_id: str, update_data: FAQUpdate) -> FAQ:
        """Update FAQ"""
        faq = await FAQ.get(faq_id)
        if not faq:
            raise HTTPException(
                status_code=404,
                detail="FAQ not found"
            )
        
        # Update fields
        update_dict = update_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(faq, field, value)
        
        faq.updated_at = datetime.utcnow()
        await faq.save()
        
        return faq
    
    async def delete_faq(self, faq_id: str) -> dict:
        """Delete FAQ"""
        faq = await FAQ.get(faq_id)
        if not faq:
            raise HTTPException(
                status_code=404,
                detail="FAQ not found"
            )
        
        await faq.delete()
        
        return {"message": "FAQ deleted successfully"}
    
    async def search_faqs(self, query: FAQSearchQuery) -> Dict:
        """Search and filter FAQs"""
        # Build filter
        filter_dict = {}
        
        if query.q:
            # Search in question and answer
            filter_dict["$or"] = [
                {"question": {"$regex": query.q, "$options": "i"}},
                {"answer": {"$regex": query.q, "$options": "i"}},
                {"tags": {"$in": [query.q.lower()]}}
            ]
        
        if query.category:
            filter_dict["category"] = query.category
        
        if query.tags:
            filter_dict["tags"] = {"$in": query.tags}
        
        if query.is_published is not None:
            filter_dict["is_published"] = query.is_published
        
        # Count total
        total = await FAQ.find(filter_dict).count()
        
        # Build sort
        sort_field = query.sort_by
        if sort_field == "priority" and not query.category:
            # If sorting by priority without category filter, also sort by category
            sort = [
                ("category", 1),
                (sort_field, -1 if query.sort_order == "desc" else 1)
            ]
        else:
            sort = [(sort_field, -1 if query.sort_order == "desc" else 1)]
        
        # Fetch paginated results
        skip = (query.page - 1) * query.per_page
        faqs = await FAQ.find(filter_dict).sort(sort).skip(skip).limit(query.per_page).to_list()
        
        return {
            "items": faqs,
            "total": total,
            "page": query.page,
            "per_page": query.per_page
        }
    
    async def get_faqs_by_category(self, category: FAQCategory) -> List[FAQ]:
        """Get all published FAQs by category"""
        return await FAQ.find({
            "category": category,
            "is_published": True
        }).sort([("priority", -1), ("view_count", -1)]).to_list()
    
    async def vote_faq(self, faq_id: str, is_helpful: bool) -> Dict:
        """Vote on FAQ helpfulness"""
        faq = await FAQ.get(faq_id)
        if not faq:
            raise HTTPException(
                status_code=404,
                detail="FAQ not found"
            )
        
        if is_helpful:
            faq.helpful_votes += 1
        else:
            faq.unhelpful_votes += 1
        
        await faq.save()
        
        return {
            "success": True,
            "message": "Thank you for your feedback",
            "helpful_votes": faq.helpful_votes,
            "unhelpful_votes": faq.unhelpful_votes
        }
    
    async def get_related_faqs(self, faq_id: str) -> List[FAQ]:
        """Get related FAQs"""
        faq = await FAQ.get(faq_id)
        if not faq or not faq.related_faqs:
            return []
        
        # Convert string IDs to ObjectIds
        related_ids = [PydanticObjectId(id_str) for id_str in faq.related_faqs]
        
        return await FAQ.find({
            "_id": {"$in": related_ids},
            "is_published": True
        }).to_list()
    
    async def get_popular_faqs(self, limit: int = 10) -> List[FAQ]:
        """Get most viewed FAQs"""
        return await FAQ.find({
            "is_published": True
        }).sort([("view_count", -1)]).limit(limit).to_list()
    
    async def bulk_action(self, faq_ids: List[str], action: str) -> dict:
        """Perform bulk action on FAQs"""
        # Convert string IDs to ObjectIds
        object_ids = [PydanticObjectId(id_str) for id_str in faq_ids]
        
        if action == "publish":
            result = await FAQ.find({"_id": {"$in": object_ids}}).update_many({
                "$set": {"is_published": True, "updated_at": datetime.utcnow()}
            })
        elif action == "unpublish":
            result = await FAQ.find({"_id": {"$in": object_ids}}).update_many({
                "$set": {"is_published": False, "updated_at": datetime.utcnow()}
            })
        elif action == "delete":
            result = await FAQ.find({"_id": {"$in": object_ids}}).delete()
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid action"
            )
        
        return {
            "success": True,
            "message": f"{action.capitalize()} action performed on {len(faq_ids)} FAQs",
            "affected_count": result.modified_count if hasattr(result, 'modified_count') else result.deleted_count
        }


# Create service instance
faq_service = FAQService()