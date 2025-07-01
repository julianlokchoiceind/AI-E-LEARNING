"""
Support ticket API endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.models.user import User
from app.models.support_ticket import TicketStatus, TicketPriority, TicketCategory
from app.schemas.support_ticket import (
    TicketCreateRequest,
    TicketUpdateRequest,
    MessageCreateRequest,
    TicketSearchQuery,
    SatisfactionRatingRequest,
    ContactFormRequest,
    SupportTicketSchema,
    TicketWithMessagesSchema,
    TicketListSchema,
    MessageSchema,
    TicketStatsSchema
)
from app.services.support_ticket_service import SupportTicketService
from app.core.deps import get_current_user, get_admin_user
from app.core.email import email_service
from app.schemas.base import StandardResponse

router = APIRouter()
ticket_service = SupportTicketService()


@router.post("/tickets", response_model=StandardResponse[SupportTicketSchema])
async def create_ticket(
    ticket_data: TicketCreateRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a new support ticket"""
    try:
        ticket = await ticket_service.create_ticket(current_user, ticket_data)
        return StandardResponse(
            success=True,
            data=ticket.dict(),
            message="Support ticket created successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create ticket: {str(e)}"
        )


@router.get("/tickets", response_model=StandardResponse[TicketListSchema])
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


@router.get("/tickets/stats", response_model=StandardResponse[TicketStatsSchema])
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


@router.get("/tickets/{ticket_id}", response_model=StandardResponse[TicketWithMessagesSchema])
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


@router.put("/tickets/{ticket_id}", response_model=StandardResponse[SupportTicketSchema])
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
        
        return StandardResponse(
            success=True,
            data=ticket.dict(),
            message="Ticket updated successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update ticket: {str(e)}"
        )


@router.post("/tickets/{ticket_id}/messages", response_model=StandardResponse[MessageSchema])
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
        
        return StandardResponse(
            success=True,
            data=message.dict(),
            message="Message added successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to add message: {str(e)}"
        )


@router.post("/tickets/{ticket_id}/rate", response_model=StandardResponse[SupportTicketSchema])
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
        
        return StandardResponse(
            success=True,
            data=ticket.dict(),
            message="Thank you for your feedback!"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to rate ticket: {str(e)}"
        )


@router.post("/contact", response_model=StandardResponse[dict])
async def submit_contact_form(contact_data: ContactFormRequest):
    """Submit contact form - available to all users without authentication"""
    try:
        # Send contact email to admin
        await email_service.send_contact_form_email(
            from_name=contact_data.name,
            from_email=contact_data.email,
            subject=contact_data.subject,
            message=contact_data.message
        )
        
        return StandardResponse(
            success=True,
            data={},
            message="Thank you for your message! We'll get back to you soon."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send contact message: {str(e)}"
        )