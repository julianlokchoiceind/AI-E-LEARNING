"""
Email service using Microsoft Graph API
Unified email service combining all email functionality
"""
import logging
from typing import Optional, List, Dict, Any
from pathlib import Path
import json
import requests
from msal import ConfidentialClientApplication

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Unified email service using Microsoft Graph API."""
    
    def __init__(self):
        self.authority = f"https://login.microsoftonline.com/{settings.AZURE_TENANT_ID}"
        self.scope = ["https://graph.microsoft.com/.default"]
        self.graph_endpoint = "https://graph.microsoft.com/v1.0"
        self.from_email = settings.MAIL_FROM_ADDRESS
        self.from_name = settings.EMAILS_FROM_NAME
        
        # Initialize MSAL app
        self.app = ConfidentialClientApplication(
            settings.AZURE_CLIENT_ID,
            authority=self.authority,
            client_credential=settings.AZURE_CLIENT_SECRET,
        )
        
        # Cache for access token
        self._token_cache = None
        
    def get_access_token(self) -> Optional[str]:
        """Get access token using client credentials flow"""
        try:
            # Try to get token from cache first
            if self._token_cache:
                # In production, check token expiry
                return self._token_cache
            
            # Acquire token
            result = self.app.acquire_token_for_client(scopes=self.scope)
            
            if "access_token" in result:
                self._token_cache = result["access_token"]
                logger.info("Successfully acquired access token")
                return result["access_token"]
            else:
                logger.error(f"Failed to acquire token: {result.get('error')}, {result.get('error_description')}")
                return None
                
        except Exception as e:
            logger.error(f"Error acquiring access token: {str(e)}")
            return None
        
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        attachments: Optional[List[Path]] = None
    ) -> bool:
        """
        Send email using Microsoft Graph API.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML content of the email
            text_content: Plain text content (optional)
            attachments: List of file paths to attach (optional)
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Get access token
            access_token = self.get_access_token()
            if not access_token:
                logger.error("Failed to get access token")
                return False
            
            # Note: Current Graph API implementation doesn't support attachments
            # This can be added later if needed
            if attachments:
                logger.warning("Attachments are not yet supported with Graph API")
            
            # Prepare email message
            message = {
                "message": {
                    "subject": subject,
                    "body": {
                        "contentType": "HTML",
                        "content": html_content
                    },
                    "toRecipients": [
                        {
                            "emailAddress": {
                                "address": to_email
                            }
                        }
                    ]
                },
                "saveToSentItems": True
            }
            
            # Send email via Graph API
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            endpoint = f"{self.graph_endpoint}/users/{self.from_email}/sendMail"
            response = requests.post(endpoint, headers=headers, json=message)
            
            if response.status_code == 202:
                logger.info(f"Email sent successfully to {to_email}")
                return True
            else:
                logger.error(f"Failed to send email: {response.status_code}, {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending email: {str(e)}")
            return False
    
    async def send_verification_email(
        self, 
        to_email: str, 
        name: str, 
        token: str
    ) -> bool:
        """Send email verification."""
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        
        subject = "Verify your email - CHOICE AI E-Learning Platform"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to AI E-Learning Platform!</h2>
            <p>Hi {name},</p>
            <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
            <div style="margin: 30px 0;">
                <a href="{verification_url}" 
                   style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; display: inline-block;">
                    Verify Email
                </a>
            </div>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all;">{verification_url}</p>
            <p>This link will expire in 24 hours.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;">
            <p style="color: #666; font-size: 14px;">
                If you didn't create an account, please ignore this email.
            </p>
        </div>
        """
        
        return await self.send_email(to_email, subject, html_content)
    
    async def send_password_reset_email(
        self,
        to_email: str,
        name: str,
        token: str
    ) -> bool:
        """Send password reset email."""
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        
        subject = "Reset your password - AI E-Learning Platform"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>Hi {name},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="margin: 30px 0;">
                <a href="{reset_url}" 
                   style="background-color: #EF4444; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; display: inline-block;">
                    Reset Password
                </a>
            </div>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all;">{reset_url}</p>
            <p>This link will expire in 1 hour.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;">
            <p style="color: #666; font-size: 14px;">
                If you didn't request this password reset, please ignore this email.
                Your password won't be changed.
            </p>
        </div>
        """
        
        return await self.send_email(to_email, subject, html_content)
    
    async def send_enrollment_confirmation(
        self,
        to_email: str,
        name: str,
        course_title: str,
        course_id: Optional[str] = None
    ) -> bool:
        """
        Send course enrollment confirmation email.
        
        Args:
            to_email: Student email address
            name: Student name
            course_title: Title of the enrolled course
            course_id: Course ID for direct link
            
        Returns:
            bool: True if email sent successfully
        """
        subject = f"Enrollment Confirmed - {course_title}"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Enrollment Confirmed!</h2>
            <p>Hi {name},</p>
            <p>You have successfully enrolled in:</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0; color: #1f2937;">{course_title}</h3>
            </div>
            <p>You can start learning right away!</p>
            <div style="margin: 30px 0;">
                <a href="{settings.FRONTEND_URL}/my-courses" 
                   style="background-color: #10B981; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; display: inline-block;">
                    Start Learning
                </a>
            </div>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;">
            <p style="color: #666; font-size: 14px;">
                Happy learning!<br>
                The AI E-Learning Team
            </p>
        </div>
        """
        
        return await self.send_email(to_email, subject, html_content)
    
    async def send_payment_confirmation(
        self,
        to_email: str,
        name: str,
        payment_type: str,
        amount: float,
        currency: str = "USD",
        description: Optional[str] = None
    ) -> bool:
        """
        Send payment confirmation email.
        
        Args:
            to_email: Customer email
            name: Customer name
            payment_type: Type of payment (course, subscription)
            amount: Payment amount
            currency: Currency code
            description: Payment description
            
        Returns:
            bool: True if email sent successfully
        """
        subject = "Payment Confirmation - AI E-Learning Platform"
        
        # Format amount with currency
        formatted_amount = f"{currency} {amount:,.2f}"
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Payment Successful!</h2>
            <p>Hi {name},</p>
            <p>Thank you for your payment. Your transaction has been processed successfully.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #1f2937;">Payment Details</h3>
                <p style="margin: 5px 0;"><strong>Amount:</strong> {formatted_amount}</p>
                <p style="margin: 5px 0;"><strong>Type:</strong> {payment_type}</p>
                {f'<p style="margin: 5px 0;"><strong>Description:</strong> {description}</p>' if description else ''}
            </div>
            
            <p>A receipt has been sent to your email address.</p>
            
            <div style="margin: 30px 0;">
                <a href="{settings.FRONTEND_URL}/my-courses" 
                   style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; display: inline-block;">
                    View My Courses
                </a>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;">
            <p style="color: #666; font-size: 14px;">
                If you have any questions about your payment, please contact our support team.
            </p>
        </div>
        """
        
        return await self.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content
        )
    
    async def send_certificate_email(
        self,
        to_email: str,
        name: str,
        course_title: str,
        certificate_url: str
    ) -> bool:
        """
        Send course completion certificate email.
        
        Args:
            to_email: Student email
            name: Student name
            course_title: Completed course title
            certificate_url: URL to download certificate
            
        Returns:
            bool: True if email sent successfully
        """
        subject = f"Congratulations! Your Certificate for {course_title}"
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>🎉 Congratulations, {name}!</h2>
            <p>You have successfully completed the course:</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0; color: #1f2937;">{course_title}</h3>
            </div>
            
            <p>Your certificate of completion is ready! You can download it using the button below:</p>
            
            <div style="margin: 30px 0;">
                <a href="{certificate_url}" 
                   style="background-color: #10B981; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; display: inline-block;">
                    Download Certificate
                </a>
            </div>
            
            <p>Share your achievement on LinkedIn and let others know about your new skills!</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;">
            <p style="color: #666; font-size: 14px;">
                Keep learning and growing!<br>
                The AI E-Learning Team
            </p>
        </div>
        """
        
        return await self.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content
        )
    
    async def send_welcome_email(
        self,
        to_email: str,
        name: str
    ) -> bool:
        """
        Send welcome email after successful verification.
        
        Args:
            to_email: User email
            name: User name
            
        Returns:
            bool: True if email sent successfully
        """
        subject = "Welcome to AI E-Learning Platform!"
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome aboard, {name}! 🎉</h2>
            <p>Your email has been verified and your account is now active.</p>
            
            <p>Here's what you can do next:</p>
            <ul style="line-height: 1.8;">
                <li>Browse our extensive course catalog</li>
                <li>Start with beginner-friendly courses</li>
                <li>Track your learning progress</li>
                <li>Earn certificates upon completion</li>
                <li>Get help from our AI Study Buddy</li>
            </ul>
            
            <div style="margin: 30px 0;">
                <a href="{settings.FRONTEND_URL}/courses" 
                   style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; display: inline-block;">
                    Browse Courses
                </a>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;">
            <p style="color: #666; font-size: 14px;">
                Happy learning!<br>
                The AI E-Learning Team
            </p>
        </div>
        """
        
        return await self.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content
        )


# Create a singleton instance
email_service = EmailService()