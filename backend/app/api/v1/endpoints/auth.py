"""
Authentication endpoints for user registration, login, and token management.
"""
from datetime import datetime, timedelta
from typing import Any
from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from passlib.context import CryptContext
from jose import JWTError, jwt
from pydantic import EmailStr
import secrets
import logging

from app.core.config import settings
from app.core.database import get_database
from app.core.email import email_service
from app.core.rate_limit import limiter, AUTH_RATE_LIMITS
from app.models.user import User
from app.schemas.auth import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    TokenPayload,
    PasswordReset,
    PasswordResetRequest,
    EmailVerificationResend,
    OAuthUserCreate,
    TokenWithRefresh,
    RefreshTokenRequest
)
from app.api.deps import get_current_user
from app.schemas.base import StandardResponse, ErrorResponse

logger = logging.getLogger(__name__)

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def create_access_token(subject: str, expires_delta: timedelta = None) -> str:
    """Create JWT access token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def generate_verification_token() -> str:
    """Generate email verification token."""
    return secrets.token_urlsafe(32)


def create_refresh_token() -> str:
    """Generate refresh token."""
    return secrets.token_urlsafe(64)


def verify_refresh_token(token: str) -> dict:
    """Verify refresh token and return user data."""
    # In production, store refresh tokens in database with expiry
    # For now, we'll use JWT for refresh tokens too
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def create_refresh_jwt(subject: str, expires_delta: timedelta = None) -> str:
    """Create JWT refresh token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=30)  # 30 days for refresh token
    
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


@router.post("/register", response_model=StandardResponse[UserResponse], status_code=status.HTTP_201_CREATED)
@limiter.limit(AUTH_RATE_LIMITS["register"])
async def register(request: Request, user_data: UserCreate) -> StandardResponse[UserResponse]:
    """
    Register a new user.
    """
    db = get_database()
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Create user object
    user_doc = {
        "email": user_data.email,
        "name": user_data.name,
        "password": get_password_hash(user_data.password),
        "role": "student",
        "premium_status": False,
        "is_verified": False,
        "verification_token": generate_verification_token(),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Save to MongoDB
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    
    # Send verification email
    try:
        await email_service.send_verification_email(
            to_email=user_data.email,
            name=user_data.name,
            token=user_doc['verification_token']
        )
        logger.info(f"Verification email sent to: {user_data.email}")
    except Exception as e:
        logger.error(f"Failed to send verification email: {str(e)}")
        # Continue with registration even if email fails
    
    # Return user response (without password)
    user_response = UserResponse(
        id=str(user_doc["_id"]),
        email=user_doc["email"],
        name=user_doc["name"],
        role=user_doc["role"],
        premium_status=user_doc["premium_status"],
        is_verified=user_doc["is_verified"],
        created_at=user_doc["created_at"]
    )
    
    return StandardResponse(
        success=True,
        data=user_response,
        message="Registration successful. Please check your email to verify your account."
    )


@router.post("/login", response_model=TokenWithRefresh)
@limiter.limit(AUTH_RATE_LIMITS["login"])
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    db = get_database()
    
    # Get user from MongoDB
    user = await db.users.find_one({"email": form_data.username})
    
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # TEMPORARILY DISABLED FOR DEVELOPMENT
    # if not user["is_verified"]:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Please verify your email before logging in"
    #     )
    
    # Create access token and refresh token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=str(user["_id"]), expires_delta=access_token_expires
    )
    refresh_token = create_refresh_jwt(subject=str(user["_id"]))
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60  # Convert to seconds
    }


@router.get("/verify-email", response_model=StandardResponse[dict])
@limiter.limit(AUTH_RATE_LIMITS["verify_email"])
async def verify_email(request: Request, token: str) -> StandardResponse[dict]:
    """
    Verify user email with token.
    """
    db = get_database()
    
    # Find user with this token
    user = await db.users.find_one({"verification_token": token})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid verification token"
        )
    
    # Update user verification status
    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "is_verified": True,
                "verification_token": None,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return StandardResponse(
        success=True,
        data={"email": user["email"]},
        message="Email verified successfully"
    )


@router.post("/oauth", response_model=TokenWithRefresh)
@limiter.limit(AUTH_RATE_LIMITS["login"])
async def oauth_login(request: Request, oauth_data: OAuthUserCreate) -> Any:
    """
    Handle OAuth user login/registration.
    """
    db = get_database()
    
    # Check if user already exists
    user = await db.users.find_one({"email": oauth_data.email})
    
    if not user:
        # Create new OAuth user
        user_doc = {
            "email": oauth_data.email,
            "name": oauth_data.name,
            "password": None,  # OAuth users don't have passwords
            "role": "student",
            "premium_status": False,
            "is_verified": True,  # OAuth users are pre-verified
            "oauth_provider": oauth_data.provider,
            "oauth_provider_id": oauth_data.provider_id,
            "profile_picture": oauth_data.picture,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Save to MongoDB
        result = await db.users.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        
        logger.info(f"New OAuth user created: {oauth_data.email} via {oauth_data.provider}")
    else:
        # Update existing user OAuth info
        await db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "oauth_provider": oauth_data.provider,
                    "oauth_provider_id": oauth_data.provider_id,
                    "profile_picture": oauth_data.picture,
                    "is_verified": True,  # Ensure OAuth users are verified
                    "updated_at": datetime.utcnow()
                }
            }
        )
        user = await db.users.find_one({"_id": user["_id"]})
    
    # Create tokens
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=str(user["_id"]), expires_delta=access_token_expires
    )
    refresh_token = create_refresh_jwt(subject=str(user["_id"]))
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


@router.post("/refresh", response_model=TokenWithRefresh)
async def refresh_access_token(token_request: RefreshTokenRequest) -> Any:
    """
    Refresh access token using refresh token.
    """
    # Verify refresh token
    payload = verify_refresh_token(token_request.refresh_token)
    
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Create new access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=payload.get("sub"), expires_delta=access_token_expires
    )
    
    # Create new refresh token (rotate refresh tokens for security)
    new_refresh_token = create_refresh_jwt(subject=payload.get("sub"))
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


@router.post("/logout", response_model=StandardResponse[dict])
async def logout() -> StandardResponse[dict]:
    """
    Logout user (invalidate token).
    """
    # TODO: Implement token blacklist
    return StandardResponse(
        success=True,
        data={},
        message="Successfully logged out"
    )


@router.post("/forgot-password", response_model=StandardResponse[dict])
@limiter.limit(AUTH_RATE_LIMITS["forgot_password"])
async def forgot_password(request: Request, reset_request: PasswordResetRequest) -> StandardResponse[dict]:
    """
    Request password reset email.
    """
    db = get_database()
    
    # Find user by email
    user = await db.users.find_one({"email": reset_request.email})
    
    if not user:
        # Don't reveal if email exists or not for security
        return StandardResponse(
            success=True,
            data={},
            message="If the email exists, a password reset link has been sent"
        )
    
    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    reset_expires = datetime.utcnow() + timedelta(hours=1)
    
    # Update user with reset token
    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "reset_password_token": reset_token,
                "reset_password_expires": reset_expires,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Send password reset email
    try:
        await email_service.send_password_reset_email(
            to_email=user["email"],
            name=user["name"],
            token=reset_token
        )
        logger.info(f"Password reset email sent to: {user['email']}")
    except Exception as e:
        logger.error(f"Failed to send password reset email: {str(e)}")
    
    return StandardResponse(
        success=True,
        data={},
        message="If the email exists, a password reset link has been sent"
    )


@router.post("/reset-password", response_model=StandardResponse[dict])
async def reset_password(reset_data: PasswordReset) -> StandardResponse[dict]:
    """
    Reset password with token.
    """
    db = get_database()
    
    # Find user with valid reset token
    user = await db.users.find_one({
        "reset_password_token": reset_data.token,
        "reset_password_expires": {"$gt": datetime.utcnow()}
    })
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or expired reset token"
        )
    
    # Update password and clear reset token
    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "password": get_password_hash(reset_data.new_password),
                "reset_password_token": None,
                "reset_password_expires": None,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return StandardResponse(
        success=True,
        data={"email": user["email"]},
        message="Password reset successfully"
    )


@router.post("/resend-verification", response_model=StandardResponse[dict])
@limiter.limit(AUTH_RATE_LIMITS["resend_verification"])
async def resend_verification(request: Request, email_request: EmailVerificationResend) -> StandardResponse[dict]:
    """
    Resend email verification.
    """
    db = get_database()
    
    # Find user by email
    user = await db.users.find_one({"email": email_request.email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user["is_verified"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already verified"
        )
    
    # Generate new verification token
    new_token = generate_verification_token()
    
    # Update user with new token
    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "verification_token": new_token,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Send verification email
    try:
        await email_service.send_verification_email(
            to_email=user["email"],
            name=user["name"],
            token=new_token
        )
        logger.info(f"Verification email resent to: {user['email']}")
    except Exception as e:
        logger.error(f"Failed to resend verification email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email"
        )
    
    return StandardResponse(
        success=True,
        data={"email": user["email"]},
        message="Verification email sent successfully"
    )


@router.get("/verify-email", response_model=StandardResponse[dict])
async def verify_email(token: str) -> StandardResponse[dict]:
    """
    Verify email address with token.
    """
    db = get_database()
    
    # Find user with verification token
    user = await db.users.find_one({"verification_token": token})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid verification token"
        )
    
    if user["is_verified"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already verified"
        )
    
    # Update user as verified
    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "is_verified": True,
                "verification_token": None,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Send welcome email after successful verification
    try:
        await email_service.send_welcome_email(
            to_email=user["email"],
            name=user["name"]
        )
        logger.info(f"Welcome email sent to: {user['email']}")
    except Exception as e:
        logger.error(f"Failed to send welcome email: {str(e)}")
        # Don't fail the verification if email fails
    
    return StandardResponse(
        success=True,
        data={"email": user["email"]},
        message="Email verified successfully! Welcome to AI E-Learning Platform."
    )