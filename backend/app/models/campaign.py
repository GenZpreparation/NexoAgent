"""
NexoAgent - Campaign & Lead Models (Bulk Outbound Engine)
Supports CSV uploads of 5,000+ leads, pacing concurrency control,
DND compliance, and auto-retry state tracking.
"""
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, TimestampMixin


class Campaign(Base, TimestampMixin):
    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    workspace_id: Mapped[int] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_id: Mapped[int] = mapped_column(ForeignKey("voice_agents.id", ondelete="RESTRICT"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="draft", index=True)  # draft, running, paused, completed
    concurrency_limit: Mapped[int] = mapped_column(Integer, default=5)  # Max parallel calls
    total_leads: Mapped[int] = mapped_column(Integer, default=0)
    dialed_leads: Mapped[int] = mapped_column(Integer, default=0)
    connected_leads: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    workspace = relationship("Workspace")
    agent = relationship("VoiceAgent")
    leads = relationship("Lead", back_populates="campaign", cascade="all, delete-orphan")


class Lead(Base, TimestampMixin):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    workspace_id: Mapped[int] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(100), default="Customer")
    phone_number: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    custom_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict)
    
    # Lead Lifecycle Status:
    # pending, dialing, completed, busy, no-answer, dnd_blocked, failed
    status: Mapped[str] = mapped_column(String(30), default="pending", index=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    max_retries: Mapped[int] = mapped_column(Integer, default=3)
    call_sid: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    last_called_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationship
    campaign = relationship("Campaign", back_populates="leads")
