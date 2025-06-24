"""
Main FastAPI application entry point.
Configures middleware, routes, and event handlers.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.core.rate_limit import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# Initialize Sentry if DSN is provided
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        integrations=[FastApiIntegration()],
        traces_sample_rate=0.1,
        environment="development" if settings.DEBUG else "production"
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events.
    Handles startup and shutdown.
    """
    # Startup
    logger.info("Starting up AI E-Learning Platform API...")
    try:
        await connect_to_mongo()
        logger.info("MongoDB connection established successfully")
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
        logger.info("Running without MongoDB connection - in-memory mode")
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    await close_mongo_connection()


# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# Configure rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    *[str(origin) for origin in settings.BACKEND_CORS_ORIGINS]
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "service": "AI E-Learning Platform API"
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to AI E-Learning Platform API",
        "version": settings.VERSION,
        "docs": f"{settings.API_V1_STR}/docs"
    }


# Import and include routers
from app.api.v1.api import api_router
app.include_router(api_router, prefix=settings.API_V1_STR)