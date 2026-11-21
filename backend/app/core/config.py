"""
NexoAgent - Core Configuration
Environment variables and system settings using Pydantic Settings.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "NexoAgent"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Async Database URL (default to local async sqlite, can be overridden with asyncpg in .env)
    DATABASE_URL: str = "sqlite+aiosqlite:///./nexoagent.db"

    # Security & JWT
    SECRET_KEY: str = "nexoagent-super-secret-jwt-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # S3 / Cloudflare R2 Audio Recording Storage
    S3_BUCKET_NAME: str = "nexoagent-recordings"
    S3_REGION_NAME: str = "ap-south-1"
    S3_ENDPOINT_URL: str | None = None  # e.g. "https://<accountid>.r2.cloudflarestorage.com"
    AWS_ACCESS_KEY_ID: str = "nexoagent-dev-key"
    AWS_SECRET_ACCESS_KEY: str = "nexoagent-dev-secret-key-12345678"
    RECORDING_PRESIGNED_EXPIRY_SECONDS: int = 900  # 15 minutes streaming link

    # WhatsApp Cloud API (Meta / Gupshup)
    WHATSAPP_API_TOKEN: str | None = None
    WHATSAPP_PHONE_NUMBER_ID: str | None = None
    WHATSAPP_BUSINESS_ACCOUNT_ID: str | None = None
    DEFAULT_BROCHURE_PDF_URL: str = "https://storage.nexoagent.com/brochures/nexo_grandeur_brochure.pdf"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
