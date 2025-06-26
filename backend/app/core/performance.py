"""
Performance optimization utilities
"""

from functools import lru_cache, wraps
from typing import Callable, Any, Optional
import time
import asyncio
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class PerformanceMonitor:
    """Monitor and log performance metrics"""
    
    def __init__(self):
        self.metrics = {}
        self.slow_query_threshold = 1.0  # 1 second
        self.slow_api_threshold = 2.0    # 2 seconds
    
    def track_execution_time(self, name: str, execution_time: float):
        """Track execution time for a specific operation"""
        if name not in self.metrics:
            self.metrics[name] = {
                'count': 0,
                'total_time': 0,
                'min_time': float('inf'),
                'max_time': 0,
                'slow_count': 0
            }
        
        metric = self.metrics[name]
        metric['count'] += 1
        metric['total_time'] += execution_time
        metric['min_time'] = min(metric['min_time'], execution_time)
        metric['max_time'] = max(metric['max_time'], execution_time)
        
        # Check if slow
        threshold = self.slow_query_threshold if 'query' in name.lower() else self.slow_api_threshold
        if execution_time > threshold:
            metric['slow_count'] += 1
            logger.warning(f"Slow operation detected: {name} took {execution_time:.2f}s")
    
    def get_metrics(self):
        """Get performance metrics summary"""
        summary = {}
        for name, metric in self.metrics.items():
            if metric['count'] > 0:
                summary[name] = {
                    'count': metric['count'],
                    'avg_time': metric['total_time'] / metric['count'],
                    'min_time': metric['min_time'],
                    'max_time': metric['max_time'],
                    'slow_count': metric['slow_count'],
                    'slow_percentage': (metric['slow_count'] / metric['count']) * 100
                }
        return summary


# Global performance monitor instance
performance_monitor = PerformanceMonitor()


def measure_performance(name: Optional[str] = None):
    """Decorator to measure function execution time"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                return result
            finally:
                execution_time = time.time() - start_time
                func_name = name or f"{func.__module__}.{func.__name__}"
                performance_monitor.track_execution_time(func_name, execution_time)
                
                if execution_time > 1.0:  # Log slow operations
                    logger.info(f"{func_name} took {execution_time:.2f}s")
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                execution_time = time.time() - start_time
                func_name = name or f"{func.__module__}.{func.__name__}"
                performance_monitor.track_execution_time(func_name, execution_time)
                
                if execution_time > 1.0:  # Log slow operations
                    logger.info(f"{func_name} took {execution_time:.2f}s")
        
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    return decorator


def timed_lru_cache(seconds: int = 300, maxsize: int = 128):
    """LRU cache with time-based expiration"""
    def decorator(func):
        func = lru_cache(maxsize=maxsize)(func)
        func.cache_time = {}
        
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Create cache key
            key = str(args) + str(kwargs)
            
            # Check if cache is expired
            if key in func.cache_time:
                if datetime.now() - func.cache_time[key] > timedelta(seconds=seconds):
                    # Cache expired, clear it
                    func.cache_clear()
                    func.cache_time.clear()
            
            # Get result
            result = func(*args, **kwargs)
            func.cache_time[key] = datetime.now()
            
            return result
        
        wrapper.cache_clear = func.cache_clear
        wrapper.cache_info = func.cache_info
        
        return wrapper
    return decorator


class QueryOptimizer:
    """Database query optimization utilities"""
    
    @staticmethod
    async def batch_fetch(model, ids: list, batch_size: int = 100):
        """Fetch multiple documents in batches to avoid N+1 queries"""
        results = []
        for i in range(0, len(ids), batch_size):
            batch_ids = ids[i:i + batch_size]
            batch_results = await model.find({"_id": {"$in": batch_ids}}).to_list(None)
            results.extend(batch_results)
        return results
    
    @staticmethod
    def create_indexes(db):
        """Create database indexes for performance"""
        indexes = {
            'users': [
                ('email', 1),
                ('role', 1),
                ('created_at', -1)
            ],
            'courses': [
                ('creator_id', 1),
                ('category', 1),
                ('status', 1),
                ('created_at', -1),
                [('status', 1), ('category', 1)],  # Compound index
                [('creator_id', 1), ('status', 1)]
            ],
            'enrollments': [
                ('user_id', 1),
                ('course_id', 1),
                [('user_id', 1), ('course_id', 1)],  # Unique compound
                ('enrolled_at', -1)
            ],
            'progress': [
                ('user_id', 1),
                ('course_id', 1),
                ('lesson_id', 1),
                [('user_id', 1), ('course_id', 1), ('lesson_id', 1)]
            ],
            'payments': [
                ('user_id', 1),
                ('status', 1),
                ('created_at', -1),
                [('user_id', 1), ('status', 1)]
            ]
        }
        
        for collection_name, index_list in indexes.items():
            collection = db[collection_name]
            for index in index_list:
                if isinstance(index, tuple):
                    collection.create_index([(index[0], index[1])])
                else:
                    # Compound index
                    collection.create_index(index)
        
        logger.info("Database indexes created for performance optimization")


class ConnectionPool:
    """Manage database connection pooling"""
    
    def __init__(self, max_connections: int = 100):
        self.max_connections = max_connections
        self.connections = []
        self.available = asyncio.Queue(maxsize=max_connections)
        
    async def get_connection(self):
        """Get a connection from the pool"""
        return await self.available.get()
    
    async def return_connection(self, conn):
        """Return a connection to the pool"""
        await self.available.put(conn)
    
    async def close_all(self):
        """Close all connections in the pool"""
        while not self.available.empty():
            conn = await self.available.get()
            await conn.close()


# Response caching for frequently accessed data
class ResponseCache:
    """Cache API responses for performance"""
    
    def __init__(self):
        self.cache = {}
        self.ttl = {}
    
    def get(self, key: str) -> Optional[Any]:
        """Get cached response"""
        if key in self.cache:
            if datetime.now() < self.ttl[key]:
                return self.cache[key]
            else:
                # Expired
                del self.cache[key]
                del self.ttl[key]
        return None
    
    def set(self, key: str, value: Any, ttl_seconds: int = 300):
        """Set cached response with TTL"""
        self.cache[key] = value
        self.ttl[key] = datetime.now() + timedelta(seconds=ttl_seconds)
    
    def clear(self):
        """Clear all cache"""
        self.cache.clear()
        self.ttl.clear()


# Global response cache instance
response_cache = ResponseCache()


def cache_response(ttl_seconds: int = 300):
    """Decorator to cache API responses"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Check cache
            cached = response_cache.get(cache_key)
            if cached is not None:
                return cached
            
            # Get fresh result
            result = await func(*args, **kwargs)
            
            # Cache result
            response_cache.set(cache_key, result, ttl_seconds)
            
            return result
        
        return wrapper
    return decorator