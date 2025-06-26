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
        db.client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            maxPoolSize=10,
            minPoolSize=10
        )
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
                SupportTicket,
                TicketMessage,
                Review,
                ReviewVote,
                ReviewReport,
                Certificate
            ]
        )
        
        logger.info("Successfully connected to MongoDB")
        
    except Exception as e:
        logger.error(f"Could not connect to MongoDB: {e}")
        raise


async def close_mongo_connection():
    """Close database connection."""
    if db.client:
        db.client.close()
        logger.info("Disconnected from MongoDB")


def get_database() -> AsyncIOMotorDatabase:
    """Get database instance."""
    if db.database is None:
        raise RuntimeError("Database is not initialized")
    return db.database