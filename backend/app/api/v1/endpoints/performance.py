"""
Performance monitoring endpoints for admin users
"""

from fastapi import APIRouter, Depends, Query
from typing import Dict, Any
from datetime import datetime

from app.core.deps import get_admin_user
from app.core.performance import performance_monitor
from app.services.db_optimization import db_optimizer
from app.schemas.base import StandardResponse
from app.models.user import User

router = APIRouter()


@router.get("/metrics", response_model=StandardResponse[Dict[str, Any]])
async def get_performance_metrics(
    current_user: User = Depends(get_admin_user)
) -> StandardResponse[Dict[str, Any]]:
    """
    Get performance metrics for the application (admin only)
    
    Returns:
    - API endpoint performance metrics
    - Database query performance
    - Slow operation counts
    """
    metrics = performance_monitor.get_metrics()
    
    # Categorize metrics
    api_metrics = {k: v for k, v in metrics.items() if k.startswith("api.")}
    db_metrics = {k: v for k, v in metrics.items() if k.startswith("db.") or k.startswith("course.")}
    other_metrics = {k: v for k, v in metrics.items() if not k.startswith("api.") and not k.startswith("db.") and not k.startswith("course.")}
    
    # Calculate summary statistics
    total_requests = sum(m.get("count", 0) for m in api_metrics.values())
    slow_api_calls = sum(m.get("slow_count", 0) for m in api_metrics.values())
    slow_db_queries = sum(m.get("slow_count", 0) for m in db_metrics.values())
    
    return StandardResponse(
        success=True,
        message="Performance metrics retrieved successfully",
        data={
            "summary": {
                "total_api_requests": total_requests,
                "slow_api_calls": slow_api_calls,
                "slow_db_queries": slow_db_queries,
                "timestamp": datetime.utcnow().isoformat()
            },
            "api_metrics": api_metrics,
            "database_metrics": db_metrics,
            "other_metrics": other_metrics
        }
    )


@router.post("/optimize/indexes", response_model=StandardResponse[Dict[str, str]])
async def optimize_database_indexes(
    current_user: User = Depends(get_admin_user)
) -> StandardResponse[Dict[str, str]]:
    """
    Create/recreate database indexes for performance optimization (admin only)
    """
    await db_optimizer.create_indexes()
    
    return StandardResponse(
        success=True,
        message="Database indexes optimized successfully",
        data={
            "status": "completed",
            "timestamp": datetime.utcnow().isoformat()
        }
    )


@router.post("/cache/warm", response_model=StandardResponse[Dict[str, str]])
async def warm_cache(
    current_user: User = Depends(get_admin_user)
) -> StandardResponse[Dict[str, str]]:
    """
    Warm up cache with frequently accessed data (admin only)
    """
    await db_optimizer.warm_cache()
    
    return StandardResponse(
        success=True,
        message="Cache warmed up successfully",
        data={
            "status": "completed",
            "timestamp": datetime.utcnow().isoformat()
        }
    )


@router.delete("/cache/clear", response_model=StandardResponse[Dict[str, str]])
async def clear_cache(
    current_user: User = Depends(get_admin_user)
) -> StandardResponse[Dict[str, str]]:
    """
    Clear all cached data (admin only)
    
    Note: Currently no cache is implemented in the backend.
    This endpoint is kept for future use if caching is added.
    """
    # No cache to clear - backend is cache-free
    
    return StandardResponse(
        success=True,
        message="No cache to clear (backend is cache-free)",
        data={
            "status": "completed",
            "timestamp": datetime.utcnow().isoformat()
        }
    )


@router.get("/slow-queries", response_model=StandardResponse[Dict[str, Any]])
async def analyze_slow_queries(
    current_user: User = Depends(get_admin_user)
) -> StandardResponse[Dict[str, Any]]:
    """
    Analyze slow database queries (admin only)
    """
    await db_optimizer.analyze_slow_queries()
    
    # Get metrics for slow queries
    metrics = performance_monitor.get_metrics()
    slow_queries = {
        k: v for k, v in metrics.items() 
        if v.get("slow_count", 0) > 0
    }
    
    # Sort by slow count descending
    sorted_queries = sorted(
        slow_queries.items(), 
        key=lambda x: x[1].get("slow_count", 0), 
        reverse=True
    )
    
    return StandardResponse(
        success=True,
        message="Slow query analysis completed",
        data={
            "slow_queries": dict(sorted_queries[:20]),  # Top 20 slow queries
            "total_slow_queries": sum(q[1].get("slow_count", 0) for q in sorted_queries),
            "timestamp": datetime.utcnow().isoformat()
        }
    )