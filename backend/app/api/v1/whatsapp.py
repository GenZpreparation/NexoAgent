"""
NexoAgent - WhatsApp Management & Webhook Router
Enables dashboard users to trigger WhatsApp brochures on demand
and handles delivery receipts from WhatsApp Cloud API.
"""
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from app.core.deps import get_current_user
from app.models import User
from app.services.whatsapp import whatsapp_service

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp Automation"])


class SendBrochureRequest(BaseModel):
    customer_phone: str = Field(..., example="+919876543210")
    project_name: str = Field(default="Nexo Grandeur Sector 75", example="Nexo Grandeur Sector 75")
    brochure_url: Optional[str] = Field(default=None, example="https://storage.nexoagent.com/brochures/brochure.pdf")
    call_id: Optional[int] = Field(default=None, example=1)


class BookVisitRequest(BaseModel):
    customer_phone: str = Field(..., example="+919876543210")
    project_name: str = Field(default="Nexo Grandeur Sector 75", example="Nexo Grandeur Sector 75")
    visit_date: str = Field(..., example="This Sunday")
    time_slot: str = Field(default="Morning (11 AM)", example="Morning (11 AM)")
    call_id: Optional[int] = Field(default=None, example=1)


@router.post("/send-brochure")
async def trigger_whatsapp_brochure(
    payload: SendBrochureRequest,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Dashboard ya API se customer ko WhatsApp brochure send karta hai."""
    result = await whatsapp_service.send_brochure(
        customer_phone=payload.customer_phone,
        project_name=payload.project_name,
        brochure_url=payload.brochure_url,
        call_id=payload.call_id
    )
    return result


@router.post("/book-visit")
async def trigger_site_visit_confirmation(
    payload: BookVisitRequest,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Site visit book karke customer ko WhatsApp slip dispatch karta hai."""
    result = await whatsapp_service.send_site_visit_confirmation(
        customer_phone=payload.customer_phone,
        project_name=payload.project_name,
        visit_date=payload.visit_date,
        time_slot=payload.time_slot,
        call_id=payload.call_id
    )
    return result


@router.post("/webhook")
async def whatsapp_status_webhook(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Meta WhatsApp delivery status webhook (sent, delivered, read)."""
    return {
        "status": "received",
        "processed": True
    }
