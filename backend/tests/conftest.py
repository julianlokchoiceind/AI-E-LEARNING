"""
Test configuration and fixtures for the AI E-Learning Platform.
"""
import asyncio
import pytest
import pytest_asyncio
from typing import AsyncGenerator
from httpx import AsyncClient
from fastapi.testclient import TestClient
from motor.motor_asyncio import AsyncIOMotorClient
import os

from app.main import app
from app.core.config import settings
from app.core.database import db


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_db():
    """Create a test database."""
    # Use a separate test database
    test_db_name = "ai-elearning-test"
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    test_database = client[test_db_name]
    
    # Setup
    db.database = test_database
    yield test_database
    
    # Cleanup - drop test database
    await client.drop_database(test_db_name)
    client.close()


@pytest_asyncio.fixture
async def client(test_db) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def test_client() -> TestClient:
    """Create a synchronous test client for simple tests."""
    return TestClient(app)


@pytest_asyncio.fixture
async def test_user_data():
    """Sample user data for testing."""
    return {
        "email": "test@example.com",
        "name": "Test User",
        "password": "testpassword123"
    }


@pytest_asyncio.fixture
async def test_course_data():
    """Sample course data for testing."""
    return {
        "title": "Test Course",
        "description": "A test course for unit testing",
        "category": "programming",
        "level": "beginner",
        "pricing": {
            "is_free": True,
            "price": 0
        }
    }


@pytest_asyncio.fixture
async def clean_db(test_db):
    """Clean the test database before and after each test."""
    # Clean before
    collections = await test_db.list_collection_names()
    for collection in collections:
        await test_db[collection].delete_many({})
    
    yield
    
    # Clean after
    collections = await test_db.list_collection_names()
    for collection in collections:
        await test_db[collection].delete_many({})


@pytest.fixture
def mock_email_service(monkeypatch):
    """Mock email service for testing."""
    async def mock_send_email(*args, **kwargs):
        return {"status": "sent", "message": "Mock email sent"}
    
    monkeypatch.setattr("app.services.email_service.send_email", mock_send_email)
    return mock_send_email