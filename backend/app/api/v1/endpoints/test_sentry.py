"""
Test endpoint for Sentry integration.
This file should be removed in production.
"""
from fastapi import APIRouter, HTTPException
import sentry_sdk
from app.core.sentry_utils import capture_enrollment_error, track_business_metric

router = APIRouter()


@router.get("/sentry-test")
async def test_sentry():
    """Test Sentry error tracking."""
    
    # Test 1: Capture a message
    sentry_sdk.capture_message("Test message from AI E-Learning Platform", level="info")
    
    # Test 2: Track a business metric
    track_business_metric("test_enrollment_rate", 0.85, {"course_type": "ai"})
    
    # Test 3: Raise an exception
    try:
        raise ValueError("Test error for Sentry")
    except Exception as e:
        sentry_sdk.capture_exception(e)
    
    return {
        "message": "Sentry test completed",
        "tests": [
            "Captured test message",
            "Tracked business metric",
            "Captured test exception"
        ]
    }


@router.get("/sentry-error")
async def test_sentry_error():
    """Test Sentry error tracking with unhandled exception."""
    # This will be automatically captured by Sentry
    raise HTTPException(status_code=500, detail="Test error for Sentry monitoring")