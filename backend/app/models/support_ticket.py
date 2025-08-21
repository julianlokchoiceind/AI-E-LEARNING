"""
Support Ticket model for customer support
"""
from datetime import datetime
from typing import List, Optional
from enum import Enum
from beanie import Document, Indexed, Link
from pydantic import Field

from app.models.user import User


class TicketPriority(str, Enum):
    """Ticket priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TicketStatus(str, Enum):
    """Ticket status"""
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    WAITING_FOR_USER = "waiting_for_user"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketCategory(str, Enum):
    """Ticket categories"""
    TECHNICAL = "technical"
    BILLING = "billing"
    COURSE_CONTENT = "course_content"
    ACCOUNT = "account"
    FEATURE_REQUEST = "feature_request"
    BUG_REPORT = "bug_report"
    OTHER = "other"


class TicketMessage(Document):
    """Individual message in a support ticket thread"""
    ticket_id: str = Field(..., description="Parent ticket ID")
    sender_id: str = Field(..., description="User ID of the sender")
    sender_name: str = Field(..., description="Name of the sender")
    sender_role: str = Field(default="user", description="Role: user or support")
    message: str = Field(..., description="Message content")
    attachments: List[str] = Field(default_factory=list, description="Attachment URLs")
    is_internal_note: bool = Field(default=False, description="Internal note visible only to support")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "ticket_messages"
        indexes = [
            "ticket_id",
            "sender_id",
            "created_at"
        ]


class SupportTicket(Document):
    """Support ticket model"""
    # User information
    user_id: str = Field(..., description="User who created the ticket")
    user_email: str = Field(..., description="User email for reference")
    user_name: str = Field(..., description="User name for display")
    
    # Ticket details
    title: Indexed(str)  # type: ignore
    description: str = Field(..., description="Initial ticket description")
    category: TicketCategory = Field(default=TicketCategory.OTHER)
    priority: TicketPriority = Field(default=TicketPriority.MEDIUM)
    status: TicketStatus = Field(default=TicketStatus.OPEN)
    
    # Assignment
    assigned_to: Optional[str] = Field(None, description="Support agent ID")
    assigned_to_name: Optional[str] = Field(None, description="Support agent name")
    assigned_at: Optional[datetime] = None
    
    # Metadata
    tags: List[str] = Field(default_factory=list)
    related_course_id: Optional[str] = Field(None, description="Related course if applicable")
    related_order_id: Optional[str] = Field(None, description="Related payment/order if applicable")
    
    # Response tracking
    first_response_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    resolution_note: Optional[str] = None
    
    # Analytics
    response_count: int = Field(default=0, ge=0)
    last_user_message_at: Optional[datetime] = None
    last_support_message_at: Optional[datetime] = None
    satisfaction_rating: Optional[float] = Field(None, ge=1, le=5)
    satisfaction_comment: Optional[str] = None
    
    # Viewed tracking for notifications
    viewed_by_admin_at: Optional[datetime] = None
    last_admin_view_at: Optional[datetime] = None
    viewed_by_user_at: Optional[datetime] = None
    last_user_view_at: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "support_tickets"
        indexes = [
            "user_id",
            "status",
            "priority",
            "category",
            "assigned_to",
            "viewed_by_admin_at",  # For unread logic
            "last_user_message_at",  # For unread comparisons
            [("status", 1), ("priority", -1)],
            [("user_id", 1), ("created_at", -1)],
            [("status", 1), ("viewed_by_admin_at", 1)],  # For unread filtering
            [("viewed_by_admin_at", 1), ("last_user_message_at", -1)],  # For unread comparisons
            "created_at"
        ]

    def update_timestamps(self):
        """Update the updated_at timestamp"""
        self.updated_at = datetime.utcnow()