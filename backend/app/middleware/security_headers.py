"""
Security Headers Middleware
Implements security headers to protect against common vulnerabilities
"""

from fastapi import Request
from fastapi.responses import Response
from typing import Callable

class SecurityHeadersMiddleware:
    """Middleware to add security headers to all responses"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            async def send_wrapper(message):
                if message["type"] == "http.response.start":
                    headers = dict(message.get("headers", []))
                    
                    # Security headers
                    security_headers = {
                        b"x-content-type-options": b"nosniff",
                        b"x-frame-options": b"DENY",
                        b"x-xss-protection": b"1; mode=block",
                        b"strict-transport-security": b"max-age=31536000; includeSubDomains",
                        b"content-security-policy": b"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.youtube.com https://s.ytimg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://www.youtube.com https://i.ytimg.com; frame-src https://www.youtube.com;",
                        b"referrer-policy": b"strict-origin-when-cross-origin",
                        b"permissions-policy": b"camera=(), microphone=(), geolocation=()"
                    }
                    
                    # Add headers
                    for header, value in security_headers.items():
                        headers[header] = value
                    
                    # Update message
                    message["headers"] = [(k, v) for k, v in headers.items()]
                
                await send(message)
            
            await self.app(scope, receive, send_wrapper)
        else:
            await self.app(scope, receive, send)