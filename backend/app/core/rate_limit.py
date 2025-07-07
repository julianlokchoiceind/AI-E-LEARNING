"""
Rate limiting configuration using slowapi.
Protects auth endpoints from brute force attacks.
"""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

# Create limiter instance using remote address as key
# Add a unique identifier to prevent cross-session rate limiting in development
import hashlib
import time

def get_unique_key(request):
    """Get unique key for rate limiting that includes session info"""
    remote_addr = get_remote_address(request)
    # In development, add timestamp to prevent persistent rate limits
    if remote_addr in ['127.0.0.1', 'localhost', '::1']:
        session_id = getattr(request.state, 'session_id', str(time.time()))
        return f"{remote_addr}:{session_id}"
    return remote_addr

limiter = Limiter(key_func=get_remote_address)

# Rate limit configurations for different endpoints
AUTH_RATE_LIMITS = {
    "login": "20/minute",          # 20 login attempts per minute (increased for development)
    "register": "10/minute",        # 10 registrations per minute
    "forgot_password": "5/minute",  # 5 password reset requests per minute
    "verify_email": "20/minute",    # 20 verification attempts per minute (increased for better UX)
    "resend_verification": "5/minute",  # 5 resend requests per minute
    "change_password": "10/minute",     # 10 password change attempts per minute
    "preferences": "30/minute"          # 30 preference read/write operations per minute
}