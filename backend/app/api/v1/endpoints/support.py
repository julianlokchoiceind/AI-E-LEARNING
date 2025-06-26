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
    TicketStandardResponse,
    TicketWithMessagesStandardResponse,
    TicketListStandardResponse,
    MessageStandardResponse,
    TicketStatsStandardResponse
)
from app.services.support_ticket_service import SupportTicketService
from app.core.deps import get_current_user, get_admin_user

router = APIRouter()
ticket_service = SupportTicketService()


@router.post("/tickets", response_model=TicketStandardResponse)
async def create_ticket(
    ticket_data: TicketCreateRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a new support ticket"""
    try:
        ticket = await ticket_service.create_ticket(current_user, ticket_data)
        return {
            "success": True,
            "data": ticket.dict(),
            "message": "Support ticket created successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create ticket: {str(e)}"
        )


@router.get("/tickets", response_model=TicketListStandardResponse)
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
        return {
            "success": True,
            "data": result,
            "message": "Tickets retrieved successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch tickets: {str(e)}"
        )


@router.get("/tickets/stats", response_model=TicketStatsStandardResponse)
async def get_ticket_stats(
    current_user: User = Depends(get_current_user)
):
    """Get ticket statistics"""
    try:
        stats = await ticket_service.get_ticket_stats(current_user)
        return {
            "success": True,
            "data": stats,
            "message": "Ticket statistics retrieved successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch ticket stats: {str(e)}"
        )


@router.get("/tickets/{ticket_id}", response_model=TicketWithMessagesStandardResponse)
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
        
        return {
            "success": True,
            "data": ticket_data,
            "message": "Ticket retrieved successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch ticket: {str(e)}"
        )


@router.put("/tickets/{ticket_id}", response_model=TicketStandardResponse)
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
        
        return {
            "success": True,
            "data": ticket.dict(),
            "message": "Ticket updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update ticket: {str(e)}"
        )


@router.post("/tickets/{ticket_id}/messages", response_model=MessageStandardResponse)
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
        
        return {
            "success": True,
            "data": message.dict(),
            "message": "Message added successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to add message: {str(e)}"
        )


@router.post("/tickets/{ticket_id}/rate", response_model=TicketStandardResponse)
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
        
        return {
            "success": True,
            "data": ticket.dict(),
            "message": "Thank you for your feedback!"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to rate ticket: {str(e)}"
        )