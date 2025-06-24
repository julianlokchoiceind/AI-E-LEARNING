"""
Comprehensive unit tests for authentication system.
"""
import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta
import secrets

from app.core.database import get_database
from app.main import app
from app.api.v1.endpoints.auth import get_password_hash, verify_password


@pytest.mark.asyncio
async def test_user_registration_validation(test_client: AsyncClient):
    """Test user registration with various validation scenarios."""
    # Test with invalid email
    response = await test_client.post("/api/v1/auth/register", json={
        "email": "invalid-email",
        "name": "Test User",
        "password": "testpass123"
    })
    assert response.status_code == 422  # Validation error
    
    # Test with short password
    response = await test_client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "name": "Test User",
        "password": "short"
    })
    assert response.status_code == 422
    
    # Test with empty name
    response = await test_client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "name": "",
        "password": "testpass123"
    })
    assert response.status_code == 422
    
    # Test with valid data
    response = await test_client.post("/api/v1/auth/register", json={
        "email": "valid@example.com",
        "name": "Valid User",
        "password": "validpass123"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "valid@example.com"
    assert data["is_verified"] is False


@pytest.mark.asyncio
async def test_duplicate_email_registration(test_client: AsyncClient):
    """Test that duplicate email registration is prevented."""
    user_data = {
        "email": "duplicate@example.com",
        "name": "First User",
        "password": "testpass123"
    }
    
    # First registration should succeed
    response = await test_client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 201
    
    # Second registration with same email should fail
    user_data["name"] = "Second User"
    response = await test_client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_unverified_user(test_client: AsyncClient):
    """Test that unverified users cannot login."""
    # Register user
    await test_client.post("/api/v1/auth/register", json={
        "email": "unverified@example.com",
        "name": "Unverified User",
        "password": "testpass123"
    })
    
    # Try to login
    response = await test_client.post("/api/v1/auth/login", data={
        "username": "unverified@example.com",
        "password": "testpass123"
    })
    
    assert response.status_code == 403
    assert "verify your email" in response.json()["detail"]


@pytest.mark.asyncio
async def test_email_verification_flow(test_client: AsyncClient):
    """Test complete email verification flow."""
    # Register user
    response = await test_client.post("/api/v1/auth/register", json={
        "email": "verify@example.com",
        "name": "Verify User",
        "password": "testpass123"
    })
    assert response.status_code == 201
    
    # Get verification token from database
    db = get_database()
    user = await db.users.find_one({"email": "verify@example.com"})
    assert user["verification_token"] is not None
    
    # Verify email with token
    response = await test_client.get(
        f"/api/v1/auth/verify-email?token={user['verification_token']}"
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Email verified successfully"
    
    # Check user is now verified
    user = await db.users.find_one({"email": "verify@example.com"})
    assert user["is_verified"] is True
    assert user["verification_token"] is None
    
    # Now user can login
    response = await test_client.post("/api/v1/auth/login", data={
        "username": "verify@example.com",
        "password": "testpass123"
    })
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_invalid_verification_token(test_client: AsyncClient):
    """Test email verification with invalid token."""
    response = await test_client.get(
        "/api/v1/auth/verify-email?token=invalid-token-123"
    )
    assert response.status_code == 404
    assert "Invalid verification token" in response.json()["detail"]


@pytest.mark.asyncio
async def test_password_reset_flow(test_client: AsyncClient):
    """Test complete password reset flow."""
    # Register and verify user
    await test_client.post("/api/v1/auth/register", json={
        "email": "reset@example.com",
        "name": "Reset User",
        "password": "oldpassword123"
    })
    
    db = get_database()
    await db.users.update_one(
        {"email": "reset@example.com"},
        {"$set": {"is_verified": True}}
    )
    
    # Request password reset
    response = await test_client.post("/api/v1/auth/forgot-password", json={
        "email": "reset@example.com"
    })
    assert response.status_code == 200
    
    # Get reset token from database
    user = await db.users.find_one({"email": "reset@example.com"})
    reset_token = user["reset_password_token"]
    assert reset_token is not None
    
    # Reset password with token
    response = await test_client.post("/api/v1/auth/reset-password", json={
        "token": reset_token,
        "new_password": "newpassword123"
    })
    assert response.status_code == 200
    assert response.json()["message"] == "Password reset successfully"
    
    # Verify old password no longer works
    response = await test_client.post("/api/v1/auth/login", data={
        "username": "reset@example.com",
        "password": "oldpassword123"
    })
    assert response.status_code == 401
    
    # Verify new password works
    response = await test_client.post("/api/v1/auth/login", data={
        "username": "reset@example.com",
        "password": "newpassword123"
    })
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_expired_reset_token(test_client: AsyncClient):
    """Test that expired reset tokens are rejected."""
    db = get_database()
    
    # Create user with expired reset token
    user_doc = {
        "email": "expired@example.com",
        "name": "Expired User",
        "password": get_password_hash("testpass123"),
        "role": "student",
        "premium_status": False,
        "is_verified": True,
        "reset_password_token": secrets.token_urlsafe(32),
        "reset_password_expires": datetime.utcnow() - timedelta(hours=2),  # Expired
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    await db.users.insert_one(user_doc)
    
    # Try to reset with expired token
    response = await test_client.post("/api/v1/auth/reset-password", json={
        "token": user_doc["reset_password_token"],
        "new_password": "newpassword123"
    })
    assert response.status_code == 404
    assert "Invalid or expired" in response.json()["detail"]


@pytest.mark.asyncio
async def test_resend_verification_email(test_client: AsyncClient):
    """Test resending verification email."""
    # Register user
    await test_client.post("/api/v1/auth/register", json={
        "email": "resend@example.com",
        "name": "Resend User",
        "password": "testpass123"
    })
    
    # Request resend
    response = await test_client.post("/api/v1/auth/resend-verification", json={
        "email": "resend@example.com"
    })
    assert response.status_code == 200
    assert "Verification email sent successfully" in response.json()["message"]
    
    # Check new token was generated
    db = get_database()
    user = await db.users.find_one({"email": "resend@example.com"})
    assert user["verification_token"] is not None


@pytest.mark.asyncio
async def test_resend_verification_already_verified(test_client: AsyncClient):
    """Test that verified users cannot request verification resend."""
    # Create verified user
    db = get_database()
    await db.users.insert_one({
        "email": "already.verified@example.com",
        "name": "Verified User",
        "password": get_password_hash("testpass123"),
        "role": "student",
        "premium_status": False,
        "is_verified": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    
    # Try to resend verification
    response = await test_client.post("/api/v1/auth/resend-verification", json={
        "email": "already.verified@example.com"
    })
    assert response.status_code == 400
    assert "Email already verified" in response.json()["detail"]


@pytest.mark.asyncio
async def test_password_hashing(test_client: AsyncClient):
    """Test password hashing and verification functions."""
    password = "mysecretpassword123"
    
    # Test hashing
    hashed = get_password_hash(password)
    assert hashed != password
    assert len(hashed) > 50  # bcrypt hashes are long
    
    # Test verification
    assert verify_password(password, hashed) is True
    assert verify_password("wrongpassword", hashed) is False
    
    # Test that same password produces different hashes (due to salt)
    hashed2 = get_password_hash(password)
    assert hashed != hashed2
    assert verify_password(password, hashed2) is True


@pytest.mark.asyncio
async def test_rate_limiting_per_endpoint(test_client: AsyncClient):
    """Test that rate limits are applied per endpoint."""
    # Test register endpoint (3/minute)
    for i in range(4):
        response = await test_client.post("/api/v1/auth/register", json={
            "email": f"ratelimit{i}@example.com",
            "name": f"User {i}",
            "password": "testpass123"
        })
        
        if i < 3:
            assert response.status_code in [201, 400]  # Success or duplicate
        else:
            assert response.status_code == 429  # Rate limited
    
    # Login endpoint should still work (different limit)
    response = await test_client.post("/api/v1/auth/login", data={
        "username": "test@example.com",
        "password": "testpass123"
    })
    assert response.status_code in [200, 401, 403]  # Not rate limited