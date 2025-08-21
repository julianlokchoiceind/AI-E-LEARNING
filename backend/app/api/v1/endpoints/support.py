"""
Support ticket API endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status as http_status, Query, UploadFile, File

from app.models.user import User
from app.models.support_ticket import SupportTicket, TicketStatus, TicketPriority, TicketCategory
from app.schemas.support_ticket import (
    TicketCreateRequest,
    TicketUpdateRequest,
    MessageCreateRequest,
    TicketSearchQuery,
    SatisfactionRatingRequest,
    SupportTicket,
    TicketWithMessages,
    TicketListResponse,
    TicketMessage,
    TicketStats
)
from app.services.support_ticket_service import SupportTicketService
from app.core.deps import get_current_user, get_admin_user
from app.core.email import email_service
from app.schemas.base import StandardResponse
from app.core.config import get_file_upload_service

router = APIRouter()
ticket_service = SupportTicketService()


def compute_is_unread(ticket_data, current_user=None):
    """Compute is_unread based on user role perspective (dict or object)"""
    is_unread = False
    
    # Get ticket fields - handle both dict and object
    if isinstance(ticket_data, dict):
        ticket_status = ticket_data.get('status')
        viewed_by_admin = ticket_data.get('viewed_by_admin_at')
        viewed_by_user = ticket_data.get('viewed_by_user_at')
        last_user_message_at = ticket_data.get('last_user_message_at')
        last_support_message_at = ticket_data.get('last_support_message_at')
    else:
        ticket_status = ticket_data.status.value if hasattr(ticket_data.status, 'value') else ticket_data.status
        viewed_by_admin = getattr(ticket_data, 'viewed_by_admin_at', None)
        viewed_by_user = getattr(ticket_data, 'viewed_by_user_at', None)
        last_user_message_at = getattr(ticket_data, 'last_user_message_at', None)
        last_support_message_at = getattr(ticket_data, 'last_support_message_at', None)
    
    # Only consider unread if ticket is not closed/resolved
    if ticket_status not in ["closed", "resolved"]:
        # Determine perspective based on user role
        if current_user and current_user.role in ["admin", "creator"]:
            # ADMIN perspective: Check if user sent new messages
            # New ticket never viewed by admin
            if not viewed_by_admin:
                is_unread = True
            # User messaged after admin last viewed
            elif last_user_message_at and viewed_by_admin:
                # Simple string comparison for ISO dates
                if str(last_user_message_at) > str(viewed_by_admin):
                    is_unread = True
        else:
            # USER perspective: Check if support sent new messages
            # Support replied but never viewed by user
            if last_support_message_at and not viewed_by_user:
                is_unread = True
            # Support replied after user last viewed
            elif last_support_message_at and viewed_by_user:
                # Simple string comparison for ISO dates  
                if str(last_support_message_at) > str(viewed_by_user):
                    is_unread = True
    return is_unread


def convert_ticket_to_dict(ticket, current_user=None):
    """Convert SupportTicket to dictionary with proper ObjectId and enum handling"""
    # Compute is_unread using centralized logic with user perspective
    is_unread = compute_is_unread(ticket, current_user)
    
    # Extract status properly
    ticket_status = ticket.status.value if hasattr(ticket.status, 'value') else ticket.status
    
    return {
        "id": str(ticket.id),
        "user_id": ticket.user_id,
        "user_email": ticket.user_email,
        "user_name": ticket.user_name,
        "title": ticket.title,
        "description": ticket.description,
        "category": ticket.category.value if hasattr(ticket.category, 'value') else ticket.category,
        "priority": ticket.priority.value if hasattr(ticket.priority, 'value') else ticket.priority,
        "status": ticket_status,
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
        "satisfaction_rating": ticket.satisfaction_rating,
        "satisfaction_comment": ticket.satisfaction_comment,
        "viewed_by_admin_at": ticket.viewed_by_admin_at.isoformat() if hasattr(ticket, 'viewed_by_admin_at') and ticket.viewed_by_admin_at else None,
        "last_admin_view_at": ticket.last_admin_view_at.isoformat() if hasattr(ticket, 'last_admin_view_at') and ticket.last_admin_view_at else None,
        "viewed_by_user_at": ticket.viewed_by_user_at.isoformat() if hasattr(ticket, 'viewed_by_user_at') and ticket.viewed_by_user_at else None,
        "last_user_view_at": ticket.last_user_view_at.isoformat() if hasattr(ticket, 'last_user_view_at') and ticket.last_user_view_at else None,
        "is_unread": is_unread,  # NEW: Computed field for admin unread status
        "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
        "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None
    }

def convert_message_to_dict(message):
    """Convert TicketMessage to dictionary with proper ObjectId handling"""
    return {
        "id": str(message.id),
        "ticket_id": message.ticket_id,
        "sender_id": message.sender_id,
        "sender_name": message.sender_name,
        "sender_role": message.sender_role,
        "message": message.message,
        "attachments": message.attachments,
        "is_internal_note": message.is_internal_note,
        "created_at": message.created_at.isoformat() if message.created_at else None,
        "updated_at": message.updated_at.isoformat() if message.updated_at else None
    }


@router.post("/tickets", response_model=StandardResponse[SupportTicket])
async def create_ticket(
    ticket_data: TicketCreateRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a new support ticket"""
    try:
        ticket = await ticket_service.create_ticket(current_user, ticket_data)
        
        # Manual dictionary conversion to handle ObjectId and enums
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
            "satisfaction_rating": ticket.satisfaction_rating,
            "satisfaction_comment": ticket.satisfaction_comment,
            "viewed_by_admin_at": ticket.viewed_by_admin_at.isoformat() if hasattr(ticket, 'viewed_by_admin_at') and ticket.viewed_by_admin_at else None,
            "last_admin_view_at": ticket.last_admin_view_at.isoformat() if hasattr(ticket, 'last_admin_view_at') and ticket.last_admin_view_at else None,
            "viewed_by_user_at": ticket.viewed_by_user_at.isoformat() if hasattr(ticket, 'viewed_by_user_at') and ticket.viewed_by_user_at else None,
            "last_user_view_at": ticket.last_user_view_at.isoformat() if hasattr(ticket, 'last_user_view_at') and ticket.last_user_view_at else None,
            "is_unread": True,  # New tickets are unread by default
            "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
            "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None
        }
        
        return StandardResponse(
            success=True,
            data=ticket_dict,
            message="Support ticket created successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=http_http_status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create ticket: {str(e)}"
        )


@router.get("/tickets", response_model=StandardResponse[TicketListResponse])
async def get_tickets(
    q: Optional[str] = None,
    status: Optional[str] = None,  # Change to str to handle "unread" virtual status
    priority: Optional[TicketPriority] = None,
    category: Optional[TicketCategory] = None,
    assigned_to: Optional[str] = None,
    user_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sort_by: str = "created_at",
    sort_order: str = "desc",
    current_user: User = Depends(get_current_user)
):
    """Get support tickets with filtering and pagination"""
    try:
        # Handle virtual "unread" status
        filter_unread_only = (status and status == "unread")
        actual_status = None
        
        if status and not filter_unread_only:
            try:
                actual_status = TicketStatus(status)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid status: {status}. Must be one of: {[s.value for s in TicketStatus]} or 'unread'"
                )
        
        query = TicketSearchQuery(
            q=q,
            status=actual_status,  # Pass validated enum or None
            priority=priority,
            category=category,
            assigned_to=assigned_to,
            user_id=user_id,
            page=page,
            per_page=per_page,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        result = await ticket_service.search_tickets(query, current_user)
        
        # Convert tickets in the result to handle ObjectId serialization
        if result and 'items' in result:
            converted_items = []
            for ticket in result['items']:
                if hasattr(ticket, 'dict'):
                    # If it's a Pydantic model, convert manually with current_user perspective
                    ticket_dict = convert_ticket_to_dict(ticket, current_user)
                    
                    # If filtering for unread only, check if ticket is actually unread
                    if filter_unread_only and not ticket_dict.get('is_unread', False):
                        continue  # Skip non-unread tickets
                        
                    converted_items.append(ticket_dict)
                else:
                    # If it's already a dict, keep as is
                    converted_items.append(ticket)
            result['items'] = converted_items
            
            # Update total count if we filtered for unread
            if filter_unread_only:
                result['total'] = len(converted_items)
                result['total_pages'] = (len(converted_items) + result.get('per_page', 20) - 1) // result.get('per_page', 20)
        
        return StandardResponse(
            success=True,
            data=result,
            message="Tickets retrieved successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch tickets: {str(e)}"
        )


@router.get("/tickets/stats", response_model=StandardResponse[TicketStats])
async def get_ticket_stats(
    current_user: User = Depends(get_current_user)
):
    """Get ticket statistics"""
    try:
        stats = await ticket_service.get_ticket_stats(current_user)
        return StandardResponse(
            success=True,
            data=stats,
            message="Ticket statistics retrieved successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch ticket stats: {str(e)}"
        )


@router.get("/tickets/{ticket_id}", response_model=StandardResponse[TicketWithMessages])
async def get_ticket(
    ticket_id: str,
    include_internal: bool = False,
    current_user: User = Depends(get_current_user)
):
    """Get a specific ticket with messages"""
    try:
        # Only admins can see internal notes
        if include_internal and current_user.role not in ["admin", "creator"]:
            include_internal = False
        
        ticket_data = await ticket_service.get_ticket_with_messages(
            ticket_id,
            current_user,
            include_internal
        )
        
        if not ticket_data:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Ticket not found or access denied"
            )
        
        # Service already returns properly converted data
        return StandardResponse(
            success=True,
            data=ticket_data,
            message="Ticket retrieved successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch ticket: {str(e)}"
        )


@router.put("/tickets/{ticket_id}", response_model=StandardResponse[SupportTicket])
async def update_ticket(
    ticket_id: str,
    update_data: TicketUpdateRequest,
    current_user: User = Depends(get_admin_user)
):
    """Update ticket (admin/support only)"""
    try:
        ticket = await ticket_service.update_ticket(ticket_id, update_data, current_user)
        
        if not ticket:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Ticket not found"
            )
        
        # Use manual dictionary conversion instead of .dict()
        ticket_dict = convert_ticket_to_dict(ticket, current_user)
        
        return StandardResponse(
            success=True,
            data=ticket_dict,
            message="Ticket updated successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update ticket: {str(e)}"
        )


@router.post("/tickets/{ticket_id}/messages", response_model=StandardResponse[TicketMessage])
async def add_message(
    ticket_id: str,
    message_data: MessageCreateRequest,
    current_user: User = Depends(get_current_user)
):
    """Add a message to ticket"""
    try:
        message = await ticket_service.add_message(ticket_id, message_data, current_user)
        
        if not message:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Ticket not found or access denied"
            )
        
        # Manual dictionary conversion for message  
        message_dict = {
            "id": str(message.id),
            "ticket_id": message.ticket_id,
            "sender_id": message.sender_id,
            "sender_name": message.sender_name,
            "sender_role": message.sender_role,
            "message": message.message,
            "attachments": message.attachments,
            "is_internal_note": message.is_internal_note,
            "created_at": message.created_at.isoformat() if message.created_at else None,
            "updated_at": message.updated_at.isoformat() if message.updated_at else None
        }
        
        return StandardResponse(
            success=True,
            data=message_dict,
            message="Message added successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to add message: {str(e)}"
        )


@router.post("/tickets/{ticket_id}/rate", response_model=StandardResponse[SupportTicket])
async def rate_ticket(
    ticket_id: str,
    rating_data: SatisfactionRatingRequest,
    current_user: User = Depends(get_current_user)
):
    """Rate ticket satisfaction"""
    try:
        ticket = await ticket_service.rate_ticket(ticket_id, rating_data, current_user)
        
        if not ticket:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Ticket not found, access denied, or ticket not resolved"
            )
        
        # Use manual dictionary conversion instead of .dict()
        ticket_dict = convert_ticket_to_dict(ticket, current_user)
        
        return StandardResponse(
            success=True,
            data=ticket_dict,
            message="Thank you for your feedback!"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to rate ticket: {str(e)}"
        )




@router.post("/tickets/{ticket_id}/attachments", response_model=StandardResponse[TicketMessage])
async def upload_attachment(
    ticket_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload attachment to support ticket"""
    try:
        # Get file upload service
        file_service = get_file_upload_service()
        
        # Upload file with support-ticket context
        upload_result = await file_service.upload_file(
            file=file,
            context="support-tickets",
            custom_filename=None  # Use original filename with ait- prefix
        )
        
        # Add attachment to ticket via service
        message = await ticket_service.add_attachment(
            ticket_id=ticket_id,
            attachment_url=upload_result["url"],
            filename=upload_result["original_filename"],
            file_size=upload_result["size"],
            current_user=current_user
        )
        
        if not message:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Ticket not found or access denied"
            )
        
        # Manual dictionary conversion for message
        message_dict = {
            "id": str(message.id),
            "ticket_id": message.ticket_id,
            "sender_id": message.sender_id,
            "sender_name": message.sender_name,
            "sender_role": message.sender_role,
            "message": message.message,
            "attachments": message.attachments,
            "is_internal_note": message.is_internal_note,
            "created_at": message.created_at.isoformat() if message.created_at else None,
            "updated_at": message.updated_at.isoformat() if message.updated_at else None
        }
        
        return StandardResponse(
            success=True,
            data=message_dict,
            message=f"Attachment '{upload_result['original_filename']}' uploaded successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to upload attachment: {str(e)}"
        )


@router.patch("/tickets/{ticket_id}/close", response_model=StandardResponse[dict])
async def close_ticket(
    ticket_id: str,
    current_user: User = Depends(get_admin_user)
):
    """Close support ticket (admin/support only)"""
    try:
        ticket = await ticket_service.close_ticket(ticket_id, current_user)
        
        if not ticket:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Ticket not found or cannot be closed"
            )
        
        # Manual dictionary conversion for ticket
        ticket_dict = {
            "id": str(ticket.id),
            "status": ticket.status.value if hasattr(ticket.status, 'value') else ticket.status,
            "closed_at": ticket.closed_at.isoformat() if ticket.closed_at else None,
            "resolved_at": ticket.resolved_at.isoformat() if ticket.resolved_at else None,
            "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None
        }
        
        return StandardResponse(
            success=True,
            data=ticket_dict,
            message="Ticket closed successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to close ticket: {str(e)}"
        )


@router.patch("/tickets/{ticket_id}/reopen", response_model=StandardResponse[dict])
async def reopen_ticket(
    ticket_id: str,
    current_user: User = Depends(get_admin_user)
):
    """Reopen closed support ticket (admin/support only)"""
    try:
        ticket = await ticket_service.reopen_ticket(ticket_id, current_user)
        
        if not ticket:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Ticket not found or cannot be reopened"
            )
        
        # Manual dictionary conversion for ticket
        ticket_dict = {
            "id": str(ticket.id),
            "status": ticket.status.value if hasattr(ticket.status, 'value') else ticket.status,
            "closed_at": ticket.closed_at.isoformat() if ticket.closed_at else None,
            "resolved_at": ticket.resolved_at.isoformat() if ticket.resolved_at else None,
            "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None
        }
        
        return StandardResponse(
            success=True,
            data=ticket_dict,
            message="Ticket reopened successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to reopen ticket: {str(e)}"
        )


@router.patch("/tickets/{ticket_id}/view", response_model=StandardResponse[dict])
async def mark_ticket_viewed(
    ticket_id: str,
    current_user: User = Depends(get_current_user)
):
    """Mark ticket as viewed by current user"""
    try:
        from datetime import datetime
        
        # Get the ticket
        from bson import ObjectId
        from app.core.database import get_database
        db = get_database()
        ticket_doc = await db.support_tickets.find_one({"_id": ObjectId(ticket_id)})
        if not ticket_doc:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Ticket not found"
            )
        
        # Work with raw document to avoid Pydantic validation issues
        # Check if user has access to this ticket
        if current_user.role == "student" and str(ticket_doc.get("user_id")) != str(current_user.id):
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Update viewed timestamps based on user role
        now = datetime.utcnow()
        update_data = {}
        
        if current_user.role in ["admin", "creator"]:
            # Admin viewing ticket - ALWAYS update viewed_by_admin_at (not just first time)
            update_data["viewed_by_admin_at"] = now
            update_data["last_admin_view_at"] = now
        else:
            # Student viewing ticket - ALWAYS update both timestamps
            update_data["viewed_by_user_at"] = now
            update_data["last_user_view_at"] = now
        
        # Update the ticket in database
        await db.support_tickets.update_one(
            {"_id": ObjectId(ticket_id)},
            {"$set": update_data}
        )
        
        # Get updated document for response
        updated_doc = await db.support_tickets.find_one({"_id": ObjectId(ticket_id)})
        
        return StandardResponse(
            success=True,
            data={
                "id": str(updated_doc["_id"]),
                "viewed_by_admin_at": updated_doc.get("viewed_by_admin_at").isoformat() if updated_doc.get("viewed_by_admin_at") else None,
                "last_admin_view_at": updated_doc.get("last_admin_view_at").isoformat() if updated_doc.get("last_admin_view_at") else None,
                "viewed_by_user_at": updated_doc.get("viewed_by_user_at").isoformat() if updated_doc.get("viewed_by_user_at") else None,
                "last_user_view_at": updated_doc.get("last_user_view_at").isoformat() if updated_doc.get("last_user_view_at") else None
            },
            message="Ticket marked as viewed"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to mark ticket as viewed: {str(e)}"
        )


@router.get("/admin/tickets", response_model=StandardResponse[TicketListResponse])
async def get_admin_tickets(
    q: Optional[str] = None,
    status: Optional[str] = None,  # Change to str to handle "unread"
    priority: Optional[TicketPriority] = None,
    category: Optional[TicketCategory] = None,
    assigned_to: Optional[str] = None,
    user_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sort_by: str = "created_at",
    sort_order: str = "desc",
    current_user: User = Depends(get_admin_user)
):
    """Get all support tickets for admin (no user filtering)"""
    try:
        # Check if filtering for unread tickets (status="unread" is virtual status)
        filter_unread_only = (status and status == "unread")
        
        # Convert status string to enum if it's a valid status
        actual_status = None
        if status and not filter_unread_only:
            try:
                actual_status = TicketStatus(status)
            except ValueError:
                actual_status = None
        
        query = TicketSearchQuery(
            q=q,
            status=actual_status,
            priority=priority,
            category=category,
            assigned_to=assigned_to,
            user_id=user_id,
            page=page,
            per_page=per_page,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        # Use optimized aggregation for better performance
        if filter_unread_only:
            # Use MongoDB aggregation pipeline for unread filtering - much faster
            result = await ticket_service.search_tickets_with_unread_aggregation(query, None, filter_unread_only=True)
        else:
            # Use standard search with is_unread computed at DB level
            result = await ticket_service.search_tickets_with_unread_aggregation(query, None, filter_unread_only=False)
        
        # ENSURE: is_unread field exists in all tickets
        if result.get('items'):
            for ticket in result['items']:
                if 'is_unread' not in ticket:
                    # Fallback: compute is_unread if missing
                    ticket['is_unread'] = compute_is_unread(ticket)
        
        return StandardResponse(
            success=True,
            data=result,
            message="Admin tickets retrieved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch admin tickets: {str(e)}"
        )


@router.get("/notifications", response_model=StandardResponse[dict])
async def get_notifications(current_user: User = Depends(get_current_user)):
    """Get support notifications: unread count and recent tickets"""
    try:
        from app.core.database import get_database
        from bson import ObjectId
        
        db = get_database()
        is_admin = current_user.role in ["admin", "creator"]
        
        if is_admin:
            # Admin: Get unread tickets with details for dropdown
            pipeline = [
                # Skip closed/resolved tickets for admin notifications
                {"$match": {
                    "status": {"$nin": ["closed", "resolved"]}
                }},
                
                # Compute is_unread (same logic as table aggregation)
                {"$addFields": {
                    "is_unread": {
                        "$cond": {
                            "if": {
                                "$or": [
                                    # Never viewed by admin
                                    {"$or": [
                                        {"$eq": ["$viewed_by_admin_at", None]},
                                        {"$eq": [{"$type": "$viewed_by_admin_at"}, "missing"]}
                                    ]},
                                    # User messaged after admin last viewed
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
                            },
                            "then": True,
                            "else": False
                        }
                    }
                }},
                
                # Filter only unread tickets
                {"$match": {"is_unread": True}},
                
                # Sort by most recent first
                {"$sort": {"created_at": -1}},
                
                # Add ID conversion and select fields for dropdown
                {"$project": {
                    "_id": 0,  # Exclude the original _id field
                    "id": {"$toString": "$_id"},
                    "title": 1,
                    "user_name": 1,
                    "category": 1,
                    "priority": 1,
                    "created_at": 1,
                    "is_unread": 1
                }}
            ]
        else:
            # User: Get their tickets with new support replies
            pipeline = [
                # Only user's tickets
                {"$match": {"user_id": str(current_user.id)}},
                
                # Compute is_unread for user
                {"$addFields": {
                    "is_unread": {
                        "$cond": {
                            "if": {
                                "$or": [
                                    # Support replied but never viewed by user
                                    {
                                        "$and": [
                                            {"$ne": ["$last_support_message_at", None]},
                                            {"$or": [
                                                {"$eq": ["$viewed_by_user_at", None]},
                                                {"$eq": [{"$type": "$viewed_by_user_at"}, "missing"]}
                                            ]}
                                        ]
                                    },
                                    # Support replied after user last viewed
                                    {
                                        "$and": [
                                            {"$ne": ["$last_support_message_at", None]},
                                            {"$ne": ["$viewed_by_user_at", None]},
                                            {"$ne": [{"$type": "$last_support_message_at"}, "missing"]},
                                            {"$ne": [{"$type": "$viewed_by_user_at"}, "missing"]},
                                            {"$gt": ["$last_support_message_at", "$viewed_by_user_at"]}
                                        ]
                                    }
                                ]
                            },
                            "then": True,
                            "else": False
                        }
                    }
                }},
                
                # Filter only unread tickets
                {"$match": {"is_unread": True}},
                
                # Sort by most recent first
                {"$sort": {"created_at": -1}},
                
                # Add ID conversion and select fields for dropdown
                {"$project": {
                    "_id": 0,  # Exclude the original _id field
                    "id": {"$toString": "$_id"},
                    "title": 1,
                    "user_name": 1,
                    "category": 1,
                    "priority": 1,
                    "created_at": 1,
                    "is_unread": 1
                }}
            ]
        
        # Execute aggregation to get all unread tickets
        collection = db.support_tickets
        unread_tickets = await collection.aggregate(pipeline).to_list(length=None)
        
        # Calculate count and recent tickets (limit 5 for dropdown performance)
        count = len(unread_tickets)
        recent_tickets = unread_tickets[:5]  # Limit to 5 most recent for dropdown
        
        # Ensure all ObjectId fields are converted to strings (safe approach)
        safe_recent_tickets = []
        for ticket in recent_tickets:
            safe_ticket = {}
            for key, value in ticket.items():
                if isinstance(value, ObjectId):
                    safe_ticket[key] = str(value)
                else:
                    safe_ticket[key] = value
            safe_recent_tickets.append(safe_ticket)
        
        return StandardResponse(
            success=True,
            data={
                "count": count,
                "recent_tickets": safe_recent_tickets
            },
            message="Support notifications retrieved"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to get support notifications: {str(e)}"
        )