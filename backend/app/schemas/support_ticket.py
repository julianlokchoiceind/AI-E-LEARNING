"""
Support Ticket schemas for request/response validation
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator

from app.models.support_ticket import TicketPriority, TicketStatus, TicketCategory
from app.schemas.base import StandardResponse


# Request schemas
class TicketCreateRequest(BaseModel):
    """Request schema for creating a support ticket"""
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10, max_length=5000)
    category: TicketCategory
    priority: Optional[TicketPriority] = TicketPriority.MEDIUM
    related_course_id: Optional[str] = None
    related_order_id: Optional[str] = None
    attachments: Optional[List[str]] = Field(default_factory=list)


class TicketUpdateRequest(BaseModel):
    """Request schema for updating a ticket (admin/support)"""
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    category: Optional[TicketCategory] = None
    priority: Optional[TicketPriority] = None
    status: Optional[TicketStatus] = None
    assigned_to: Optional[str] = None
    tags: Optional[List[str]] = None
    resolution_note: Optional[str] = None


class MessageCreateRequest(BaseModel):
    """Request schema for adding a message to ticket"""
    message: str = Field(..., min_length=1, max_length=5000)
    attachments: Optional[List[str]] = Field(default_factory=list)
    is_internal_note: Optional[bool] = False


class TicketSearchQuery(BaseModel):
    """Query parameters for searching tickets"""
    q: Optional[str] = Field(None, description="Search query")
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    category: Optional[TicketCategory] = None
    assigned_to: Optional[str] = None
    user_id: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    page: int = Field(1, ge=1)
    per_page: int = Field(20, ge=1, le=100)
    sort_by: str = Field("created_at", pattern="^(created_at|updated_at|priority|status)$")
    sort_order: str = Field("desc", pattern="^(asc|desc)$")


class SatisfactionRatingRequest(BaseModel):
    """Request schema for ticket satisfaction rating"""
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=1000)


class ContactFormRequest(BaseModel):
    """Request schema for contact form submission"""
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')
    subject: str = Field(..., min_length=5, max_length=200)
    message: str = Field(..., min_length=10, max_length=5000)


# Response schemas
class TicketMessage(BaseModel):
    """Response schema for ticket message"""
    id: str = Field(..., alias="_id")
    ticket_id: str
    sender_id: str
    sender_name: str
    sender_role: str
    message: str
    attachments: List[str]
    is_internal_note: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


class SupportTicket(BaseModel):
    """Response schema for support ticket"""
    id: str = Field(..., alias="_id")
    user_id: str
    user_email: str
    user_name: str
    title: str
    description: str
    category: TicketCategory
    priority: TicketPriority
    status: TicketStatus
    assigned_to: Optional[str]
    assigned_to_name: Optional[str]
    assigned_at: Optional[datetime]
    tags: List[str]
    related_course_id: Optional[str]
    related_order_id: Optional[str]
    first_response_at: Optional[datetime]
    resolved_at: Optional[datetime]
    closed_at: Optional[datetime]
    resolution_note: Optional[str]
    response_count: int
    last_user_message_at: Optional[datetime]
    last_support_message_at: Optional[datetime]
    satisfaction_rating: Optional[int]
    satisfaction_comment: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


class TicketWithMessages(SupportTicket):
    """Support ticket with messages"""
    messages: List[TicketMessage] = Field(default_factory=list)


class TicketListResponse(BaseModel):
    """Response for paginated ticket list"""
    items: List[SupportTicket]
    total: int
    page: int
    per_page: int
    total_pages: int


class TicketStats(BaseModel):
    """Ticket statistics"""
    total_tickets: int
    open_tickets: int
    in_progress_tickets: int
    resolved_tickets: int
    avg_response_time_hours: Optional[float]
    avg_resolution_time_hours: Optional[float]
    satisfaction_avg: Optional[float]
    tickets_by_category: Dict[str, int]
    tickets_by_priority: Dict[str, int]


# Standard responses
TicketStandardResponse = StandardResponse[SupportTicket]
TicketWithMessagesStandardResponse = StandardResponse[TicketWithMessages]
TicketListStandardResponse = StandardResponse[TicketListResponse]
MessageStandardResponse = StandardResponse[TicketMessage]
TicketStatsStandardResponse = StandardResponse[TicketStats]