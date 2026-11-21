"""
NexoAgent - Voice Agent Model
Stores the persona, prompts, voice configuration, and first message.
"""
from sqlalchemy import String, Text, Float, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, TimestampMixin


class VoiceAgent(Base, TimestampMixin):
    __tablename__ = "voice_agents"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    workspace_id: Mapped[int] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., "Pooja - Nexo Homes"
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    first_message: Mapped[str] = mapped_column(String(500), nullable=False)
    voice_provider: Mapped[str] = mapped_column(String(50), default="sarvam")  # sarvam, deepgram, elevenlabs
    voice_id: Mapped[str] = mapped_column(String(100), default="bulbul:v3/pooja")
    language: Mapped[str] = mapped_column(String(20), default="hi-IN")
    temperature: Mapped[float] = mapped_column(Float, default=0.3)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    workspace = relationship("Workspace", back_populates="agents")
    calls = relationship("Call", back_populates="agent")
