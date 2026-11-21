"""
NexoAgent - Call Ledger & Call History Router
Provides paginated call logs, recording URLs, billing breakdowns, and AI analytics.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import User, Call, CallLog
from app.schemas.call import CallResponse, CallListResponse
from app.services.intelligence import intelligence_service, CallAnalyticsResult
from app.services.storage import recording_storage

router = APIRouter(prefix="/calls", tags=["Call Ledger & Analytics"])


@router.get("", response_model=CallListResponse)
async def list_calls(
    call_status: Optional[str] = Query(default=None, alias="status", description="Filter by status (e.g. completed, busy)"),
    agent_id: Optional[int] = Query(default=None, description="Filter by agent ID"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Current user ke workspace ke saare calls list karta hai
    with pagination, status filter, and eager-loaded CallLog.
    """
    # 1. Base query with strict tenant isolation
    query = select(Call).where(Call.workspace_id == current_user.workspace_id)
    count_query = select(func.count(Call.id)).where(Call.workspace_id == current_user.workspace_id)

    if call_status:
        query = query.where(Call.status == call_status)
        count_query = count_query.where(Call.status == call_status)

    if agent_id:
        query = query.where(Call.agent_id == agent_id)
        count_query = count_query.where(Call.agent_id == agent_id)

    # Total count
    total_res = await db.execute(count_query)
    total = total_res.scalar_one()

    # Paginated results with eager-loaded log
    query = query.options(selectinload(Call.log)).order_by(Call.id.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    calls = result.scalars().all()

    return CallListResponse(
        total=total,
        items=calls
    )


@router.get("/{call_id}", response_model=CallResponse)
async def get_call_details(
    call_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Single call details aur AI transcript/sentiment log fetch karta hai.
    Tenant isolation enforced (doosre workspace ki call 404 degi).
    """
    result = await db.execute(
        select(Call)
        .options(selectinload(Call.log))
        .where(
            Call.id == call_id,
            Call.workspace_id == current_user.workspace_id
        )
    )
    call = result.scalar_one_or_none()
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Call with ID {call_id} not found"
        )
    return call


@router.post("/{call_id}/analyze", response_model=CallResponse)
async def analyze_call_ai(
    call_id: int,
    transcript: Optional[str] = Body(default=None, embed=True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Call transcript ko Groq LLM intelligence engine me process karke
    summary, sentiment, aur extracted variables CallLog me persist karta hai.
    """
    result = await db.execute(
        select(Call)
        .options(selectinload(Call.log))
        .where(
            Call.id == call_id,
            Call.workspace_id == current_user.workspace_id
        )
    )
    call = result.scalar_one_or_none()
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Call with ID {call_id} not found"
        )

    # Transcript determine karo
    text_to_analyze = transcript or (call.log.transcript if call.log else "")
    if not text_to_analyze:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No transcript available to analyze"
        )

    # Run AI Intelligence extraction
    analytics: CallAnalyticsResult = await intelligence_service.analyze_transcript(text_to_analyze)

    # Persist into CallLog
    if not call.log:
        call.log = CallLog(call_id=call.id)
        db.add(call.log)

    call.log.transcript = text_to_analyze
    call.log.summary = analytics.summary
    call.log.sentiment = analytics.sentiment
    call.log.extracted_data = {
        **analytics.extracted_variables,
        "lead_interest": analytics.lead_interest,
        "action_items": analytics.action_items
    }

    await db.commit()
    await db.refresh(call)
    await db.refresh(call.log)
    return call


@router.get("/{call_id}/recording")
async def get_call_recording_stream(
    call_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Call recording MP3 audio ke liye time-limited (15-min) secure
    presigned streaming URL generate karta hai.
    Tenant isolation enforced (DLF cannot stream Godrej's audio).
    """
    result = await db.execute(
        select(Call).where(
            Call.id == call_id,
            Call.workspace_id == current_user.workspace_id
        )
    )
    call = result.scalar_one_or_none()
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Call with ID {call_id} not found"
        )

    if not call.recording_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio recording not available for this call"
        )

    streaming_url = recording_storage.generate_streaming_url(call.recording_url)

    return {
        "call_id": call.id,
        "call_sid": call.call_sid,
        "streaming_url": streaming_url,
        "expires_in_seconds": 900
    }
