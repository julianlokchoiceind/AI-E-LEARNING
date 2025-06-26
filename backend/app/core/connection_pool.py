"""
MongoDB connection pooling configuration
"""

from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import os


class ConnectionPool:
    """MongoDB connection pool manager"""
    
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
    
    async def connect(self, mongodb_uri: str, database_name: str = "ai_elearning"):
        """Create connection pool with optimized settings"""
        # Connection pool settings for better performance
        self.client = AsyncIOMotorClient(
            mongodb_uri,
            maxPoolSize=100,          # Maximum number of connections
            minPoolSize=10,           # Minimum number of connections
            maxIdleTimeMS=45000,      # Close idle connections after 45 seconds
            waitQueueTimeoutMS=5000,  # Wait max 5 seconds for a connection
            serverSelectionTimeoutMS=5000,  # Server selection timeout
            connectTimeoutMS=10000,   # Connection timeout
            socketTimeoutMS=30000,    # Socket timeout
            retryWrites=True,         # Retry failed writes
            retryReads=True,          # Retry failed reads
            maxStalenessSeconds=90,   # Max staleness for read preference
            compressors=['zstd', 'snappy', 'zlib'],  # Enable compression
        )
        
        self.db = self.client[database_name]
        return self.db
    
    async def close(self):
        """Close connection pool"""
        if self.client:
            self.client.close()
    
    async def ping(self):
        """Check connection health"""
        if self.client:
            await self.client.admin.command('ping')
            return True
        return False
    
    def get_pool_status(self):
        """Get connection pool statistics"""
        if not self.client:
            return None
        
        return {
            "max_pool_size": self.client.options.pool_options.max_pool_size,
            "min_pool_size": self.client.options.pool_options.min_pool_size,
            "nodes": [
                {
                    "address": node.address,
                    "pool_size": node.pool.size,
                    "in_use": node.pool.active_sockets,
                    "available": node.pool.available_sockets
                }
                for node in self.client.nodes
            ]
        }


# Global connection pool instance
connection_pool = ConnectionPool()