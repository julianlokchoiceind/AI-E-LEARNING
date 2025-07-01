"""
Token Blacklist Service
Manages JWT token invalidation for secure logout
"""
from datetime import datetime, timedelta
from typing import Optional
import logging
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.core.database import get_database

logger = logging.getLogger(__name__)


class TokenBlacklistService:
    """Service for managing blacklisted JWT tokens"""
    
    def __init__(self):
        self.collection_name = "blacklisted_tokens"
        
    async def blacklist_token(self, token: str, user_id: str, expires_at: datetime) -> bool:
        """
        Add a token to the blacklist
        
        Args:
            token: JWT token to blacklist
            user_id: User ID who owns the token
            expires_at: When the token expires naturally
            
        Returns:
            bool: True if successfully blacklisted
        """
        try:
            db = get_database()
            
            # Create blacklist entry
            blacklist_doc = {
                "token": token,
                "user_id": user_id,
                "blacklisted_at": datetime.utcnow(),
                "expires_at": expires_at,
                "reason": "user_logout"
            }
            
            # Insert with upsert to handle duplicates
            await db[self.collection_name].update_one(
                {"token": token},
                {"$set": blacklist_doc},
                upsert=True
            )
            
            logger.info(f"Token blacklisted for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to blacklist token: {str(e)}")
            return False
    
    async def is_token_blacklisted(self, token: str) -> bool:
        """
        Check if a token is blacklisted
        
        Args:
            token: JWT token to check
            
        Returns:
            bool: True if token is blacklisted
        """
        try:
            db = get_database()
            
            # Check if token exists in blacklist
            blacklist_entry = await db[self.collection_name].find_one({
                "token": token,
                "expires_at": {"$gt": datetime.utcnow()}  # Only check non-expired tokens
            })
            
            return blacklist_entry is not None
            
        except Exception as e:
            logger.error(f"Error checking token blacklist: {str(e)}")
            # On error, assume token is valid to avoid blocking users
            return False
    
    async def cleanup_expired_tokens(self) -> int:
        """
        Remove expired tokens from blacklist to keep it clean
        
        Returns:
            int: Number of tokens removed
        """
        try:
            db = get_database()
            
            # Delete tokens that have naturally expired
            result = await db[self.collection_name].delete_many({
                "expires_at": {"$lt": datetime.utcnow()}
            })
            
            if result.deleted_count > 0:
                logger.info(f"Cleaned up {result.deleted_count} expired blacklisted tokens")
            
            return result.deleted_count
            
        except Exception as e:
            logger.error(f"Error cleaning up expired tokens: {str(e)}")
            return 0
    
    async def blacklist_all_user_tokens(self, user_id: str) -> bool:
        """
        Blacklist all tokens for a specific user (for security incidents)
        
        Args:
            user_id: User ID to blacklist all tokens for
            
        Returns:
            bool: True if successful
        """
        try:
            db = get_database()
            
            # Create a blanket blacklist entry for the user
            # This will be checked against user_id in tokens
            blanket_blacklist = {
                "user_id": user_id,
                "blacklisted_at": datetime.utcnow(),
                "expires_at": datetime.utcnow() + timedelta(days=30),  # 30 days future
                "reason": "security_incident",
                "all_tokens": True
            }
            
            await db[self.collection_name].insert_one(blanket_blacklist)
            
            logger.warning(f"All tokens blacklisted for user {user_id} due to security incident")
            return True
            
        except Exception as e:
            logger.error(f"Failed to blacklist all user tokens: {str(e)}")
            return False
    
    async def get_blacklist_stats(self) -> dict:
        """
        Get statistics about the token blacklist
        
        Returns:
            dict: Statistics about blacklisted tokens
        """
        try:
            db = get_database()
            
            total_blacklisted = await db[self.collection_name].count_documents({})
            active_blacklisted = await db[self.collection_name].count_documents({
                "expires_at": {"$gt": datetime.utcnow()}
            })
            expired_count = total_blacklisted - active_blacklisted
            
            return {
                "total_blacklisted": total_blacklisted,
                "active_blacklisted": active_blacklisted,
                "expired_count": expired_count
            }
            
        except Exception as e:
            logger.error(f"Error getting blacklist stats: {str(e)}")
            return {
                "total_blacklisted": 0,
                "active_blacklisted": 0,
                "expired_count": 0
            }


# Create singleton instance
token_blacklist_service = TokenBlacklistService()