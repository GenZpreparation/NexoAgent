"""
NexoAgent - Telephony Webhook Handler & Database Sync
Purpose: Receives real-time call lifecycle events from Telecom Carriers,
persists them into the Call Ledger, and automatically deducts wallet balance.
"""
import math
from typing import Optional, Dict, Any, Union
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models import Call, CallLog, Workspace, Lead, Campaign
from app.services.campaign import campaign_engine
from app.services.telephony import telephony_service
from app.schemas.campaign import MetaLeadPayload

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

# Meta Webhook Verification Secret
META_VERIFY_TOKEN = "nexo_meta_secret_2026"


class CallStatusEvent(BaseModel):
    call_id: str = Field(..., description="Unique Carrier Call SID (e.g. CA_12345)")
    to_phone: str = Field(..., description="Customer phone number")
    from_phone: str = Field(..., description="Virtual CLI phone number")
    call_status: str = Field(..., description="initiated, ringing, in-progress, completed, busy, no-answer, failed")
    call_duration_seconds: int = Field(default=0, description="Duration in seconds (only for completed calls)")
    recording_url: Optional[str] = Field(default=None, description="Audio recording MP3 URL")
    workspace_id: Optional[int] = Field(default=1, description="Tenant workspace ID")
    agent_id: Optional[int] = Field(default=None, description="Voice agent ID")


def calculate_call_cost(duration_seconds: int, rate_per_minute: float = 5.50) -> float:
    """
    Connected talk time ke hisaab se call cost calculate karta hai.
    Rule: Har partial minute ko next whole minute me round up kiya jata hai.
    """
    if duration_seconds <= 0:
        return 0.0
    billed_minutes = math.ceil(duration_seconds / 60.0)
    return round(billed_minutes * rate_per_minute, 2)


@router.post("/telephony")
async def handle_telephony_webhook(
    event: CallStatusEvent,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Carrier (Twilio/Exotel) se call status updates receive karta hai
    aur real-time database me Call record update karta hai.
    """
    cost = 0.0
    if event.call_status == "completed":
        cost = calculate_call_cost(event.call_duration_seconds)

    # 1. Check if Call already exists
    result = await db.execute(select(Call).where(Call.call_sid == event.call_id))
    call = result.scalar_one_or_none()

    if not call:
        # Create new Call row
        call = Call(
            call_sid=event.call_id,
            workspace_id=event.workspace_id or 1,
            agent_id=event.agent_id,
            customer_phone=event.to_phone,
            direction="outbound",
            status=event.call_status,
            duration_seconds=event.call_duration_seconds,
            cost_inr=cost,
            recording_url=event.recording_url
        )
        db.add(call)
        await db.flush()

        # Initialize empty CallLog
        call_log = CallLog(
            call_id=call.id,
            transcript=None,
            summary=None,
            sentiment=None,
            extracted_data={},
            whatsapp_status="none"
        )
        db.add(call_log)
    else:
        # Update existing Call row
        call.status = event.call_status
        call.duration_seconds = event.call_duration_seconds
        call.cost_inr = cost
        if event.recording_url:
            call.recording_url = event.recording_url

    # 2. If call completed and billed > 0, deduct from workspace balance
    if event.call_status == "completed" and cost > 0:
        ws_res = await db.execute(select(Workspace).where(Workspace.id == call.workspace_id))
        ws = ws_res.scalar_one_or_none()
        if ws:
            ws.balance_inr = round(ws.balance_inr - cost, 2)

    # 3. Smart Auto-Retry Hook: If call was busy or no-answer, check if lead needs retry scheduling
    retry_scheduled = False
    if event.call_status in ["busy", "no-answer", "failed"]:
        lead_res = await db.execute(select(Lead).where(Lead.call_sid == event.call_id))
        lead = lead_res.scalar_one_or_none()
        if lead:
            retry_scheduled = campaign_engine.schedule_lead_retry(lead, event.call_status)

    await db.commit()

    return {
        "status": "success",
        "call_id": event.call_id,
        "processed_state": event.call_status,
        "billed_cost_inr": cost,
        "retry_scheduled": retry_scheduled
    }


# ============================================================================
# META (FACEBOOK & INSTAGRAM) LEAD ADS SPEED-TO-LEAD WEBHOOK
# ============================================================================

@router.get("/meta-leads", response_class=PlainTextResponse)
async def verify_meta_webhook(
    hub_mode: Optional[str] = Query(default=None, alias="hub.mode"),
    hub_verify_token: Optional[str] = Query(default=None, alias="hub.verify_token"),
    hub_challenge: Optional[str] = Query(default=None, alias="hub.challenge"),
):
    """
    Meta Developer Verification Handshake Endpoint.
    When configuring webhook URL in Meta App Dashboard, Meta sends a GET request
    with hub.challenge and hub.verify_token. If verified, must respond with hub.challenge.
    """
    if hub_mode == "subscribe" and hub_verify_token == META_VERIFY_TOKEN:
        return PlainTextResponse(content=hub_challenge or "", status_code=status.HTTP_200_OK)
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Verification token mismatch or invalid hub.mode"
    )


@router.post("/meta-leads", status_code=status.HTTP_200_OK)
async def ingest_meta_lead(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Speed-to-Lead Meta Ads Ingestion & Sub-30s Auto-Dialer:
    1. Ingests leads from Facebook/Instagram Lead Ads.
    2. Sanitizes Indian phone numbers (+91).
    3. Scrubs National DND registry.
    4. Validates TRAI 10 AM - 7 PM calling hours.
    5. Dispatches instant outbound AI voice call in < 30 seconds!
    """
    body = await request.json()

    # Support both standard Meta event wrapper and direct JSON payloads
    full_name = "Prospect"
    phone_number = None
    city = None
    workspace_id = 1
    agent_id = None
    campaign_id = None
    auto_dial = True
    custom_data = {}

    if "entry" in body and isinstance(body["entry"], list):
        # Standard Meta Webhook payload
        entry = body["entry"][0]
        changes = entry.get("changes", [{}])[0]
        value = changes.get("value", {})
        leadgen_id = value.get("leadgen_id", "META_LEAD")
        full_name = value.get("full_name") or f"Meta Lead {leadgen_id}"
        phone_number = value.get("phone_number")
        custom_data = value
    else:
        # Direct payload
        full_name = body.get("full_name", "Prospect")
        phone_number = body.get("phone_number")
        city = body.get("city")
        workspace_id = body.get("workspace_id", 1)
        agent_id = body.get("agent_id")
        campaign_id = body.get("campaign_id")
        auto_dial = body.get("auto_dial", True)
        custom_data = body.get("custom_data", {})

    if not phone_number:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="phone_number is required"
        )

    # 1. E.164 Phone Sanitization
    try:
        clean_phone = telephony_service.sanitize_phone_number(phone_number)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # 2. DND Registry Scrubbing
    is_dnd = campaign_engine.is_dnd_registered(clean_phone)
    if is_dnd:
        return {
            "status": "lead_saved",
            "dnd_scrubbed": True,
            "call_dispatched": False,
            "message": "Number is registered on TRAI DND registry. Dialing prevented."
        }

    # 3. Check TRAI calling window (10 AM - 7 PM IST)
    within_hours = campaign_engine.is_within_trai_calling_hours()

    # 4. Save lead in DB if campaign_id is provided or create speed-to-lead record
    call_sid = None
    speed_to_lead_status = "queued"

    if auto_dial and within_hours:
        # Check workspace balance
        ws_res = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
        ws = ws_res.scalar_one_or_none()
        if not ws or ws.balance_inr < 5.50:
            return {
                "status": "lead_saved",
                "call_dispatched": False,
                "reason": "insufficient_wallet_balance",
                "phone_number": clean_phone
            }

        # Sub-30s Speed-to-Lead Outbound Dial
        call_res = telephony_service.initiate_outbound_call(clean_phone)
        call_sid = call_res.get("call_id")
        speed_to_lead_status = "instant_dialed"

        # Log call record
        call = Call(
            call_sid=call_sid,
            workspace_id=workspace_id,
            agent_id=agent_id,
            customer_phone=clean_phone,
            direction="outbound",
            status="initiated",
            duration_seconds=0,
            cost_inr=0.0
        )
        db.add(call)
        await db.flush()

        call_log = CallLog(
            call_id=call.id,
            transcript=None,
            summary=f"Speed-to-Lead Meta Ad Lead for {full_name}",
            sentiment="Neutral",
            extracted_data=custom_data,
            whatsapp_status="none"
        )
        db.add(call_log)

    # If campaign_id was given, save as campaign lead
    if campaign_id:
        lead = Lead(
            campaign_id=campaign_id,
            workspace_id=workspace_id,
            full_name=full_name,
            phone_number=clean_phone,
            city=city,
            custom_data=custom_data,
            status="dialing" if speed_to_lead_status == "instant_dialed" else ("pending" if within_hours else "scheduled_trai_window"),
            call_sid=call_sid,
            last_called_at=datetime.now(timezone.utc) if speed_to_lead_status == "instant_dialed" else None,
            retry_count=1 if speed_to_lead_status == "instant_dialed" else 0,
            lead_source="meta_ads"
        )
        db.add(lead)

    await db.commit()

    return {
        "status": "success",
        "speed_to_lead_status": speed_to_lead_status,
        "phone_number": clean_phone,
        "full_name": full_name,
        "call_sid": call_sid,
        "trai_compliant": within_hours,
        "latency_target": "sub_30_seconds"
    }
