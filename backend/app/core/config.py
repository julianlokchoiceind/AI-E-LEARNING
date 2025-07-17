"""
Application configuration using Pydantic Settings.
Loads environment variables automatically from backend/.env
"""
import os
from typing import Optional, List, Union
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, validator
from dotenv import load_dotenv

# Load environment variables from root .env.local
load_dotenv(os.path.join(os.path.dirname(__file__), '../../../.env.local'))


class Settings(BaseSettings):
    # Application
    PROJECT_NAME: str = "AI E-Learning Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    # Read from NEXT_PUBLIC_APP_URL for consistency with frontend
    FRONTEND_URL: str = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # Database
    MONGODB_URI: str
    DATABASE_NAME: str = "ai-elearning"
    
    # Authentication
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Email (Microsoft Graph API)
    AZURE_CLIENT_ID: str
    AZURE_CLIENT_SECRET: str
    AZURE_TENANT_ID: str
    MAIL_FROM_ADDRESS: str
    EMAILS_FROM_NAME: Optional[str] = "AI E-Learning Platform"
    
    # Legacy SMTP (deprecated)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASS: Optional[str] = None
    SECURITY_TEAM_EMAIL: str = "security@ai-elearning.com"
    

    
    # AI Service
    ANTHROPIC_API_KEY: str
    ANTHROPIC_MODEL: str = "claude-3-5-sonnet-20240620"
    
    # AI Settings
    @property
    def anthropic_api_key(self) -> str:
        return self.ANTHROPIC_API_KEY
    
    @property
    def anthropic_model(self) -> str:
        return self.ANTHROPIC_MODEL
    
    @property
    def debug(self) -> bool:
        return self.DEBUG
    
    # Payment
    STRIPE_SECRET_KEY: str
    STRIPE_WEBHOOK_SECRET: str
    
    # Storage & CDN
    CLOUDFLARE_API_TOKEN: Optional[str] = None
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    S3_BUCKET_NAME: Optional[str] = None
    
    # File Upload Configuration
    USE_LOCAL_STORAGE: bool = True
    LOCAL_UPLOAD_DIR: str = "/app/uploads"
    LOCAL_UPLOAD_URL_PREFIX: str = "/uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_EXTENSIONS: List[str] = [
        ".pdf", ".doc", ".docx", ".zip", ".rar",
        ".jpg", ".jpeg", ".png", ".gif", ".webp",
        ".txt", ".md", ".py", ".js", ".html", ".css"
    ]
    ALLOWED_MIME_TYPES: List[str] = [
        "application/pdf",
        "application/msword", 
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/zip",
        "application/x-rar-compressed",
        "image/jpeg",
        "image/png",
        "image/gif", 
        "image/webp",
        "text/plain",
        "text/markdown",
        "text/x-python",
        "application/javascript",
        "text/html",
        "text/css"
    ]
    
    # Cloud Storage Configuration (for future migration)
    AWS_S3_REGION: str = "us-east-1"
    GOOGLE_CLOUD_PROJECT_ID: Optional[str] = None
    GOOGLE_CLOUD_BUCKET: Optional[str] = None
    
    # File Upload Security
    ENABLE_FILE_CONTENT_VALIDATION: bool = True
    ENABLE_MALWARE_SCANNING: bool = False  # Requires additional service
    
    @property
    def max_file_size_mb(self) -> float:
        """Get max file size in MB for display."""
        return round(self.MAX_FILE_SIZE / (1024 * 1024), 1)
    
    # Sentry
    SENTRY_DSN: Optional[str] = "https://e361b6f5a71325c0649205ce514e1a31@o4509546120675328.ingest.us.sentry.io/4509546126114816"
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

def get_settings() -> Settings:
    """Get application settings"""
    return settings

def get_storage_backend():
    """Get configured storage backend instance."""
    from ..utils.storage import get_storage_backend
    
    return get_storage_backend(
        use_local=settings.USE_LOCAL_STORAGE,
        local_upload_dir=settings.LOCAL_UPLOAD_DIR,
        local_url_prefix=settings.LOCAL_UPLOAD_URL_PREFIX,
        s3_bucket=settings.S3_BUCKET_NAME,
        s3_region=settings.AWS_S3_REGION,
        s3_access_key=settings.AWS_ACCESS_KEY_ID,
        s3_secret_key=settings.AWS_SECRET_ACCESS_KEY,
        gcs_bucket=settings.GOOGLE_CLOUD_BUCKET,
        gcs_project_id=settings.GOOGLE_CLOUD_PROJECT_ID
    )

def get_file_upload_service():
    """Get configured file upload service instance."""
    from ..utils.file_upload import FileUploadService
    
    storage = get_storage_backend()
    return FileUploadService(
        storage=storage,
        max_file_size=settings.MAX_FILE_SIZE,
        allowed_extensions=settings.ALLOWED_FILE_EXTENSIONS,
        allowed_mime_types=settings.ALLOWED_MIME_TYPES
    )