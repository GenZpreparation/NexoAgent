"""
NexoAgent - Workspace Model (Multi-Tenancy Root)
Every business/organization has its own isolated workspace.
"""
from sqlalchemy import String, Float, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, TimestampMixin


class Workspace(Base, TimestampMixin):
    __tablename__ = "workspaces"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    balance_inr: Mapped[float] = mapped_column(Float, default=500.0)  # Free ₹500 calling credit
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    users = relationship("User", back_populates="workspace", cascade="all, delete-orphan")
    agents = relationship("VoiceAgent", back_populates="workspace", cascade="all, delete-orphan")
    calls = relationship("Call", back_populates="workspace", cascade="all, delete-orphan")
