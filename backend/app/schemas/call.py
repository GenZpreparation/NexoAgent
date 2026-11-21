"""
NexoAgent - Call & CallLog Pydantic Schemas
Defines request and response contracts for Call Ledger, Call History, and Intelligence Analytics.
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel


class CallLogResponse(BaseModel):
    id: int
    transcript: Optional[str] = None
    summary: Optional[str] = None
    sentiment: Optional[str] = None
    extracted_data: Optional[Dict[str, Any]] = None
    whatsapp_status: str

    class Config:
        from_attributes = True


class CallResponse(BaseModel):
    id: int
    call_sid: str
    workspace_id: int
    agent_id: Optional[int] = None
    customer_phone: str
    direction: str
    status: str
    duration_seconds: int
    cost_inr: float
    recording_url: Optional[str] = None
    created_at: datetime
    log: Optional[CallLogResponse] = None

    class Config:
        from_attributes = True


class CallListResponse(BaseModel):
    total: int
    items: List[CallResponse]
