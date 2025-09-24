"""
Waitlist API endpoints
"""
from fastapi import APIRouter, HTTPException, status, Request
from pydantic import BaseModel, EmailStr
from app.models.waitlist import Waitlist
from app.core.email import email_service
from app.schemas.base import StandardResponse


router = APIRouter()


class WaitlistJoinRequest(BaseModel):
    """Waitlist join request schema"""
    email: EmailStr


@router.post("/join", response_model=StandardResponse[dict])
async def join_waitlist(request: Request, waitlist_data: WaitlistJoinRequest):
    """Join waitlist - available to all users without authentication"""
    try:
        # Check if email already exists
        existing = await Waitlist.find_one({"email": waitlist_data.email})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This email has already joined the waitlist!"
            )

        # Get request info
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")

        # Create waitlist entry
        waitlist_entry = Waitlist(
            email=waitlist_data.email,
            ip_address=ip_address,
            user_agent=user_agent
        )
        await waitlist_entry.insert()

        # Send notification email to admin
        await email_service.send_waitlist_notification_email(
            email=waitlist_data.email,
            ip_address=ip_address,
            user_agent=user_agent
        )

        return StandardResponse(
            success=True,
            data={},
            message="🎉 Welcome to the waitlist! We'll notify you when we launch."
        )

    except HTTPException:
        # Re-raise HTTP exceptions (like our 409 duplicate)
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to join waitlist: {str(e)}"
        )