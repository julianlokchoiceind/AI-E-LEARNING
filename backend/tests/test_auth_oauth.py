"""
Unit tests for OAuth authentication and refresh token functionality.
"""
import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta
from jose import jwt
import json

from app.core.config import settings
from app.main import app
from app.core.database import get_database


@pytest.mark.asyncio
async def test_oauth_user_creation(test_client: AsyncClient):
    """Test OAuth user creation endpoint."""
    oauth_data = {
        "email": "oauth.user@example.com",
        "name": "OAuth User",
        "provider": "google",
        "provider_id": "google-123456",
        "picture": "https://example.com/photo.jpg"
    }
    
    response = await test_client.post("/api/v1/auth/oauth", json=oauth_data)
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert "expires_in" in data
    
    # Verify user was created in database
    db = get_database()
    user = await db.users.find_one({"email": oauth_data["email"]})
    assert user is not None
    assert user["is_verified"] is True
    assert user["oauth_provider"] == "google"
    assert user["oauth_provider_id"] == "google-123456"
    assert user["password"] is None


@pytest.mark.asyncio
async def test_oauth_existing_user_update(test_client: AsyncClient):
    """Test OAuth login for existing user updates their OAuth info."""
    # First create a regular user
    register_data = {
        "email": "existing.user@example.com",
        "name": "Existing User",
        "password": "testpassword123"
    }
    
    await test_client.post("/api/v1/auth/register", json=register_data)
    
    # Now OAuth login with same email
    oauth_data = {
        "email": "existing.user@example.com",
        "name": "Existing User",
        "provider": "github",
        "provider_id": "github-789012",
        "picture": "https://github.com/photo.jpg"
    }
    
    response = await test_client.post("/api/v1/auth/oauth", json=oauth_data)
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    
    # Verify user OAuth info was updated
    db = get_database()
    user = await db.users.find_one({"email": oauth_data["email"]})
    assert user["oauth_provider"] == "github"
    assert user["oauth_provider_id"] == "github-789012"
    assert user["is_verified"] is True  # OAuth auto-verifies


@pytest.mark.asyncio
async def test_refresh_token_flow(test_client: AsyncClient):
    """Test refresh token generation and usage."""
    # Login to get tokens
    login_data = {
        "username": "test@example.com",
        "password": "testpassword123"
    }
    
    # First register the user
    await test_client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "name": "Test User",
        "password": "testpassword123"
    })
    
    # Verify email
    db = get_database()
    user = await db.users.find_one({"email": "test@example.com"})
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"is_verified": True}}
    )
    
    # Login
    response = await test_client.post("/api/v1/auth/login", data=login_data)
    assert response.status_code == 200
    tokens = response.json()
    
    assert "access_token" in tokens
    assert "refresh_token" in tokens
    assert "expires_in" in tokens
    
    # Use refresh token to get new access token
    refresh_response = await test_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]}
    )
    
    assert refresh_response.status_code == 200
    new_tokens = refresh_response.json()
    
    assert "access_token" in new_tokens
    assert "refresh_token" in new_tokens
    assert new_tokens["access_token"] != tokens["access_token"]  # New access token
    assert new_tokens["refresh_token"] != tokens["refresh_token"]  # Rotated refresh token


@pytest.mark.asyncio
async def test_invalid_refresh_token(test_client: AsyncClient):
    """Test invalid refresh token returns 401."""
    response = await test_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "invalid-token-12345"}
    )
    
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid refresh token"


@pytest.mark.asyncio
async def test_access_token_expiry(test_client: AsyncClient):
    """Test that access tokens have correct expiry."""
    # Login to get tokens
    login_data = {
        "username": "expiry.test@example.com",
        "password": "testpassword123"
    }
    
    # Register and verify user
    await test_client.post("/api/v1/auth/register", json={
        "email": "expiry.test@example.com",
        "name": "Expiry Test",
        "password": "testpassword123"
    })
    
    db = get_database()
    user = await db.users.find_one({"email": "expiry.test@example.com"})
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"is_verified": True}}
    )
    
    # Login
    response = await test_client.post("/api/v1/auth/login", data=login_data)
    tokens = response.json()
    
    # Decode access token to check expiry
    payload = jwt.decode(
        tokens["access_token"],
        settings.JWT_SECRET,
        algorithms=[settings.JWT_ALGORITHM]
    )
    
    exp_time = datetime.fromtimestamp(payload["exp"])
    now = datetime.utcnow()
    
    # Check expiry is approximately ACCESS_TOKEN_EXPIRE_MINUTES from now
    time_diff = (exp_time - now).total_seconds() / 60
    assert abs(time_diff - settings.ACCESS_TOKEN_EXPIRE_MINUTES) < 1  # Within 1 minute tolerance


@pytest.mark.asyncio
async def test_oauth_rate_limiting(test_client: AsyncClient):
    """Test OAuth endpoint respects rate limits."""
    oauth_data = {
        "email": "ratelimit@example.com",
        "name": "Rate Limit Test",
        "provider": "google",
        "provider_id": "google-rate-limit"
    }
    
    # Make multiple requests to trigger rate limit
    for i in range(6):  # AUTH_RATE_LIMITS["login"] is "5/minute"
        response = await test_client.post("/api/v1/auth/oauth", json=oauth_data)
        
        if i < 5:
            assert response.status_code == 200
        else:
            # 6th request should be rate limited
            assert response.status_code == 429  # Too Many Requests