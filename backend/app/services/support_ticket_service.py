"""
Support Ticket service for business logic
"""
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from beanie import PydanticObjectId

from app.models.support_ticket import SupportTicket, TicketMessage, TicketStatus, TicketPriority
from app.models.user import User
from app.schemas.support_ticket import (
    TicketCreateRequest,
    TicketUpdateRequest,
    MessageCreateRequest,
    TicketSearchQuery,
    SatisfactionRatingRequest
)
from app.services.email_service import EmailService


class SupportTicketService:
    def __init__(self):
        self.email_service = EmailService()

    async def create_ticket(
        self,
        user: User,
        ticket_data: TicketCreateRequest
    ) -> SupportTicket:
        """Create a new support ticket"""
        # Create ticket
        ticket = SupportTicket(
            user_id=str(user.id),
            user_email=user.email,
            user_name=user.name,
            title=ticket_data.title,
            description=ticket_data.description,
            category=ticket_data.category,
            priority=ticket_data.priority,
            related_course_id=ticket_data.related_course_id,
            related_order_id=ticket_data.related_order_id
        )
        
        await ticket.insert()
        
        # Create initial message
        initial_message = TicketMessage(
            ticket_id=str(ticket.id),
            sender_id=str(user.id),
            sender_name=user.name,
            sender_role="user",
            message=ticket_data.description,
            attachments=ticket_data.attachments or []
        )
        await initial_message.insert()
        
        # Send email notification to support team
        await self._notify_support_team(ticket)
        
        return ticket

    async def get_ticket(self, ticket_id: str, user: Optional[User] = None) -> Optional[SupportTicket]:
        """Get a ticket by ID with access control"""
        ticket = await SupportTicket.get(ticket_id)
        if not ticket:
            return None
        
        # Check access permissions
        if user and user.role == "student":
            # Students can only see their own tickets
            if str(ticket.user_id) != str(user.id):
                return None
        
        return ticket

    async def get_ticket_with_messages(
        self,
        ticket_id: str,
        user: Optional[User] = None,
        include_internal: bool = False
    ) -> Optional[Dict]:
        """Get ticket with all messages"""
        ticket = await self.get_ticket(ticket_id, user)
        if not ticket:
            return None
        
        # Fetch messages
        message_filter = {"ticket_id": ticket_id}
        if not include_internal and user and user.role == "student":
            message_filter["is_internal_note"] = False
        
        messages = await TicketMessage.find(message_filter).sort("created_at").to_list()
        
        return {
            **ticket.dict(),
            "messages": [msg.dict() for msg in messages]
        }

    async def search_tickets(
        self,
        query: TicketSearchQuery,
        user: Optional[User] = None
    ) -> Dict:
        """Search and filter tickets"""
        # Build filter
        filter_dict = {}
        
        # Access control
        if user and user.role == "student":
            filter_dict["user_id"] = str(user.id)
        elif query.user_id:
            filter_dict["user_id"] = query.user_id
        
        # Search filters
        if query.q:
            filter_dict["$or"] = [
                {"title": {"$regex": query.q, "$options": "i"}},
                {"description": {"$regex": query.q, "$options": "i"}}
            ]
        
        if query.status:
            filter_dict["status"] = query.status
        if query.priority:
            filter_dict["priority"] = query.priority
        if query.category:
            filter_dict["category"] = query.category
        if query.assigned_to:
            filter_dict["assigned_to"] = query.assigned_to
        
        # Date range filter
        if query.date_from or query.date_to:
            date_filter = {}
            if query.date_from:
                date_filter["$gte"] = query.date_from
            if query.date_to:
                date_filter["$lte"] = query.date_to
            filter_dict["created_at"] = date_filter
        
        # Count total
        total = await SupportTicket.find(filter_dict).count()
        
        # Sort
        sort_field = query.sort_by
        if query.sort_order == "desc":
            sort_field = f"-{sort_field}"
        
        # Fetch paginated results
        skip = (query.page - 1) * query.per_page
        tickets = await SupportTicket.find(filter_dict).sort(sort_field).skip(skip).limit(query.per_page).to_list()
        
        return {
            "items": [ticket.dict() for ticket in tickets],
            "total": total,
            "page": query.page,
            "per_page": query.per_page,
            "total_pages": (total + query.per_page - 1) // query.per_page
        }

    async def update_ticket(
        self,
        ticket_id: str,
        update_data: TicketUpdateRequest,
        updated_by: User
    ) -> Optional[SupportTicket]:
        """Update ticket (admin/support only)"""
        ticket = await SupportTicket.get(ticket_id)
        if not ticket:
            return None
        
        # Update fields
        update_dict = update_data.dict(exclude_unset=True)
        
        # Handle status changes
        if "status" in update_dict:
            new_status = update_dict["status"]
            if new_status == TicketStatus.RESOLVED and not ticket.resolved_at:
                ticket.resolved_at = datetime.utcnow()
            elif new_status == TicketStatus.CLOSED and not ticket.closed_at:
                ticket.closed_at = datetime.utcnow()
            elif new_status == TicketStatus.IN_PROGRESS and not ticket.first_response_at:
                ticket.first_response_at = datetime.utcnow()
        
        # Handle assignment
        if "assigned_to" in update_dict:
            ticket.assigned_at = datetime.utcnow()
            # Get assigned user name
            if update_dict["assigned_to"]:
                assigned_user = await User.get(update_dict["assigned_to"])
                if assigned_user:
                    ticket.assigned_to_name = assigned_user.name
        
        # Apply updates
        for field, value in update_dict.items():
            setattr(ticket, field, value)
        
        ticket.update_timestamps()
        await ticket.save()
        
        # Send notifications
        await self._notify_ticket_update(ticket, updated_by)
        
        return ticket

    async def add_message(
        self,
        ticket_id: str,
        message_data: MessageCreateRequest,
        sender: User
    ) -> Optional[TicketMessage]:
        """Add a message to ticket"""
        ticket = await SupportTicket.get(ticket_id)
        if not ticket:
            return None
        
        # Check permissions
        is_support = sender.role in ["admin", "creator"]
        if not is_support and str(ticket.user_id) != str(sender.id):
            return None
        
        # Create message
        message = TicketMessage(
            ticket_id=ticket_id,
            sender_id=str(sender.id),
            sender_name=sender.name,
            sender_role="support" if is_support else "user",
            message=message_data.message,
            attachments=message_data.attachments or [],
            is_internal_note=message_data.is_internal_note and is_support
        )
        await message.insert()
        
        # Update ticket
        ticket.response_count += 1
        if is_support:
            ticket.last_support_message_at = datetime.utcnow()
            if not ticket.first_response_at:
                ticket.first_response_at = datetime.utcnow()
            # Auto set to in_progress if open
            if ticket.status == TicketStatus.OPEN:
                ticket.status = TicketStatus.IN_PROGRESS
        else:
            ticket.last_user_message_at = datetime.utcnow()
            # Reopen if resolved/closed
            if ticket.status in [TicketStatus.RESOLVED, TicketStatus.CLOSED]:
                ticket.status = TicketStatus.OPEN
        
        ticket.update_timestamps()
        await ticket.save()
        
        # Send notifications
        if not message.is_internal_note:
            await self._notify_new_message(ticket, message, sender)
        
        return message

    async def rate_ticket(
        self,
        ticket_id: str,
        rating_data: SatisfactionRatingRequest,
        user: User
    ) -> Optional[SupportTicket]:
        """Rate ticket satisfaction"""
        ticket = await SupportTicket.get(ticket_id)
        if not ticket:
            return None
        
        # Only ticket owner can rate
        if str(ticket.user_id) != str(user.id):
            return None
        
        # Only resolved/closed tickets can be rated
        if ticket.status not in [TicketStatus.RESOLVED, TicketStatus.CLOSED]:
            return None
        
        ticket.satisfaction_rating = rating_data.rating
        ticket.satisfaction_comment = rating_data.comment
        ticket.update_timestamps()
        await ticket.save()
        
        return ticket

    async def get_ticket_stats(self, user: Optional[User] = None) -> Dict:
        """Get ticket statistics"""
        filter_dict = {}
        if user and user.role == "student":
            filter_dict["user_id"] = str(user.id)
        
        # Get counts by status
        total = await SupportTicket.find(filter_dict).count()
        open_count = await SupportTicket.find({**filter_dict, "status": TicketStatus.OPEN}).count()
        in_progress = await SupportTicket.find({**filter_dict, "status": TicketStatus.IN_PROGRESS}).count()
        resolved = await SupportTicket.find({**filter_dict, "status": TicketStatus.RESOLVED}).count()
        
        # Calculate average times
        pipeline = [
            {"$match": filter_dict},
            {"$group": {
                "_id": None,
                "avg_response_time": {
                    "$avg": {
                        "$cond": [
                            {"$and": ["$first_response_at", "$created_at"]},
                            {"$subtract": ["$first_response_at", "$created_at"]},
                            None
                        ]
                    }
                },
                "avg_resolution_time": {
                    "$avg": {
                        "$cond": [
                            {"$and": ["$resolved_at", "$created_at"]},
                            {"$subtract": ["$resolved_at", "$created_at"]},
                            None
                        ]
                    }
                },
                "avg_satisfaction": {"$avg": "$satisfaction_rating"}
            }}
        ]
        
        stats_result = await SupportTicket.aggregate(pipeline).to_list(1)
        stats = stats_result[0] if stats_result else {}
        
        # Get counts by category and priority
        category_counts = {}
        priority_counts = {}
        
        category_pipeline = [
            {"$match": filter_dict},
            {"$group": {"_id": "$category", "count": {"$sum": 1}}}
        ]
        category_results = await SupportTicket.aggregate(category_pipeline).to_list()
        for result in category_results:
            category_counts[result["_id"]] = result["count"]
        
        priority_pipeline = [
            {"$match": filter_dict},
            {"$group": {"_id": "$priority", "count": {"$sum": 1}}}
        ]
        priority_results = await SupportTicket.aggregate(priority_pipeline).to_list()
        for result in priority_results:
            priority_counts[result["_id"]] = result["count"]
        
        return {
            "total_tickets": total,
            "open_tickets": open_count,
            "in_progress_tickets": in_progress,
            "resolved_tickets": resolved,
            "avg_response_time_hours": (
                stats.get("avg_response_time", 0) / 3600000 if stats.get("avg_response_time") else None
            ),
            "avg_resolution_time_hours": (
                stats.get("avg_resolution_time", 0) / 3600000 if stats.get("avg_resolution_time") else None
            ),
            "satisfaction_avg": stats.get("avg_satisfaction"),
            "tickets_by_category": category_counts,
            "tickets_by_priority": priority_counts
        }

    async def _notify_support_team(self, ticket: SupportTicket):
        """Send notification to support team about new ticket"""
        # In production, this would notify support team via email/Slack
        pass

    async def _notify_ticket_update(self, ticket: SupportTicket, updated_by: User):
        """Send notification about ticket update"""
        # Notify ticket owner if updated by support
        if updated_by.role in ["admin", "creator"] and ticket.user_id != str(updated_by.id):
            # Send email to user
            pass

    async def _notify_new_message(self, ticket: SupportTicket, message: TicketMessage, sender: User):
        """Send notification about new message"""
        # Notify the other party
        if sender.role in ["admin", "creator"]:
            # Notify user
            pass
        else:
            # Notify support team
            pass