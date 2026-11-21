"""
NexoAgent - Outbound CRM Webhook Subscription Model
Allows businesses to register webhook URLs (HubSpot, Zoho, Salesforce, Google Sheets)
to receive real-time push events when calls complete or leads are qualified.
"""
from typing import Optional
from sqlalchemy import String, Boolean, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, TimestampMixin


class WebhookSubscription(Base, TimestampMixin):
    __tablename__ = "webhook_subscriptions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    workspace_id: Mapped[int] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Destination webhook URL (e.g. "https://crm.godrej.com/webhooks/nexo-leads")
    target_url: Mapped[str] = mapped_column(String(500), nullable=False)
    
    # Cryptographic signing secret for HMAC-SHA256 signature header (X-Nexo-Signature)
    secret: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Events to subscribe to (e.g. ["call.completed", "lead.qualified", "campaign.completed"])
    subscribed_events: Mapped[Optional[list]] = mapped_column(JSON, default=lambda: ["call.completed", "lead.qualified"])
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    # Relationships
    workspace = relationship("Workspace")
