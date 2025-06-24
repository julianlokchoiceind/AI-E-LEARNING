"""
API dependencies for authentication and authorization.
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import ValidationError

from app.core.config import settings
from app.schemas.auth import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    """
    Get current user from JWT token.
    Returns the user email (subject) from the token.
    """
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        
        if token_data.sub is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Could not validate credentials",
            )
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    
    # TODO: Get user from database
    # For now, just return the email from token
    return token_data.sub


async def get_current_active_user(
    current_user: str = Depends(get_current_user)
) -> str:
    """
    Get current active user.
    """
    # TODO: Check if user is active in database
    return current_user