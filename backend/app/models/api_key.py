"""
NexoAgent - Developer API Key Model
Allows businesses and external CRMs to programmatically dispatch calls
and query telecalling intelligence via Bearer nexo_live_... keys.
"""
from typing import Optional
from datetime import datetime
from sqlalchemy import String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, TimestampMixin


class ApiKey(Base, TimestampMixin):
    __tablename__ = "api_keys"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    workspace_id: Mapped[int] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Key Name for human identification (e.g. "Salesforce CRM Sync Key")
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Visible Prefix for identification in Dashboard (e.g. "nexo_live_9f8a...")
    key_prefix: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    
    # SHA-256 Hash of the actual secret key (stored securely, secret never kept in plain text)
    hashed_key: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    workspace = relationship("Workspace")
