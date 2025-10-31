"""
Rate limiting with MongoDB sliding window.
Protects auth endpoints from brute force attacks.
"""
from datetime import datetime, timedelta
from typing import Optional
from functools import wraps
from fastapi import HTTPException, Request, status
from app.core.database import get_database
import logging

logger = logging.getLogger(__name__)

# Rate limit configurations
RATE_LIMIT_CONFIG = {
    "login": {
        "limit": 5,
        "window": 60,      # 5 attempts/1 minute
        "lockout": 900     # Block 15 minutes
    },
    "register": {
        "limit": 5,
        "window": 3600,    # 5 attempts/hour
        "lockout": 3600    # Block 1 hour
    },
    "oauth_login": {
        "limit": 10,
        "window": 60,      # 10 attempts/minute
        "lockout": None    # No lockout
    },
    "forgot_password": {
        "limit": 3,
        "window": 300,     # 3 attempts/5 minutes
        "lockout": 900     # Block 15 minutes
    },
    "verify_email": {
        "limit": 10,
        "window": 60,      # 10 attempts/minute
        "lockout": None    # No lockout
    },
    "resend_verification": {
        "limit": 3,
        "window": 3600,    # 3 attempts/hour
        "lockout": 3600    # Block 1 hour
    },
    "change_password": {
        "limit": 5,
        "window": 60,      # 5 attempts/minute
        "lockout": 300     # Block 5 minutes
    },
    "preferences": {
        "limit": 30,
        "window": 60,      # 30 attempts/minute
        "lockout": None    # No lockout
    }
}


def get_client_ip(request: Request) -> str:
    """Get client IP address from request."""
    # Check X-Forwarded-For header first (for proxies)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()

    # Fall back to direct client IP
    if request.client:
        return request.client.host

    return "unknown"


async def check_rate_limit(ip: str, endpoint: str) -> None:
    """
    Check if request is within rate limit using sliding window.
    Raises HTTPException if rate limit exceeded.
    """
    config = RATE_LIMIT_CONFIG.get(endpoint)
    if not config:
        return  # No rate limit for this endpoint

    limit = config["limit"]
    window_seconds = config["window"]
    lockout_seconds = config.get("lockout")

    db = get_database()
    now = datetime.utcnow()
    key = f"{ip}:{endpoint}"

    # Check lockout first
    if lockout_seconds:
        lockout = await db.rate_limit_lockouts.find_one({"key": key})
        if lockout and lockout["locked_until"] > now:
            remaining = int((lockout["locked_until"] - now).total_seconds())
            minutes = remaining // 60
            seconds = remaining % 60
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many attempts. Try again in {minutes}m {seconds}s"
            )
        elif lockout and lockout["locked_until"] <= now:
            # Lockout expired, remove it
            await db.rate_limit_lockouts.delete_one({"key": key})

    # Sliding window: Count requests in the last N seconds
    window_start = now - timedelta(seconds=window_seconds)
    count = await db.rate_limits.count_documents({
        "key": key,
        "timestamp": {"$gte": window_start}
    })

    if count >= limit:
        # Rate limit exceeded
        if lockout_seconds:
            # Create lockout
            await db.rate_limit_lockouts.update_one(
                {"key": key},
                {
                    "$set": {
                        "key": key,
                        "locked_until": now + timedelta(seconds=lockout_seconds),
                        "created_at": now
                    }
                },
                upsert=True
            )
            minutes = lockout_seconds // 60
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many attempts. Locked for {minutes} minutes"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please slow down"
            )

    # Record this attempt
    await db.rate_limits.insert_one({
        "key": key,
        "timestamp": now,
        "expires_at": now + timedelta(seconds=window_seconds)
    })


async def reset_rate_limit(ip: str, endpoint: str) -> None:
    """Reset rate limit for successful actions (e.g., successful login)."""
    db = get_database()
    key = f"{ip}:{endpoint}"

    # Delete all rate limit records and lockout
    await db.rate_limits.delete_many({"key": key})
    await db.rate_limit_lockouts.delete_one({"key": key})


def rate_limit(endpoint: str):
    """
    Decorator for rate limiting endpoints.

    Usage:
        @rate_limit("login")
        async def login(request: Request, ...):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request from args or kwargs
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            if not request:
                request = kwargs.get('request')

            if request:
                ip = get_client_ip(request)
                await check_rate_limit(ip, endpoint)

            return await func(*args, **kwargs)
        return wrapper
    return decorator
