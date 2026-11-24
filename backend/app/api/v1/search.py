"""
NexoAgent - Global Search Router (Ctrl + K)
Powers the top search bar seen in Outpero's sidebar:
Unified instant search across AI Employees, Leads, Campaigns, and Call Records.
"""
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import User, VoiceAgent, Lead, Campaign, Call

router = APIRouter(prefix="/search", tags=["Global Quick Search (Ctrl+K)"])


class SearchResultItem(BaseModel):
    category: str  # "employee", "lead", "campaign", "call"
    id: int
    title: str
    subtitle: Optional[str] = None
    url: str


class SearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[SearchResultItem]


@router.get("", response_model=SearchResponse)
async def global_quick_search(
    q: str = Query(..., min_length=1, max_length=100, description="Search query string"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Outpero Ctrl+K Quick Search:
    Searches across AI Employees, Leads, Campaigns and Calls within user's workspace.
    """
    clean_q = q.strip()
    pattern = f"%{clean_q}%"
    results: List[SearchResultItem] = []

    # 1. Search AI Employees (VoiceAgent)
    agents_res = await db.execute(
        select(VoiceAgent).where(
            VoiceAgent.workspace_id == current_user.workspace_id,
            VoiceAgent.name.ilike(pattern)
        ).limit(5)
    )
    for a in agents_res.scalars().all():
        results.append(
            SearchResultItem(
                category="employee",
                id=a.id,
                title=a.name,
                subtitle=f"Voice: {a.voice_id} ({a.language})",
                url=f"/dashboard/agents/{a.id}"
            )
        )

    # 2. Search Leads
    leads_res = await db.execute(
        select(Lead).where(
            Lead.workspace_id == current_user.workspace_id,
            or_(
                Lead.full_name.ilike(pattern),
                Lead.phone_number.ilike(pattern),
                Lead.city.ilike(pattern)
            )
        ).limit(5)
    )
    for l in leads_res.scalars().all():
        results.append(
            SearchResultItem(
                category="lead",
                id=l.id,
                title=f"{l.full_name} ({l.phone_number})",
                subtitle=f"Status: {l.status} | Source: {l.lead_source}",
                url=f"/dashboard/leads?search={l.phone_number}"
            )
        )

    # 3. Search Campaigns
    camps_res = await db.execute(
        select(Campaign).where(
            Campaign.workspace_id == current_user.workspace_id,
            Campaign.name.ilike(pattern)
        ).limit(5)
    )
    for c in camps_res.scalars().all():
        results.append(
            SearchResultItem(
                category="campaign",
                id=c.id,
                title=c.name,
                subtitle=f"Status: {c.status} | Concurrency: {c.concurrency_limit}",
                url=f"/dashboard/campaigns/{c.id}"
            )
        )

    # 4. Search Calls
    calls_res = await db.execute(
        select(Call).where(
            Call.workspace_id == current_user.workspace_id,
            or_(
                Call.customer_phone.ilike(pattern),
                Call.call_sid.ilike(pattern)
            )
        ).limit(5)
    )
    for cl in calls_res.scalars().all():
        results.append(
            SearchResultItem(
                category="call",
                id=cl.id,
                title=f"Call to {cl.customer_phone}",
                subtitle=f"SID: {cl.call_sid} | Duration: {cl.duration_seconds}s | Status: {cl.status}",
                url=f"/dashboard/calls/{cl.id}"
            )
        )

    return SearchResponse(
        query=clean_q,
        total_results=len(results),
        results=results
    )
