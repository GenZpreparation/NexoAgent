"""
NexoAgent - Telephony Channels & Numbers Router
Manages dedicated Indian caller lines, concurrency capacity (₹649/channel),
and live calling activity telemetry matching Outpero's live top bar ticker.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import User, Channel, Call, VoiceAgent

router = APIRouter(prefix="/channels", tags=["Telephony Channels & Live Telemetry"])


class ChannelCreateRequest(BaseModel):
    phone_number: str = Field(..., example="+918045678900", description="Indian E.164 phone number")
    friendly_name: Optional[str] = Field(default="Primary Caller Line", description="Label for this line")
    concurrency_limit: int = Field(default=1, ge=1, le=50, description="Allocated channels / simultaneous lines")
    dlt_entity_id: Optional[str] = Field(default=None, description="TRAI DLT Principal Entity ID")
    dlt_sender_id: Optional[str] = Field(default=None, description="TRAI DLT 6-character Sender Header")
    assigned_agent_id: Optional[int] = Field(default=None, description="Optional default AI Agent for inbound calls")


class ChannelResponse(BaseModel):
    id: int
    phone_number: str
    friendly_name: str
    concurrency_limit: int
    dlt_entity_id: Optional[str] = None
    dlt_sender_id: Optional[str] = None
    assigned_agent_id: Optional[int] = None
    is_active: bool

    class Config:
        from_attributes = True


class LiveConcurrencyResponse(BaseModel):
    active_calls_count: int
    burn_rate_inr_per_min: float
    total_channels: int
    channels_utilized_pct: float
    status_label: str  # e.g. "0 on calls · 0.0/min"


@router.get("", response_model=List[ChannelResponse])
async def list_channels(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Workspace ke saare allocated channels aur dedicated phone numbers list karta hai."""
    res = await db.execute(
        select(Channel)
        .where(Channel.workspace_id == current_user.workspace_id)
        .order_by(Channel.id.asc())
    )
    return res.scalars().all()


@router.post("", response_model=ChannelResponse, status_code=status.HTTP_201_CREATED)
async def allocate_channel(
    payload: ChannelCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Naya dedicated business phone number aur concurrency channel allocate karta hai."""
    # Check if number already registered
    existing = await db.execute(select(Channel).where(Channel.phone_number == payload.phone_number))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Phone number '{payload.phone_number}' is already allocated to a workspace"
        )

    channel = Channel(
        workspace_id=current_user.workspace_id,
        phone_number=payload.phone_number,
        friendly_name=payload.friendly_name or "Primary Caller Line",
        concurrency_limit=payload.concurrency_limit,
        dlt_entity_id=payload.dlt_entity_id,
        dlt_sender_id=payload.dlt_sender_id,
        assigned_agent_id=payload.assigned_agent_id,
        is_active=True
    )
    db.add(channel)
    await db.commit()
    await db.refresh(channel)
    return channel


@router.get("/live", response_model=LiveConcurrencyResponse)
async def get_live_concurrency_ticker(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Outpero Live Ticker: Returns '• 0 on calls · 0.0/min' matching the top bar.
    """
    # Count calls currently in-progress or initiated
    active_calls_res = await db.execute(
        select(func.count(Call.id)).where(
            Call.workspace_id == current_user.workspace_id,
            Call.status.in_(["initiated", "ringing", "in-progress"])
        )
    )
    active_calls = active_calls_res.scalar_one() or 0

    # Total channels capacity
    tot_channels_res = await db.execute(
        select(func.coalesce(func.sum(Channel.concurrency_limit), 5)).where(
            Channel.workspace_id == current_user.workspace_id,
            Channel.is_active == True
        )
    )
    total_channels = tot_channels_res.scalar_one() or 5

    # Outpero standard rate: ₹5.50 per active minute
    burn_rate = round(active_calls * 5.5, 1)
    utilization = round((active_calls / total_channels * 100), 1) if total_channels > 0 else 0.0
    status_label = f"• {active_calls} on calls · {burn_rate}/min"

    return LiveConcurrencyResponse(
        active_calls_count=active_calls,
        burn_rate_inr_per_min=burn_rate,
        total_channels=total_channels,
        channels_utilized_pct=utilization,
        status_label=status_label
    )
