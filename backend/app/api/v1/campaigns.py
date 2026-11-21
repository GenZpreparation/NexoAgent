"""
NexoAgent - Campaign Management & CSV Ingestion Router
Allows businesses to manage outbound campaigns, upload 5,000+ lead CSVs,
and trigger paced calling runs.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import User, Campaign, Lead, VoiceAgent
from app.schemas.campaign import (
    CampaignCreateRequest,
    CampaignResponse,
    LeadResponse
)
from app.services.campaign import campaign_engine
from app.services.wallet import wallet_service

router = APIRouter(prefix="/campaigns", tags=["Bulk Campaigns"])


@router.post("", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(
    payload: CampaignCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Naya Outbound Campaign create karta hai."""
    # Verify agent belongs to this workspace
    agent_res = await db.execute(
        select(VoiceAgent).where(
            VoiceAgent.id == payload.agent_id,
            VoiceAgent.workspace_id == current_user.workspace_id
        )
    )
    agent = agent_res.scalar_one_or_none()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Voice agent not found in your workspace"
        )
    if not agent.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Voice agent '{agent.name}' is currently paused/deactivated. Cannot bind to campaign."
        )

    campaign = Campaign(
        workspace_id=current_user.workspace_id,
        agent_id=payload.agent_id,
        name=payload.name,
        concurrency_limit=payload.concurrency_limit,
        status="draft"
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    return campaign


@router.get("", response_model=List[CampaignResponse])
async def list_campaigns(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Current workspace ke saare campaigns list karta hai."""
    result = await db.execute(
        select(Campaign)
        .where(Campaign.workspace_id == current_user.workspace_id)
        .order_by(Campaign.id.desc())
    )
    return result.scalars().all()


@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Single campaign details aur progress counters fetch karta hai."""
    result = await db.execute(
        select(Campaign).where(
            Campaign.id == campaign_id,
            Campaign.workspace_id == current_user.workspace_id
        )
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


@router.post("/{campaign_id}/upload-csv")
async def upload_leads_csv(
    campaign_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    CSV file upload karke leads ingest karta hai.
    Sanitizes numbers (+91), removes duplicates, scrubs DND.
    """
    # Verify campaign exists
    camp_res = await db.execute(
        select(Campaign).where(
            Campaign.id == campaign_id,
            Campaign.workspace_id == current_user.workspace_id
        )
    )
    campaign = camp_res.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    content_bytes = await file.read()
    csv_text = content_bytes.decode("utf-8", errors="ignore")

    stats = await campaign_engine.ingest_leads_from_csv(
        campaign_id=campaign.id,
        workspace_id=current_user.workspace_id,
        csv_content=csv_text,
        db=db
    )
    return {
        "status": "success",
        "campaign_id": campaign.id,
        **stats
    }


@router.post("/{campaign_id}/start")
async def start_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Campaign ko start karta hai aur initial batch of calls dispatch karta hai."""
    result = await db.execute(
        select(Campaign).where(
            Campaign.id == campaign_id,
            Campaign.workspace_id == current_user.workspace_id
        )
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Pre-Dial Wallet Balance Enforcer
    has_bal = await wallet_service.has_sufficient_balance(
        workspace_id=current_user.workspace_id,
        min_threshold_inr=10.0,
        db=db
    )
    if not has_bal:
        curr_bal = await wallet_service.get_balance(current_user.workspace_id, db)
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Cannot start campaign. Insufficient wallet balance (₹{curr_bal}). Minimum ₹10.00 required. Please recharge your wallet."
        )

    campaign.status = "running"
    await db.commit()

    # Dispatch first batch respecting concurrency limit
    batch_res = await campaign_engine.dispatch_next_batch(
        campaign_id=campaign.id,
        workspace_id=current_user.workspace_id,
        db=db
    )
    return {
        "status": "campaign_running",
        "campaign_id": campaign.id,
        "concurrency_limit": campaign.concurrency_limit,
        **batch_res
    }


@router.get("/{campaign_id}/leads", response_model=List[LeadResponse])
async def list_campaign_leads(
    campaign_id: int,
    lead_status: Optional[str] = Query(default=None, alias="status"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Campaign ke leads ko list karta hai with status filter."""
    query = select(Lead).where(
        Lead.campaign_id == campaign_id,
        Lead.workspace_id == current_user.workspace_id
    )
    if lead_status:
        query = query.where(Lead.status == lead_status)
    query = query.order_by(Lead.id.asc()).limit(limit).offset(offset)
    res = await db.execute(query)
    return res.scalars().all()


@router.post("/{campaign_id}/dispatch-retries")
async def dispatch_campaign_retries(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Campaign ke due retry leads (status=retry_scheduled, now >= next_retry_at)
    ko auto-dial karta hai respecting TRAI calling hours.
    """
    res = await campaign_engine.dispatch_due_retries(
        campaign_id=campaign_id,
        workspace_id=current_user.workspace_id,
        db=db
    )
    return {
        "campaign_id": campaign_id,
        **res
    }

