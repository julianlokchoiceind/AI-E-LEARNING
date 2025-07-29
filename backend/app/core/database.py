"""
MongoDB database connection and configuration.
Uses Motor async driver with Beanie ODM.
"""
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from beanie import init_beanie
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class MongoDB:
    client: Optional[AsyncIOMotorClient] = None
    database: Optional[AsyncIOMotorDatabase] = None


db = MongoDB()


async def connect_to_mongo():
    """Create database connection."""
    try:
        # Attempting to connect to MongoDB...
        
        # Thêm server selection timeout và các options khác
        db.client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            maxPoolSize=10,
            minPoolSize=10,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=10000,
            retryWrites=True,
            w='majority'
        )
        
        # Test connection trước
        await db.client.admin.command('ping')
        # MongoDB ping successful
        
        # Use "ai-elearning" as the database name
        db.database = db.client["ai-elearning"]
        
        # Import models here to avoid circular imports
        from app.models.user import User
        from app.models.course import Course
        from app.models.chapter import Chapter
        from app.models.lesson import Lesson
        from app.models.progress import Progress
        from app.models.quiz import Quiz, QuizProgress
        from app.models.enrollment import Enrollment
        from app.models.payment import Payment
        from app.models.faq import FAQ
        from app.models.faq_category import FAQCategory
        from app.models.support_ticket import SupportTicket, TicketMessage
        from app.models.review import Review, ReviewVote, ReviewReport
        from app.models.certificate import Certificate
        
        # Initialize Beanie with all document models
        await init_beanie(
            database=db.database,
            document_models=[
                User,
                Course,
                Chapter,
                Lesson,
                Progress,
                Quiz,
                QuizProgress,
                Enrollment,
                Payment,
                FAQ,
                FAQCategory,
                SupportTicket,
                TicketMessage,
                Review,
                ReviewVote,
                ReviewReport,
                Certificate
            ]
        )
        
        # Successfully connected to MongoDB
        logger.info(f"✅ Successfully connected to MongoDB at {settings.MONGODB_URI.split('@')[1]}")
        
        # Count collections
        collections = await db.database.list_collection_names()
        logger.info(f"📁 Database ready with {len(collections)} collections")
        
        return db.client
        
    except Exception as e:
        logger.error(f"Could not connect to MongoDB: {e}")
        raise


async def close_mongo_connection():
    """Close database connection."""
    if db.client:
        db.client.close()
        # Disconnected from MongoDB


def get_database() -> AsyncIOMotorDatabase:
    """Get database instance."""
    if db.database is None:
        raise RuntimeError("Database is not initialized")
    return db.database