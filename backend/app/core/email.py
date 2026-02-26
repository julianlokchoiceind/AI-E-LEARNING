"""
Email service using Microsoft Graph API
Unified email service combining all email functionality
"""
import logging
from typing import Optional, List, Dict, Any
from pathlib import Path
from datetime import datetime
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

    def get_email_template(
        self,
        title: str,
        content: str,
        button_text: Optional[str] = None,
        button_url: Optional[str] = None,
        context_box: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate unified email template with consistent branding.

        Args:
            title: Email title/heading
            content: Main email content (HTML)
            button_text: CTA button text (optional)
            button_url: CTA button URL (optional)
            context_box: Context box with type and content (optional)
                        Format: {"type": "success|warning|info", "content": "HTML content"}

        Returns:
            str: Complete HTML email template
        """
        # Context box styling based on type
        context_html = ""
        if context_box:
            context_type = context_box.get("type", "info")
            context_content = context_box.get("content", "")

            if context_type == "success":
                box_bg = "#f0fdf4"
                border_color = "#10b981"
            elif context_type == "warning":
                box_bg = "#fef3c7"
                border_color = "#f59e0b"
            else:  # info
                box_bg = "#f8fafc"
                border_color = "hsl(221, 83%, 53%)"

            context_html = f"""
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: {box_bg}; border-left: 3px solid {border_color}; border-radius: 6px; margin: 24px 0 32px 0;">
                <tr>
                    <td style="padding: 20px 24px;">
                        {context_content}
                    </td>
                </tr>
            </table>
            """

        # Button HTML
        button_html = ""
        if button_text and button_url:
            button_html = f"""
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0 32px 0;">
                <tr>
                    <td align="center">
                        <a href="{button_url}" class="email-button"
                           style="background: linear-gradient(135deg, hsl(221, 83%, 53%) 0%, hsl(221, 83%, 40%) 100%);
                                  color: #ffffff;
                                  padding: 14px 28px;
                                  border-radius: 6px;
                                  text-decoration: none;
                                  display: inline-block;
                                  font-weight: 500;
                                  font-size: 16px;
                                  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
                                  letter-spacing: 0.2px;">
                            {button_text}
                        </a>
                    </td>
                </tr>
            </table>
            """

        # Complete email template
        return f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>{title} - HEART HT</title>
            <style>
                @media only screen and (max-width: 600px) {{
                    .email-wrapper {{ padding: 0 !important; }}
                    .email-title {{ font-size: 20px !important; }}
                    .email-content {{ font-size: 15px !important; }}
                    .email-button {{ font-size: 15px !important; }}
                    .email-secondary {{ font-size: 14px !important; }}
                    .email-footer {{ font-size: 13px !important; }}
                    .email-footer-links {{ font-size: 12px !important; }}
                }}
            </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background-color: #f8fafc;">

            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="email-wrapper" style="background-color: #f8fafc; padding: 20px 0;">
                <tr>
                    <td align="center">
                        <table role="presentation" cellpadding="0" cellspacing="0" width="580" style="background-color: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

                            <!-- HEADER -->
                            <tr>
                                <td style="background: linear-gradient(135deg, hsl(221, 83%, 53%) 0%, hsl(221, 83%, 40%) 100%); padding: 16px 35px;">
                                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                        <tr>
                                            <td style="vertical-align: middle;">
                                                <img src="{settings.FRONTEND_URL}/images/logo/heartht-logo-192x192.png"
                                                     alt="HEART HT"
                                                     style="height: 40px; vertical-align: middle; margin-right: 12px;"
                                                     onerror="this.style.display='none';">
                                                <span style="color: #ffffff; font-size: 18px; font-weight: 600; letter-spacing: 0.3px; vertical-align: middle;">
                                                    HEART HT
                                                </span>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- CONTENT -->
                            <tr>
                                <td style="padding: 40px 35px;">
                                    <h1 class="email-title" style="color: #1e293b; font-size: 24px; font-weight: 600; margin: 0 0 24px 0; line-height: 1.3;">
                                        {title}
                                    </h1>

                                    <div class="email-content" style="color: #475569; font-size: 16px; line-height: 1.6;">
                                        {content}
                                    </div>

                                    {context_html}

                                    {button_html}
                                </td>
                            </tr>

                            <!-- FOOTER -->
                            <tr>
                                <td style="background-color: #f8fafc; padding: 16px 35px; text-align: center; border-top: 1px solid #e2e8f0;">
                                    <p class="email-footer" style="color: #64748b; font-size: 14px; margin: 0 0 8px 0;">
                                        © 2026 HEART HT AI E-Learning Platform
                                    </p>
                                    <p style="margin: 0;">
                                        <a href="{settings.FRONTEND_URL}/privacy" class="email-footer-links" style="color: hsl(221, 83%, 53%); font-size: 13px; text-decoration: none; margin: 0 6px;">Privacy</a>
                                        <span class="email-footer-links" style="color: #cbd5e1; font-size: 13px;">•</span>
                                        <a href="{settings.FRONTEND_URL}/terms" class="email-footer-links" style="color: hsl(221, 83%, 53%); font-size: 13px; text-decoration: none; margin: 0 6px;">Terms</a>
                                        <span class="email-footer-links" style="color: #cbd5e1; font-size: 13px;">•</span>
                                        <a href="{settings.FRONTEND_URL}/support" class="email-footer-links" style="color: hsl(221, 83%, 53%); font-size: 13px; text-decoration: none; margin: 0 6px;">Support</a>
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """

    async def send_verification_email(
        self,
        to_email: str,
        name: str,
        token: str
    ) -> bool:
        """Send email verification."""
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"

        subject = "Verify your email - CHOICE AI E-Learning Platform"

        content = f"""
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi <strong>{name}</strong>,
            </p>

            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 28px 0;">
                Please verify your email address to activate your account and start learning.
            </p>

            <p style="color: #64748b; font-size: 15px; line-height: 1.4; margin: 0 0 8px 0;">
                Or copy this link:
            </p>
            <p style="color: hsl(221, 83%, 53%); font-size: 15px; word-break: break-all; background-color: #f8fafc; padding: 12px; border-radius: 4px; margin: 0 0 28px 0;">
                {verification_url}
            </p>

            <p style="color: #94a3b8; font-size: 15px; line-height: 1.4; margin: 0; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                If you didn't create an account, please ignore this email.
            </p>
        """

        html_content = self.get_email_template(
            title="Verify Your Email Address",
            content=content,
            button_text="Verify Email",
            button_url=verification_url
        )

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

        content = f"""
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi <strong>{name}</strong>,
            </p>

            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 28px 0;">
                We received a request to reset your password. Click the button below to create a new password.
            </p>

            <p style="color: #64748b; font-size: 15px; line-height: 1.4; margin: 0 0 8px 0;">
                Or copy this link:
            </p>
            <p style="color: hsl(221, 83%, 53%); font-size: 15px; word-break: break-all; background-color: #f8fafc; padding: 12px; border-radius: 4px; margin: 0 0 28px 0;">
                {reset_url}
            </p>

            <p style="color: #94a3b8; font-size: 15px; line-height: 1.4; margin: 0; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                If you didn't request this password reset, please ignore this email. Your password won't be changed.
            </p>
        """

        context_box = {
            "background_color": "#fefce8",
            "border_color": "#eab308",
            "content": '<p style="margin: 0; color: #92400e; font-size: 15px;"><strong>Security Notice:</strong> This link expires in 1 hour.</p>'
        }

        html_content = self.get_email_template(
            title="Reset Your Password",
            content=content,
            button_text="Reset Password",
            button_url=reset_url,
            context_box=context_box
        )

        return await self.send_email(to_email, subject, html_content)
    
    async def send_enrollment_confirmation(
        self,
        to_email: str,
        name: str,
        course_title: str,
        course_id: Optional[str] = None,
        lesson_id: Optional[str] = None
    ) -> bool:
        """
        Send course enrollment confirmation email.
        
        Args:
            to_email: Student email address
            name: Student name
            course_title: Title of the enrolled course
            course_id: Course ID for direct link
            lesson_id: First lesson ID for direct learning link
            
        Returns:
            bool: True if email sent successfully
        """
        # Determine the best link for the user
        if course_id and lesson_id:
            # Direct link to start learning
            learning_url = f"{settings.FRONTEND_URL}/learn/{course_id}/{lesson_id}"
            button_text = "Start Learning Now"
        elif course_id:
            # Link to course detail page
            learning_url = f"{settings.FRONTEND_URL}/courses/{course_id}"
            button_text = "View Course"
        else:
            # Fallback to dashboard
            learning_url = f"{settings.FRONTEND_URL}/dashboard"
            button_text = "Go to Dashboard"
            
        subject = f"Enrollment Confirmed - {course_title}"

        content = f"""
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi <strong>{name}</strong>,
            </p>

            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 28px 0;">
                You're enrolled! Start learning immediately.
            </p>
        """

        # Course info context box
        context_box = {
            "background_color": "#f8fafc",
            "border_color": "hsl(221, 83%, 53%)",
            "content": f"""
                <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 6px 0; font-weight: 600;">{course_title}</h2>
                <p style="color: #64748b; font-size: 15px; margin: 0;">
                    Ready to start your learning journey
                </p>
            """
        }

        html_content = self.get_email_template(
            title="Enrollment Confirmed",
            content=content,
            button_text=button_text,
            button_url=learning_url,
            context_box=context_box
        )
        
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
        subject = "Payment Successful - AI E-Learning Platform"

        # Format amount with currency
        formatted_amount = f"{currency} {amount:,.2f}"

        content = f"""
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 28px 0;">
                Thank you! Your payment has been processed successfully.
            </p>
        """

        # Payment summary context box (green for success)
        payment_details = f"""
            <table width="100%" style="font-size: 15px;">
                <tr>
                    <td style="color: #64748b; padding: 4px 0;">Amount:</td>
                    <td style="color: #1e293b; text-align: right; font-weight: 500;">{formatted_amount}</td>
                </tr>
                <tr>
                    <td style="color: #64748b; padding: 4px 0;">Type:</td>
                    <td style="color: #1e293b; text-align: right; font-weight: 500;">{payment_type.title()}</td>
                </tr>"""

        if description:
            payment_details += f"""
                <tr>
                    <td style="color: #64748b; padding: 2px 0;">Description:</td>
                    <td style="color: #1e293b; text-align: right; font-weight: 500;">{description}</td>
                </tr>"""

        payment_details += "</table>"

        context_box = {
            "background_color": "#f0fdf4",
            "border_color": "#22c55e",
            "content": payment_details
        }

        html_content = self.get_email_template(
            title="Payment Successful",
            content=content,
            button_text="Access Course",
            button_url=f"{settings.FRONTEND_URL}/dashboard",
            context_box=context_box
        )
        
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
        subject = f"Congratulations! Certificate for {course_title}"

        content = f"""
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi <strong>{name}</strong>,
            </p>

            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 28px 0;">
                Congratulations! You have successfully completed the course and your certificate is ready.
            </p>

            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 28px 0;">
                Share your achievement and let others know about your new skills!
            </p>
        """

        # Certificate info context box (green for achievement)
        context_box = {
            "background_color": "#f0fdf4",
            "border_color": "#22c55e",
            "content": f"""
                <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 6px 0; font-weight: 600;">{course_title}</h2>
                <p style="color: #64748b; font-size: 15px; margin: 0;">
                    Course completed successfully
                </p>
            """
        }

        html_content = self.get_email_template(
            title="Certificate Ready!",
            content=content,
            button_text="Download Certificate",
            button_url=certificate_url,
            context_box=context_box
        )
        
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

        content = f"""
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi <strong>{name}</strong>,
            </p>

            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 28px 0;">
                Welcome to AI E-Learning Platform! Your email has been verified and your account is now active.
            </p>

            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Start your learning journey:
            </p>
            <ul style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 28px 20px; padding: 0;">
                <li>Browse our extensive course catalog</li>
                <li>Track your learning progress</li>
                <li>Earn certificates upon completion</li>
                <li>Get help from our AI Study Buddy</li>
            </ul>
        """

        html_content = self.get_email_template(
            title="Welcome to AI E-Learning!",
            content=content,
            button_text="Browse Courses",
            button_url=f"{settings.FRONTEND_URL}/courses"
        )

        return await self.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content
        )
    
    async def send_course_approval_email(
        self,
        to_email: str,
        creator_name: str,
        course_title: str,
        course_id: str
    ) -> bool:
        """
        Send email notification when course is approved.
        
        Args:
            to_email: Creator email
            creator_name: Creator name
            course_title: Title of approved course
            course_id: Course ID for direct link
            
        Returns:
            bool: True if email sent successfully
        """
        subject = f"Course Approved - {course_title}"

        content = f"""
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi <strong>{creator_name}</strong>,
            </p>

            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 28px 0;">
                Great news! Your course has been reviewed and approved. Students can now enroll and start learning.
            </p>
        """

        # Course approval context box (green for success)
        context_box = {
            "background_color": "#f0fdf4",
            "border_color": "#22c55e",
            "content": f"""
                <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 6px 0; font-weight: 600;">{course_title}</h2>
                <p style="color: #64748b; font-size: 15px; margin: 0;">
                    Course is now live and available to students
                </p>
            """
        }

        html_content = self.get_email_template(
            title="Course Approved!",
            content=content,
            button_text="View Your Course",
            button_url=f"{settings.FRONTEND_URL}/courses/{course_id}",
            context_box=context_box
        )
        
        return await self.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content
        )
    
    async def send_course_rejection_email(
        self,
        to_email: str,
        creator_name: str,
        course_title: str,
        reason: str,
        course_id: str
    ) -> bool:
        """
        Send email notification when course is rejected.
        
        Args:
            to_email: Creator email
            creator_name: Creator name
            course_title: Title of rejected course
            reason: Feedback/reason for rejection
            course_id: Course ID for editing
            
        Returns:
            bool: True if email sent successfully
        """
        subject = f"Course Review Feedback - {course_title}"

        content = f"""
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi <strong>{creator_name}</strong>,
            </p>

            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 28px 0;">
                Thank you for submitting your course for review. We've identified some areas that need improvement before publication.
            </p>

            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 28px 0;">
                Please address the feedback below and resubmit your course for review.
            </p>
        """

        # Feedback context box (yellow for warning/attention needed)
        context_box = {
            "background_color": "#fefce8",
            "border_color": "#eab308",
            "content": f"""
                <h3 style="color: #1e293b; font-size: 16px; margin: 0 0 8px 0; font-weight: 600;">Review Feedback:</h3>
                <p style="color: #64748b; font-size: 15px; margin: 0; white-space: pre-wrap; line-height: 1.4;">{reason}</p>
            """
        }

        html_content = self.get_email_template(
            title="Course Needs Revision",
            content=content,
            button_text="Edit Your Course",
            button_url=f"{settings.FRONTEND_URL}/courses/{course_id}/edit",
            context_box=context_box
        )
        
        return await self.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content
        )
    
    async def send_contact_form_email(
        self,
        from_name: str,
        from_email: str,
        subject: str,
        message: str
    ) -> bool:
        """
        Send contact form submission to admin email.
        
        Args:
            from_name: Sender's name
            from_email: Sender's email
            subject: Contact form subject
            message: Contact form message
            
        Returns:
            bool: True if email sent successfully
        """
        admin_email = "info@choiceind.com"
        email_subject = f"Contact Form Submission - {subject}"

        content = f"""
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 28px 0;">
                New contact form submission received from the AI E-Learning Platform.
            </p>
        """

        # Contact details context box
        contact_details = f"""
            <table width="100%" style="font-size: 15px;">
                <tr>
                    <td style="color: #64748b; padding: 4px 0;">Name:</td>
                    <td style="color: #1e293b; text-align: right; font-weight: 500;">{from_name}</td>
                </tr>
                <tr>
                    <td style="color: #64748b; padding: 4px 0;">Email:</td>
                    <td style="color: #1e293b; text-align: right; font-weight: 500;">{from_email}</td>
                </tr>
                <tr>
                    <td style="color: #64748b; padding: 4px 0;">Subject:</td>
                    <td style="color: #1e293b; text-align: right; font-weight: 500;">{subject}</td>
                </tr>
            </table>
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                <h3 style="color: #1e293b; font-size: 16px; margin: 0 0 8px 0; font-weight: 600;">Message:</h3>
                <p style="color: #64748b; font-size: 15px; margin: 0; white-space: pre-line; line-height: 1.4;">{message}</p>
            </div>
        """

        context_box = {
            "background_color": "#f8fafc",
            "border_color": "hsl(221, 83%, 53%)",
            "content": contact_details
        }

        html_content = self.get_email_template(
            title="New Contact Form Submission",
            content=content,
            button_text="Reply to Sender",
            button_url=f"mailto:{from_email}",
            context_box=context_box
        )
        
        return await self.send_email(
            to_email=admin_email,
            subject=email_subject,
            html_content=html_content
        )
    
    async def send_support_ticket_notification(
        self,
        ticket_id: str,
        user_name: str,
        user_email: str,
        ticket_title: str,
        ticket_description: str,
        ticket_category: str,
        ticket_priority: str
    ) -> bool:
        """
        Send new support ticket notification to support team.
        
        Args:
            ticket_id: Support ticket ID
            user_name: Name of user who created ticket
            user_email: Email of user who created ticket  
            ticket_title: Ticket title
            ticket_description: Ticket description
            ticket_category: Ticket category
            ticket_priority: Ticket priority
            
        Returns:
            bool: True if email sent successfully
        """
        admin_email = "julian.lok88@icloud.com"  # Support team email
        subject = f"New Support Ticket #{ticket_id[:8]} - {ticket_priority.title()}"

        content = f"""
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 28px 0;">
                New support ticket created by {user_name}. Please respond within 24 hours.
            </p>
        """

        # Priority color mapping for context box
        priority_colors = {
            "low": "#f0fdf4",      # Light green background
            "medium": "#fefce8",   # Light yellow background
            "high": "#fef2f2",     # Light red background
            "urgent": "#fef2f2"    # Light red background
        }

        priority_borders = {
            "low": "#22c55e",      # Green border
            "medium": "#eab308",   # Yellow border
            "high": "#ef4444",     # Red border
            "urgent": "#dc2626"    # Dark red border
        }

        bg_color = priority_colors.get(ticket_priority.lower(), "#f8fafc")
        border_color = priority_borders.get(ticket_priority.lower(), "hsl(221, 83%, 53%)")

        # Ticket details context box
        ticket_details = f"""
            <table width="100%" style="font-size: 15px;">
                <tr>
                    <td style="color: #64748b; padding: 4px 0;">ID:</td>
                    <td style="color: #1e293b; text-align: right; font-weight: 500;">#{ticket_id[:8]}</td>
                </tr>
                <tr>
                    <td style="color: #64748b; padding: 4px 0;">Priority:</td>
                    <td style="color: #1e293b; text-align: right; font-weight: 500;">{ticket_priority.title()}</td>
                </tr>
                <tr>
                    <td style="color: #64748b; padding: 4px 0;">Category:</td>
                    <td style="color: #1e293b; text-align: right; font-weight: 500;">{ticket_category.title()}</td>
                </tr>
                <tr>
                    <td style="color: #64748b; padding: 4px 0;">From:</td>
                    <td style="color: #1e293b; text-align: right; font-weight: 500;">{user_name}</td>
                </tr>
            </table>
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                <h3 style="color: #1e293b; font-size: 16px; margin: 0 0 6px 0; font-weight: 600;">{ticket_title}</h3>
                <p style="color: #64748b; font-size: 15px; margin: 0; white-space: pre-line; line-height: 1.4;">{ticket_description}</p>
            </div>
        """

        context_box = {
            "background_color": bg_color,
            "border_color": border_color,
            "content": ticket_details
        }

        html_content = self.get_email_template(
            title="New Support Ticket",
            content=content,
            button_text="View & Respond",
            button_url=f"{settings.FRONTEND_URL}/admin/support/{ticket_id}",
            context_box=context_box
        )
        
        return await self.send_email(
            to_email=admin_email,
            subject=subject,
            html_content=html_content
        )
    
    async def send_support_ticket_reply_notification(
        self,
        ticket_id: str,
        ticket_title: str,
        user_name: str,
        user_email: str,
        reply_message: str,
        sender_name: str,
        sender_role: str
    ) -> bool:
        """
        Send notification to user when support team replies to ticket.
        
        Args:
            ticket_id: Support ticket ID
            ticket_title: Ticket title
            user_name: Name of ticket owner
            user_email: Email of ticket owner
            reply_message: The reply message content
            sender_name: Name of person who replied
            sender_role: Role of person who replied (admin, creator)
            
        Returns:
            bool: True if email sent successfully
        """
        subject = f"Support Reply - Ticket #{ticket_id[:8]}"

        # Clean up reply message (remove markdown and attachments)
        clean_message = reply_message.replace("**", "").replace("📎 Uploaded attachment:", "📎 Attachment:")

        content = f"""
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi <strong>{user_name}</strong>,
            </p>

            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 28px 0;">
                Our support team has replied to your ticket. You can view the full conversation using the button below.
            </p>
        """

        # Reply context box (blue for informational)
        reply_details = f"""
            <table width="100%" style="font-size: 15px;">
                <tr>
                    <td style="color: #64748b; padding: 4px 0;">Ticket:</td>
                    <td style="color: #1e293b; text-align: right; font-weight: 500;">#{ticket_id[:8]}</td>
                </tr>
                <tr>
                    <td style="color: #64748b; padding: 4px 0;">From:</td>
                    <td style="color: #1e293b; text-align: right; font-weight: 500;">{sender_name}</td>
                </tr>
            </table>
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                <h3 style="color: #1e293b; font-size: 16px; margin: 0 0 6px 0; font-weight: 600;">{ticket_title}</h3>
                <p style="color: #64748b; font-size: 15px; margin: 0; white-space: pre-line; line-height: 1.4;">{clean_message}</p>
            </div>
        """

        context_box = {
            "background_color": "#f8fafc",
            "border_color": "hsl(221, 83%, 53%)",
            "content": reply_details
        }

        html_content = self.get_email_template(
            title="New Support Reply",
            content=content,
            button_text="View Conversation",
            button_url=f"{settings.FRONTEND_URL}/support/{ticket_id}",
            context_box=context_box
        )
        
        return await self.send_email(
            to_email=user_email,
            subject=subject,
            html_content=html_content
        )

    async def send_waitlist_notification_email(
        self,
        email: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> bool:
        """
        Send waitlist notification to admin email.

        Args:
            email: User's email who joined waitlist
            ip_address: User's IP address
            user_agent: User's browser info

        Returns:
            bool: True if email sent successfully
        """
        admin_email = "info@choiceind.com"
        subject = f"New Waitlist Signup - {email}"

        from datetime import datetime

        content = f"""
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 28px 0;">
                New waitlist signup received from the AI E-Learning Platform.
            </p>
        """

        # Waitlist details context box
        waitlist_details = f"""
            <table width="100%" style="font-size: 15px;">
                <tr>
                    <td style="color: #64748b; padding: 4px 0;">Email:</td>
                    <td style="color: #1e293b; text-align: right; font-weight: 500;">{email}</td>
                </tr>
                <tr>
                    <td style="color: #64748b; padding: 4px 0;">IP Address:</td>
                    <td style="color: #1e293b; text-align: right; font-weight: 500;">{ip_address or 'Not available'}</td>
                </tr>
                <tr>
                    <td style="color: #64748b; padding: 4px 0;">Browser:</td>
                    <td style="color: #1e293b; text-align: right; font-weight: 500;">{user_agent[:50] + '...' if user_agent and len(user_agent) > 50 else user_agent or 'Not available'}</td>
                </tr>
                <tr>
                    <td style="color: #64748b; padding: 4px 0;">Joined:</td>
                    <td style="color: #1e293b; text-align: right; font-weight: 500;">{datetime.now().strftime('%Y-%m-%d %H:%M UTC')}</td>
                </tr>
            </table>
        """

        context_box = {
            "background_color": "#f8fafc",
            "border_color": "hsl(221, 83%, 53%)",
            "content": waitlist_details
        }

        html_content = self.get_email_template(
            title="New Waitlist Signup",
            content=content,
            button_text="View Admin Dashboard",
            button_url=f"{settings.FRONTEND_URL}/admin",
            context_box=context_box
        )

        return await self.send_email(
            to_email=admin_email,
            subject=subject,
            html_content=html_content
        )


# Create a singleton instance
email_service = EmailService()