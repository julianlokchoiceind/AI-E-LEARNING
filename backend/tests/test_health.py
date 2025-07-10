"""
Basic health check tests for CI/CD pipeline.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    """Test health check endpoint returns 200."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "service" in data


def test_root_endpoint():
    """Test root endpoint returns welcome message."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "AI E-Learning Platform" in data["message"]
    assert "version" in data


def test_docs_endpoint():
    """Test docs endpoint is accessible."""
    response = client.get("/api/v1/docs")
    assert response.status_code == 200
    # Should return HTML page
    assert "text/html" in response.headers.get("content-type", "")


def test_openapi_json():
    """Test OpenAPI JSON is available."""
    response = client.get("/api/v1/openapi.json")
    assert response.status_code == 200
    # Should return JSON
    assert response.headers.get("content-type") == "application/json"
    data = response.json()
    assert "openapi" in data
    assert "info" in data