"""
Security monitoring endpoints for admin users
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

from app.core.deps import get_admin_user
from app.services.security_monitoring import security_monitor
from app.schemas.base import StandardResponse
from app.models.user import User

router = APIRouter()


@router.get("/events", response_model=StandardResponse[Dict[str, Any]])
async def get_security_events(
    hours: int = Query(24, description="Number of hours to look back", ge=1, le=168),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    severity: Optional[str] = Query(None, description="Filter by severity (low, medium, high)"),
    current_user: User = Depends(get_admin_user)
):
    """
    Get security events for the specified time period (admin only)
    """
    try:
        if not security_monitor.db:
            raise HTTPException(
                status_code=503,
                detail="Security monitoring service not available"
            )
        
        # Build query
        since = datetime.utcnow() - timedelta(hours=hours)
        query = {"timestamp": {"$gte": since}}
        
        if event_type:
            query["event_type"] = event_type
        
        if severity:
            query["severity"] = severity
        
        # Get events from database
        events = await security_monitor.db.security_events.find(
            query
        ).sort("timestamp", -1).limit(1000).to_list(None)
        
        # Convert ObjectId to string
        for event in events:
            event["_id"] = str(event["_id"])
        
        return StandardResponse(
            success=True,
            message=f"Retrieved {len(events)} security events",
            data={
                "events": events,
                "period_hours": hours,
                "filters": {
                    "event_type": event_type,
                    "severity": severity
                }
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve security events: {str(e)}"
        )


@router.get("/summary", response_model=StandardResponse[Dict[str, Any]])
async def get_security_summary(
    hours: int = Query(24, description="Number of hours for summary", ge=1, le=168),
    current_user: User = Depends(get_admin_user)
):
    """
    Get security event summary for the specified time period (admin only)
    """
    try:
        summary = await security_monitor.get_security_summary(hours)
        
        return StandardResponse(
            success=True,
            message="Security summary retrieved successfully",
            data=summary
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve security summary: {str(e)}"
        )


@router.post("/cleanup", response_model=StandardResponse[Dict[str, Any]])
async def cleanup_old_events(
    days: int = Query(30, description="Delete events older than this many days", ge=7, le=365),
    current_user: User = Depends(get_admin_user)
):
    """
    Clean up old security events (admin only)
    """
    try:
        await security_monitor.cleanup_old_events(days)
        
        return StandardResponse(
            success=True,
            message=f"Successfully cleaned up security events older than {days} days",
            data={"days": days}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to cleanup security events: {str(e)}"
        )


@router.get("/alerts/thresholds", response_model=StandardResponse[Dict[str, Any]])
async def get_alert_thresholds(
    current_user: User = Depends(get_admin_user)
):
    """
    Get current alert thresholds (admin only)
    """
    return StandardResponse(
        success=True,
        message="Alert thresholds retrieved successfully",
        data={
            "thresholds": security_monitor.alert_thresholds,
            "channels": security_monitor.alert_channels
        }
    )


@router.post("/test-alert", response_model=StandardResponse[Dict[str, Any]])
async def test_security_alert(
    current_user: User = Depends(get_admin_user)
):
    """
    Send a test security alert (admin only)
    """
    try:
        # Log a test security event
        test_event = {
            "type": "test_alert",
            "severity": "low",
            "user_id": str(current_user.id),
            "details": {
                "message": "This is a test security alert",
                "triggered_by": current_user.email
            }
        }
        
        await security_monitor.log_security_event(test_event)
        
        # Manually trigger an alert
        await security_monitor._trigger_alert({
            "type": "test_alert",
            "event_type": "test_alert",
            "count": 1,
            "threshold": 1,
            "user_id": str(current_user.id),
            "timestamp": datetime.utcnow()
        })
        
        return StandardResponse(
            success=True,
            message="Test security alert sent successfully",
            data={"event": test_event}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send test alert: {str(e)}"
        )