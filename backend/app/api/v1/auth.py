"""
NexoAgent - Multi-Tenant Authentication Router
Endpoints for user registration (workspace creation), login, and profile lookup.
"""
import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.deps import get_current_user, get_current_workspace
from app.models import Workspace, User
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    UserResponse,
    WorkspaceResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def generate_slug(name: str) -> str:
    """Generates a clean URL slug from company name."""
    clean = re.sub(r"[^\w\s-]", "", name.lower())
    return re.sub(r"[-\s]+", "-", clean).strip("-")


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_workspace_admin(
    payload: UserRegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Naya Workspace aur uska Admin User create karta hai.
    Sath me ₹500 free calling balance allocate hota hai.
    """
    # 1. Check if email already registered
    existing_user = await db.execute(select(User).where(User.email == payload.email))
    if existing_user.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists"
        )

    # 2. Generate unique slug
    base_slug = generate_slug(payload.company_name)
    slug = base_slug
    counter = 1
    while True:
        existing_ws = await db.execute(select(Workspace).where(Workspace.slug == slug))
        if not existing_ws.scalar_one_or_none():
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    # 3. Create Workspace
    workspace = Workspace(
        name=payload.company_name,
        slug=slug,
        balance_inr=500.0,
        is_active=True
    )
    db.add(workspace)
    await db.flush()

    # 4. Create Admin User
    user = User(
        workspace_id=workspace.id,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        role="admin",
        is_active=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    await db.refresh(workspace)

    # 5. Issue JWT Token
    token_data = {"sub": str(user.id), "workspace_id": workspace.id}
    access_token = create_access_token(data=token_data)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
        workspace=WorkspaceResponse.model_validate(workspace)
    )


@router.post("/login", response_model=TokenResponse)
async def login_user(
    payload: UserLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """User login verify karke JWT access token return karta hai."""
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive"
        )

    # Fetch workspace
    ws_res = await db.execute(select(Workspace).where(Workspace.id == user.workspace_id))
    workspace = ws_res.scalar_one_or_none()

    token_data = {"sub": str(user.id), "workspace_id": user.workspace_id}
    access_token = create_access_token(data=token_data)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
        workspace=WorkspaceResponse.model_validate(workspace)
    )


@router.get("/me")
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    workspace: Workspace = Depends(get_current_workspace)
):
    """Current authenticated user aur unka workspace profile return karta hai."""
    return {
        "user": UserResponse.model_validate(current_user),
        "workspace": WorkspaceResponse.model_validate(workspace)
    }
