"""
Payment model for tracking all payment transactions.
Based on CLAUDE.md payment schema.
"""
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import Field
from beanie import Document, PydanticObjectId, Indexed


class Payment(Document):
    # User reference
    user_id: Indexed(PydanticObjectId) = Field(..., description="User who made the payment")
    
    # Payment details
    type: Indexed(str) = Field(..., description="Payment type: course_purchase, subscription, refund")
    amount: float = Field(..., ge=0, description="Payment amount")
    currency: str = Field(default="USD", description="Payment currency")
    
    # Related entities
    course_id: Optional[PydanticObjectId] = Field(None, description="Course ID for purchases")
    subscription_id: Optional[str] = Field(None, description="Stripe subscription ID")
    
    # Payment provider details
    provider: str = Field(default="stripe", description="Payment provider: stripe")
    provider_payment_id: Optional[str] = Field(None, description="Payment ID from provider")
    provider_customer_id: Optional[str] = Field(None, description="Customer ID from provider")
    
    # Payment status
    status: Indexed(str) = Field(
        default="pending", 
        description="Payment status: pending, completed, failed, cancelled, refunded"
    )
    
    # Payment metadata
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Payment metadata")
    
    # Timestamps
    paid_at: Optional[datetime] = Field(None, description="When payment was completed")
    refunded_at: Optional[datetime] = Field(None, description="When payment was refunded")
    created_at: Indexed(datetime) = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "payments"
        indexes = [
            "user_id",
            "type",
            "status",
            [("user_id", 1), ("status", 1)],
            [("type", 1), ("status", 1)],
            [("created_at", -1)]
        ]