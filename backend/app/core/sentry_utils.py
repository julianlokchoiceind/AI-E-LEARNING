"""
Sentry utilities for enhanced error tracking in e-learning platform.
"""
import functools
import logging
from typing import Any, Dict, Optional, Callable
import sentry_sdk
from sentry_sdk import set_user, set_tag, set_context, capture_exception, capture_message
from fastapi import Request

logger = logging.getLogger(__name__)


def track_user_context(user: Optional[Dict[str, Any]]) -> None:
    """
    Set user context for Sentry tracking.
    
    Args:
        user: User dictionary with id, email, role, etc.
    """
    if user:
        set_user({
            "id": str(user.get("_id", "")),
            "email": user.get("email", ""),
            "username": user.get("name", ""),
            "role": user.get("role", "student"),
            "premium_status": user.get("premium_status", False)
        })


def track_course_context(course_id: str, lesson_id: Optional[str] = None) -> None:
    """
    Set course context for learning-related errors.
    
    Args:
        course_id: Course ID
        lesson_id: Optional lesson ID
    """
    set_context("course", {
        "course_id": course_id,
        "lesson_id": lesson_id or "N/A"
    })


def track_payment_context(payment_id: str, amount: float, currency: str = "USD") -> None:
    """
    Set payment context for transaction errors.
    
    Args:
        payment_id: Payment transaction ID
        amount: Payment amount
        currency: Currency code
    """
    set_context("payment", {
        "payment_id": payment_id,
        "amount": amount,
        "currency": currency
    })


def track_ai_context(question: str, response_time: Optional[float] = None) -> None:
    """
    Set AI assistant context for AI-related errors.
    
    Args:
        question: User question to AI
        response_time: Response time in seconds
    """
    set_context("ai_assistant", {
        "question_length": len(question),
        "response_time": response_time or "N/A"
    })


def capture_enrollment_error(user_id: str, course_id: str, error: Exception) -> None:
    """
    Capture enrollment-specific errors with context.
    
    Args:
        user_id: User attempting enrollment
        course_id: Course being enrolled in
        error: The exception that occurred
    """
    set_tag("error.type", "enrollment")
    set_context("enrollment", {
        "user_id": user_id,
        "course_id": course_id
    })
    capture_exception(error)


def capture_video_playback_error(
    user_id: str, 
    lesson_id: str, 
    video_url: str, 
    error: Exception
) -> None:
    """
    Capture video playback errors with context.
    
    Args:
        user_id: User experiencing the error
        lesson_id: Lesson containing the video
        video_url: Video URL that failed
        error: The exception that occurred
    """
    set_tag("error.type", "video_playback")
    set_context("video", {
        "user_id": user_id,
        "lesson_id": lesson_id,
        "video_url": video_url
    })
    capture_exception(error)


def sentry_async_wrapper(func: Callable) -> Callable:
    """
    Decorator to automatically capture exceptions in async functions.
    
    Usage:
        @sentry_async_wrapper
        async def my_function():
            ...
    """
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            capture_exception(e)
            raise
    return wrapper


def sentry_sync_wrapper(func: Callable) -> Callable:
    """
    Decorator to automatically capture exceptions in sync functions.
    
    Usage:
        @sentry_sync_wrapper
        def my_function():
            ...
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            capture_exception(e)
            raise
    return wrapper


def track_business_metric(metric_name: str, value: float, tags: Optional[Dict[str, str]] = None) -> None:
    """
    Track business metrics in Sentry.
    
    Args:
        metric_name: Name of the metric (e.g., "enrollment_success_rate")
        value: Metric value
        tags: Optional tags for the metric
    """
    with sentry_sdk.start_transaction(op="business_metric", name=metric_name) as transaction:
        transaction.set_tag("metric.name", metric_name)
        transaction.set_tag("metric.value", str(value))
        
        if tags:
            for key, value in tags.items():
                transaction.set_tag(f"metric.{key}", value)


def log_slow_query(query_name: str, duration_ms: float, threshold_ms: float = 1000) -> None:
    """
    Log slow database queries to Sentry.
    
    Args:
        query_name: Name/description of the query
        duration_ms: Query duration in milliseconds
        threshold_ms: Threshold for considering a query slow
    """
    if duration_ms > threshold_ms:
        capture_message(
            f"Slow query detected: {query_name} took {duration_ms}ms",
            level="warning"
        )
        set_context("slow_query", {
            "query_name": query_name,
            "duration_ms": duration_ms,
            "threshold_ms": threshold_ms
        })


def configure_request_context(request: Request) -> None:
    """
    Configure Sentry context from FastAPI request.
    
    Args:
        request: FastAPI Request object
    """
    set_context("request", {
        "url": str(request.url),
        "method": request.method,
        "path": request.url.path,
        "query_params": dict(request.query_params),
        "client_host": request.client.host if request.client else "unknown"
    })