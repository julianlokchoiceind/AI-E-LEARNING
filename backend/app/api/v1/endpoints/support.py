"""
Support ticket API endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File

from app.models.user import User
from app.models.support_ticket import TicketStatus, TicketPriority, TicketCategory
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


def convert_ticket_to_dict(ticket):
    """Convert SupportTicket to dictionary with proper ObjectId and enum handling"""
    return {
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
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create ticket: {str(e)}"
        )


@router.get("/tickets", response_model=StandardResponse[TicketListResponse])
async def get_tickets(
    q: Optional[str] = None,
    status: Optional[TicketStatus] = None,
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
        query = TicketSearchQuery(
            q=q,
            status=status,
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
                    # If it's a Pydantic model, convert manually
                    converted_items.append(convert_ticket_to_dict(ticket))
                else:
                    # If it's already a dict, keep as is
                    converted_items.append(ticket)
            result['items'] = converted_items
        
        return StandardResponse(
            success=True,
            data=result,
            message="Tickets retrieved successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
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
            status_code=status.HTTP_400_BAD_REQUEST,
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
                status_code=status.HTTP_404_NOT_FOUND,
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
            status_code=status.HTTP_400_BAD_REQUEST,
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
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found"
            )
        
        # Use manual dictionary conversion instead of .dict()
        ticket_dict = convert_ticket_to_dict(ticket)
        
        return StandardResponse(
            success=True,
            data=ticket_dict,
            message="Ticket updated successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
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
                status_code=status.HTTP_404_NOT_FOUND,
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
            status_code=status.HTTP_400_BAD_REQUEST,
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
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found, access denied, or ticket not resolved"
            )
        
        # Use manual dictionary conversion instead of .dict()
        ticket_dict = convert_ticket_to_dict(ticket)
        
        return StandardResponse(
            success=True,
            data=ticket_dict,
            message="Thank you for your feedback!"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
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
                status_code=status.HTTP_404_NOT_FOUND,
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
            status_code=status.HTTP_400_BAD_REQUEST,
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
                status_code=status.HTTP_404_NOT_FOUND,
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
            status_code=status.HTTP_400_BAD_REQUEST,
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
                status_code=status.HTTP_404_NOT_FOUND,
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
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to reopen ticket: {str(e)}"
        )