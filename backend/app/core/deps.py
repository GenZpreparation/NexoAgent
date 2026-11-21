"""
NexoAgent - Authentication & Multi-Tenant Dependency Injectors
Provides get_current_user and get_current_workspace for route protection.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models import User, Workspace

import hashlib
from datetime import datetime, timezone
from typing import Optional
from fastapi import Depends, HTTPException, Header, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models import User, Workspace, ApiKey

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)


async def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    x_api_key: Optional[str] = Header(default=None, alias="X-API-Key"),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dual Authentication Resolver:
    1. Checks if Developer API Key is passed via `X-API-Key` or `Bearer nexo_live_...`
    2. Fallbacks to standard JWT Bearer token authentication.
    Strictly isolated per workspace.
    """
    # Check for API Key in header or bearer token
    api_key_candidate = x_api_key
    if not api_key_candidate and token and token.startswith("nexo_live_"):
        api_key_candidate = token

    if api_key_candidate:
        hashed = hashlib.sha256(api_key_candidate.strip().encode("utf-8")).hexdigest()
        key_res = await db.execute(
            select(ApiKey).where(ApiKey.hashed_key == hashed, ApiKey.is_active == True)
        )
        api_key_obj = key_res.scalar_one_or_none()
        if not api_key_obj:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or revoked Developer API Key",
                headers={"WWW-Authenticate": "ApiKey"},
            )

        # Update last used timestamp
        api_key_obj.last_used_at = datetime.now(timezone.utc)
        await db.commit()

        # Resolve representative admin user for this workspace
        user_res = await db.execute(
            select(User)
            .where(User.workspace_id == api_key_obj.workspace_id)
            .order_by(User.id.asc())
        )
        user = user_res.scalars().first()
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Workspace user inactive")
        return user

    # JWT Authentication Path
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Provide Bearer JWT token or X-API-Key.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception
    
    user_id_str: str = payload.get("sub")
    if not user_id_str:
        raise credentials_exception
    
    try:
        user_id = int(user_id_str)
    except ValueError:
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    
    return user


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """RBAC Guard: Enforces Admin role for critical tenant operations."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Admin privilege required for this operation."
        )
    return current_user


async def get_current_workspace(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Workspace:
    """Current authenticated user ka isolated workspace return karta hai."""
    result = await db.execute(select(Workspace).where(Workspace.id == current_user.workspace_id))
    workspace = result.scalar_one_or_none()
    if not workspace or not workspace.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found or inactive")
    return workspace

