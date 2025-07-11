"""
Input Validation Middleware with 3-Layer Security Approach
Implements smart validation to prevent XSS, SQL injection while avoiding false positives
"""

from fastapi import Request, HTTPException
import re
import json
import nh3
from typing import Any, Dict, List, Set
from urllib.parse import unquote
import logging

logger = logging.getLogger(__name__)

class InputValidator:
    """Validates and sanitizes user input with field-aware approach"""
    
    def __init__(self):
        # Fields that need only basic sanitization (no strict validation)
        self.safe_fields: Set[str] = {
            'title', 'description', 'short_description', 
            'syllabus', 'prerequisites', 'target_audience',
            'content', 'bio', 'about', 'summary', 'notes'
        }
        
        # Fields that need strict validation
        self.strict_fields: Set[str] = {
            'email', 'password', 'api_key', 'token',
            'secret', 'private_key', 'webhook_url'
        }
        
        # Only REAL dangerous SQL patterns (not common words)
        self.dangerous_sql_patterns = [
            # SQL injection with quotes and commands
            r"('|\");\s*(drop|delete|truncate|exec|execute)\s+(table|database|schema)",
            r"';\s*(DROP|DELETE|TRUNCATE|EXEC|EXECUTE)\s+(TABLE|DATABASE|SCHEMA)",  # Uppercase variant
            # SQL comments with dangerous commands
            r"--\s*(drop|delete|truncate|exec|execute)\s",
            # UNION based injection
            r"union\s+(all\s+)?select\s+",
            # Hex encoding attempts
            r"0x[0-9a-f]+",
            # Time-based blind SQL injection
            r"(sleep|benchmark|waitfor)\s*\(",
        ]
        
        # XSS patterns that are actually dangerous
        self.dangerous_xss_patterns = [
            r"<script[^>]*>.*?</script>",
            r"javascript\s*:",
            r"on\w+\s*=\s*[\"'].*?[\"']",  # Event handlers
            r"<iframe[^>]*>",
            r"<object[^>]*>",
            r"<embed[^>]*>",
            r"<img[^>]*onerror\s*=",
            r"<svg[^>]*onload\s*=",
        ]
        
        # Path traversal patterns
        self.path_traversal_patterns = [
            r"\.\./",
            r"\.\.\\",
            r"%2e%2e[/\\]",
            r"%252e%252e",
        ]
        
        # Compile patterns for efficiency
        self.sql_regex = [re.compile(pattern, re.IGNORECASE) for pattern in self.dangerous_sql_patterns]
        self.xss_regex = [re.compile(pattern, re.IGNORECASE | re.DOTALL) for pattern in self.dangerous_xss_patterns]
        self.path_regex = [re.compile(pattern, re.IGNORECASE) for pattern in self.path_traversal_patterns]
    
    def is_dangerous_sql(self, value: str) -> bool:
        """Check if input contains ACTUAL SQL injection attempts"""
        decoded_value = unquote(value)
        
        # Skip validation for very long text (course descriptions, etc)
        if len(decoded_value) > 10000:
            return False
            
        for pattern in self.sql_regex:
            if pattern.search(decoded_value):
                logger.warning(f"SQL injection attempt detected: {decoded_value[:100]}...")
                return True
        return False
    
    def is_dangerous_xss(self, value: str) -> bool:
        """Check if input contains dangerous XSS patterns"""
        decoded_value = unquote(value)
        
        for pattern in self.xss_regex:
            if pattern.search(decoded_value):
                logger.warning(f"XSS attempt detected: {decoded_value[:100]}...")
                return True
        return False
    
    def is_path_traversal(self, value: str) -> bool:
        """Check if input contains path traversal patterns"""
        decoded_value = unquote(value)
        
        for pattern in self.path_regex:
            if pattern.search(decoded_value):
                logger.warning(f"Path traversal attempt detected: {decoded_value[:100]}...")
                return True
        return False
    
    def sanitize_html(self, value: str, field_name: str = None) -> str:
        """Sanitize HTML content based on field type"""
        if field_name in ['title', 'name', 'slug']:
            # Strip ALL HTML from titles
            return nh3.clean(value, tags=set())
        elif field_name in ['description', 'content', 'bio']:
            # Allow safe formatting tags
            return nh3.clean(
                value,
                tags={"b", "i", "u", "em", "strong", "p", "br", "ul", "ol", "li"},
                attributes={},
                link_rel=None
            )
        else:
            # Default: strip all HTML
            return nh3.clean(value, tags=set())
    
    def validate_field(self, field_name: str, value: Any) -> Any:
        """Field-aware validation strategy"""
        if not isinstance(value, str):
            return value
            
        # Layer 1: Field-specific handling
        if field_name in self.safe_fields:
            # Only sanitize, no strict validation for content fields
            return self.sanitize_html(value, field_name)
        
        # Layer 2: Check for dangerous patterns
        if self.is_dangerous_sql(value):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid input in field '{field_name}': SQL injection detected"
            )
        
        if self.is_dangerous_xss(value):
            # Don't block, just sanitize
            return self.sanitize_html(value, field_name)
        
        if field_name in self.strict_fields and self.is_path_traversal(value):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid input in field '{field_name}': Path traversal detected"
            )
        
        # Layer 3: Return sanitized value
        return self.sanitize_html(value, field_name)
    
    def validate_input(self, value: Any, parent_key: str = "") -> Any:
        """Recursively validate and sanitize input"""
        if isinstance(value, str):
            return self.validate_field(parent_key, value)
        
        elif isinstance(value, dict):
            # Recursively validate dict values with field context
            return {k: self.validate_input(v, k) for k, v in value.items()}
        
        elif isinstance(value, list):
            # Recursively validate list items
            return [self.validate_input(item, parent_key) for item in value]
        
        return value

class InputValidationMiddleware:
    """Middleware to validate all incoming requests with smart field handling"""
    
    def __init__(self, app):
        self.app = app
        self.validator = InputValidator()
        # Paths that should be skipped
        self.skip_paths = [
            "/api/v1/auth/login",
            "/api/v1/auth/token", 
            "/api/v1/auth/register",  # Allow registration
            "/api/v1/auth/oauth",     # OAuth endpoints
            "/token",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/health",
            "/metrics"
        ]
    
    def should_skip_validation(self, path: str, content_type: str) -> bool:
        """Determine if request should skip validation"""
        # Skip specified endpoints
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
                # Always validate query parameters
                for key, value in request.query_params.items():
                    self.validator.validate_field(key, value)
                
                # Validate path parameters
                path_params = scope.get("path_params", {})
                for key, value in path_params.items():
                    self.validator.validate_field(key, str(value))
                
                # Check if we should skip body validation
                content_type = request.headers.get("content-type", "")
                path = scope.get("path", "")
                
                if self.should_skip_validation(path, content_type):
                    await self.app(scope, receive, send)
                    return
                
                # For JSON requests, validate body
                if request.method in ["POST", "PUT", "PATCH"] and "application/json" in content_type:
                    body_data = b""
                    
                    async def wrapped_receive():
                        nonlocal body_data
                        
                        message = await receive()
                        
                        if message["type"] == "http.request":
                            body_chunk = message.get("body", b"")
                            body_data += body_chunk
                            
                            # If this is the last chunk, validate the complete body
                            if not message.get("more_body", False):
                                if body_data:
                                    try:
                                        # Parse and validate JSON with field context
                                        json_body = json.loads(body_data.decode())
                                        validated_body = self.validator.validate_input(json_body)
                                        
                                        # Return the validated body
                                        validated_body_bytes = json.dumps(validated_body).encode()
                                        
                                        return {
                                            "type": "http.request",
                                            "body": validated_body_bytes,
                                            "more_body": False
                                        }
                                    except json.JSONDecodeError:
                                        # If not valid JSON, pass through
                                        pass
                        
                        return message
                    
                    await self.app(scope, wrapped_receive, send)
                else:
                    # For non-JSON requests, proceed normally
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