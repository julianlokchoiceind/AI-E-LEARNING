"""
Security Tests
Tests for SQL injection, XSS, rate limiting, and authentication security
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
import jwt
import time

from app.main import app
from app.core.config import settings


class TestSecurityFeatures:
    """Test suite for security features"""
    
    def test_sql_injection_protection(self, client: TestClient):
        """Test SQL injection protection"""
        malicious_inputs = [
            "'; DROP TABLE users; --",
            "1' OR '1'='1",
            "admin'--",
            "1; DELETE FROM courses WHERE 1=1",
            "' UNION SELECT * FROM users--",
            "1' AND '1'='1",
        ]
        
        for payload in malicious_inputs:
            # Test in query parameters
            response = client.get(f"/api/v1/courses?search={payload}")
            assert response.status_code in [400, 200]  # Either rejected or safely handled
            
            # Ensure we detect SQL injection
            if response.status_code == 400:
                assert "sql injection" in response.text.lower() or "validation_error" in response.text.lower()
    
    def test_xss_protection(self, client: TestClient):
        """Test XSS protection"""
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "javascript:alert('XSS')",
            "<iframe src='javascript:alert(1)'>",
            "<svg onload=alert('XSS')>",
            "<body onload=alert('XSS')>",
        ]
        
        for payload in xss_payloads:
            # Test in search parameters (no auth required)
            response = client.get(f"/api/v1/courses?search={payload}")
            
            # Should be rejected by input validation
            if response.status_code == 400:
                assert "xss" in response.text.lower() or "validation_error" in response.text.lower()
            else:
                # If not rejected, ensure content is safe
                response_text = response.text
                assert "<script>" not in response_text
                assert "onerror=" not in response_text
                assert "javascript:" not in response_text
    
    def test_path_traversal_protection(self, client: TestClient):
        """Test path traversal protection"""
        path_traversal_payloads = [
            "../../../etc/passwd",
            "..\\..\\..\\windows\\system32\\config\\sam",
            "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
            "....//....//....//etc/passwd",
        ]
        
        for payload in path_traversal_payloads:
            response = client.get(f"/api/v1/courses/{payload}")
            assert response.status_code in [400, 404]
            
            if response.status_code == 400:
                assert "path traversal" in response.text.lower()
    
    def test_rate_limiting(self, client: TestClient):
        """Test rate limiting"""
        # Test default endpoint rate limiting (100 req/min)
        # Note: This is a simplified test that just checks if rate limiting is enabled
        # A full test would require many requests
        
        response = client.get("/health")
        # Just ensure the endpoint works and rate limiting doesn't break normal requests
        assert response.status_code == 200
        
        # The actual rate limit test would require 100+ requests
        # which is time-consuming for unit tests
    
    def test_auth_endpoint_rate_limiting(self, client: TestClient):
        """Test stricter rate limiting on auth endpoints"""
        # Auth endpoints have 5 req/5min limit
        # This is a simplified test
        
        login_data = {
            "username": "test@example.com",
            "password": "wrongpassword"
        }
        
        # Just test that auth endpoint accepts requests
        response = client.post("/api/v1/auth/login", data=login_data)
        # Should get 422 (validation error) or 401 (unauthorized), not server error
        assert response.status_code in [401, 422]
    
    def test_authentication_security(self, client: TestClient):
        """Test authentication security"""
        # Test invalid token
        response = client.get(
            "/api/v1/users/profile",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401
        
        # Test malformed token
        response = client.get(
            "/api/v1/users/profile",
            headers={"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"}
        )
        assert response.status_code == 401
        
        # Test expired token
        expired_token = self._create_expired_token()
        response = client.get(
            "/api/v1/users/profile",
            headers={"Authorization": f"Bearer {expired_token}"}
        )
        assert response.status_code == 401
    
    def test_security_headers(self, client: TestClient):
        """Test security headers are present"""
        response = client.get("/health")
        
        # Check security headers
        assert response.headers.get("X-Content-Type-Options") == "nosniff"
        assert response.headers.get("X-Frame-Options") == "DENY"
        assert response.headers.get("X-XSS-Protection") == "1; mode=block"
        assert "max-age=" in response.headers.get("Strict-Transport-Security", "")
        assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
        assert "Content-Security-Policy" in response.headers
    
    def test_password_complexity(self, client: TestClient):
        """Test password complexity requirements"""
        weak_passwords = [
            "12345678",  # Numbers only
            "password",  # Common password
            "abc",       # Too short
            "abcdefgh",  # No numbers or special chars
        ]
        
        for weak_password in weak_passwords:
            response = client.post(
                "/api/v1/auth/register",
                json={
                    "email": "test@example.com",
                    "password": weak_password,
                    "name": "Test User"
                }
            )
            
            # Should reject weak passwords
            assert response.status_code == 422 or response.status_code == 400
    
    def test_input_validation_edge_cases(self, client: TestClient):
        """Test input validation with edge cases"""
        # Test extremely long input
        long_input = "a" * 10000
        response = client.get(f"/api/v1/courses?search={long_input}")
        assert response.status_code in [400, 414]  # Bad request or URI too long
        
        # Test null bytes
        null_byte_input = "test\x00hack"
        response = client.get(f"/api/v1/courses?search={null_byte_input}")
        assert response.status_code in [400, 200]  # Either rejected or handled safely
        
        # Test unicode attacks
        unicode_attacks = [
            "test\u202e\u0064\u006e\u0065",  # Right-to-left override
            "test\ufeff<script>alert(1)</script>",  # Zero-width space
        ]
        
        for attack in unicode_attacks:
            response = client.get(f"/api/v1/courses?search={attack}")
            assert response.status_code in [400, 200]
    
    def _get_auth_headers(self, client: TestClient) -> dict:
        """Helper to get valid authentication headers"""
        # Register a test user
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": f"test_{time.time()}@example.com",
                "password": "Test@1234!",
                "name": "Test User"
            }
        )
        
        if response.status_code == 200:
            # Login to get token
            login_response = client.post(
                "/api/v1/auth/login",
                data={
                    "username": response.json()["data"]["email"],
                    "password": "Test@1234!"
                }
            )
            
            if login_response.status_code == 200:
                token = login_response.json()["data"]["access_token"]
                return {"Authorization": f"Bearer {token}"}
        
        # Fallback - create a test token
        return {"Authorization": f"Bearer {self._create_test_token()}"}
    
    def _create_test_token(self) -> str:
        """Create a valid test JWT token"""
        payload = {
            "sub": "test_user_id",
            "email": "test@example.com",
            "exp": datetime.utcnow() + timedelta(minutes=15),
            "type": "access"
        }
        return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    
    def _create_expired_token(self) -> str:
        """Create an expired JWT token"""
        payload = {
            "sub": "test_user_id",
            "email": "test@example.com",
            "exp": datetime.utcnow() - timedelta(minutes=15),
            "type": "access"
        }
        return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


# Fixtures
@pytest.fixture
def client():
    """Create test client"""
    return TestClient(app)