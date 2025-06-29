"""
Input Validation Middleware
Implements input validation to prevent SQL injection, XSS, and other injection attacks
"""

from fastapi import Request, HTTPException
import re
import html
import json
from typing import Any, Dict, List
from urllib.parse import unquote

class InputValidator:
    """Validates and sanitizes user input"""
    
    def __init__(self):
        # SQL injection patterns
        self.sql_patterns = [
            r"(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)",
            r"(--|#|\/\*|\*\/)",
            r"(\bor\b\s*\d+\s*=\s*\d+)",
            r"(\band\b\s*\d+\s*=\s*\d+)",
            r"(';|\";\s*(drop|delete|update|insert))",
            r"(\b(sys|information_schema)\b)",
        ]
        
        # XSS patterns
        self.xss_patterns = [
            r"<script[^>]*>.*?</script>",
            r"javascript:",
            r"on\w+\s*=",
            r"<iframe[^>]*>",
            r"<object[^>]*>",
            r"<embed[^>]*>",
            r"<link[^>]*>",
            r"<meta[^>]*>",
            r"<img[^>]*src[^>]*>",
        ]
        
        # Path traversal patterns
        self.path_traversal_patterns = [
            r"\.\./",
            r"\.\.\\",
            r"%2e%2e%2f",
            r"%2e%2e%5c",
        ]
        
        # Compile patterns for efficiency
        self.sql_regex = [re.compile(pattern, re.IGNORECASE) for pattern in self.sql_patterns]
        self.xss_regex = [re.compile(pattern, re.IGNORECASE) for pattern in self.xss_patterns]
        self.path_regex = [re.compile(pattern, re.IGNORECASE) for pattern in self.path_traversal_patterns]
    
    def is_sql_injection(self, value: str) -> bool:
        """Check if input contains SQL injection patterns"""
        # Decode URL encoded values
        decoded_value = unquote(value)
        
        for pattern in self.sql_regex:
            if pattern.search(decoded_value):
                return True
        return False
    
    def is_xss_attack(self, value: str) -> bool:
        """Check if input contains XSS patterns"""
        # Decode URL encoded values
        decoded_value = unquote(value)
        
        for pattern in self.xss_regex:
            if pattern.search(decoded_value):
                return True
        return False
    
    def is_path_traversal(self, value: str) -> bool:
        """Check if input contains path traversal patterns"""
        # Decode URL encoded values
        decoded_value = unquote(value)
        
        for pattern in self.path_regex:
            if pattern.search(decoded_value):
                return True
        return False
    
    def sanitize_html(self, value: str) -> str:
        """Sanitize HTML content"""
        return html.escape(value)
    
    def validate_input(self, value: Any) -> Any:
        """Validate and sanitize input"""
        if isinstance(value, str):
            # Check for malicious patterns
            if self.is_sql_injection(value):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid input: SQL injection detected"
                )
            
            if self.is_xss_attack(value):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid input: XSS attack detected"
                )
            
            if self.is_path_traversal(value):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid input: Path traversal detected"
                )
            
            # Return sanitized value for display
            return self.sanitize_html(value)
        
        elif isinstance(value, dict):
            # Recursively validate dict values
            return {k: self.validate_input(v) for k, v in value.items()}
        
        elif isinstance(value, list):
            # Recursively validate list items
            return [self.validate_input(item) for item in value]
        
        return value

class InputValidationMiddleware:
    """Middleware to validate all incoming requests"""
    
    def __init__(self, app):
        self.app = app
        self.validator = InputValidator()
        # Paths that should be skipped (OAuth2, file uploads, etc.)
        self.skip_paths = [
            "/api/v1/auth/login",
            "/api/v1/auth/token", 
            "/token",
            "/docs",
            "/redoc",
            "/openapi.json"
        ]
    
    def should_skip_validation(self, path: str, content_type: str) -> bool:
        """Determine if request should skip validation"""
        # Skip OAuth2 endpoints
        if any(skip_path in path for skip_path in self.skip_paths):
            return True
        
        # Skip form-urlencoded requests (OAuth2, file uploads)
        if content_type and "application/x-www-form-urlencoded" in content_type:
            return True
        
        # Skip multipart form data (file uploads)
        if content_type and "multipart/form-data" in content_type:
            return True
        
        return False
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            request = Request(scope, receive)
            
            try:
                # Always validate query parameters and path parameters
                for key, value in request.query_params.items():
                    self.validator.validate_input(value)
                
                path_params = scope.get("path_params", {})
                for key, value in path_params.items():
                    self.validator.validate_input(str(value))
                
                # Check if we should skip body validation
                content_type = request.headers.get("content-type", "")
                path = scope.get("path", "")
                
                if self.should_skip_validation(path, content_type):
                    # Skip body validation for OAuth2 and form data
                    await self.app(scope, receive, send)
                    return
                
                # For JSON requests, validate body using a custom receive wrapper
                if request.method in ["POST", "PUT", "PATCH"] and "application/json" in content_type:
                    # Create a wrapper that validates JSON body without consuming it
                    body_data = b""
                    body_complete = False
                    
                    async def wrapped_receive():
                        nonlocal body_data, body_complete
                        
                        message = await receive()
                        
                        if message["type"] == "http.request":
                            body_chunk = message.get("body", b"")
                            body_data += body_chunk
                            
                            # If this is the last chunk, validate the complete body
                            if not message.get("more_body", False):
                                body_complete = True
                                
                                if body_data:
                                    try:
                                        # Parse and validate JSON
                                        json_body = json.loads(body_data.decode())
                                        validated_body = self.validator.validate_input(json_body)
                                        
                                        # Update the body with validated data
                                        validated_body_bytes = json.dumps(validated_body).encode()
                                        
                                        # Return the validated body
                                        return {
                                            "type": "http.request",
                                            "body": validated_body_bytes,
                                            "more_body": False
                                        }
                                    except json.JSONDecodeError:
                                        # If not valid JSON, pass through original
                                        pass
                        
                        return message
                    
                    await self.app(scope, wrapped_receive, send)
                else:
                    # For non-JSON requests or GET requests, proceed normally
                    await self.app(scope, receive, send)
                
            except HTTPException as e:
                # Send error response
                response_body = json.dumps({
                    "error": "VALIDATION_ERROR",
                    "message": e.detail
                })
                
                await send({
                    "type": "http.response.start",
                    "status": e.status_code,
                    "headers": [(b"content-type", b"application/json")],
                })
                
                await send({
                    "type": "http.response.body",
                    "body": response_body.encode(),
                })
        else:
            await self.app(scope, receive, send)