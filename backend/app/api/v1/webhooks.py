"""
NexoAgent - Telephony Webhook Handler & Database Sync
Purpose: Receives real-time call lifecycle events from Telecom Carriers,
persists them into the Call Ledger, and automatically deducts wallet balance.
"""
import math
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models import Call, CallLog, Workspace

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


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

    await db.commit()

    return {
        "status": "success",
        "call_id": event.call_id,
        "processed_state": event.call_status,
        "billed_cost_inr": cost
    }
