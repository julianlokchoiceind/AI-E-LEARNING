"""
Token Blacklist Middleware
Checks if JWT tokens are blacklisted before allowing access
"""
import logging
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from jose import jwt, JWTError

from app.core.config import settings
from app.services.token_blacklist_service import token_blacklist_service

logger = logging.getLogger(__name__)


class TokenBlacklistMiddleware(BaseHTTPMiddleware):
    """Middleware to check if JWT tokens are blacklisted"""
    
    def __init__(self, app):
        super().__init__(app)
        self.protected_paths = [
            "/api/v1/users",
            "/api/v1/courses",
            "/api/v1/enrollments", 
            "/api/v1/progress",
            "/api/v1/admin",
            "/api/v1/creator"
        ]
        self.excluded_paths = [
            "/api/v1/auth/login",
            "/api/v1/auth/register", 
            "/api/v1/auth/refresh",
            "/api/v1/auth/verify-email",
            "/api/v1/auth/forgot-password",
            "/api/v1/auth/reset-password",
            "/health",
            "/docs",
            "/openapi.json"
        ]
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """Check token blacklist before processing request"""
        
        # Skip check for non-protected paths
        if not self._is_protected_path(request.url.path):
            return await call_next(request)
        
        # Skip check for excluded paths
        if self._is_excluded_path(request.url.path):
            return await call_next(request)
        
        # Extract token from Authorization header
        token = self._extract_token(request)
        
        if token:
            try:
                # Check if token is blacklisted
                is_blacklisted = await token_blacklist_service.is_token_blacklisted(token)
                
                if is_blacklisted:
                    logger.warning(f"Blacklisted token used for path: {request.url.path}")
                    return JSONResponse(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        content={
                            "error": {
                                "code": "TOKEN_BLACKLISTED",
                                "message": "Token has been invalidated. Please login again.",
                                "detail": "Your session has been terminated. Please login again to continue."
                            }
                        }
                    )
                
            except Exception as e:
                logger.error(f"Error checking token blacklist: {str(e)}")
                # On error, allow request to continue to avoid blocking users
                # The main auth middleware will handle invalid tokens
        
        return await call_next(request)
    
    def _is_protected_path(self, path: str) -> bool:
        """Check if path requires authentication"""
        return any(path.startswith(protected) for protected in self.protected_paths)
    
    def _is_excluded_path(self, path: str) -> bool:
        """Check if path should skip blacklist check"""
        return any(path.startswith(excluded) for excluded in self.excluded_paths)
    
    def _extract_token(self, request: Request) -> str:
        """Extract JWT token from Authorization header"""
        try:
            authorization = request.headers.get("Authorization")
            if not authorization:
                return None
            
            # Expected format: "Bearer <token>"
            scheme, token = authorization.split()
            if scheme.lower() != "bearer":
                return None
            
            return token
            
        except (ValueError, AttributeError):
            return None