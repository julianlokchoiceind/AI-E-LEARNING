"""
Rate Limiting Middleware
Implements rate limiting to prevent API abuse and DDoS attacks
"""

from fastapi import Request, HTTPException
from datetime import datetime, timedelta
from typing import Dict, Optional
import time
from collections import defaultdict
import asyncio

class RateLimiter:
    """Rate limiter using in-memory storage (upgrade to Redis for production)"""
    
    def __init__(self):
        self.requests = defaultdict(list)
        self.limits = {
            'default': {'requests': 100, 'window': 60},      # 100 req/min
            'auth': {'requests': 5, 'window': 300},          # 5 req/5min
            'ai': {'requests': 50, 'window': 3600},          # 50 req/hour
            'payment': {'requests': 10, 'window': 60},       # 10 req/min
            'upload': {'requests': 10, 'window': 3600}       # 10 req/hour
        }
        # Lock for thread-safe operations
        self.lock = asyncio.Lock()
    
    async def check_rate_limit(
        self,
        request: Request,
        endpoint_type: str = 'default'
    ) -> None:
        """Check and enforce rate limits"""
        # Get identifier (user ID or IP)
        user = getattr(request.state, 'user', None)
        identifier = str(user.id) if user else request.client.host
        
        # Get limit config
        limit_config = self.limits.get(endpoint_type, self.limits['default'])
        
        # Create key
        key = f"{endpoint_type}:{identifier}"
        
        async with self.lock:
            now = time.time()
            
            # Clean old requests
            self.requests[key] = [
                req_time for req_time in self.requests[key]
                if now - req_time < limit_config['window']
            ]
            
            # Check limit
            if len(self.requests[key]) >= limit_config['requests']:
                # Calculate retry after
                oldest_request = min(self.requests[key])
                retry_after = int(oldest_request + limit_config['window'] - now)
                
                raise HTTPException(
                    status_code=429,
                    detail={
                        'error': 'RATE_LIMITED',
                        'message': f"Too many requests. Limit: {limit_config['requests']} per {limit_config['window']}s",
                        'retry_after': retry_after
                    },
                    headers={'Retry-After': str(retry_after)}
                )
            
            # Add current request
            self.requests[key].append(now)
            
            # Add rate limit info to request state
            request.state.rate_limit_remaining = limit_config['requests'] - len(self.requests[key])
            request.state.rate_limit_reset = datetime.fromtimestamp(
                now + limit_config['window']
            )

class RateLimitMiddleware:
    """Middleware to apply rate limiting"""
    
    def __init__(self, app):
        self.app = app
        self.rate_limiter = RateLimiter()
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            request = Request(scope, receive)
            
            # Determine endpoint type based on path
            path = request.url.path
            endpoint_type = 'default'
            
            if '/auth/' in path:
                endpoint_type = 'auth'
            elif '/ai/' in path:
                endpoint_type = 'ai'
            elif '/payments/' in path:
                endpoint_type = 'payment'
            elif '/upload' in path:
                endpoint_type = 'upload'
            
            try:
                # Check rate limit
                await self.rate_limiter.check_rate_limit(request, endpoint_type)
                
                # Add rate limit headers to response
                async def send_wrapper(message):
                    if message["type"] == "http.response.start":
                        headers = dict(message.get("headers", []))
                        
                        if hasattr(request.state, 'rate_limit_remaining'):
                            headers[b"x-ratelimit-remaining"] = str(request.state.rate_limit_remaining).encode()
                            headers[b"x-ratelimit-reset"] = str(int(request.state.rate_limit_reset.timestamp())).encode()
                        
                        message["headers"] = [(k, v) for k, v in headers.items()]
                    
                    await send(message)
                
                await self.app(scope, receive, send_wrapper)
            except HTTPException as e:
                # Send rate limit error response
                response_body = e.detail if isinstance(e.detail, str) else str(e.detail)
                response_headers = [
                    (b"content-type", b"application/json"),
                ]
                
                if hasattr(e, 'headers'):
                    for header, value in e.headers.items():
                        response_headers.append((header.encode(), value.encode()))
                
                await send({
                    "type": "http.response.start",
                    "status": e.status_code,
                    "headers": response_headers,
                })
                
                await send({
                    "type": "http.response.body",
                    "body": response_body.encode(),
                })
        else:
            await self.app(scope, receive, send)