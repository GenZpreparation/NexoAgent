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
app.include_router(webhooks_router, prefix="/api/v1")

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "NexoAgent Core API",
        "version": "1.0.0"
    }
