"""
NexoAgent - Channel & Dedicated Phone Number Model
Represents allocated Indian business caller lines (+91 DLT registered)
and concurrency capacity matching Outpero's Channels specification.
"""
from typing import Optional
from sqlalchemy import String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, TimestampMixin


class Channel(Base, TimestampMixin):
    __tablename__ = "telephony_channels"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    workspace_id: Mapped[int] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    phone_number: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    friendly_name: Mapped[str] = mapped_column(String(100), default="Primary Caller Line")
    concurrency_limit: Mapped[int] = mapped_column(Integer, default=1)
    dlt_entity_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    dlt_sender_id: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    assigned_agent_id: Mapped[Optional[int]] = mapped_column(ForeignKey("voice_agents.id", ondelete="SET NULL"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    workspace = relationship("Workspace")
    assigned_agent = relationship("VoiceAgent")
