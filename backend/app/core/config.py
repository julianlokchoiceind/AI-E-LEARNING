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
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
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
    
    # Sentry
    SENTRY_DSN: Optional[str] = None
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

def get_settings() -> Settings:
    """Get application settings"""
    return settings