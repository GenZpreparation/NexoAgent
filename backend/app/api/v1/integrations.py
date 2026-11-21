"""
NexoAgent - CRM Integrations & Outbound Webhooks Router
Allows businesses to connect external CRMs (HubSpot, Zoho, Salesforce, Google Sheets)
to receive live push events upon call completion, lead qualification, or WhatsApp delivery.
"""
import hmac
import hashlib
import json
import secrets
from typing import List, Optional, Dict, Any
from datetime import datetime
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, HttpUrl
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models import User, WebhookSubscription

router = APIRouter(prefix="/integrations", tags=["CRM Integrations & Webhooks"])


class WebhookCreateRequest(BaseModel):
    target_url: str = Field(..., example="https://crm.godrej.com/api/nexo-lead-webhook")
    description: Optional[str] = Field(default=None, example="HubSpot Inbound Lead Pipeline")
    subscribed_events: Optional[List[str]] = Field(
        default=["call.completed", "lead.qualified"],
        example=["call.completed", "lead.qualified"]
    )


class WebhookResponse(BaseModel):
    id: int
    workspace_id: int
    target_url: str
    description: Optional[str]
    secret: str
    subscribed_events: List[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("/webhooks", response_model=WebhookResponse, status_code=status.HTTP_201_CREATED)
async def register_crm_webhook(
    payload: WebhookCreateRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Naya Outbound Webhook register karta hai client ke CRM integration ke liye."""
    secret = f"whsec_{secrets.token_hex(16)}"
    webhook = WebhookSubscription(
        workspace_id=current_user.workspace_id,
        target_url=payload.target_url,
        description=payload.description,
        secret=secret,
        subscribed_events=payload.subscribed_events or ["call.completed", "lead.qualified"],
        is_active=True
    )
    db.add(webhook)
    await db.commit()
    await db.refresh(webhook)
    return webhook


@router.get("/webhooks", response_model=List[WebhookResponse])
async def list_crm_webhooks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Current workspace ke registered outbound webhooks list karta hai."""
    result = await db.execute(
        select(WebhookSubscription)
        .where(
            WebhookSubscription.workspace_id == current_user.workspace_id,
            WebhookSubscription.is_active == True
        )
        .order_by(WebhookSubscription.id.desc())
    )
    return result.scalars().all()


@router.delete("/webhooks/{webhook_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_crm_webhook(
    webhook_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Outbound CRM webhook ko delete/revoke karta hai."""
    result = await db.execute(
        select(WebhookSubscription).where(
            WebhookSubscription.id == webhook_id,
            WebhookSubscription.workspace_id == current_user.workspace_id
        )
    )
    wh = result.scalar_one_or_none()
    if not wh:
        raise HTTPException(status_code=404, detail="Webhook subscription not found")

    await db.delete(wh)
    await db.commit()
    return None


@router.post("/webhooks/{webhook_id}/test-ping")
async def test_ping_webhook(
    webhook_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Client ke CRM webhook endpoint par sample 'lead.qualified' payload dispatch karta hai."""
    result = await db.execute(
        select(WebhookSubscription).where(
            WebhookSubscription.id == webhook_id,
            WebhookSubscription.workspace_id == current_user.workspace_id
        )
    )
    wh = result.scalar_one_or_none()
    if not wh:
        raise HTTPException(status_code=404, detail="Webhook subscription not found")

    sample_event = {
        "event": "lead.qualified",
        "timestamp": datetime.utcnow().isoformat(),
        "data": {
            "lead_name": "Aman Verma",
            "phone_number": "+919876543210",
            "call_sid": "CA_TEST_PING_101",
            "lead_score": "Hot Lead",
            "extracted_budget": "2.5 Cr",
            "preferred_bhk": "3 BHK High Rise",
            "site_visit_date": "Saturday 11:00 AM",
            "whatsapp_brochure_delivered": True
        }
    }
    payload_bytes = json.dumps(sample_event).encode("utf-8")
    signature = hmac.new(wh.secret.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()

    return {
        "status": "ping_simulated",
        "target_url": wh.target_url,
        "signature_sent": f"sha256={signature}",
        "event_payload": sample_event,
        "message": "Webhook payload and HMAC signature constructed successfully."
    }
