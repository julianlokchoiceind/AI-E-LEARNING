"""
Common dependencies for API endpoints.
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import decode_token
from app.models.user import User
from beanie import PydanticObjectId


# HTTP Bearer Security
security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """
    Get current authenticated user from JWT token.
    Raises HTTPException if token is invalid or user not found.
    """
    # Extract token from Bearer header
    token = credentials.credentials
    
    # Decode token
    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    try:
        user = await User.get(PydanticObjectId(user_id))
    except:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))) -> Optional[User]:
    """
    Get current authenticated user from JWT token.
    Returns None if no token provided or token is invalid.
    Used for endpoints that work for both authenticated and anonymous users.
    """
    if not credentials:
        return None
    
    try:
        # Extract token from Bearer header
        token = credentials.credentials
        
        # Decode token
        user_id = decode_token(token)
        if not user_id:
            return None
        
        # Get user from database
        try:
            user = await User.get(PydanticObjectId(user_id))
            return user
        except:
            return None
    except:
        return None


async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Get current user and verify they have admin role.
    Raises HTTPException if user is not admin.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin role required."
        )
    return current_user


async def get_creator_or_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Get current user and verify they have creator or admin role.
    Raises HTTPException if user is not creator or admin.
    """
    if current_user.role not in ["creator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Creator or Admin role required."
        )
    return current_user


# Alias for backward compatibility
get_current_admin = get_admin_user