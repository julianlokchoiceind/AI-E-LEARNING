"""
Main FastAPI application entry point.
Configures middleware, routes, and event handlers.
"""
# Suppress Pydantic warnings
import warnings
warnings.filterwarnings("ignore", category=UserWarning, module="pydantic._internal._config")

# Standard library imports
import logging
from contextlib import asynccontextmanager

# Third-party imports
import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sentry_sdk.integrations.fastapi import FastApiIntegration
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

# Local application imports
from app.core.config import settings
from app.core.database import close_mongo_connection, connect_to_mongo
from app.core.rate_limit import limiter
from app.middleware.input_validation import InputValidationMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.middleware.token_blacklist import TokenBlacklistMiddleware
from app.services.db_optimization import db_optimizer
from app.services.security_monitoring import security_monitor

# Configure logging based on environment
log_level = logging.INFO if settings.DEBUG else logging.INFO
logging.basicConfig(
    level=log_level,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Reduce verbosity of third-party loggers
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("uvicorn.error").setLevel(logging.WARNING)
logging.getLogger("fastapi").setLevel(logging.WARNING)
logging.getLogger("motor").setLevel(logging.WARNING)
logging.getLogger("pymongo").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("sentry_sdk").setLevel(logging.ERROR)
logging.getLogger("pydantic").setLevel(logging.ERROR)
logging.getLogger("pydantic_core").setLevel(logging.ERROR)
logging.getLogger("pydantic._internal").setLevel(logging.ERROR)
logging.getLogger("passlib").setLevel(logging.ERROR)
logging.getLogger("python_multipart").setLevel(logging.WARNING)
logging.getLogger("urllib3").setLevel(logging.WARNING)
logging.getLogger("watchfiles").setLevel(logging.WARNING)


# Initialize Sentry if DSN is provided
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        integrations=[
            FastApiIntegration(
                transaction_style="endpoint",
                failed_request_status_codes=[400, 401, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 422, 423, 424, 425, 426, 428, 429, 431, 451, 500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511]
            )
        ],
        traces_sample_rate=0.1,  # Performance monitoring: 10% of transactions
        profiles_sample_rate=0.1,  # Performance profiling: 10% of transactions
        environment="development" if settings.DEBUG else "production",
        release=f"ai-elearning-backend@{settings.VERSION}",
        
        # Performance monitoring
        _experiments={
            "profiles_sample_rate": 0.1,
        },
        
        # E-learning specific contexts
        before_send=lambda event, hint: event,
        before_send_transaction=lambda event, hint: event,
        
        # Filter out health check transactions
        traces_sampler=lambda sampling_context: 0.0 if sampling_context.get("asgi_scope", {}).get("path") == "/health" else 0.1,
        
        # Additional options
        attach_stacktrace=True,
        send_default_pii=False,  # Don't send PII by default
        debug=False,  # Disable verbose Sentry logging
    )
    
    # Set up custom tags
    sentry_sdk.set_tag("app.component", "backend")
    sentry_sdk.set_tag("app.platform", "fastapi")
    
    # Sentry initialized silently


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
        # MongoDB connected successfully
        
        # Initialize security monitor with database
        await security_monitor.init_db(db_client)
        # Security monitoring initialized
        
        # Initialize database optimizer
        await db_optimizer.init_db(db_client)
        # Database optimizer initialized
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
        # Không chạy in-memory mode, bắt buộc phải có MongoDB
        raise RuntimeError(f"Cannot start without MongoDB connection: {e}")
    
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

# Keep using the default rate limit handler but ensure CORS headers
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS
# Dynamically build origins list
origins = [
    settings.FRONTEND_URL,  # Use configured frontend URL
    "http://localhost:3000",  # Keep for local development
    *[str(origin) for origin in settings.BACKEND_CORS_ORIGINS]
]
# Remove duplicates while preserving order
origins = list(dict.fromkeys(origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add security middleware - DEBUG: Testing each middleware individually
app.add_middleware(SecurityHeadersMiddleware)
# Re-enabled with smart 3-layer validation approach
app.add_middleware(InputValidationMiddleware)  # Fixed: field-aware validation with nh3 sanitization
app.add_middleware(TokenBlacklistMiddleware)  # Check blacklisted tokens for secure logout


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
        "message": "Welcome to CHOICE AI E-Learning Platform API",
        "version": settings.VERSION,
        "docs": f"{settings.API_V1_STR}/docs"
    }


# Mount static files for uploaded content
import os


if settings.USE_LOCAL_STORAGE and os.path.exists(settings.LOCAL_UPLOAD_DIR):
    app.mount(
        settings.LOCAL_UPLOAD_URL_PREFIX,
        StaticFiles(directory=settings.LOCAL_UPLOAD_DIR),
        name="uploads"
    )
    logger.info(f"Mounted static files at {settings.LOCAL_UPLOAD_URL_PREFIX} from {settings.LOCAL_UPLOAD_DIR}")
else:
    logger.warning(f"Upload directory {settings.LOCAL_UPLOAD_DIR} does not exist. File uploads may fail.")

# Import and include routers
from app.api.v1.api import api_router
app.include_router(api_router, prefix=settings.API_V1_STR)