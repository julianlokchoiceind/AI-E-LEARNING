"""
Email service for sending verification and password reset emails.
Using aiosmtplib for async email sending.
"""
import logging
from typing import Optional, List
from pathlib import Path
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails asynchronously."""
    
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_pass = settings.SMTP_PASS
        self.from_email = settings.EMAILS_FROM_EMAIL
        self.from_name = settings.EMAILS_FROM_NAME
        
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        attachments: Optional[List[Path]] = None
    ) -> bool:
        """
        Send email asynchronously.
        
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
            # Create message
            message = MIMEMultipart("alternative")
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = to_email
            message["Subject"] = subject
            
            # Add text and HTML parts
            if text_content:
                text_part = MIMEText(text_content, "plain")
                message.attach(text_part)
            
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            # Add attachments if any
            if attachments:
                for file_path in attachments:
                    if file_path.exists():
                        with open(file_path, "rb") as f:
                            part = MIMEBase("application", "octet-stream")
                            part.set_payload(f.read())
                            encoders.encode_base64(part)
                            part.add_header(
                                "Content-Disposition",
                                f"attachment; filename={file_path.name}"
                            )
                            message.attach(part)
            
            # Send email
            async with aiosmtplib.SMTP(
                hostname=self.smtp_host,
                port=self.smtp_port,
                use_tls=True
            ) as smtp:
                await smtp.login(self.smtp_user, self.smtp_pass)
                await smtp.send_message(message)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    async def send_verification_email(self, to_email: str, name: str, token: str) -> bool:
        """
        Send email verification email.
        
        Args:
            to_email: Recipient email address
            name: User's name
            token: Verification token
            
        Returns:
            bool: True if email sent successfully
        """
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        
        subject = "Verify your AI E-Learning Platform account"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Verification</title>
                <!--[if mso]>
                <noscript>
                    <xml>
                        <o:OfficeDocumentSettings>
                            <o:PixelsPerInch>96</o:PixelsPerInch>
                        </o:OfficeDocumentSettings>
                    </xml>
                </noscript>
                <![endif]-->
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f7fafc;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f7fafc;">
                    <tr>
                        <td align="center" style="padding: 40px 20px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <tr>
                                    <td align="center" style="padding: 40px 20px 20px; background-color: #2563eb; border-radius: 8px 8px 0 0;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">AI E-Learning Platform</h1>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <h2 style="margin: 0 0 20px; color: #1a202c; font-size: 20px; font-weight: 600;">Welcome, {name}!</h2>
                                        
                                        <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                                            Thank you for signing up for AI E-Learning Platform. To complete your registration and access all features, please verify your email address.
                                        </p>
                                        
                                        <!-- CTA Button -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td align="center" style="padding: 30px 0;">
                                                    <a href="{verification_url}" 
                                                       style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px; box-shadow: 0 2px 4px rgba(37,99,235,0.2);">
                                                        Verify Email Address
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="margin: 0 0 10px; color: #718096; font-size: 14px;">
                                            Or copy and paste this link into your browser:
                                        </p>
                                        <p style="margin: 0 0 30px; padding: 12px 16px; background-color: #f7fafc; border-radius: 4px; word-break: break-all; font-size: 14px; color: #4a5568;">
                                            {verification_url}
                                        </p>
                                        
                                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                                        
                                        <p style="margin: 0 0 10px; color: #718096; font-size: 14px;">
                                            This verification link will expire in 24 hours for security reasons.
                                        </p>
                                        
                                        <p style="margin: 0; color: #a0aec0; font-size: 13px;">
                                            If you didn't create an account with AI E-Learning Platform, please ignore this email.
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td align="center" style="padding: 30px 20px; background-color: #f7fafc; border-radius: 0 0 8px 8px;">
                                        <p style="margin: 0 0 10px; color: #718096; font-size: 14px;">
                                            Need help? Contact us at <a href="mailto:support@ai-elearning.com" style="color: #2563eb; text-decoration: none;">support@ai-elearning.com</a>
                                        </p>
                                        <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                                            © 2024 AI E-Learning Platform. All rights reserved.
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
        
        text_content = f"""
        Welcome to AI E-Learning Platform!
        
        Hi {name},
        
        Thank you for signing up for AI E-Learning Platform. To complete your registration and access all features, please verify your email address by clicking the link below:
        
        {verification_url}
        
        This verification link will expire in 24 hours for security reasons.
        
        If you didn't create an account with AI E-Learning Platform, please ignore this email.
        
        Need help? Contact us at support@ai-elearning.com
        
        Best regards,
        The AI E-Learning Team
        """
        
        return await self.send_email(to_email, subject, html_content, text_content)
    
    async def send_password_reset_email(self, to_email: str, name: str, token: str) -> bool:
        """
        Send password reset email.
        
        Args:
            to_email: Recipient email address
            name: User's name
            token: Reset token
            
        Returns:
            bool: True if email sent successfully
        """
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        
        subject = "Reset your AI E-Learning Platform password"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset</title>
                <!--[if mso]>
                <noscript>
                    <xml>
                        <o:OfficeDocumentSettings>
                            <o:PixelsPerInch>96</o:PixelsPerInch>
                        </o:OfficeDocumentSettings>
                    </xml>
                </noscript>
                <![endif]-->
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f7fafc;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f7fafc;">
                    <tr>
                        <td align="center" style="padding: 40px 20px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <tr>
                                    <td align="center" style="padding: 40px 20px 20px; background-color: #2563eb; border-radius: 8px 8px 0 0;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Password Reset Request</h1>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <h2 style="margin: 0 0 20px; color: #1a202c; font-size: 20px; font-weight: 600;">Hi {name},</h2>
                                        
                                        <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                                            We received a request to reset the password for your AI E-Learning Platform account. If you made this request, click the button below to create a new password.
                                        </p>
                                        
                                        <!-- CTA Button -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td align="center" style="padding: 30px 0;">
                                                    <a href="{reset_url}" 
                                                       style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px; box-shadow: 0 2px 4px rgba(37,99,235,0.2);">
                                                        Reset Password
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="margin: 0 0 10px; color: #718096; font-size: 14px;">
                                            Or copy and paste this link into your browser:
                                        </p>
                                        <p style="margin: 0 0 30px; padding: 12px 16px; background-color: #f7fafc; border-radius: 4px; word-break: break-all; font-size: 14px; color: #4a5568;">
                                            {reset_url}
                                        </p>
                                        
                                        <div style="padding: 20px; background-color: #fef5e7; border-radius: 6px; margin-bottom: 20px;">
                                            <p style="margin: 0 0 10px; color: #f59e0b; font-size: 14px; font-weight: 600;">
                                                ⚠️ Important Security Information
                                            </p>
                                            <p style="margin: 0; color: #92400e; font-size: 14px;">
                                                This password reset link will expire in 1 hour for security reasons. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                                            </p>
                                        </div>
                                        
                                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                                        
                                        <p style="margin: 0; color: #a0aec0; font-size: 13px;">
                                            For security reasons, we never ask for your password via email. If you receive any suspicious emails, please report them to our support team.
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td align="center" style="padding: 30px 20px; background-color: #f7fafc; border-radius: 0 0 8px 8px;">
                                        <p style="margin: 0 0 10px; color: #718096; font-size: 14px;">
                                            Need help? Contact us at <a href="mailto:support@ai-elearning.com" style="color: #2563eb; text-decoration: none;">support@ai-elearning.com</a>
                                        </p>
                                        <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                                            © 2024 AI E-Learning Platform. All rights reserved.
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
        
        text_content = f"""
        Password Reset Request
        
        Hi {name},
        
        We received a request to reset the password for your AI E-Learning Platform account. 
        
        To reset your password, please click the link below:
        {reset_url}
        
        This password reset link will expire in 1 hour for security reasons.
        
        If you didn't request a password reset, please ignore this email and your password will remain unchanged.
        
        For security reasons, we never ask for your password via email. If you receive any suspicious emails, please report them to our support team.
        
        Need help? Contact us at support@ai-elearning.com
        
        Best regards,
        The AI E-Learning Team
        """
        
        return await self.send_email(to_email, subject, html_content, text_content)


# Create singleton instance
email_service = EmailService()