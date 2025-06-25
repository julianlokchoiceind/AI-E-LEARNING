"""
Email service for sending notifications.
"""
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails."""
    
    @staticmethod
    async def send_course_approved(
        recipient_email: str,
        creator_name: str,
        course_title: str
    ):
        """Send email notification when course is approved."""
        try:
            # In a real implementation, this would use SMTP or a service like SendGrid
            logger.info(f"Sending course approval email to {recipient_email}")
            
            subject = f"Your course '{course_title}' has been approved!"
            body = f"""
            Hi {creator_name},
            
            Great news! Your course "{course_title}" has been approved and is now published on our platform.
            
            Students can now enroll in your course and start learning.
            
            Best regards,
            The AI E-Learning Team
            """
            
            # TODO: Implement actual email sending
            # For now, just log the email
            logger.info(f"Email sent - Subject: {subject}, To: {recipient_email}")
            
        except Exception as e:
            logger.error(f"Failed to send course approval email: {str(e)}")
            # Don't raise exception to avoid blocking the approval process
    
    @staticmethod
    async def send_course_rejected(
        recipient_email: str,
        creator_name: str,
        course_title: str,
        feedback: str
    ):
        """Send email notification when course is rejected."""
        try:
            logger.info(f"Sending course rejection email to {recipient_email}")
            
            subject = f"Your course '{course_title}' needs revisions"
            body = f"""
            Hi {creator_name},
            
            Your course "{course_title}" has been reviewed and needs some revisions before it can be published.
            
            Feedback from our review team:
            {feedback}
            
            Please make the necessary changes and submit your course for review again.
            
            Best regards,
            The AI E-Learning Team
            """
            
            # TODO: Implement actual email sending
            logger.info(f"Email sent - Subject: {subject}, To: {recipient_email}")
            
        except Exception as e:
            logger.error(f"Failed to send course rejection email: {str(e)}")
    
    @staticmethod
    async def send_welcome_email(
        recipient_email: str,
        user_name: str
    ):
        """Send welcome email to new users."""
        try:
            logger.info(f"Sending welcome email to {recipient_email}")
            
            subject = "Welcome to AI E-Learning Platform!"
            body = f"""
            Hi {user_name},
            
            Welcome to the AI E-Learning Platform! We're excited to have you join our community.
            
            Start exploring our courses and begin your AI learning journey today.
            
            Best regards,
            The AI E-Learning Team
            """
            
            # TODO: Implement actual email sending
            logger.info(f"Email sent - Subject: {subject}, To: {recipient_email}")
            
        except Exception as e:
            logger.error(f"Failed to send welcome email: {str(e)}")
    
    @staticmethod
    async def send_enrollment_confirmation(
        recipient_email: str,
        user_name: str,
        course_title: str
    ):
        """Send confirmation when user enrolls in a course."""
        try:
            logger.info(f"Sending enrollment confirmation to {recipient_email}")
            
            subject = f"Enrolled in '{course_title}'"
            body = f"""
            Hi {user_name},
            
            You've successfully enrolled in "{course_title}"!
            
            You can start learning right away by visiting your dashboard.
            
            Happy learning!
            The AI E-Learning Team
            """
            
            # TODO: Implement actual email sending
            logger.info(f"Email sent - Subject: {subject}, To: {recipient_email}")
            
        except Exception as e:
            logger.error(f"Failed to send enrollment confirmation: {str(e)}")