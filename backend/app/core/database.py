"""
NexoAgent - Async Database Engine & Session Management
SQLAlchemy 2.0 Async Session dependency for FastAPI.
"""
from typing import AsyncGenerator
from datetime import datetime
from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine
)
from app.core.config import settings

# 1. Async Engine create karna
# echo=False production me fast rakhta hai, development me True karke raw SQL dekh sakte hain
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True
)

# 2. Async Session Factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# 3. Base Model with Common Audit Fields
class Base(DeclarativeBase):
    """Base class for all SQLAlchemy 2.0 ORM models."""
    pass


class TimestampMixin:
    """Har table me created_at aur updated_at auto-track karne ke liye."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )


# 4. FastAPI Dependency for Database Sessions
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI route dependency jo har HTTP request ke liye
    ek dedicated async database session deti hai aur kaam khatam
    hote hi session ko cleanly close karti hai.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
