"""
Payment schemas for Stripe integration.
Based on CLAUDE.md payment workflows.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator
from enum import Enum
from app.schemas.base import StandardResponse


class PaymentType(str, Enum):
    """Payment type enumeration"""
    COURSE_PURCHASE = "course_purchase"
    SUBSCRIPTION = "subscription"
    REFUND = "refund"


class PaymentStatus(str, Enum):
    """Payment status enumeration"""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class PaymentProvider(str, Enum):
    """Payment provider enumeration"""
    STRIPE = "stripe"
    MOMO = "momo"
    ZALOPAY = "zalopay"


class PaymentMethod(str, Enum):
    """Payment method enumeration"""
    CARD = "card"
    BANK_TRANSFER = "bank_transfer"
    E_WALLET = "e_wallet"


class SubscriptionStatus(str, Enum):
    """Subscription status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    CANCELLED = "cancelled"
    PAST_DUE = "past_due"


class SubscriptionType(str, Enum):
    """Subscription type enumeration"""
    FREE = "free"
    PRO = "pro"


# Request Schemas
class CoursePaymentRequest(BaseModel):
    """Request schema for course purchase"""
    course_id: str = Field(..., description="Course ID to purchase")
    payment_method_id: str = Field(..., description="Stripe payment method ID")
    
    class Config:
        json_schema_extra = {
            "example": {
                "course_id": "60d5eca77dd70542c0bdd77a",
                "payment_method_id": "pm_1234567890"
            }
        }


class SubscriptionRequest(BaseModel):
    """Request schema for subscription creation"""
    payment_method_id: str = Field(..., description="Stripe payment method ID")
    plan_type: SubscriptionType = Field(SubscriptionType.PRO, description="Subscription plan type")
    
    class Config:
        json_schema_extra = {
            "example": {
                "payment_method_id": "pm_1234567890",
                "plan_type": "pro"
            }
        }


class SubscriptionCancelRequest(BaseModel):
    """Request schema for subscription cancellation"""
    cancel_at_period_end: bool = Field(
        True, 
        description="Cancel at end of billing period or immediately"
    )
    reason: Optional[str] = Field(None, description="Cancellation reason")


class RefundRequest(BaseModel):
    """Request schema for payment refund"""
    payment_id: str = Field(..., description="Payment ID to refund")
    amount: Optional[float] = Field(None, description="Partial refund amount (None for full refund)")
    reason: str = Field(..., description="Refund reason")


# Response Schemas
class PaymentIntentResponse(BaseModel):
    """Response schema for payment intent creation"""
    client_secret: str = Field(..., description="Stripe client secret for frontend")
    payment_intent_id: str = Field(..., description="Stripe payment intent ID")
    amount: float = Field(..., description="Payment amount")
    currency: str = Field(..., description="Payment currency")
    
    class Config:
        json_schema_extra = {
            "example": {
                "client_secret": "pi_1234567890_secret_abcdef",
                "payment_intent_id": "pi_1234567890",
                "amount": 99.99,
                "currency": "USD"
            }
        }


class PaymentResponse(BaseModel):
    """Response schema for payment record"""
    id: str = Field(..., description="Payment ID")
    user_id: str = Field(..., description="User ID")
    type: PaymentType = Field(..., description="Payment type")
    amount: float = Field(..., description="Payment amount")
    currency: str = Field(..., description="Payment currency")
    status: PaymentStatus = Field(..., description="Payment status")
    provider: PaymentProvider = Field(..., description="Payment provider")
    provider_payment_id: Optional[str] = Field(None, description="Provider payment ID")
    course_id: Optional[str] = Field(None, description="Course ID for purchase")
    subscription_id: Optional[str] = Field(None, description="Subscription ID")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Payment metadata")
    paid_at: Optional[datetime] = Field(None, description="Payment completion time")
    created_at: datetime = Field(..., description="Creation timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "pay_60d5eca77dd70542c0bdd77a",
                "user_id": "user_123",
                "type": "course_purchase",
                "amount": 99.99,
                "currency": "USD",
                "status": "completed",
                "provider": "stripe",
                "provider_payment_id": "pi_1234567890",
                "course_id": "course_456",
                "metadata": {
                    "payment_method": "card",
                    "last_4_digits": "4242"
                },
                "paid_at": "2024-01-20T10:30:00Z",
                "created_at": "2024-01-20T10:28:00Z"
            }
        }


class SubscriptionResponse(BaseModel):
    """Response schema for subscription"""
    id: str = Field(..., description="Subscription ID")
    user_id: str = Field(..., description="User ID")
    type: SubscriptionType = Field(..., description="Subscription type")
    status: SubscriptionStatus = Field(..., description="Subscription status")
    stripe_subscription_id: str = Field(..., description="Stripe subscription ID")
    stripe_customer_id: str = Field(..., description="Stripe customer ID")
    current_period_start: datetime = Field(..., description="Current billing period start")
    current_period_end: datetime = Field(..., description="Current billing period end")
    cancel_at_period_end: bool = Field(..., description="Will cancel at period end")
    created_at: datetime = Field(..., description="Creation timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "sub_60d5eca77dd70542c0bdd77a",
                "user_id": "user_123",
                "type": "pro",
                "status": "active",
                "stripe_subscription_id": "sub_1234567890",
                "stripe_customer_id": "cus_1234567890",
                "current_period_start": "2024-01-01T00:00:00Z",
                "current_period_end": "2024-02-01T00:00:00Z",
                "cancel_at_period_end": False,
                "created_at": "2024-01-01T00:00:00Z"
            }
        }


class PaymentHistoryResponse(BaseModel):
    """Response schema for payment history"""
    payments: List[PaymentResponse] = Field(..., description="List of payments")
    total_count: int = Field(..., description="Total number of payments")
    total_amount: float = Field(..., description="Total amount paid")
    
    class Config:
        json_schema_extra = {
            "example": {
                "payments": [],
                "total_count": 5,
                "total_amount": 299.95
            }
        }


class PaymentStandardResponse(StandardResponse[PaymentResponse]):
    """Standard response wrapper for payment operations"""
    pass


class SubscriptionStandardResponse(StandardResponse[SubscriptionResponse]):
    """Standard response wrapper for subscription operations"""
    pass


class PaymentHistoryStandardResponse(StandardResponse[PaymentHistoryResponse]):
    """Standard response wrapper for payment history"""
    pass


# Webhook Schemas
class StripeWebhookEvent(BaseModel):
    """Schema for Stripe webhook events"""
    id: str = Field(..., description="Event ID")
    type: str = Field(..., description="Event type")
    data: Dict[str, Any] = Field(..., description="Event data")
    created: int = Field(..., description="Event timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "evt_1234567890",
                "type": "payment_intent.succeeded",
                "data": {
                    "object": {
                        "id": "pi_1234567890",
                        "amount": 9999,
                        "currency": "usd"
                    }
                },
                "created": 1704038400
            }
        }