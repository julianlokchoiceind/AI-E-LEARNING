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
    
    async def send_welcome_email(self, to_email: str, name: str) -> bool:
        """
        Send welcome email after successful registration.
        
        Args:
            to_email: Recipient email address
            name: User's name
            
        Returns:
            bool: True if email sent successfully
        """
        subject = "Welcome to AI E-Learning Platform!"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f7fafc;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f7fafc;">
                    <tr>
                        <td align="center" style="padding: 40px 20px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <tr>
                                    <td align="center" style="padding: 40px 20px 20px; background-color: #10b981; border-radius: 8px 8px 0 0;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">🎉 Welcome to AI E-Learning!</h1>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <h2 style="margin: 0 0 20px; color: #1a202c; font-size: 20px; font-weight: 600;">Hi {name}!</h2>
                                        
                                        <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                                            Welcome to AI E-Learning Platform! We're excited to have you join our community of learners and creators.
                                        </p>
                                        
                                        <div style="padding: 20px; background-color: #f0f9ff; border-radius: 6px; margin-bottom: 20px;">
                                            <h3 style="margin: 0 0 15px; color: #1e40af; font-size: 16px; font-weight: 600;">🚀 Getting Started</h3>
                                            <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.6;">
                                                <li>Browse our course catalog and find your perfect learning path</li>
                                                <li>Chat with our AI Study Buddy for personalized assistance</li>
                                                <li>Track your progress and earn certificates</li>
                                                <li>Join our community of passionate learners</li>
                                            </ul>
                                        </div>
                                        
                                        <!-- CTA Button -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td align="center" style="padding: 30px 0;">
                                                    <a href="{settings.FRONTEND_URL}/courses" 
                                                       style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px; box-shadow: 0 2px 4px rgba(37,99,235,0.2);">
                                                        Explore Courses
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="margin: 0; color: #718096; font-size: 14px; text-align: center;">
                                            Need help? Our AI Study Buddy is available 24/7 to assist you!
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td align="center" style="padding: 30px 20px; background-color: #f7fafc; border-radius: 0 0 8px 8px;">
                                        <p style="margin: 0 0 10px; color: #718096; font-size: 14px;">
                                            Questions? Contact us at <a href="mailto:support@ai-elearning.com" style="color: #2563eb; text-decoration: none;">support@ai-elearning.com</a>
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
        
        Hi {name}!
        
        Welcome to AI E-Learning Platform! We're excited to have you join our community of learners and creators.
        
        Getting Started:
        - Browse our course catalog and find your perfect learning path
        - Chat with our AI Study Buddy for personalized assistance
        - Track your progress and earn certificates
        - Join our community of passionate learners
        
        Start learning: {settings.FRONTEND_URL}/courses
        
        Need help? Our AI Study Buddy is available 24/7 to assist you!
        
        Questions? Contact us at support@ai-elearning.com
        
        Best regards,
        The AI E-Learning Team
        """
        
        return await self.send_email(to_email, subject, html_content, text_content)
    
    async def send_enrollment_confirmation_email(self, to_email: str, name: str, course_title: str, course_id: str) -> bool:
        """
        Send enrollment confirmation email.
        
        Args:
            to_email: Recipient email address
            name: User's name
            course_title: Course title
            course_id: Course ID for direct link
            
        Returns:
            bool: True if email sent successfully
        """
        course_url = f"{settings.FRONTEND_URL}/learn/{course_id}"
        subject = f"Enrollment confirmed: {course_title}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Enrollment Confirmation</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f7fafc;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f7fafc;">
                    <tr>
                        <td align="center" style="padding: 40px 20px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <tr>
                                    <td align="center" style="padding: 40px 20px 20px; background-color: #10b981; border-radius: 8px 8px 0 0;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">✅ Enrollment Confirmed!</h1>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <h2 style="margin: 0 0 20px; color: #1a202c; font-size: 20px; font-weight: 600;">Hi {name}!</h2>
                                        
                                        <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                                            Congratulations! You have successfully enrolled in:
                                        </p>
                                        
                                        <div style="padding: 20px; background-color: #f0f9ff; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #2563eb;">
                                            <h3 style="margin: 0 0 10px; color: #1e40af; font-size: 18px; font-weight: 600;">📚 {course_title}</h3>
                                            <p style="margin: 0; color: #374151; font-size: 14px;">Ready to start your learning journey?</p>
                                        </div>
                                        
                                        <!-- CTA Button -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td align="center" style="padding: 30px 0;">
                                                    <a href="{course_url}" 
                                                       style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px; box-shadow: 0 2px 4px rgba(37,99,235,0.2);">
                                                        Start Learning
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <div style="padding: 20px; background-color: #fef5e7; border-radius: 6px; margin-bottom: 20px;">
                                            <p style="margin: 0 0 10px; color: #f59e0b; font-size: 14px; font-weight: 600;">
                                                💡 Learning Tips
                                            </p>
                                            <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px; line-height: 1.6;">
                                                <li>Use our AI Study Buddy when you have questions</li>
                                                <li>Complete lessons in sequence for best results</li>
                                                <li>Take quizzes to reinforce your learning</li>
                                                <li>Earn your certificate upon completion</li>
                                            </ul>
                                        </div>
                                        
                                        <p style="margin: 0; color: #718096; font-size: 14px; text-align: center;">
                                            Happy learning! 🚀
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
        Enrollment Confirmed!
        
        Hi {name}!
        
        Congratulations! You have successfully enrolled in: {course_title}
        
        Start learning: {course_url}
        
        Learning Tips:
        - Use our AI Study Buddy when you have questions
        - Complete lessons in sequence for best results
        - Take quizzes to reinforce your learning
        - Earn your certificate upon completion
        
        Happy learning!
        
        Need help? Contact us at support@ai-elearning.com
        
        Best regards,
        The AI E-Learning Team
        """
        
        return await self.send_email(to_email, subject, html_content, text_content)
    
    async def send_payment_confirmation_email(self, to_email: str, name: str, course_title: str, amount: float, currency: str = "USD") -> bool:
        """
        Send payment confirmation email.
        
        Args:
            to_email: Recipient email address
            name: User's name
            course_title: Course title
            amount: Payment amount
            currency: Currency code
            
        Returns:
            bool: True if email sent successfully
        """
        subject = f"Payment confirmed for {course_title}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Payment Confirmation</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f7fafc;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f7fafc;">
                    <tr>
                        <td align="center" style="padding: 40px 20px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <tr>
                                    <td align="center" style="padding: 40px 20px 20px; background-color: #059669; border-radius: 8px 8px 0 0;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">💳 Payment Confirmed</h1>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <h2 style="margin: 0 0 20px; color: #1a202c; font-size: 20px; font-weight: 600;">Hi {name}!</h2>
                                        
                                        <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                                            Thank you for your purchase! Your payment has been successfully processed.
                                        </p>
                                        
                                        <div style="padding: 20px; background-color: #f0fdf4; border-radius: 6px; margin-bottom: 20px; border: 1px solid #bbf7d0;">
                                            <h3 style="margin: 0 0 15px; color: #166534; font-size: 16px; font-weight: 600;">📄 Order Details</h3>
                                            <table style="width: 100%; border-collapse: collapse;">
                                                <tr>
                                                    <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600;">Course:</td>
                                                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">{course_title}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600;">Amount:</td>
                                                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">${amount:.2f} {currency}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600;">Status:</td>
                                                    <td style="padding: 8px 0; color: #059669; font-size: 14px; font-weight: 600;">✅ Completed</td>
                                                </tr>
                                            </table>
                                        </div>
                                        
                                        <!-- CTA Button -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td align="center" style="padding: 30px 0;">
                                                    <a href="{settings.FRONTEND_URL}/my-courses" 
                                                       style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px; box-shadow: 0 2px 4px rgba(37,99,235,0.2);">
                                                        Access Your Course
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <div style="padding: 20px; background-color: #f3f4f6; border-radius: 6px; margin-bottom: 20px;">
                                            <p style="margin: 0 0 10px; color: #374151; font-size: 14px; font-weight: 600;">
                                                📧 Receipt & Support
                                            </p>
                                            <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                                A detailed receipt has been sent to your email. For billing questions or course support, please contact us at support@ai-elearning.com
                                            </p>
                                        </div>
                                        
                                        <p style="margin: 0; color: #718096; font-size: 14px; text-align: center;">
                                            Thank you for choosing AI E-Learning Platform! 🎓
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td align="center" style="padding: 30px 20px; background-color: #f7fafc; border-radius: 0 0 8px 8px;">
                                        <p style="margin: 0 0 10px; color: #718096; font-size: 14px;">
                                            Questions? Contact us at <a href="mailto:support@ai-elearning.com" style="color: #2563eb; text-decoration: none;">support@ai-elearning.com</a>
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
        Payment Confirmed
        
        Hi {name}!
        
        Thank you for your purchase! Your payment has been successfully processed.
        
        Order Details:
        Course: {course_title}
        Amount: ${amount:.2f} {currency}
        Status: ✅ Completed
        
        Access your course: {settings.FRONTEND_URL}/my-courses
        
        A detailed receipt has been sent to your email. For billing questions or course support, please contact us at support@ai-elearning.com
        
        Thank you for choosing AI E-Learning Platform!
        
        Best regards,
        The AI E-Learning Team
        """
        
        return await self.send_email(to_email, subject, html_content, text_content)
    
    async def send_course_approval_email(self, to_email: str, creator_name: str, course_title: str, course_id: str) -> bool:
        """
        Send course approval notification to content creator.
        
        Args:
            to_email: Creator's email address
            creator_name: Creator's name
            course_title: Course title
            course_id: Course ID for direct link
            
        Returns:
            bool: True if email sent successfully
        """
        course_url = f"{settings.FRONTEND_URL}/creator/courses/{course_id}"
        subject = f"Course approved: {course_title}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Course Approved</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f7fafc;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f7fafc;">
                    <tr>
                        <td align="center" style="padding: 40px 20px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <tr>
                                    <td align="center" style="padding: 40px 20px 20px; background-color: #059669; border-radius: 8px 8px 0 0;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">🎉 Course Approved!</h1>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <h2 style="margin: 0 0 20px; color: #1a202c; font-size: 20px; font-weight: 600;">Congratulations, {creator_name}!</h2>
                                        
                                        <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                                            Great news! Your course has been approved and is now live on AI E-Learning Platform.
                                        </p>
                                        
                                        <div style="padding: 20px; background-color: #f0fdf4; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #059669;">
                                            <h3 style="margin: 0 0 10px; color: #166534; font-size: 18px; font-weight: 600;">📚 {course_title}</h3>
                                            <p style="margin: 0; color: #374151; font-size: 14px;">Status: ✅ Published and available to students</p>
                                        </div>
                                        
                                        <!-- CTA Button -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td align="center" style="padding: 30px 0;">
                                                    <a href="{course_url}" 
                                                       style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px; box-shadow: 0 2px 4px rgba(37,99,235,0.2);">
                                                        View Course Dashboard
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <div style="padding: 20px; background-color: #f0f9ff; border-radius: 6px; margin-bottom: 20px;">
                                            <p style="margin: 0 0 10px; color: #1e40af; font-size: 14px; font-weight: 600;">
                                                📈 Next Steps
                                            </p>
                                            <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.6;">
                                                <li>Monitor student enrollments and feedback</li>
                                                <li>Engage with students in course discussions</li>
                                                <li>Track your earnings in the creator dashboard</li>
                                                <li>Plan your next course based on student interest</li>
                                            </ul>
                                        </div>
                                        
                                        <p style="margin: 0; color: #718096; font-size: 14px; text-align: center;">
                                            Thank you for contributing to our learning community! 🚀
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td align="center" style="padding: 30px 20px; background-color: #f7fafc; border-radius: 0 0 8px 8px;">
                                        <p style="margin: 0 0 10px; color: #718096; font-size: 14px;">
                                            Creator support: <a href="mailto:creators@ai-elearning.com" style="color: #2563eb; text-decoration: none;">creators@ai-elearning.com</a>
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
        Course Approved!
        
        Congratulations, {creator_name}!
        
        Great news! Your course has been approved and is now live on AI E-Learning Platform.
        
        Course: {course_title}
        Status: ✅ Published and available to students
        
        View your course dashboard: {course_url}
        
        Next Steps:
        - Monitor student enrollments and feedback
        - Engage with students in course discussions
        - Track your earnings in the creator dashboard
        - Plan your next course based on student interest
        
        Thank you for contributing to our learning community!
        
        Creator support: creators@ai-elearning.com
        
        Best regards,
        The AI E-Learning Team
        """
        
        return await self.send_email(to_email, subject, html_content, text_content)
    
    async def send_course_rejection_email(self, to_email: str, creator_name: str, course_title: str, reason: str, course_id: str) -> bool:
        """
        Send course rejection notification to content creator.
        
        Args:
            to_email: Creator's email address
            creator_name: Creator's name
            course_title: Course title
            reason: Rejection reason
            course_id: Course ID for direct link
            
        Returns:
            bool: True if email sent successfully
        """
        course_url = f"{settings.FRONTEND_URL}/creator/courses/{course_id}/edit"
        subject = f"Course needs revision: {course_title}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Course Needs Revision</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f7fafc;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f7fafc;">
                    <tr>
                        <td align="center" style="padding: 40px 20px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <tr>
                                    <td align="center" style="padding: 40px 20px 20px; background-color: #f59e0b; border-radius: 8px 8px 0 0;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">📝 Course Needs Revision</h1>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <h2 style="margin: 0 0 20px; color: #1a202c; font-size: 20px; font-weight: 600;">Hi {creator_name},</h2>
                                        
                                        <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                                            Thank you for submitting your course for review. We've reviewed your course and have some feedback to help make it even better.
                                        </p>
                                        
                                        <div style="padding: 20px; background-color: #fef5e7; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
                                            <h3 style="margin: 0 0 10px; color: #92400e; font-size: 18px; font-weight: 600;">📚 {course_title}</h3>
                                            <p style="margin: 0; color: #374151; font-size: 14px;">Status: Needs revision before publication</p>
                                        </div>
                                        
                                        <div style="padding: 20px; background-color: #fef2f2; border-radius: 6px; margin-bottom: 20px; border: 1px solid #fecaca;">
                                            <h3 style="margin: 0 0 15px; color: #dc2626; font-size: 16px; font-weight: 600;">📋 Feedback & Required Changes</h3>
                                            <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">{reason}</p>
                                        </div>
                                        
                                        <!-- CTA Button -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td align="center" style="padding: 30px 0;">
                                                    <a href="{course_url}" 
                                                       style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px; box-shadow: 0 2px 4px rgba(37,99,235,0.2);">
                                                        Edit Course
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <div style="padding: 20px; background-color: #f0f9ff; border-radius: 6px; margin-bottom: 20px;">
                                            <p style="margin: 0 0 10px; color: #1e40af; font-size: 14px; font-weight: 600;">
                                                💡 Tips for Success
                                            </p>
                                            <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.6;">
                                                <li>Review our content quality guidelines</li>
                                                <li>Make sure all videos are clear and professional</li>
                                                <li>Include detailed course descriptions and learning objectives</li>
                                                <li>Test your course from a student's perspective</li>
                                            </ul>
                                        </div>
                                        
                                        <p style="margin: 0; color: #718096; font-size: 14px; text-align: center;">
                                            We're here to help you succeed! Don't hesitate to reach out with questions.
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td align="center" style="padding: 30px 20px; background-color: #f7fafc; border-radius: 0 0 8px 8px;">
                                        <p style="margin: 0 0 10px; color: #718096; font-size: 14px;">
                                            Creator support: <a href="mailto:creators@ai-elearning.com" style="color: #2563eb; text-decoration: none;">creators@ai-elearning.com</a>
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
        Course Needs Revision
        
        Hi {creator_name},
        
        Thank you for submitting your course for review. We've reviewed your course and have some feedback to help make it even better.
        
        Course: {course_title}
        Status: Needs revision before publication
        
        Feedback & Required Changes:
        {reason}
        
        Edit your course: {course_url}
        
        Tips for Success:
        - Review our content quality guidelines
        - Make sure all videos are clear and professional
        - Include detailed course descriptions and learning objectives
        - Test your course from a student's perspective
        
        We're here to help you succeed! Don't hesitate to reach out with questions.
        
        Creator support: creators@ai-elearning.com
        
        Best regards,
        The AI E-Learning Team
        """
        
        return await self.send_email(to_email, subject, html_content, text_content)
    
    async def send_security_alert_email(self, to_email: str, alert_message: str) -> bool:
        """Send security alert email to security team"""
        subject = "🚨 Security Alert - AI E-Learning Platform"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td align="center" style="padding: 40px 0;">
                            <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <tr>
                                    <td style="background-color: #dc3545; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">⚠️ Security Alert</h1>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <pre style="background-color: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; border-radius: 5px; overflow-x: auto; font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.5;">
{alert_message}
                                        </pre>
                                        
                                        <div style="margin-top: 30px;">
                                            <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 15px;">Recommended Actions:</h3>
                                            <ul style="color: #6b7280; line-height: 1.8;">
                                                <li>Review the security event details</li>
                                                <li>Check for any patterns or repeated attempts</li>
                                                <li>Consider blocking suspicious IPs if necessary</li>
                                                <li>Update security rules if needed</li>
                                            </ul>
                                        </div>
                                        
                                        <div style="text-align: center; margin-top: 40px;">
                                            <a href="{settings.FRONTEND_URL}/admin/security" 
                                               style="display: inline-block; background-color: #dc3545; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: 600; font-size: 16px;">
                                                View Security Dashboard
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td align="center" style="padding: 30px 20px; background-color: #f7fafc; border-radius: 0 0 8px 8px;">
                                        <p style="margin: 0 0 10px; color: #718096; font-size: 14px;">
                                            Security Team: <a href="mailto:security@ai-elearning.com" style="color: #dc3545; text-decoration: none;">security@ai-elearning.com</a>
                                        </p>
                                        <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                                            This is an automated security alert from AI E-Learning Platform
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
        SECURITY ALERT - AI E-Learning Platform
        
        {alert_message}
        
        Recommended Actions:
        - Review the security event details
        - Check for any patterns or repeated attempts
        - Consider blocking suspicious IPs if necessary
        - Update security rules if needed
        
        View Security Dashboard: {settings.FRONTEND_URL}/admin/security
        
        Security Team: security@ai-elearning.com
        
        This is an automated security alert from AI E-Learning Platform
        """
        
        return await self.send_email(to_email, subject, html_content, text_content)


# Create singleton instance
email_service = EmailService()