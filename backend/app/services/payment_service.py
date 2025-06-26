"""
Payment service for handling Stripe payments and subscriptions.
Based on CLAUDE.md payment workflows.
"""
import os
import stripe
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
from fastapi import HTTPException
from beanie import PydanticObjectId

from app.models.payment import Payment
from app.models.course import Course
from app.models.user import User
from app.models.enrollment import Enrollment
from app.schemas.payment import (
    PaymentStatus, PaymentType, PaymentProvider,
    SubscriptionStatus, SubscriptionType
)
from app.services.enrollment_service import EnrollmentService
from app.services.email_service import EmailService
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")


class PaymentService:
    """Service for handling payment operations"""
    
    @staticmethod
    async def create_payment_intent(
        user: User,
        course: Course,
        payment_method_id: str
    ) -> Dict[str, Any]:
        """
        Create a Stripe payment intent for course purchase.
        
        Workflow:
        1. Validate course is paid and not already enrolled
        2. Create Stripe payment intent
        3. Create payment record in database
        4. Return client secret for frontend
        """
        try:
            # Check if user already enrolled
            existing_enrollment = await Enrollment.find_one({
                "user_id": user.id,
                "course_id": course.id,
                "is_active": True
            })
            
            if existing_enrollment:
                raise HTTPException(
                    status_code=400,
                    detail="User already enrolled in this course"
                )
            
            # Check if course is free
            if course.pricing.get("is_free", False):
                raise HTTPException(
                    status_code=400,
                    detail="Cannot purchase a free course"
                )
            
            # Create or retrieve Stripe customer
            if not user.subscription or not user.subscription.get("stripe_customer_id"):
                customer = stripe.Customer.create(
                    email=user.email,
                    name=user.name,
                    metadata={"user_id": str(user.id)}
                )
                
                # Update user with Stripe customer ID
                if not user.subscription:
                    user.subscription = {}
                user.subscription["stripe_customer_id"] = customer.id
                await user.save()
            else:
                customer = stripe.Customer.retrieve(user.subscription["stripe_customer_id"])
            
            # Create payment intent
            amount = int(course.pricing.get("price", 0) * 100)  # Convert to cents
            
            payment_intent = stripe.PaymentIntent.create(
                amount=amount,
                currency=course.pricing.get("currency", "USD").lower(),
                customer=customer.id,
                payment_method=payment_method_id,
                metadata={
                    "user_id": str(user.id),
                    "course_id": str(course.id),
                    "course_title": course.title
                },
                description=f"Purchase: {course.title}"
            )
            
            # Create payment record
            payment = Payment(
                user_id=user.id,
                type=PaymentType.COURSE_PURCHASE,
                amount=course.pricing.get("price", 0),
                currency=course.pricing.get("currency", "USD"),
                status=PaymentStatus.PENDING,
                provider=PaymentProvider.STRIPE,
                provider_payment_id=payment_intent.id,
                provider_customer_id=customer.id,
                course_id=course.id,
                metadata={
                    "payment_method": "card",
                    "course_title": course.title
                }
            )
            await payment.insert()
            
            return {
                "client_secret": payment_intent.client_secret,
                "payment_intent_id": payment_intent.id,
                "amount": course.pricing.get("price", 0),
                "currency": course.pricing.get("currency", "USD")
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error(f"Payment intent creation failed: {str(e)}")
            raise HTTPException(status_code=500, detail="Payment processing failed")
    
    @staticmethod
    async def handle_payment_success(payment_intent_id: str) -> bool:
        """
        Handle successful payment completion.
        
        Workflow:
        1. Update payment status to completed
        2. Create enrollment for the user
        3. Send confirmation email
        """
        try:
            # Find payment record
            payment = await Payment.find_one({"provider_payment_id": payment_intent_id})
            if not payment:
                logger.error(f"Payment not found for intent: {payment_intent_id}")
                return False
            
            # Update payment status
            payment.status = PaymentStatus.COMPLETED
            payment.paid_at = datetime.utcnow()
            await payment.save()
            
            # Create enrollment
            if payment.course_id:
                enrollment = await EnrollmentService.create_enrollment(
                    user_id=str(payment.user_id),
                    course_id=str(payment.course_id),
                    enrollment_type="purchased",
                    payment_id=str(payment.id)
                )
                
                # Send confirmation email
                user = await User.get(payment.user_id)
                course = await Course.get(payment.course_id)
                
                if user and course:
                    await EmailService.send_purchase_confirmation(
                        user.email,
                        user.name,
                        course.title,
                        payment.amount,
                        payment.currency
                    )
            
            return True
            
        except Exception as e:
            logger.error(f"Payment success handling failed: {str(e)}")
            return False
    
    @staticmethod
    async def create_subscription(
        user: User,
        payment_method_id: str,
        plan_type: str = "pro"
    ) -> Dict[str, Any]:
        """
        Create a Pro subscription for the user.
        
        Workflow:
        1. Create/retrieve Stripe customer
        2. Create Stripe subscription
        3. Update user subscription status
        4. Create payment record
        """
        try:
            # Create or retrieve Stripe customer
            if not user.subscription or not user.subscription.get("stripe_customer_id"):
                customer = stripe.Customer.create(
                    email=user.email,
                    name=user.name,
                    payment_method=payment_method_id,
                    invoice_settings={"default_payment_method": payment_method_id},
                    metadata={"user_id": str(user.id)}
                )
                customer_id = customer.id
            else:
                customer_id = user.subscription["stripe_customer_id"]
                # Attach payment method to existing customer
                stripe.PaymentMethod.attach(payment_method_id, customer=customer_id)
                stripe.Customer.modify(
                    customer_id,
                    invoice_settings={"default_payment_method": payment_method_id}
                )
            
            # Get or create Stripe price ID for Pro plan
            # In production, this should be configured in environment
            price_id = os.getenv("STRIPE_PRO_PRICE_ID", "price_pro_monthly")
            
            # Create subscription
            subscription = stripe.Subscription.create(
                customer=customer_id,
                items=[{"price": price_id}],
                metadata={
                    "user_id": str(user.id),
                    "plan_type": plan_type
                }
            )
            
            # Update user subscription status
            user.subscription = {
                "type": SubscriptionType.PRO,
                "status": SubscriptionStatus.ACTIVE,
                "stripe_customer_id": customer_id,
                "stripe_subscription_id": subscription.id,
                "current_period_start": datetime.fromtimestamp(subscription.current_period_start),
                "current_period_end": datetime.fromtimestamp(subscription.current_period_end),
                "cancel_at_period_end": False
            }
            await user.save()
            
            # Create payment record
            payment = Payment(
                user_id=user.id,
                type=PaymentType.SUBSCRIPTION,
                amount=29.0,  # Pro plan price
                currency="USD",
                status=PaymentStatus.COMPLETED,
                provider=PaymentProvider.STRIPE,
                provider_payment_id=subscription.latest_invoice,
                provider_customer_id=customer_id,
                subscription_id=subscription.id,
                metadata={
                    "plan_type": plan_type,
                    "billing_cycle": "monthly"
                },
                paid_at=datetime.utcnow()
            )
            await payment.insert()
            
            # Send confirmation email
            await EmailService.send_subscription_confirmation(
                user.email,
                user.name,
                plan_type,
                29.0
            )
            
            return {
                "id": subscription.id,
                "user_id": str(user.id),
                "type": plan_type,
                "status": "active",
                "stripe_subscription_id": subscription.id,
                "stripe_customer_id": customer_id,
                "current_period_start": datetime.fromtimestamp(subscription.current_period_start),
                "current_period_end": datetime.fromtimestamp(subscription.current_period_end),
                "cancel_at_period_end": False,
                "created_at": datetime.utcnow()
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe subscription error: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error(f"Subscription creation failed: {str(e)}")
            raise HTTPException(status_code=500, detail="Subscription creation failed")
    
    @staticmethod
    async def cancel_subscription(
        user: User,
        cancel_at_period_end: bool = True
    ) -> Dict[str, Any]:
        """
        Cancel user's subscription.
        
        Workflow:
        1. Retrieve Stripe subscription
        2. Cancel subscription (immediately or at period end)
        3. Update user subscription status
        4. Send cancellation email
        """
        try:
            if not user.subscription or not user.subscription.get("stripe_subscription_id"):
                raise HTTPException(
                    status_code=400,
                    detail="No active subscription found"
                )
            
            subscription_id = user.subscription["stripe_subscription_id"]
            
            if cancel_at_period_end:
                # Cancel at end of billing period
                subscription = stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True
                )
            else:
                # Cancel immediately
                subscription = stripe.Subscription.delete(subscription_id)
            
            # Update user subscription status
            user.subscription["status"] = SubscriptionStatus.CANCELLED
            user.subscription["cancel_at_period_end"] = cancel_at_period_end
            await user.save()
            
            # Send cancellation email
            await EmailService.send_subscription_cancellation(
                user.email,
                user.name,
                user.subscription.get("current_period_end")
            )
            
            return {
                "message": "Subscription cancelled successfully",
                "cancel_at_period_end": cancel_at_period_end,
                "current_period_end": user.subscription.get("current_period_end")
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe cancellation error: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error(f"Subscription cancellation failed: {str(e)}")
            raise HTTPException(status_code=500, detail="Subscription cancellation failed")
    
    @staticmethod
    async def get_payment_history(
        user_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Get user's payment history"""
        try:
            # Get total count
            total_count = await Payment.find({"user_id": PydanticObjectId(user_id)}).count()
            
            # Get payments with pagination
            payments = await Payment.find(
                {"user_id": PydanticObjectId(user_id)}
            ).sort("-created_at").skip(offset).limit(limit).to_list()
            
            # Calculate total amount
            total_amount = sum(p.amount for p in payments if p.status == PaymentStatus.COMPLETED)
            
            return {
                "payments": payments,
                "total_count": total_count,
                "total_amount": total_amount
            }
            
        except Exception as e:
            logger.error(f"Error fetching payment history: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to fetch payment history")
    
    @staticmethod
    async def handle_webhook_event(event: Dict[str, Any]) -> bool:
        """
        Handle Stripe webhook events.
        
        Processes various webhook events like:
        - payment_intent.succeeded
        - subscription.created
        - subscription.updated
        - subscription.deleted
        """
        try:
            event_type = event.get("type")
            event_data = event.get("data", {}).get("object", {})
            
            if event_type == "payment_intent.succeeded":
                # Handle successful payment
                payment_intent_id = event_data.get("id")
                await PaymentService.handle_payment_success(payment_intent_id)
                
            elif event_type == "subscription.created" or event_type == "subscription.updated":
                # Update subscription status
                subscription_id = event_data.get("id")
                customer_id = event_data.get("customer")
                status = event_data.get("status")
                
                # Find user by customer ID
                user = await User.find_one({"subscription.stripe_customer_id": customer_id})
                if user:
                    user.subscription["status"] = status
                    user.subscription["current_period_start"] = datetime.fromtimestamp(
                        event_data.get("current_period_start")
                    )
                    user.subscription["current_period_end"] = datetime.fromtimestamp(
                        event_data.get("current_period_end")
                    )
                    await user.save()
                    
            elif event_type == "subscription.deleted":
                # Handle subscription cancellation
                customer_id = event_data.get("customer")
                user = await User.find_one({"subscription.stripe_customer_id": customer_id})
                if user:
                    user.subscription["status"] = SubscriptionStatus.CANCELLED
                    user.subscription["type"] = SubscriptionType.FREE
                    await user.save()
                    
            return True
            
        except Exception as e:
            logger.error(f"Webhook handling failed: {str(e)}")
            return False
    
    @staticmethod
    async def process_refund(
        payment: Payment,
        amount: Optional[float],
        reason: str,
        admin: User
    ) -> Dict[str, Any]:
        """
        Process payment refund through Stripe.
        
        Workflow:
        1. Validate payment can be refunded
        2. Process refund through Stripe
        3. Update payment status
        4. Cancel enrollment if course purchase
        5. Send refund confirmation email
        """
        try:
            # Check if payment can be refunded
            if payment.status != PaymentStatus.COMPLETED:
                raise HTTPException(
                    status_code=400,
                    detail="Only completed payments can be refunded"
                )
            
            if payment.status == PaymentStatus.REFUNDED:
                raise HTTPException(
                    status_code=400,
                    detail="Payment has already been refunded"
                )
            
            # Process refund through Stripe
            refund_amount = amount or payment.amount
            
            if payment.provider == PaymentProvider.STRIPE and payment.provider_payment_id:
                refund = stripe.Refund.create(
                    payment_intent=payment.provider_payment_id,
                    amount=int(refund_amount * 100),  # Convert to cents
                    reason="requested_by_customer",
                    metadata={
                        "admin_id": str(admin.id),
                        "reason": reason
                    }
                )
                
                # Update payment status
                payment.status = PaymentStatus.REFUNDED
                payment.refunded_at = datetime.utcnow()
                payment.metadata = payment.metadata or {}
                payment.metadata["refund_id"] = refund.id
                payment.metadata["refund_amount"] = refund_amount
                payment.metadata["refund_reason"] = reason
                payment.metadata["refunded_by"] = str(admin.id)
                await payment.save()
                
                # Cancel enrollment if it was a course purchase
                if payment.type == PaymentType.COURSE_PURCHASE and payment.course_id:
                    enrollment = await Enrollment.find_one({
                        "user_id": payment.user_id,
                        "course_id": payment.course_id,
                        "payment_id": payment.id
                    })
                    
                    if enrollment:
                        enrollment.is_active = False
                        enrollment.updated_at = datetime.utcnow()
                        enrollment.metadata = enrollment.metadata or {}
                        enrollment.metadata["cancelled_reason"] = "Payment refunded"
                        await enrollment.save()
                
                # Send refund confirmation email
                user = await User.get(payment.user_id)
                if user:
                    await EmailService.send_refund_confirmation(
                        user.email,
                        user.name,
                        refund_amount,
                        payment.currency,
                        reason
                    )
                
                return {
                    "success": True,
                    "message": "Refund processed successfully",
                    "payment_id": str(payment.id),
                    "refund_amount": refund_amount,
                    "refund_id": refund.id
                }
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Payment method does not support refunds"
                )
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe refund error: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))
        except HTTPException as e:
            raise e
        except Exception as e:
            logger.error(f"Refund processing failed: {str(e)}")
            raise HTTPException(status_code=500, detail="Refund processing failed")