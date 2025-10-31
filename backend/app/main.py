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
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Local application imports
from app.core.config import settings
from app.core.database import close_mongo_connection, connect_to_mongo
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
logging.getLogger("pydantic").setLevel(logging.ERROR)
logging.getLogger("pydantic_core").setLevel(logging.ERROR)
logging.getLogger("pydantic._internal").setLevel(logging.ERROR)
logging.getLogger("passlib").setLevel(logging.ERROR)
logging.getLogger("python_multipart").setLevel(logging.WARNING)
logging.getLogger("urllib3").setLevel(logging.WARNING)
logging.getLogger("watchfiles").setLevel(logging.WARNING)


# Sentry monitoring removed - using standard logging
# For production monitoring, consider implementing alternative solutions


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

# Custom exception handler to ensure CORS headers are included in error responses
from fastapi import HTTPException
from fastapi.responses import JSONResponse

async def http_exception_handler(request: Request, exc: HTTPException):
    """Custom HTTPException handler that includes CORS headers"""
    # Get origin from request
    origin = request.headers.get("origin", "")
    
    # Build response
    response = JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )
    
    # Add CORS headers if origin matches allowed origins
    if origin in origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
    
    # Add any additional headers from the exception
    if hasattr(exc, 'headers') and exc.headers:
        for key, value in exc.headers.items():
            response.headers[key] = value
    
    return response

# Add custom HTTPException handler
app.add_exception_handler(HTTPException, http_exception_handler)

# Also handle general exceptions to ensure CORS headers
async def general_exception_handler(request: Request, exc: Exception):
    """General exception handler that includes CORS headers"""
    import traceback
    error_detail = f"{type(exc).__name__}: {str(exc)}"
    logger.error(f"Unhandled exception: {error_detail}")
    logger.error(f"Traceback:\n{traceback.format_exc()}")
    
    # Get origin from request
    origin = request.headers.get("origin", "")
    
    # Build error response - include actual error in development
    response = JSONResponse(
        status_code=500,
        content={"detail": error_detail if settings.DEBUG else "Internal server error"},
    )
    
    # Add CORS headers if origin matches allowed origins
    if origin in origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
    
    return response

# Add general exception handler
app.add_exception_handler(Exception, general_exception_handler)

# Configure CORS
# Dynamically build origins list
origins = [
    settings.FRONTEND_URL,  # Use configured frontend URL
    "http://localhost:3000",  # Keep for local development
    *[str(origin) for origin in settings.BACKEND_CORS_ORIGINS]
]
# Remove duplicates while preserving order
origins = list(dict.fromkeys(origins))

# Add security middleware first
app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(InputValidationMiddleware)
app.add_middleware(TokenBlacklistMiddleware)  # Check blacklisted tokens for secure logout

# CORS Middleware MUST be added LAST to execute FIRST (best practice)
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