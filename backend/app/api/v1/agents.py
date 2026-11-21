"""
NexoAgent - Voice Agent Studio CRUD Router
Allows businesses to build, configure, list, update, and delete AI Voice Agents with strict tenant isolation.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import User, VoiceAgent
from app.schemas.agent import AgentCreateRequest, AgentUpdateRequest, AgentResponse

router = APIRouter(prefix="/agents", tags=["Voice Agent Studio"])


@router.post("", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
async def create_voice_agent(
    payload: AgentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Naya Voice Agent banata hai jo automatically current user ke
    workspace_id se bind hota hai.
    """
    agent = VoiceAgent(
        workspace_id=current_user.workspace_id,
        name=payload.name,
        system_prompt=payload.system_prompt,
        first_message=payload.first_message,
        voice_provider=payload.voice_provider,
        voice_id=payload.voice_id,
        language=payload.language,
        temperature=payload.temperature,
        is_active=True
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return agent


@router.get("", response_model=List[AgentResponse])
async def list_voice_agents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Current user ke workspace ke saare voice agents list karta hai."""
    result = await db.execute(
        select(VoiceAgent)
        .where(VoiceAgent.workspace_id == current_user.workspace_id)
        .order_by(VoiceAgent.id.desc())
    )
    agents = result.scalars().all()
    return agents


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_voice_agent(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Single agent details return karta hai.
    Agar agent doosre workspace ka hai to safe 404 deta hai.
    """
    result = await db.execute(
        select(VoiceAgent).where(
            VoiceAgent.id == agent_id,
            VoiceAgent.workspace_id == current_user.workspace_id
        )
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Voice agent with ID {agent_id} not found"
        )
    return agent


@router.patch("/{agent_id}", response_model=AgentResponse)
async def update_voice_agent(
    agent_id: int,
    payload: AgentUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Agent ke system prompt, voice, language, ya first message ko update karta hai."""
    result = await db.execute(
        select(VoiceAgent).where(
            VoiceAgent.id == agent_id,
            VoiceAgent.workspace_id == current_user.workspace_id
        )
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Voice agent with ID {agent_id} not found"
        )

    # Partial update: sirf un fields ko update karo jo request me aayi hain
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(agent, field, value)

    await db.commit()
    await db.refresh(agent)
    return agent


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_voice_agent(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Voice agent ko permanently delete karta hai (tenant-isolated)."""
    result = await db.execute(
        select(VoiceAgent).where(
            VoiceAgent.id == agent_id,
            VoiceAgent.workspace_id == current_user.workspace_id
        )
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Voice agent with ID {agent_id} not found"
        )

    await db.delete(agent)
    await db.commit()
    return None


@router.post("/{agent_id}/duplicate", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
async def duplicate_voice_agent(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    1-Click Agent Cloning / A-B Testing:
    Duplicates an existing agent with a new '(Copy)' name in the same workspace.
    """
    result = await db.execute(
        select(VoiceAgent).where(
            VoiceAgent.id == agent_id,
            VoiceAgent.workspace_id == current_user.workspace_id
        )
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Voice agent with ID {agent_id} not found in your workspace"
        )

    cloned_agent = VoiceAgent(
        workspace_id=current_user.workspace_id,
        name=f"{agent.name} (Copy)",
        system_prompt=agent.system_prompt,
        first_message=agent.first_message,
        voice_provider=agent.voice_provider,
        voice_id=agent.voice_id,
        language=agent.language,
        temperature=agent.temperature,
        is_active=True
    )
    db.add(cloned_agent)
    await db.commit()
    await db.refresh(cloned_agent)
    return cloned_agent

