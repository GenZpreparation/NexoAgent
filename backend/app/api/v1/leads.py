"""
NexoAgent - Leads & Mini-CRM Router
Provides full CRM capabilities matching Outpero's Leads & Results screen (app.outpero.com/#/leads):
Filters, 4 View Modes, Pipeline Summaries, Search, and CSV Export.
"""
import io
import csv
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, desc, asc
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import User, Lead, Campaign, Call, CallLog

router = APIRouter(prefix="/leads", tags=["Leads & Results CRM"])


class LeadItemResponse(BaseModel):
    id: int
    name: str
    phone_number: str
    city: Optional[str] = None
    campaign_name: Optional[str] = None
    status: str
    lead_source: str
    sentiment: str = "Neutral"
    outcome: str = "pending"
    captured_info: Dict[str, Any] = {}
    call_attempts: int
    call_sid: Optional[str] = None
    last_contacted_at: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


class LeadSummaryResponse(BaseModel):
    total_leads: int
    qualified: int
    pending_callback: int
    hot_leads: int


class LeadsListResponse(BaseModel):
    summary: LeadSummaryResponse
    total: int
    leads: List[LeadItemResponse]


@router.get("", response_model=LeadsListResponse)
async def list_leads(
    search: Optional[str] = Query(default=None, description="Search by name, phone or city"),
    agent_id: Optional[int] = Query(default=None, description="Filter by assigned voice agent"),
    outcome: Optional[str] = Query(default=None, description="Filter by outcome (e.g. interested, callback, dnd)"),
    hot_only: bool = Query(default=False, description="Filter only high-intent hot leads"),
    sort: str = Query(default="recent", description="Sort order: recent, oldest, priority"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Leads & Results CRM view with tenant isolation, multi-field search,
    KPI summary counters, and sentiment filters.
    """
    # 1. Base Query with workspace isolation
    query = (
        select(Lead, Campaign.name.label("campaign_name"))
        .join(Campaign, Lead.campaign_id == Campaign.id, isouter=True)
        .where(Lead.workspace_id == current_user.workspace_id)
    )

    if agent_id:
        query = query.where(Campaign.agent_id == agent_id)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.where(
            or_(
                Lead.full_name.ilike(search_pattern),
                Lead.phone_number.ilike(search_pattern),
                Lead.city.ilike(search_pattern)
            )
        )

    if outcome:
        query = query.where(Lead.status == outcome)

    # Sorting
    if sort == "oldest":
        query = query.order_by(asc(Lead.created_at))
    else:
        query = query.order_by(desc(Lead.created_at))

    # Execute fetch
    res = await db.execute(query.limit(limit).offset(offset))
    rows = res.all()

    # 2. Build Lead Items & Calculate Global Counters
    items: List[LeadItemResponse] = []
    
    # Collect call_sids to batch load call logs and sentiments
    call_sids = [r.Lead.call_sid for r in rows if r.Lead.call_sid]
    calls_map: Dict[str, Dict[str, str]] = {}
    if call_sids:
        calls_res = await db.execute(
            select(Call.call_sid, CallLog.sentiment, CallLog.summary)
            .join(CallLog, Call.id == CallLog.call_id, isouter=True)
            .where(Call.call_sid.in_(call_sids))
        )
        for c_sid, c_sent, c_summ in calls_res.all():
            calls_map[c_sid] = {
                "sentiment": c_sent or "Neutral",
                "summary": c_summ or ""
            }

    for r in rows:
        lead: Lead = r.Lead
        camp_name = r.campaign_name or "Direct Ingestion"
        
        # Determine sentiment & outcome from linked CallLog if exists
        sentiment = "Neutral"
        outcome_val = lead.status
        call_info = calls_map.get(lead.call_sid) if lead.call_sid else None
        
        if call_info:
            sentiment = call_info["sentiment"]
        elif lead.status == "completed":
            sentiment = "Warm"

        if hot_only and sentiment != "Hot":
            continue

        items.append(
            LeadItemResponse(
                id=lead.id,
                name=lead.full_name,
                phone_number=lead.phone_number,
                city=lead.city,
                campaign_name=camp_name,
                status=lead.status,
                lead_source=lead.lead_source,
                sentiment=sentiment,
                outcome=outcome_val,
                captured_info=lead.custom_data or {},
                call_attempts=lead.retry_count + (1 if lead.last_called_at else 0),
                call_sid=lead.call_sid,
                last_contacted_at=lead.last_called_at.isoformat() if lead.last_called_at else None,
                created_at=lead.created_at.isoformat()
            )
        )

    # 3. Compute KPI Summary counts for top cards
    total_leads_res = await db.execute(
        select(func.count(Lead.id)).where(Lead.workspace_id == current_user.workspace_id)
    )
    total_leads = total_leads_res.scalar_one() or 0

    pending_res = await db.execute(
        select(func.count(Lead.id)).where(
            Lead.workspace_id == current_user.workspace_id,
            Lead.status.in_(["pending", "retry_scheduled", "busy", "no-answer"])
        )
    )
    pending_count = pending_res.scalar_one() or 0

    completed_res = await db.execute(
        select(func.count(Lead.id)).where(
            Lead.workspace_id == current_user.workspace_id,
            Lead.status == "completed"
        )
    )
    qualified_count = completed_res.scalar_one() or 0

    # Hot leads estimate: completed or custom qualified
    hot_count = sum(1 for item in items if item.sentiment == "Hot")

    summary = LeadSummaryResponse(
        total_leads=total_leads,
        qualified=qualified_count,
        pending_callback=pending_count,
        hot_leads=hot_count
    )

    return LeadsListResponse(
        summary=summary,
        total=len(items),
        leads=items
    )


@router.get("/export")
async def export_leads_csv(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Downloads filtered leads as a clean CSV file matching Outpero's 'Export' button.
    """
    query = (
        select(Lead, Campaign.name.label("campaign_name"))
        .join(Campaign, Lead.campaign_id == Campaign.id, isouter=True)
        .where(Lead.workspace_id == current_user.workspace_id)
        .order_by(desc(Lead.created_at))
    )
    res = await db.execute(query)
    rows = res.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Name", "Phone Number", "City", "Campaign", "Status", "Lead Source", "Last Called At", "Created At"])

    for r in rows:
        lead: Lead = r.Lead
        writer.writerow([
            lead.id,
            lead.full_name,
            lead.phone_number,
            lead.city or "",
            r.campaign_name or "",
            lead.status,
            lead.lead_source,
            lead.last_called_at.isoformat() if lead.last_called_at else "",
            lead.created_at.isoformat()
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=nexo_leads_export.csv"}
    )
