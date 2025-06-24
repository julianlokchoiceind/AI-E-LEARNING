"""
Rate limiting configuration using slowapi.
Protects auth endpoints from brute force attacks.
"""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

# Create limiter instance using remote address as key
limiter = Limiter(key_func=get_remote_address)

# Rate limit configurations for different endpoints
AUTH_RATE_LIMITS = {
    "login": "5/minute",           # 5 login attempts per minute
    "register": "3/minute",         # 3 registrations per minute
    "forgot_password": "3/minute",  # 3 password reset requests per minute
    "verify_email": "10/minute",    # 10 verification attempts per minute
    "resend_verification": "2/minute"  # 2 resend requests per minute
}