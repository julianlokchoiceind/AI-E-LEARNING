"""
Payment endpoints for course purchases and subscriptions.
Based on CLAUDE.md payment workflows.
"""
import os
import stripe
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from app.core.deps import get_current_user
from app.models.user import User
from app.models.course import Course
from app.schemas.payment import (
    CoursePaymentRequest,
    SubscriptionRequest,
    SubscriptionCancelRequest,
    PaymentIntentResponse,
    PaymentHistoryResponse,
    SubscriptionResponse,
    PaymentStandardResponse,
    SubscriptionStandardResponse,
    PaymentHistoryStandardResponse,
    StripeWebhookEvent
)
from app.services.payment_service import PaymentService
from app.services.course_service import CourseService
from app.core.exceptions import NotFoundException
from beanie import PydanticObjectId

router = APIRouter()
logger = logging.getLogger(__name__)

# Stripe webhook endpoint secret
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")


@router.post("/course/{course_id}", response_model=PaymentIntentResponse)
async def create_course_payment(
    course_id: str,
    payment_data: CoursePaymentRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Create payment intent for course purchase.
    
    Workflow:
    1. Validate course exists and is paid
    2. Check user not already enrolled
    3. Create Stripe payment intent
    4. Process payment with payment_service
    5. Create enrollment on success
    6. Send purchase confirmation email
    7. Return payment status + access
    """
    try:
        # Validate course ID format
        if not PydanticObjectId.is_valid(course_id):
            raise HTTPException(
                status_code=400,
                detail="Invalid course ID format"
            )
        
        # Get course
        course = await Course.get(course_id)
        if not course:
            raise NotFoundException("Course not found")
        
        # Validate course ID matches request
        if str(course.id) != payment_data.course_id:
            raise HTTPException(
                status_code=400,
                detail="Course ID mismatch"
            )
        
        # Create payment intent
        result = await PaymentService.create_payment_intent(
            user=current_user,
            course=course,
            payment_method_id=payment_data.payment_method_id
        )
        
        return result
        
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Payment creation error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Payment processing failed"
        )


@router.post("/subscription", response_model=SubscriptionStandardResponse)
async def create_subscription(
    subscription_data: SubscriptionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Create Pro subscription for user.
    
    Workflow:
    1. Validate Pro subscription plan
    2. Create Stripe subscription
    3. Process recurring payment
    4. Update user.subscription_status
    5. Grant Pro access to all courses
    6. Send subscription confirmation
    7. Return subscription details
    """
    try:
        # Check if user already has active subscription
        if (current_user.subscription and 
            current_user.subscription.get("status") == "active"):
            raise HTTPException(
                status_code=400,
                detail="User already has an active subscription"
            )
        
        # Create subscription
        subscription = await PaymentService.create_subscription(
            user=current_user,
            payment_method_id=subscription_data.payment_method_id,
            plan_type=subscription_data.plan_type
        )
        
        return SubscriptionStandardResponse(
            success=True,
            message="Subscription created successfully",
            data=subscription
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Subscription creation error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Subscription creation failed"
        )


@router.get("/history", response_model=PaymentHistoryStandardResponse)
async def get_payment_history(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user)
):
    """
    Get user's payment history.
    
    Workflow:
    1. Fetch user payment records
    2. Include subscription status
    3. Format payment data
    4. Return transaction history
    """
    try:
        history = await PaymentService.get_payment_history(
            user_id=str(current_user.id),
            limit=limit,
            offset=offset
        )
        
        return PaymentHistoryStandardResponse(
            success=True,
            message="Payment history retrieved",
            data=history
        )
        
    except Exception as e:
        logger.error(f"Error fetching payment history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch payment history"
        )


@router.post("/cancel", response_model=SubscriptionStandardResponse)
async def cancel_subscription(
    cancel_data: SubscriptionCancelRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Cancel user's subscription.
    
    Workflow:
    1. Cancel Stripe subscription
    2. Update user subscription status
    3. Set expiry date to end of billing period
    4. Send cancellation confirmation
    5. Return cancellation status
    """
    try:
        # Check if user has active subscription
        if (not current_user.subscription or 
            current_user.subscription.get("status") != "active"):
            raise HTTPException(
                status_code=400,
                detail="No active subscription found"
            )
        
        # Cancel subscription
        result = await PaymentService.cancel_subscription(
            user=current_user,
            cancel_at_period_end=cancel_data.cancel_at_period_end
        )
        
        return SubscriptionStandardResponse(
            success=True,
            message=result["message"],
            data=result
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Subscription cancellation error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Subscription cancellation failed"
        )


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None)
):
    """
    Handle Stripe webhook events.
    
    Processes:
    - payment_intent.succeeded
    - payment_intent.failed
    - subscription.created
    - subscription.updated
    - subscription.deleted
    - invoice.payment_succeeded
    - invoice.payment_failed
    """
    try:
        # Get raw body
        payload = await request.body()
        
        # Verify webhook signature
        try:
            event = stripe.Webhook.construct_event(
                payload,
                stripe_signature,
                STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            logger.error("Invalid webhook payload")
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError:
            logger.error("Invalid webhook signature")
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        # Handle the event
        success = await PaymentService.handle_webhook_event(event)
        
        if not success:
            logger.error(f"Failed to handle webhook event: {event['type']}")
            raise HTTPException(
                status_code=500,
                detail="Webhook processing failed"
            )
        
        return {"status": "success"}
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Webhook processing failed"
        )


@router.get("/subscription/status")
async def get_subscription_status(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's subscription status.
    
    Returns subscription details including:
    - Plan type (free/pro)
    - Status (active/cancelled/past_due)
    - Billing period
    - Cancellation status
    """
    try:
        if not current_user.subscription:
            return {
                "type": "free",
                "status": "inactive",
                "has_subscription": False
            }
        
        return {
            "type": current_user.subscription.get("type", "free"),
            "status": current_user.subscription.get("status", "inactive"),
            "current_period_end": current_user.subscription.get("current_period_end"),
            "cancel_at_period_end": current_user.subscription.get("cancel_at_period_end", False),
            "has_subscription": current_user.subscription.get("status") == "active"
        }
        
    except Exception as e:
        logger.error(f"Error fetching subscription status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch subscription status"
        )