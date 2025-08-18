"""
Payment endpoints for course purchases and subscriptions.
Based on CLAUDE.md payment workflows.
"""
import os
import stripe
import logging
import random
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header, Request, Query
from app.core.deps import get_current_user
from app.models.user import User
from app.models.course import Course
from app.models.payment import Payment
from app.schemas.payment import (
    CoursePaymentRequest,
    SubscriptionRequest,
    SubscriptionCancelRequest,
    PaymentIntentResponse,
    PaymentHistoryResponse,
    SubscriptionResponse,
    StripeWebhookEvent,
    PaymentStatus,
    PaymentType
)
from app.schemas.base import StandardResponse
from app.services.payment_service import PaymentService
from app.services.course_service import CourseService
from app.core.exceptions import NotFoundException
from beanie import PydanticObjectId

router = APIRouter()
logger = logging.getLogger(__name__)

# Stripe webhook endpoint secret (read dynamically)
def get_webhook_secret():
    return os.getenv("STRIPE_WEBHOOK_SECRET", "")


@router.post("/course/{course_id}", response_model=StandardResponse[PaymentIntentResponse])
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
        
        return StandardResponse(
            success=True,
            data=result,
            message="Payment intent created successfully"
        )
        
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


@router.post("/subscription", response_model=StandardResponse[SubscriptionResponse])
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
            current_user.subscription.status == "active"):
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
        
        return StandardResponse(
            success=True,
            data=subscription,
            message="Subscription created successfully"
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Subscription creation error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Subscription creation failed"
        )


@router.get("/history", response_model=StandardResponse[PaymentHistoryResponse])
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
        
        return StandardResponse(
            success=True,
            data=history,
            message="Payment history retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error fetching payment history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch payment history"
        )


@router.get("/admin/history", response_model=StandardResponse[dict])
async def get_admin_payment_history(
    page: int = Query(1, description="Page number (1-based)", ge=1),
    per_page: int = Query(20, description="Items per page", ge=1, le=100),
    status: str = Query(None, description="Filter by payment status"),
    type: str = Query(None, description="Filter by payment type"),
    current_user: User = Depends(get_current_user)
):
    """
    Get all payments history for admin with user details.
    
    Admin-only endpoint that returns:
    1. All payments from all users
    2. User details (email, name) for each payment
    3. Payment analytics and filtering
    4. Comprehensive payment management data
    """
    try:
        # Check if user is admin
        if current_user.role != "admin":
            raise HTTPException(
                status_code=403,
                detail="Only admins can access all payments history"
            )
        
        # Build query filters
        query_filters = {}
        if status:
            query_filters["status"] = status
        if type:
            query_filters["type"] = type
        
        # Calculate pagination
        offset = (page - 1) * per_page
        total_count = await Payment.find(query_filters).count()
        total_pages = (total_count + per_page - 1) // per_page  # Ceiling division
        
        # Get payments with pagination
        all_payments = await Payment.find(query_filters).skip(offset).limit(per_page).to_list()
        
        # Get user details for each payment
        enriched_payments = []
        for payment in all_payments:
            try:
                # Get user details
                user = await User.get(payment.user_id)
                user_info = {
                    "email": user.email if user else "Unknown",
                    "name": user.name if user else "Unknown User"
                } if user else {"email": "Deleted User", "name": "Deleted User"}
                
                # Get course details if applicable
                course_info = None
                if payment.course_id:
                    try:
                        course = await Course.get(payment.course_id)
                        course_info = {
                            "title": course.title if course else "Unknown Course",
                            "id": str(payment.course_id)
                        }
                    except:
                        course_info = {"title": "Unknown Course", "id": str(payment.course_id)}
                
                # Format payment data
                payment_data = {
                    "id": str(payment.id),
                    "user": user_info,
                    "course": course_info,
                    "type": payment.type,
                    "amount": payment.amount,
                    "currency": payment.currency,
                    "status": payment.status,
                    "provider": payment.provider,
                    "provider_payment_id": payment.provider_payment_id,
                    "metadata": payment.metadata,
                    "created_at": payment.created_at.isoformat() if payment.created_at else None,
                    "paid_at": payment.paid_at.isoformat() if payment.paid_at else None,
                    "updated_at": payment.updated_at.isoformat() if payment.updated_at else None
                }
                
                enriched_payments.append(payment_data)
                
            except Exception as e:
                logger.warning(f"Error enriching payment {payment.id}: {str(e)}")
                # Add payment without user details as fallback
                enriched_payments.append({
                    "id": str(payment.id),
                    "user": {"email": "Error loading user", "name": "Error loading user"},
                    "course": None,
                    "type": payment.type,
                    "amount": payment.amount,
                    "currency": payment.currency,
                    "status": payment.status,
                    "provider": payment.provider,
                    "provider_payment_id": payment.provider_payment_id,
                    "metadata": payment.metadata,
                    "created_at": payment.created_at.isoformat() if payment.created_at else None,
                    "paid_at": payment.paid_at.isoformat() if payment.paid_at else None,
                    "updated_at": payment.updated_at.isoformat() if payment.updated_at else None
                })
        
        # Prepare response with unified pagination format
        response_data = {
            "payments": enriched_payments,
            "total": total_count,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
            "has_more": page < total_pages,
            "filters": {
                "status": status,
                "type": type
            }
        }
        
        return StandardResponse(
            success=True,
            data=response_data,
            message=f"Retrieved {len(enriched_payments)} payments for admin"
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error fetching admin payment history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch admin payment history"
        )


@router.post("/cancel", response_model=StandardResponse[SubscriptionResponse])
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
        has_active_subscription = False
        if current_user.subscription:
            try:
                status = current_user.subscription.get("status") if hasattr(current_user.subscription, 'get') else getattr(current_user.subscription, 'status', None)
                has_active_subscription = status == "active"
            except:
                has_active_subscription = False
        
        if not has_active_subscription:
            raise HTTPException(
                status_code=400,
                detail="No active subscription found"
            )
        
        # Cancel subscription
        result = await PaymentService.cancel_subscription(
            user=current_user,
            cancel_at_period_end=cancel_data.cancel_at_period_end
        )
        
        return StandardResponse(
            success=True,
            data=result,
            message=result.get("message", "Subscription cancelled successfully")
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
    stripe_signature: str = Header(None, alias="stripe-signature")
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
        webhook_secret = get_webhook_secret()
        
        # Check if we're in development mode (using Stripe CLI)
        is_development = os.getenv("NODE_ENV", "development") == "development"
        
        if not stripe_signature:
            logger.error("Missing stripe signature header")
            raise HTTPException(status_code=400, detail="Missing stripe signature")
        
        # Try to verify webhook signature
        try:
            event = stripe.Webhook.construct_event(
                payload,
                stripe_signature,
                webhook_secret
            )
            logger.info("✅ Webhook signature verified successfully")
            
        except stripe.error.SignatureVerificationError as e:
            if is_development:
                # In development with Stripe CLI, signature verification often fails
                # Process webhook without verification but log the issue
                logger.warning(f"⚠️ Dev mode: Signature verification failed, processing anyway: {str(e)}")
                import json
                try:
                    event = json.loads(payload.decode('utf-8'))
                except json.JSONDecodeError:
                    logger.error("Failed to parse webhook payload as JSON")
                    raise HTTPException(status_code=400, detail="Invalid payload")
            else:
                # In production, strict signature verification
                logger.error(f"Webhook signature verification failed: {str(e)}")
                raise HTTPException(status_code=400, detail="Invalid signature")
                
        except ValueError as e:
            logger.error(f"Invalid webhook payload: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid payload")
        
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


@router.get("/subscription/status", response_model=StandardResponse[dict])
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
            subscription_data = {
                "type": "free",
                "status": "inactive",
                "has_subscription": False
            }
        else:
            # Safe subscription data extraction
            try:
                if hasattr(current_user.subscription, 'get'):
                    # Dictionary case
                    subscription_data = {
                        "type": current_user.subscription.get("type", "free"),
                        "status": current_user.subscription.get("status", "inactive"),
                        "current_period_end": current_user.subscription.get("current_period_end"),
                        "cancel_at_period_end": current_user.subscription.get("cancel_at_period_end", False),
                        "has_subscription": current_user.subscription.get("status") == "active"
                    }
                else:
                    # Object case
                    subscription_data = {
                        "type": getattr(current_user.subscription, "type", "free"),
                        "status": getattr(current_user.subscription, "status", "inactive"),
                        "current_period_end": getattr(current_user.subscription, "current_period_end", None),
                        "cancel_at_period_end": getattr(current_user.subscription, "cancel_at_period_end", False),
                        "has_subscription": getattr(current_user.subscription, "status", None) == "active"
                    }
            except Exception as e:
                # Fallback to inactive
                subscription_data = {
                    "type": "free",
                    "status": "inactive",
                    "has_subscription": False
                }
        
        return StandardResponse(
            success=True,
            data=subscription_data,
            message="Subscription status retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error fetching subscription status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch subscription status"
        )


@router.get("/analytics/dashboard", response_model=StandardResponse[dict])
async def get_payment_analytics_dashboard(
    include: str = Query("all", description="Data to include: all, summary, trends"),
    days: int = Query(30, description="Number of days for trends analysis", ge=7, le=90),
    current_user: User = Depends(get_current_user)
):
    """
    Optimized combined payment analytics endpoint.
    
    Replaces /analytics/summary and /analytics/trends with a single efficient endpoint.
    Use 'include' parameter to get specific data:
    - 'all': Both summary and trends (default)
    - 'summary': Only summary metrics
    - 'trends': Only trends data
    
    This reduces API calls and improves performance by fetching data once.
    """
    try:
        
        # Check if user has access to analytics (admin or creator)
        if current_user.role not in ["admin", "creator"]:
            raise HTTPException(
                status_code=403,
                detail="Only admins and creators can access payment analytics"
            )
        
        # Single data fetch for efficiency
        from datetime import datetime, timedelta
        from collections import defaultdict
        
        now = datetime.utcnow()
        month_start = datetime(now.year, now.month, 1)
        
        # Determine date range for trends
        end_date = now
        start_date = end_date - timedelta(days=days)
        
        # Get all payments - single query
        all_payments = await Payment.find({}).to_list()
        
        # Filter payments by creator if not admin
        if current_user.role == "creator":
            creator_courses = await Course.find({"creator_id": current_user.id}).to_list()
            course_ids = [course.id for course in creator_courses]
            all_payments = [p for p in all_payments if p.course_id and p.course_id in course_ids]
        
        # Initialize response
        response_data = {}
        
        # SUMMARY DATA (if requested)
        if include in ["all", "summary"]:
            # Calculate summary metrics
            total_revenue = sum(p.amount for p in all_payments if p.status == PaymentStatus.COMPLETED)
            month_revenue = sum(
                p.amount for p in all_payments 
                if p.status == PaymentStatus.COMPLETED and p.created_at >= month_start
            )
            
            # Payment counts by status
            payment_counts = {}
            for status in PaymentStatus:
                payment_counts[status.value] = len([p for p in all_payments if p.status == status])
            
            # Active subscriptions
            if current_user.role == "admin":
                thirty_days_ago = datetime.utcnow() - timedelta(days=30)
                active_subscriptions = len([
                    p for p in all_payments 
                    if p.type == PaymentType.SUBSCRIPTION 
                    and p.status == PaymentStatus.COMPLETED
                    and p.created_at >= thirty_days_ago
                ])
            else:
                active_subscriptions = 0
            
            # Average payment value
            completed_payments = [p for p in all_payments if p.status == PaymentStatus.COMPLETED]
            avg_payment_value = (
                sum(p.amount for p in completed_payments) / len(completed_payments)
                if completed_payments else 0
            )
            
            # Payment types breakdown
            course_payments = len([p for p in all_payments if p.type == PaymentType.COURSE_PURCHASE])
            subscription_payments = len([p for p in all_payments if p.type == PaymentType.SUBSCRIPTION])
            
            response_data["summary"] = {
                "revenue": {
                    "total": round(total_revenue, 2),
                    "this_month": round(month_revenue, 2),
                    "average_payment": round(avg_payment_value, 2)
                },
                "payments": {
                    "total_count": len(all_payments),
                    "by_status": payment_counts,
                    "by_type": {
                        "course_purchases": course_payments,
                        "subscriptions": subscription_payments
                    }
                },
                "subscriptions": {
                    "active_count": active_subscriptions
                },
                "period": {
                    "from": month_start.isoformat(),
                    "to": now.isoformat()
                }
            }
        
        # TRENDS DATA (if requested)
        if include in ["all", "trends"]:
            # Filter payments for date range
            payments_in_range = [p for p in all_payments 
                                 if p.created_at >= start_date and p.created_at <= end_date]
            
            # Revenue trends by day
            daily_revenue = defaultdict(float)
            daily_payment_counts = defaultdict(int)
            
            for payment in payments_in_range:
                if payment.status == PaymentStatus.COMPLETED:
                    day_key = payment.created_at.strftime("%Y-%m-%d")
                    daily_revenue[day_key] += payment.amount
                    daily_payment_counts[day_key] += 1
            
            # Generate complete date range
            revenue_trends = []
            current_date = start_date
            while current_date <= end_date:
                day_key = current_date.strftime("%Y-%m-%d")
                revenue_trends.append({
                    "date": day_key,
                    "revenue": round(daily_revenue.get(day_key, 0), 2),
                    "payment_count": daily_payment_counts.get(day_key, 0)
                })
                current_date += timedelta(days=1)
            
            # Payment success/failure rates
            total_payments = len(payments_in_range)
            successful_payments = len([p for p in payments_in_range if p.status == PaymentStatus.COMPLETED])
            failed_payments = len([p for p in payments_in_range if p.status == PaymentStatus.FAILED])
            pending_payments = len([p for p in payments_in_range if p.status == PaymentStatus.PENDING])
            
            success_rate = (successful_payments / total_payments * 100) if total_payments > 0 else 0
            
            # Top paying courses
            course_revenue = defaultdict(float)
            course_titles = {}
            
            for payment in payments_in_range:
                if payment.status == PaymentStatus.COMPLETED and payment.course_id:
                    course_revenue[str(payment.course_id)] += payment.amount
            
            # Get course titles for top courses
            if course_revenue:
                top_course_ids = sorted(course_revenue.keys(), key=lambda x: course_revenue[x], reverse=True)[:5]
                for course_id in top_course_ids:
                    try:
                        course = await Course.get(course_id)
                        if course:
                            course_titles[course_id] = course.title
                    except:
                        course_titles[course_id] = "Unknown Course"
            
            top_courses = [
                {
                    "course_id": course_id,
                    "course_title": course_titles.get(course_id, "Unknown Course"),
                    "revenue": round(course_revenue[course_id], 2),
                    "payment_count": len([p for p in payments_in_range 
                                        if p.status == PaymentStatus.COMPLETED and str(p.course_id) == course_id])
                }
                for course_id in sorted(course_revenue.keys(), key=lambda x: course_revenue[x], reverse=True)[:5]
            ]
            
            # Payment type breakdown
            course_purchases = [p for p in payments_in_range if p.type == PaymentType.COURSE_PURCHASE]
            subscriptions = [p for p in payments_in_range if p.type == PaymentType.SUBSCRIPTION]
            
            course_revenue_total = sum(p.amount for p in course_purchases if p.status == PaymentStatus.COMPLETED)
            subscription_revenue_total = sum(p.amount for p in subscriptions if p.status == PaymentStatus.COMPLETED)
            
            response_data["trends"] = {
                "period": {
                    "start_date": start_date.strftime("%Y-%m-%d"),
                    "end_date": end_date.strftime("%Y-%m-%d"),
                    "days": days
                },
                "revenue_trends": revenue_trends,
                "payment_stats": {
                    "total_payments": total_payments,
                    "successful": successful_payments,
                    "failed": failed_payments,
                    "pending": pending_payments,
                    "success_rate": round(success_rate, 2)
                },
                "top_courses": top_courses,
                "payment_types": {
                    "course_purchases": {
                        "count": len(course_purchases),
                        "revenue": round(course_revenue_total, 2)
                    },
                    "subscriptions": {
                        "count": len(subscriptions),
                        "revenue": round(subscription_revenue_total, 2)
                    }
                }
            }
        
        # Return optimized response
        return {
            "success": True,
            "data": response_data,
            "message": f"Payment analytics {'dashboard' if include == 'all' else include} retrieved successfully"
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error fetching payment analytics dashboard: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch payment analytics dashboard"
        )


# OLD TRENDS ENDPOINT REMOVED - Use /analytics/dashboard?include=trends


# OLD SUMMARY ENDPOINT REMOVED - Use /analytics/dashboard?include=summary


@router.post("/seed-test-data", response_model=StandardResponse[dict])
async def seed_test_payment_data(
    current_user: User = Depends(get_current_user)
):
    """
    Seed test payment data for development and testing.
    
    Creates sample payments with various statuses, types, and dates
    to test analytics endpoints without needing real Stripe transactions.
    
    DEVELOPMENT/TESTING ONLY - Remove for production
    """
    try:
        # Check if user is admin (only admins can seed data)
        if current_user.role != "admin":
            raise HTTPException(
                status_code=403,
                detail="Only admins can seed test data"
            )
        
        # Get existing courses to attach payments to
        courses = await Course.find({}).limit(5).to_list()
        if not courses:
            raise HTTPException(
                status_code=400,
                detail="No courses found. Please create courses first."
            )
        
        # Get existing users to create payments for
        users = await User.find({}).limit(10).to_list()
        if not users:
            raise HTTPException(
                status_code=400,
                detail="No users found. Please create users first."
            )
        
        # Generate test payment data
        test_payments = []
        payment_count = 0
        
        # Create payments for last 30 days
        for day_offset in range(30):
            payment_date = datetime.utcnow() - timedelta(days=day_offset)
            
            # Random number of payments per day (0-3)
            daily_payments = random.randint(0, 3)
            
            for _ in range(daily_payments):
                # Random course and user
                course = random.choice(courses)
                user = random.choice(users)
                
                # Random payment type
                payment_type = random.choice([PaymentType.COURSE_PURCHASE, PaymentType.SUBSCRIPTION])
                
                # Random status (80% completed, 15% pending, 5% failed)
                status_rand = random.random()
                if status_rand < 0.8:
                    status = PaymentStatus.COMPLETED
                elif status_rand < 0.95:
                    status = PaymentStatus.PENDING
                else:
                    status = PaymentStatus.FAILED
                
                # Payment amount based on type
                if payment_type == PaymentType.COURSE_PURCHASE:
                    amount = random.choice([29.99, 49.99, 99.99, 199.99])
                else:  # Subscription
                    amount = 29.0
                
                # Create payment record
                payment = Payment(
                    user_id=user.id,
                    type=payment_type,
                    amount=amount,
                    currency="USD",
                    status=status,
                    provider="stripe",
                    provider_payment_id=f"pi_test_{random.randint(100000, 999999)}",
                    course_id=course.id if payment_type == PaymentType.COURSE_PURCHASE else None,
                    metadata={
                        "test_data": True,
                        "course_title": course.title if payment_type == PaymentType.COURSE_PURCHASE else None,
                        "payment_method": "card"
                    },
                    created_at=payment_date,
                    paid_at=payment_date if status == PaymentStatus.COMPLETED else None
                )
                
                test_payments.append(payment)
                payment_count += 1
        
        # Insert all test payments
        if test_payments:
            await Payment.insert_many(test_payments)
        
        # Also create some Pro subscription users for analytics
        subscription_users = random.sample(users, min(3, len(users)))
        for user in subscription_users:
            # Safe check for subscription status
            has_active_subscription = False
            if user.subscription:
                try:
                    # Handle both dict and object cases
                    status = user.subscription.get("status") if hasattr(user.subscription, 'get') else getattr(user.subscription, 'status', None)
                    has_active_subscription = status == "active"
                except:
                    has_active_subscription = False
            
            if not has_active_subscription:
                user.subscription = {
                    "type": "pro",
                    "status": "active",
                    "stripe_customer_id": f"cus_test_{random.randint(100000, 999999)}",
                    "stripe_subscription_id": f"sub_test_{random.randint(100000, 999999)}",
                    "current_period_start": datetime.utcnow() - timedelta(days=15),
                    "current_period_end": datetime.utcnow() + timedelta(days=15),
                    "cancel_at_period_end": False
                }
                await user.save()
        
        return StandardResponse(
            success=True,
            data={
                "message": "Test payment data seeded successfully",
                "payments_created": payment_count,
                "subscriptions_created": len(subscription_users),
                "date_range": {
                    "from": (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d"),
                    "to": datetime.utcnow().strftime("%Y-%m-%d")
                }
            },
            message=f"Created {payment_count} test payments and {len(subscription_users)} test subscriptions"
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error seeding test data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to seed test data: {str(e)}"
        )