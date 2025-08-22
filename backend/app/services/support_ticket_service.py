"""
Support Ticket service for business logic
"""
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from beanie import PydanticObjectId
from bson import ObjectId

from app.models.support_ticket import SupportTicket, TicketMessage, TicketStatus, TicketPriority
from app.models.user import User
from app.schemas.support_ticket import (
    TicketCreateRequest,
    TicketUpdateRequest,
    MessageCreateRequest,
    TicketSearchQuery
)
from app.core.email import email_service


class SupportTicketService:
    def __init__(self):
        pass
    
    def _compute_is_unread(self, ticket):
        """Compute is_unread for ticket (same logic as endpoint)"""
        is_unread = False
        
        # Get status
        ticket_status = ticket.status.value if hasattr(ticket.status, 'value') else ticket.status
        viewed_by_admin = getattr(ticket, 'viewed_by_admin_at', None)
        last_user_message_at = getattr(ticket, 'last_user_message_at', None)
        
        # Only consider unread if ticket is not closed
        if ticket_status != "closed":
            # New ticket never viewed by admin
            if not viewed_by_admin:
                is_unread = True
            # User messaged after admin last viewed
            elif last_user_message_at and viewed_by_admin:
                # Simple string comparison for ISO dates
                if str(last_user_message_at) > str(viewed_by_admin):
                    is_unread = True
        
        return is_unread

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
        
        # Convert ticket to dict manually to avoid ObjectId issues
        ticket_dict = {
            "id": str(ticket.id),
            "user_id": ticket.user_id,
            "user_email": ticket.user_email,
            "user_name": ticket.user_name,
            "title": ticket.title,
            "description": ticket.description,
            "category": ticket.category.value if hasattr(ticket.category, 'value') else ticket.category,
            "priority": ticket.priority.value if hasattr(ticket.priority, 'value') else ticket.priority,
            "status": ticket.status.value if hasattr(ticket.status, 'value') else ticket.status,
            "assigned_to": ticket.assigned_to,
            "assigned_to_name": ticket.assigned_to_name if hasattr(ticket, 'assigned_to_name') else None,
            "assigned_at": ticket.assigned_at.isoformat() if hasattr(ticket, 'assigned_at') and ticket.assigned_at else None,
            "tags": ticket.tags,
            "related_course_id": ticket.related_course_id,
            "related_order_id": ticket.related_order_id,
            "first_response_at": ticket.first_response_at.isoformat() if ticket.first_response_at else None,
            "resolved_at": ticket.resolved_at.isoformat() if ticket.resolved_at else None,
            "closed_at": ticket.closed_at.isoformat() if ticket.closed_at else None,
            "resolution_note": ticket.resolution_note,
            "response_count": ticket.response_count,
            "last_user_message_at": ticket.last_user_message_at.isoformat() if ticket.last_user_message_at else None,
            "last_support_message_at": ticket.last_support_message_at.isoformat() if ticket.last_support_message_at else None,
            "viewed_by_admin_at": ticket.viewed_by_admin_at.isoformat() if ticket.viewed_by_admin_at else None,
            "last_admin_view_at": ticket.last_admin_view_at.isoformat() if ticket.last_admin_view_at else None,
            "viewed_by_user_at": ticket.viewed_by_user_at.isoformat() if ticket.viewed_by_user_at else None,
            "last_user_view_at": ticket.last_user_view_at.isoformat() if ticket.last_user_view_at else None,
            "is_unread": self._compute_is_unread(ticket),  # Add computed field
            "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
            "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None
        }
        
        # Convert messages to dict manually to avoid ObjectId issues
        messages_dict = []
        for msg in messages:
            msg_dict = {
                "id": str(msg.id),
                "ticket_id": msg.ticket_id,
                "sender_id": msg.sender_id,
                "sender_name": msg.sender_name,
                "sender_role": msg.sender_role,
                "message": msg.message,
                "attachments": msg.attachments,
                "is_internal_note": msg.is_internal_note,
                "created_at": msg.created_at.isoformat() if msg.created_at else None,
                "updated_at": msg.updated_at.isoformat() if msg.updated_at else None
            }
            messages_dict.append(msg_dict)
        
        return {
            **ticket_dict,
            "messages": messages_dict
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
        
        # Return raw Pydantic models - endpoint will handle conversion with is_unread computation
        return {
            "items": tickets,
            "total": total,
            "page": query.page,
            "per_page": query.per_page,
            "total_pages": (total + query.per_page - 1) // query.per_page
        }

    async def search_tickets_with_unread_aggregation(
        self,
        query: TicketSearchQuery,
        user: Optional[User] = None,
        filter_unread_only: bool = False
    ) -> Dict:
        """
        Optimized search with MongoDB aggregation pipeline for unread filtering.
        Moves computation from Python to MongoDB for better performance.
        """
        # Build match stage
        match_stage = {}
        
        # Access control
        if user and user.role == "student":
            match_stage["user_id"] = str(user.id)
        elif query.user_id:
            match_stage["user_id"] = query.user_id
        
        # Search filters
        if query.q:
            match_stage["$or"] = [
                {"title": {"$regex": query.q, "$options": "i"}},
                {"description": {"$regex": query.q, "$options": "i"}}
            ]
        
        if query.status:
            match_stage["status"] = query.status
        if query.priority:
            match_stage["priority"] = query.priority
        if query.category:
            match_stage["category"] = query.category
        if query.assigned_to:
            match_stage["assigned_to"] = query.assigned_to
        
        # Date range filter
        if query.date_from or query.date_to:
            date_filter = {}
            if query.date_from:
                date_filter["$gte"] = query.date_from
            if query.date_to:
                date_filter["$lte"] = query.date_to
            match_stage["created_at"] = date_filter
        
        # Build aggregation pipeline
        pipeline = [
            {"$match": match_stage},
            
            # Single $addFields stage: compute is_unread AND ensure all required fields exist
            {"$addFields": {
                # Compute is_unread using MongoDB logic - MUST be preserved
                "is_unread": {
                    "$cond": {
                        "if": {
                            "$and": [
                                # Only consider if ticket is not closed
                                {"$ne": ["$status", "closed"]},
                                {
                                    "$or": [
                                        # Case 1: Never viewed by admin (viewed_by_admin_at is null/missing)
                                        {"$or": [
                                            {"$eq": ["$viewed_by_admin_at", None]},
                                            {"$eq": [{"$type": "$viewed_by_admin_at"}, "missing"]}
                                        ]},
                                        # Case 2: User messaged after admin last viewed
                                        {
                                            "$and": [
                                                {"$ne": ["$last_user_message_at", None]},
                                                {"$ne": ["$viewed_by_admin_at", None]},
                                                {"$ne": [{"$type": "$last_user_message_at"}, "missing"]},
                                                {"$ne": [{"$type": "$viewed_by_admin_at"}, "missing"]},
                                                {"$gt": ["$last_user_message_at", "$viewed_by_admin_at"]}
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        "then": True,
                        "else": False
                    }
                },
                # Convert _id to id for frontend consistency
                "id": {"$toString": "$_id"},
                # Core tracking fields - ensure they exist with null if missing
                "viewed_by_admin_at": {"$ifNull": ["$viewed_by_admin_at", None]},
                "last_admin_view_at": {"$ifNull": ["$last_admin_view_at", None]},  
                "viewed_by_user_at": {"$ifNull": ["$viewed_by_user_at", None]},
                "last_user_view_at": {"$ifNull": ["$last_user_view_at", None]},
                # Assignment fields
                "assigned_to": {"$ifNull": ["$assigned_to", None]},
                "assigned_to_name": {"$ifNull": ["$assigned_to_name", None]},
                "assigned_at": {"$ifNull": ["$assigned_at", None]},
                # Resolution fields  
                "first_response_at": {"$ifNull": ["$first_response_at", None]},
                "resolved_at": {"$ifNull": ["$resolved_at", None]},
                "closed_at": {"$ifNull": ["$closed_at", None]},
                "resolution_note": {"$ifNull": ["$resolution_note", None]},
                # Analytics fields
                "last_user_message_at": {"$ifNull": ["$last_user_message_at", None]},
                "last_support_message_at": {"$ifNull": ["$last_support_message_at", None]},
                # Other optional fields
                "related_course_id": {"$ifNull": ["$related_course_id", None]},
                "related_order_id": {"$ifNull": ["$related_order_id", None]},
                # Arrays with empty defaults
                "tags": {"$ifNull": ["$tags", []]},
                # Ensure response_count has default
                "response_count": {"$ifNull": ["$response_count", 0]}
            }},
            
            # Only remove _id field, preserve all other fields
            {"$project": {"_id": 0}}
        ]
        
        # Add unread filter to pipeline if requested
        if filter_unread_only:
            pipeline.append({"$match": {"is_unread": True}})
        
        # Add sorting
        sort_direction = -1 if query.sort_order == "desc" else 1
        pipeline.append({"$sort": {query.sort_by: sort_direction}})
        
        # Count total documents (before pagination)
        count_pipeline = pipeline.copy()
        count_pipeline.append({"$count": "total"})
        
        # Add pagination to main pipeline
        skip = (query.page - 1) * query.per_page
        pipeline.extend([
            {"$skip": skip},
            {"$limit": query.per_page}
        ])
        
        # Execute both pipelines
        collection = SupportTicket.get_motor_collection()
        
        # Get total count
        count_result = await collection.aggregate(count_pipeline).to_list(length=None)
        total = count_result[0]["total"] if count_result else 0
        
        # Get paginated results
        tickets = await collection.aggregate(pipeline).to_list(length=None)
        
        
        return {
            "items": tickets,
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
            if new_status == TicketStatus.CLOSED and not ticket.closed_at:
                ticket.closed_at = datetime.utcnow()
            elif new_status == TicketStatus.OPEN and not ticket.first_response_at:
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
            sender_name=sender.name or sender.email,
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
        else:
            ticket.last_user_message_at = datetime.utcnow()
            # Reopen if closed
            if ticket.status == TicketStatus.CLOSED:
                ticket.status = TicketStatus.OPEN
        
        ticket.update_timestamps()
        await ticket.save()
        
        # Send notifications
        if not message.is_internal_note:
            await self._notify_new_message(ticket, message, sender)
        
        return message


    async def get_ticket_stats(self, user: Optional[User] = None) -> Dict:
        """Get ticket statistics"""
        filter_dict = {}
        if user and user.role == "student":
            filter_dict["user_id"] = str(user.id)
        
        # Get counts by status (simplified to open/closed)
        total = await SupportTicket.find(filter_dict).count()
        open_count = await SupportTicket.find({**filter_dict, "status": TicketStatus.OPEN}).count()
        closed_count = await SupportTicket.find({**filter_dict, "status": TicketStatus.CLOSED}).count()
        
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
                }
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
            "closed_tickets": closed_count,
            "avg_response_time_hours": (
                stats.get("avg_response_time", 0) / 3600000 if stats.get("avg_response_time") else None
            ),
            "avg_resolution_time_hours": (
                stats.get("avg_resolution_time", 0) / 3600000 if stats.get("avg_resolution_time") else None
            ),
            "tickets_by_category": category_counts,
            "tickets_by_priority": priority_counts
        }

    async def _notify_support_team(self, ticket: SupportTicket):
        """Send notification to support team about new ticket"""
        try:
            await email_service.send_support_ticket_notification(
                ticket_id=str(ticket.id),
                user_name=ticket.user_name,
                user_email=ticket.user_email,
                ticket_title=ticket.title,
                ticket_description=ticket.description,
                ticket_category=ticket.category.value if hasattr(ticket.category, 'value') else ticket.category,
                ticket_priority=ticket.priority.value if hasattr(ticket.priority, 'value') else ticket.priority
            )
        except Exception as e:
            # Log error but don't fail the ticket creation
            print(f"Failed to send support team notification: {str(e)}")
            pass

    async def _notify_ticket_update(self, ticket: SupportTicket, updated_by: User):
        """Send notification about ticket update"""
        # Notify ticket owner if updated by support
        if updated_by.role in ["admin", "creator"] and ticket.user_id != str(updated_by.id):
            # Send email to user
            pass

    async def _notify_new_message(self, ticket: SupportTicket, message: TicketMessage, sender: User):
        """Send notification about new message"""
        try:
            # Notify the other party
            if sender.role in ["admin", "creator"]:
                # Notify user about support reply
                if message.is_internal_note:
                    return  # Don't notify users about internal notes
                
                await email_service.send_support_ticket_reply_notification(
                    ticket_id=str(ticket.id),
                    ticket_title=ticket.title,
                    user_name=ticket.user_name,
                    user_email=ticket.user_email,
                    reply_message=message.message,
                    sender_name=sender.name or sender.email,
                    sender_role=sender.role
                )
            else:
                # User replied, notify support team (could implement later if needed)
                # For now, support team can check dashboard regularly
                pass
                
        except Exception as e:
            # Log error but don't fail the message creation
            print(f"Failed to send message notification: {str(e)}")
            pass

    async def add_attachment(
        self, 
        ticket_id: str, 
        attachment_url: str, 
        filename: str,
        file_size: int,
        current_user: User
    ) -> Optional[TicketMessage]:
        """
        Add attachment to support ticket by creating a system message.
        
        Args:
            ticket_id: ID of the ticket
            attachment_url: URL of the uploaded file
            filename: Original filename
            file_size: File size in bytes
            current_user: User uploading the attachment
            
        Returns:
            TicketMessage with attachment or None if ticket not found/access denied
        """
        # Get ticket with access control
        ticket = await self.get_ticket(ticket_id, current_user)
        if not ticket:
            return None
        
        # Format file size for display
        if file_size < 1024:
            size_str = f"{file_size} bytes"
        elif file_size < 1024 * 1024:
            size_str = f"{file_size / 1024:.1f} KB"
        else:
            size_str = f"{file_size / (1024 * 1024):.1f} MB"
        
        # Create system message with attachment
        message_data = TicketMessage(
            ticket_id=ticket_id,
            sender_id=str(current_user.id),
            sender_name=current_user.name or current_user.email,
            sender_role="support" if current_user.role in ["admin", "creator"] else "user",
            message=f"📎 Uploaded attachment: **{filename}** ({size_str})",
            attachments=[attachment_url],
            is_internal_note=False
        )
        
        # Save the message
        await message_data.save()
        
        # Update ticket timestamps and response count
        ticket.response_count += 1
        ticket.last_user_message_at = datetime.utcnow()
        ticket.update_timestamps()
        await ticket.save()
        
        # Send notifications (will be implemented in Phase 2)
        await self._notify_new_message(ticket, message_data, current_user)
        
        return message_data
    
    async def close_ticket(self, ticket_id: str, current_user: User) -> Optional[SupportTicket]:
        """
        Close a support ticket (admin/creator only).
        
        Args:
            ticket_id: ID of the ticket to close
            current_user: User performing the action (must be admin/creator)
            
        Returns:
            Updated SupportTicket or None if not found/access denied
        """
        # Only admin/creator can close tickets
        if current_user.role not in ["admin", "creator"]:
            return None
            
        # Get ticket
        ticket = await self.get_ticket(ticket_id, current_user)
        if not ticket:
            return None
        
        # Update ticket status to closed
        ticket.status = TicketStatus.CLOSED
        ticket.closed_at = datetime.utcnow()
        ticket.resolved_at = ticket.resolved_at or datetime.utcnow()  # Set resolved if not already
        ticket.update_timestamps()
        
        await ticket.save()
        return ticket
    
    async def reopen_ticket(self, ticket_id: str, current_user: User) -> Optional[SupportTicket]:
        """
        Reopen a closed support ticket (admin/creator only).
        
        Args:
            ticket_id: ID of the ticket to reopen
            current_user: User performing the action (must be admin/creator)
            
        Returns:
            Updated SupportTicket or None if not found/access denied
        """
        # Only admin/creator can reopen tickets
        if current_user.role not in ["admin", "creator"]:
            return None
            
        # Get ticket
        ticket = await self.get_ticket(ticket_id, current_user)
        if not ticket:
            return None
        
        # Only reopen closed tickets
        if ticket.status != TicketStatus.CLOSED:
            return None
        
        # Update ticket status to open
        ticket.status = TicketStatus.OPEN
        ticket.closed_at = None
        ticket.resolved_at = None  # Clear resolved timestamp when reopening
        ticket.update_timestamps()
        
        await ticket.save()
        return ticket