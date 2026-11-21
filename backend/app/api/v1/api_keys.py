"""
NexoAgent - Developer API Key Management Router
Allows workspace admins to generate, list, and revoke programmatic API keys (nexo_live_...)
for external CRM integrations and automated dialing pipelines.
"""
import secrets
import hashlib
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models import User, ApiKey

router = APIRouter(prefix="/api-keys", tags=["Developer API Keys"])


class ApiKeyCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, example="Salesforce CRM Integration Key")


class ApiKeyCreatedResponse(BaseModel):
    id: int
    name: str
    key_prefix: str
    api_key: str = Field(..., description="Full secret key. Revealed once upon generation!")
    created_at: datetime
    message: str = "Store this secret key safely. You will not be able to view it again."


class ApiKeyItemResponse(BaseModel):
    id: int
    name: str
    key_prefix: str
    is_active: bool
    created_at: datetime
    last_used_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.post("", response_model=ApiKeyCreatedResponse, status_code=status.HTTP_201_CREATED)
async def generate_api_key(
    payload: ApiKeyCreateRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Naya Developer API Key banata hai (nexo_live_...).
    Full key sirf ek baar response me aati hai, DB me sirf SHA-256 hash store hota hai.
    """
    raw_secret = f"nexo_live_{secrets.token_hex(20)}"
    prefix = f"{raw_secret[:14]}..."
    hashed = hashlib.sha256(raw_secret.encode("utf-8")).hexdigest()

    api_key_obj = ApiKey(
        workspace_id=current_user.workspace_id,
        name=payload.name,
        key_prefix=prefix,
        hashed_key=hashed,
        is_active=True
    )
    db.add(api_key_obj)
    await db.commit()
    await db.refresh(api_key_obj)

    return {
        "id": api_key_obj.id,
        "name": api_key_obj.name,
        "key_prefix": api_key_obj.key_prefix,
        "api_key": raw_secret,
        "created_at": api_key_obj.created_at,
        "message": "Store this secret key safely. You will not be able to view it again."
    }


@router.get("", response_model=List[ApiKeyItemResponse])
async def list_api_keys(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Current workspace ke saare active API keys list karta hai (without exposing secret)."""
    result = await db.execute(
        select(ApiKey)
        .where(ApiKey.workspace_id == current_user.workspace_id, ApiKey.is_active == True)
        .order_by(ApiKey.id.desc())
    )
    return result.scalars().all()


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_api_key(
    key_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """API key ko permanently revoke karta hai."""
    result = await db.execute(
        select(ApiKey).where(
            ApiKey.id == key_id,
            ApiKey.workspace_id == current_user.workspace_id
        )
    )
    key_obj = result.scalar_one_or_none()
    if not key_obj:
        raise HTTPException(status_code=404, detail="API key not found")

    key_obj.is_active = False
    await db.commit()
    return None
