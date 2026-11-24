"""
NexoAgent - Main FastAPI Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.database import engine, Base
import app.models  # Ensures all models are registered
from app.api.v1.webhooks import router as webhooks_router
from app.api.v1.auth import router as auth_router
from app.api.v1.agents import router as agents_router
from app.api.v1.calls import router as calls_router
from app.api.v1.whatsapp import router as whatsapp_router
from app.api.v1.campaigns import router as campaigns_router
from app.api.v1.billing import router as billing_router
from app.api.v1.api_keys import router as api_keys_router
from app.api.v1.integrations import router as integrations_router
from app.api.v1.workspace import router as workspace_router
from app.api.v1.leads import router as leads_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.channels import router as channels_router
from app.api.v1.voices import router as voices_router
from app.api.v1.search import router as search_router
from app.core.deps import get_current_user, get_current_workspace
from app.models import User, Workspace
from app.schemas.auth import UserResponse, WorkspaceResponse
from fastapi import Depends


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown: Cleanly close DB connection pool
    await engine.dispose()


app = FastAPI(
    title="NexoAgent Backend",
    description="AI Telecalling & Voice Agent Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# Include API Routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(agents_router, prefix="/api/v1")
app.include_router(calls_router, prefix="/api/v1")
app.include_router(campaigns_router, prefix="/api/v1")
app.include_router(whatsapp_router, prefix="/api/v1")
app.include_router(billing_router, prefix="/api/v1")
app.include_router(api_keys_router, prefix="/api/v1")
app.include_router(integrations_router, prefix="/api/v1")
app.include_router(workspace_router, prefix="/api/v1")
app.include_router(leads_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(channels_router, prefix="/api/v1")
app.include_router(voices_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
app.include_router(webhooks_router, prefix="/api/v1")


@app.get("/api/v1/me", tags=["Identity & Quickstart"])
async def get_my_identity(
    current_user: User = Depends(get_current_user),
    workspace: Workspace = Depends(get_current_workspace)
):
    """
    Outpero Quickstart Identity endpoint: curl https://api.outpero.com/v1/me
    Validates Bearer token or X-API-Key and returns user and workspace credits profile.
    """
    return {
        "user": UserResponse.model_validate(current_user),
        "workspace": WorkspaceResponse.model_validate(workspace),
        "credits": int(workspace.balance_inr / 10),
        "estimated_calling_minutes": int(workspace.balance_inr / 5.5)
    }


@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "NexoAgent Core API",
        "version": "1.0.0"
    }
