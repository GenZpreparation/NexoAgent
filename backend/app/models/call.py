"""
NexoAgent - Call & CallLog Models
Tracks outbound/inbound phone calls, durations, billing costs, transcripts, and AI analytics.
"""
from typing import Optional, Dict, Any
from sqlalchemy import String, Integer, Float, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, TimestampMixin


class Call(Base, TimestampMixin):
    __tablename__ = "calls"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    call_sid: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    workspace_id: Mapped[int] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_id: Mapped[Optional[int]] = mapped_column(ForeignKey("voice_agents.id", ondelete="SET NULL"), nullable=True, index=True)
    customer_phone: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    direction: Mapped[str] = mapped_column(String(20), default="outbound")  # outbound, inbound
    status: Mapped[str] = mapped_column(String(30), default="initiated", index=True)  # initiated, ringing, in-progress, completed, busy, no-answer, failed
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    cost_inr: Mapped[float] = mapped_column(Float, default=0.0)
    recording_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Relationships
    workspace = relationship("Workspace", back_populates="calls")
    agent = relationship("VoiceAgent", back_populates="calls")
    log = relationship("CallLog", back_populates="call", uselist=False, cascade="all, delete-orphan")


class CallLog(Base, TimestampMixin):
    __tablename__ = "call_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    call_id: Mapped[int] = mapped_column(ForeignKey("calls.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    transcript: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sentiment: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # Positive, Neutral, Negative, Busy
    extracted_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict)  # {"budget": "75L", "location": "Noida"}
    whatsapp_status: Mapped[str] = mapped_column(String(50), default="none")  # none, queued, sent, failed

    # Relationship
    call = relationship("Call", back_populates="log")
