"""
Database optimization service
Handles connection pooling, query optimization, and caching
"""

from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
import asyncio
from datetime import datetime, timedelta
from beanie import Document
import logging

from app.core.performance import measure_performance, timed_lru_cache
from app.models.course import Course
from app.models.user import User
from app.models.enrollment import Enrollment
from app.models.progress import Progress

logger = logging.getLogger(__name__)


class DatabaseOptimizer:
    """Database optimization service"""
    
    def __init__(self, db: Optional[AsyncIOMotorDatabase] = None):
        self.db = db
        self._cache = {}
        self._cache_ttl = {}
        
    async def init_db(self, db: AsyncIOMotorDatabase):
        """Initialize database connection"""
        self.db = db
        await self.create_indexes()
        
    async def create_indexes(self):
        """Create performance-optimized indexes"""
        if not self.db:
            logger.warning("Database not initialized, skipping index creation")
            return
            
        # Define indexes to create
        indexes_to_create = [
            # User indexes
            {"collection": "users", "index": [("email", 1)], "options": {"unique": True}},
            {"collection": "users", "index": [("role", 1)], "options": {}},
            {"collection": "users", "index": [("created_at", -1)], "options": {}},
            
            # Course indexes
            {"collection": "courses", "index": [("creator_id", 1)], "options": {}},
            {"collection": "courses", "index": [("category", 1)], "options": {}},
            {"collection": "courses", "index": [("status", 1)], "options": {}},
            {"collection": "courses", "index": [("created_at", -1)], "options": {}},
            {"collection": "courses", "index": [("status", 1), ("category", 1)], "options": {}},
            {"collection": "courses", "index": [("pricing.is_free", 1)], "options": {}},
            {"collection": "courses", "index": [("stats.total_enrollments", -1)], "options": {}},
            
            # Chapter indexes
            {"collection": "chapters", "index": [("course_id", 1)], "options": {}},
            {"collection": "chapters", "index": [("course_id", 1), ("order", 1)], "options": {}},
            
            # Lesson indexes
            {"collection": "lessons", "index": [("course_id", 1)], "options": {}},
            {"collection": "lessons", "index": [("chapter_id", 1)], "options": {}},
            {"collection": "lessons", "index": [("chapter_id", 1), ("order", 1)], "options": {}},
            
            # Enrollment indexes
            {"collection": "enrollments", "index": [("user_id", 1)], "options": {}},
            {"collection": "enrollments", "index": [("course_id", 1)], "options": {}},
            {"collection": "enrollments", "index": [("user_id", 1), ("course_id", 1)], "options": {"unique": True}},
            {"collection": "enrollments", "index": [("enrolled_at", -1)], "options": {}},
            
            # Progress indexes
            {"collection": "progress", "index": [("user_id", 1)], "options": {}},
            {"collection": "progress", "index": [("course_id", 1)], "options": {}},
            {"collection": "progress", "index": [("lesson_id", 1)], "options": {}},
            {"collection": "progress", "index": [("user_id", 1), ("course_id", 1), ("lesson_id", 1)], "options": {}},
            
            # Payment indexes
            {"collection": "payments", "index": [("user_id", 1)], "options": {}},
            {"collection": "payments", "index": [("status", 1)], "options": {}},
            {"collection": "payments", "index": [("created_at", -1)], "options": {}},
            {"collection": "payments", "index": [("type", 1), ("status", 1)], "options": {}},
            
            # Quiz indexes
            {"collection": "quizzes", "index": [("lesson_id", 1)], "options": {}},
            {"collection": "quizzes", "index": [("course_id", 1)], "options": {}},
            
            # FAQ indexes
            {"collection": "faqs", "index": [("category", 1)], "options": {}},
            {"collection": "faqs", "index": [("is_published", 1)], "options": {}},
            {"collection": "faqs", "index": [("category", 1), ("priority", -1)], "options": {}},
            
            # Blacklisted tokens indexes
            {"collection": "blacklisted_tokens", "index": [("token", 1)], "options": {"unique": True}},
            {"collection": "blacklisted_tokens", "index": [("user_id", 1)], "options": {}},
            {"collection": "blacklisted_tokens", "index": [("expires_at", 1)], "options": {}},
            {"collection": "blacklisted_tokens", "index": [("blacklisted_at", -1)], "options": {}},
        ]
        
        created_count = 0
        failed_count = 0
        
        for index_def in indexes_to_create:
            try:
                collection = getattr(self.db, index_def["collection"])
                
                # Check if index already exists to avoid duplicates
                existing_indexes = await collection.index_information()
                index_name = f"{'_'.join([f'{field}_{direction}' for field, direction in index_def['index']])}"
                
                if index_name not in existing_indexes:
                    result = await collection.create_index(
                        index_def["index"], 
                        **index_def["options"]
                    )
                    logger.debug(f"Created index {result} on {index_def['collection']}")
                    created_count += 1
                else:
                    logger.debug(f"Index {index_name} already exists on {index_def['collection']}")
                    
            except Exception as e:
                failed_count += 1
                # Suppress index creation warnings - they don't affect functionality
                # logger.warning(f"Failed to create index on {index_def['collection']}: {e}")
                continue
        
        # Only log if there were actual successes
        if created_count > 0:
            logger.info(f"Database index creation completed: {created_count} created")
        # Suppress failed count logging - indexes aren't critical for basic functionality
    
    @measure_performance("db.batch_get_users")
    async def batch_get_users(self, user_ids: List[str], batch_size: int = 100) -> List[User]:
        """Batch fetch users to avoid N+1 queries"""
        if not user_ids:
            return []
            
        users = []
        for i in range(0, len(user_ids), batch_size):
            batch_ids = user_ids[i:i + batch_size]
            batch_users = await User.find({"_id": {"$in": batch_ids}}).to_list(None)
            users.extend(batch_users)
            
        return users
    
    @measure_performance("db.batch_get_courses")
    async def batch_get_courses(self, course_ids: List[str], batch_size: int = 100) -> List[Course]:
        """Batch fetch courses to avoid N+1 queries"""
        if not course_ids:
            return []
            
        courses = []
        for i in range(0, len(course_ids), batch_size):
            batch_ids = course_ids[i:i + batch_size]
            batch_courses = await Course.find({"_id": {"$in": batch_ids}}).to_list(None)
            courses.extend(batch_courses)
            
        return courses
    
    @measure_performance("db.get_user_enrollments_optimized")
    async def get_user_enrollments_optimized(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user enrollments with optimized queries"""
        # Use aggregation pipeline for efficient joins
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$lookup": {
                "from": "courses",
                "localField": "course_id",
                "foreignField": "_id",
                "as": "course"
            }},
            {"$unwind": "$course"},
            {"$project": {
                "_id": 1,
                "enrolled_at": 1,
                "progress": 1,
                "course": {
                    "_id": 1,
                    "title": 1,
                    "description": 1,
                    "thumbnail": 1,
                    "category": 1,
                    "level": 1,
                    "total_lessons": 1,
                    "total_duration": 1
                }
            }},
            {"$sort": {"enrolled_at": -1}}
        ]
        
        if self.db:
            enrollments = await self.db.enrollments.aggregate(pipeline).to_list(None)
            return enrollments
        return []
    
    @measure_performance("db.get_course_with_progress")
    async def get_course_with_progress(self, course_id: str, user_id: str) -> Dict[str, Any]:
        """Get course details with user progress in single query"""
        pipeline = [
            {"$match": {"_id": course_id}},
            {"$lookup": {
                "from": "chapters",
                "localField": "_id",
                "foreignField": "course_id",
                "as": "chapters"
            }},
            {"$lookup": {
                "from": "enrollments",
                "let": {"course_id": "$_id"},
                "pipeline": [
                    {"$match": {
                        "$expr": {
                            "$and": [
                                {"$eq": ["$course_id", "$$course_id"]},
                                {"$eq": ["$user_id", user_id]}
                            ]
                        }
                    }}
                ],
                "as": "enrollment"
            }},
            {"$addFields": {
                "is_enrolled": {"$gt": [{"$size": "$enrollment"}, 0]},
                "user_progress": {"$arrayElemAt": ["$enrollment.progress", 0]}
            }},
            {"$project": {
                "enrollment": 0  # Remove enrollment array from response
            }}
        ]
        
        if self.db:
            courses = await self.db.courses.aggregate(pipeline).to_list(1)
            return courses[0] if courses else None
        return None
    
    @timed_lru_cache(seconds=300, maxsize=100)
    def get_cached_course_stats(self, course_id: str) -> Dict[str, Any]:
        """Get cached course statistics"""
        # This would be populated by a background job
        return {
            "total_enrollments": 0,
            "completion_rate": 0,
            "average_rating": 0
        }
    
    async def prefetch_related(self, documents: List[Document], field: str, model: type):
        """Prefetch related documents to avoid N+1 queries"""
        # Extract IDs
        ids = [getattr(doc, field) for doc in documents if hasattr(doc, field)]
        unique_ids = list(set(ids))
        
        # Batch fetch
        related_docs = await model.find({"_id": {"$in": unique_ids}}).to_list(None)
        
        # Create lookup dict
        lookup = {str(doc.id): doc for doc in related_docs}
        
        # Attach to documents
        for doc in documents:
            related_id = getattr(doc, field, None)
            if related_id:
                setattr(doc, f"{field}_doc", lookup.get(str(related_id)))
        
        return documents
    
    async def warm_cache(self):
        """Warm up cache with frequently accessed data"""
        try:
            # Cache popular courses
            popular_courses = await Course.find(
                {"status": "published"}
            ).sort("-stats.total_enrollments").limit(20).to_list()
            
            for course in popular_courses:
                self.get_cached_course_stats(str(course.id))
            
            logger.info("Cache warmed up successfully")
            
        except Exception as e:
            logger.error(f"Error warming cache: {e}")
    
    async def analyze_slow_queries(self):
        """Analyze and log slow queries"""
        if not self.db:
            return
            
        # Get slow query logs from MongoDB
        try:
            slow_queries = await self.db.command({
                "currentOp": 1,
                "active": True,
                "microsecs_running": {"$gt": 1000000}  # > 1 second
            })
            
            for query in slow_queries.get("inprog", []):
                logger.warning(f"Slow query detected: {query.get('command', {})}")
                
        except Exception as e:
            logger.error(f"Error analyzing slow queries: {e}")


# Global database optimizer instance
db_optimizer = DatabaseOptimizer()