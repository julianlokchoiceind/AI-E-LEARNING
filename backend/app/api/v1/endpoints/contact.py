"""
Contact form API endpoints - separate from support tickets
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from app.core.email import email_service
from app.schemas.base import StandardResponse


router = APIRouter()


class ContactFormRequest(BaseModel):
    """Contact form request schema"""
    name: str
    email: EmailStr
    subject: str
    message: str


@router.post("/contact", response_model=StandardResponse[dict])
async def submit_contact_form(contact_data: ContactFormRequest):
    """Submit contact form - available to all users without authentication"""
    try:
        # Send contact email to admin
        await email_service.send_contact_form_email(
            from_name=contact_data.name,
            from_email=contact_data.email,
            subject=contact_data.subject,
            message=contact_data.message
        )
        
        return StandardResponse(
            success=True,
            data={},
            message="Thank you for your message! We'll get back to you soon."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send contact message: {str(e)}"
        )