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
from app.models import User, Call, CallLog, VoiceAgent
from app.schemas.call import CallResponse, CallListResponse, CallDispatchRequest, CallDispatchResponse
from app.services.intelligence import intelligence_service, CallAnalyticsResult
from app.services.storage import recording_storage
from app.services.wallet import wallet_service
from app.services.telephony import telephony_service
from app.services.campaign import campaign_engine

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


@router.post("/dispatch", response_model=CallDispatchResponse, status_code=status.HTTP_201_CREATED)
async def dispatch_single_call(
    payload: CallDispatchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Direct Single Outbound Call Dispatcher with Pre-Dial Balance Guard.
    Checks wallet balance >= ₹10.00 before dialing carrier SIP trunk.
    """
    # 1. Pre-Dial Wallet Balance Enforcer
    has_bal = await wallet_service.has_sufficient_balance(
        workspace_id=current_user.workspace_id,
        min_threshold_inr=10.0,
        db=db
    )
    if not has_bal:
        curr_bal = await wallet_service.get_balance(current_user.workspace_id, db)
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Insufficient wallet balance (₹{curr_bal}). Minimum ₹10.00 required to place a call. Please recharge your wallet."
        )

    # 2. Verify agent belongs to this workspace
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

    # Agent Active State Guard (Complete HR Control)
    if not agent.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Voice agent '{agent.name}' is currently paused/deactivated. Please activate it in Agent Studio before dialing."
        )

    # 3. E.164 Phone Sanitization & DND Scrubbing
    try:
        clean_phone = telephony_service.sanitize_phone_number(payload.phone_number)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    if campaign_engine.is_dnd_registered(clean_phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number is registered on TRAI DND registry. Telemarketing dialing prohibited."
        )

    # 4. Dial outbound call via carrier
    call_res = telephony_service.initiate_outbound_call(clean_phone)
    call_sid = call_res.get("call_id")

    # 5. Persist initial Call row
    call = Call(
        call_sid=call_sid,
        workspace_id=current_user.workspace_id,
        agent_id=agent.id,
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
        summary=f"Direct Single Dial by user {current_user.email}",
        sentiment="Neutral",
        extracted_data={},
        whatsapp_status="none"
    )
    db.add(call_log)
    await db.commit()

    return CallDispatchResponse(
        status="dispatched",
        call_sid=call_sid,
        customer_phone=clean_phone,
        agent_id=agent.id,
        workspace_id=current_user.workspace_id
    )

