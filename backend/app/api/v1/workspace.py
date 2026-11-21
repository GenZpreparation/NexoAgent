"""
NexoAgent - Workspace Profile & Team Members Management Router
Allows Workspace Admins to invite team members, assign RBAC roles (admin, manager, member),
and manage organization settings with strict tenant isolation.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.core.security import get_password_hash
from app.models import User, Workspace

router = APIRouter(prefix="/workspace", tags=["Workspace & Team Management"])


class MemberInviteRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100, example="Amit Roy")
    email: EmailStr = Field(..., example="amit.manager@dlf.com")
    password: str = Field(..., min_length=6, max_length=50, example="ManagerPass123!")
    role: str = Field(default="manager", example="manager", description="admin, manager, member")


class MemberUpdateRequest(BaseModel):
    role: Optional[str] = Field(default=None, example="admin")
    is_active: Optional[bool] = None


class MemberResponse(BaseModel):
    id: int
    workspace_id: int
    full_name: str
    email: EmailStr
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class WorkspaceProfileResponse(BaseModel):
    id: int
    name: str
    slug: str
    balance_inr: float
    is_active: bool
    total_members: int

    class Config:
        from_attributes = True


@router.get("/profile", response_model=WorkspaceProfileResponse)
async def get_workspace_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Current workspace organization profile aur member count return karta hai."""
    ws_res = await db.execute(select(Workspace).where(Workspace.id == current_user.workspace_id))
    ws = ws_res.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    members_res = await db.execute(select(User).where(User.workspace_id == current_user.workspace_id))
    members = members_res.scalars().all()

    return {
        "id": ws.id,
        "name": ws.name,
        "slug": ws.slug,
        "balance_inr": ws.balance_inr,
        "is_active": ws.is_active,
        "total_members": len(members)
    }


@router.post("/members", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
async def invite_team_member(
    payload: MemberInviteRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Naya Team Member invite karta hai with RBAC role (admin, manager, member).
    Sirf Workspace Admin hi naye members ko invite kar sakta hai.
    """
    if payload.role not in ["admin", "manager", "member"]:
        raise HTTPException(status_code=400, detail="Role must be one of: admin, manager, member")

    # Check email duplicate across system
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_user = User(
        workspace_id=current_user.workspace_id,
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
        is_active=True
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


@router.get("/members", response_model=List[MemberResponse])
async def list_team_members(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Workspace ke saare teammates list karta hai."""
    res = await db.execute(
        select(User)
        .where(User.workspace_id == current_user.workspace_id)
        .order_by(User.id.asc())
    )
    return res.scalars().all()


@router.patch("/members/{user_id}", response_model=MemberResponse)
async def update_team_member(
    user_id: int,
    payload: MemberUpdateRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Team member ka role ya status update karta hai (Admin only)."""
    res = await db.execute(
        select(User).where(
            User.id == user_id,
            User.workspace_id == current_user.workspace_id
        )
    )
    member = res.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found in your workspace")

    if payload.role is not None:
        if payload.role not in ["admin", "manager", "member"]:
            raise HTTPException(status_code=400, detail="Invalid role")
        member.role = payload.role

    if payload.is_active is not None:
        if member.id == current_user.id and payload.is_active is False:
            raise HTTPException(status_code=400, detail="Admin cannot deactivate their own account")
        member.is_active = payload.is_active

    await db.commit()
    await db.refresh(member)
    return member


@router.delete("/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_team_member(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Team member ko workspace se remove karta hai (Admin only)."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Admin cannot remove themselves from workspace")

    res = await db.execute(
        select(User).where(
            User.id == user_id,
            User.workspace_id == current_user.workspace_id
        )
    )
    member = res.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found in your workspace")

    await db.delete(member)
    await db.commit()
    return None
