"""
Main FastAPI application entry point.
Configures middleware, routes, and event handlers.
"""
# Standard library imports
import logging
from contextlib import asynccontextmanager

# Third-party imports
import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sentry_sdk.integrations.fastapi import FastApiIntegration
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

# Local application imports
from app.core.config import settings
from app.core.database import close_mongo_connection, connect_to_mongo
from app.core.rate_limit import limiter
from app.middleware.input_validation import InputValidationMiddleware
from app.middleware.rate_limiter import RateLimitMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.services.db_optimization import db_optimizer
from app.services.security_monitoring import security_monitor

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
        db_client = await connect_to_mongo()
        logger.info("MongoDB connection established successfully")
        
        # Initialize security monitor with database
        if db_client:
            await security_monitor.init_db(db_client)
            logger.info("Security monitoring initialized")
            
            # Initialize database optimizer
            await db_optimizer.init_db(db_client)
            logger.info("Database optimizer initialized")
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

# Add security middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(InputValidationMiddleware)


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