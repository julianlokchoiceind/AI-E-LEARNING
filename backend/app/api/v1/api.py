"""
API v1 router that includes all endpoints.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import auth

api_router = APIRouter()

# Include routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])