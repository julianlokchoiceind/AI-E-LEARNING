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
from app.models.faq import FAQ
from app.models.faq_category import FAQCategory
from app.schemas.faq import FAQCreate, FAQUpdate, FAQSearchQuery


class FAQService:
    """Service for managing FAQs"""
    
    def _format_faq(self, faq: FAQ) -> dict:
        """Format FAQ for response (smart backend pattern)"""
        faq_dict = faq.dict(exclude={"id"})
        faq_dict["id"] = str(faq.id)
        return faq_dict
    
    async def create_faq(self, faq_data: FAQCreate) -> dict:
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
        
        # Validate category_id if provided
        if faq_data.category_id:
            category = await FAQCategory.get(faq_data.category_id)
            if not category:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid category ID"
                )
        
        # Create FAQ
        faq = FAQ(**faq_data.dict())
        # Ensure pre_save is called to generate slug if needed
        await faq.pre_save()
        await faq.save()
        
        return self._format_faq(faq)
    
    async def get_faq(self, faq_id: str) -> dict:
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
        
        return self._format_faq(faq)
    
    async def update_faq(self, faq_id: str, update_data: FAQUpdate) -> dict:
        """Update FAQ"""
        faq = await FAQ.get(faq_id)
        if not faq:
            raise HTTPException(
                status_code=404,
                detail="FAQ not found"
            )
        
        # Validate category_id if being updated
        if hasattr(update_data, 'category_id') and update_data.category_id:
            category = await FAQCategory.get(update_data.category_id)
            if not category:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid category ID"
                )
        
        # Update fields
        update_dict = update_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(faq, field, value)
        
        faq.updated_at = datetime.utcnow()
        await faq.save()
        
        return self._format_faq(faq)
    
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
                {"answer": {"$regex": query.q, "$options": "i"}}
            ]
        
        if query.category:
            filter_dict["category_id"] = query.category
        
        if query.is_published is not None:
            filter_dict["is_published"] = query.is_published
        
        # Count total
        total = await FAQ.find(filter_dict).count()
        
        # Build sort
        sort_field = query.sort_by
        if sort_field == "priority" and not query.category:
            # If sorting by priority without category filter, also sort by category_id
            sort = [
                ("category_id", 1),
                (sort_field, -1 if query.sort_order == "desc" else 1)
            ]
        else:
            sort = [(sort_field, -1 if query.sort_order == "desc" else 1)]
        
        # Fetch paginated results
        skip = (query.page - 1) * query.per_page
        faqs = await FAQ.find(filter_dict).sort(sort).skip(skip).limit(query.per_page).to_list()
        
        # Convert _id to id for frontend consistency (smart backend pattern)
        formatted_faqs = [self._format_faq(faq) for faq in faqs]
        
        return {
            "items": formatted_faqs,
            "total": total,
            "page": query.page,
            "per_page": query.per_page,
            "total_pages": (total + query.per_page - 1) // query.per_page
        }
    
    async def get_faqs_by_category(self, category_id: str) -> List[dict]:
        """Get all published FAQs by category"""
        faqs = await FAQ.find({
            "category_id": category_id,
            "is_published": True
        }).sort([("priority", -1), ("view_count", -1)]).to_list()
        return [self._format_faq(faq) for faq in faqs]
    
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
    
    async def get_related_faqs(self, faq_id: str) -> List[dict]:
        """Get related FAQs"""
        faq = await FAQ.get(faq_id)
        if not faq or not faq.related_faqs:
            return []
        
        # Convert string IDs to ObjectIds
        related_ids = [PydanticObjectId(id_str) for id_str in faq.related_faqs]
        
        faqs = await FAQ.find({
            "_id": {"$in": related_ids},
            "is_published": True
        }).to_list()
        return [self._format_faq(faq) for faq in faqs]
    
    async def get_popular_faqs(self, limit: int = 10) -> List[dict]:
        """Get most viewed FAQs"""
        faqs = await FAQ.find({
            "is_published": True
        }).sort([("view_count", -1)]).limit(limit).to_list()
        return [self._format_faq(faq) for faq in faqs]
    
    async def bulk_action(self, faq_ids: List[str] = None, action: str = None, faqs_data: List[dict] = None) -> dict:
        """Perform bulk action on FAQs"""

        if action == "create":
            # Handle bulk create
            if not faqs_data:
                raise HTTPException(status_code=400, detail="faqs_data required for create action")

            created_faqs = []
            errors = []

            for i, faq_data in enumerate(faqs_data):
                try:
                    # Create FAQ instance
                    faq = FAQ(**faq_data)

                    # Call pre_save to generate slug if needed
                    await faq.pre_save()

                    # Save to database
                    await faq.save()

                    # Format and add to created list
                    created_faqs.append(self._format_faq(faq))

                except Exception as e:
                    errors.append({
                        "index": i,
                        "question": faq_data.get('question', 'Unknown'),
                        "error": str(e)
                    })

            return {
                "success": True,
                "message": f"Created {len(created_faqs)} FAQs successfully",
                "created_count": len(created_faqs),
                "failed_count": len(errors),
                "created_faqs": created_faqs,
                "errors": errors if errors else None
            }

        # Handle other actions (publish/unpublish/delete)
        if not faq_ids:
            raise HTTPException(status_code=400, detail="faq_ids required for this action")

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

    def _generate_slug(self, question: str) -> str:
        """Generate slug from question text"""
        if not question:
            return ''

        # Simple slug generation from question
        slug = question.lower()
        # Keep only alphanumeric and spaces
        slug = ''.join(c if c.isalnum() or c == ' ' else '' for c in slug)
        # Replace spaces with hyphens and limit length
        slug = '-'.join(slug.split())[:100]
        return slug if slug else ''


# Create service instance
faq_service = FAQService()