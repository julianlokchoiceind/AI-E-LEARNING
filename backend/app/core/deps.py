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
    import logging
    logger = logging.getLogger(__name__)
    
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
    import logging
    logger = logging.getLogger(__name__)
    
    if not credentials:
        logger.info("No credentials provided")
        return None
    
    try:
        # Extract token from Bearer header
        token = credentials.credentials
        
        # Decode token
        user_id = decode_token(token)
        
        if not user_id:
            logger.warning("Token decode returned None")
            return None
        
        # Get user from database
        try:
            user = await User.get(PydanticObjectId(user_id))
            return user
        except Exception as e:
            logger.error(f"Error getting user from DB: {e}")
            return None
    except Exception as e:
        logger.error(f"Error in get_current_user_optional: {e}")
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


async def get_current_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[User]:
    """
    ALIAS for get_current_user_optional() - for backward compatibility with api/deps.py
    This ensures all imports work with the consolidated deps file.
    """
    return await get_current_user_optional(credentials)


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current active user (verified).
    Copied from api/deps.py for compatibility.
    """
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user