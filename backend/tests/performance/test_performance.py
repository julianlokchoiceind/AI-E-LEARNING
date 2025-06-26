"""
Performance tests for optimized endpoints
"""

import asyncio
import time
from typing import List
import pytest
from httpx import AsyncClient
from app.main import app
from app.core.performance import performance_monitor


class TestPerformanceOptimizations:
    """Test suite for performance optimizations"""
    
    @pytest.mark.asyncio
    async def test_course_list_performance(self):
        """Test that course list endpoint performs within acceptable time"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            start_time = time.time()
            
            # Make request to course list endpoint
            response = await client.get("/api/v1/courses?per_page=50")
            
            end_time = time.time()
            execution_time = end_time - start_time
            
            # Should complete within 2 seconds
            assert execution_time < 2.0, f"Course list took {execution_time:.2f}s, expected < 2s"
            assert response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_batch_access_check_performance(self):
        """Test that batch access check is faster than individual checks"""
        from app.services.course_service import CourseService
        from app.models.course import Course
        
        # Get sample courses
        courses = await Course.find().limit(20).to_list()
        
        if len(courses) >= 10:
            # Time batch check
            start_time = time.time()
            batch_result = await CourseService.batch_check_course_access(courses, None)
            batch_time = time.time() - start_time
            
            # Time individual checks
            start_time = time.time()
            for course in courses:
                await CourseService.check_course_access(course, None)
            individual_time = time.time() - start_time
            
            # Batch should be at least 50% faster for 10+ courses
            assert batch_time < individual_time * 0.5, \
                f"Batch check ({batch_time:.2f}s) should be faster than individual ({individual_time:.2f}s)"
    
    @pytest.mark.asyncio
    async def test_performance_metrics_collection(self):
        """Test that performance metrics are being collected"""
        # Clear metrics
        performance_monitor.metrics.clear()
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Make some requests
            await client.get("/api/v1/courses")
            await client.get("/health")
        
        # Check metrics were collected
        metrics = performance_monitor.get_metrics()
        assert len(metrics) > 0, "No performance metrics collected"
        
        # Check for specific metrics
        api_metrics = [k for k in metrics.keys() if k.startswith("api.")]
        assert len(api_metrics) > 0, "No API metrics collected"
    
    @pytest.mark.asyncio
    async def test_database_indexes_exist(self):
        """Test that database indexes are created"""
        from app.core.database import db
        from app.services.db_optimization import db_optimizer
        
        if db:
            # Create indexes if not exist
            await db_optimizer.create_indexes()
            
            # Check some key indexes exist
            user_indexes = await db.users.list_indexes()
            user_index_names = [idx['name'] for idx in user_indexes]
            
            # Should have email index
            assert any('email' in name for name in user_index_names), \
                "Email index not found on users collection"
            
            # Check course indexes
            course_indexes = await db.courses.list_indexes()
            course_index_names = [idx['name'] for idx in course_indexes]
            
            # Should have creator_id index
            assert any('creator_id' in name for name in course_index_names), \
                "Creator ID index not found on courses collection"
    
    def test_performance_monitor_tracking(self):
        """Test performance monitor correctly tracks slow operations"""
        # Clear metrics
        performance_monitor.metrics.clear()
        
        # Track a fast operation
        performance_monitor.track_execution_time("test.fast", 0.5)
        
        # Track a slow operation
        performance_monitor.track_execution_time("test.slow", 3.0)
        
        metrics = performance_monitor.get_metrics()
        
        # Check fast operation
        assert metrics['test.fast']['slow_count'] == 0
        assert metrics['test.fast']['avg_time'] == 0.5
        
        # Check slow operation
        assert metrics['test.slow']['slow_count'] == 1
        assert metrics['test.slow']['avg_time'] == 3.0