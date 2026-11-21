"""
NexoAgent - Campaign & Lead Pydantic Schemas
Defines request and response contracts for Bulk Calling Campaigns & CSV ingestion.
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class CampaignCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=150, example="Noida Luxury Villas - Nov 2026")
    agent_id: int = Field(..., example=1)
    concurrency_limit: int = Field(default=5, ge=1, le=50, example=5)


class CampaignResponse(BaseModel):
    id: int
    workspace_id: int
    agent_id: int
    name: str
    status: str
    concurrency_limit: int
    total_leads: int
    dialed_leads: int
    connected_leads: int
    created_at: datetime

    class Config:
        from_attributes = True


class LeadItem(BaseModel):
    full_name: str = Field(default="Customer", example="Aman Verma")
    phone_number: str = Field(..., example="+919876543210")
    city: Optional[str] = Field(default=None, example="Gurgaon")
    custom_data: Optional[Dict[str, Any]] = Field(default_factory=dict, example={"budget": "2.5 Cr"})


class LeadUploadRequest(BaseModel):
    leads: List[LeadItem]


class LeadResponse(BaseModel):
    id: int
    campaign_id: int
    workspace_id: int
    full_name: str
    phone_number: str
    city: Optional[str]
    status: str
    retry_count: int
    max_retries: int
    call_sid: Optional[str]
    last_called_at: Optional[datetime]
    next_retry_at: Optional[datetime] = None
    lead_source: str = "csv_upload"

    class Config:
        from_attributes = True


class MetaLeadPayload(BaseModel):
    full_name: str = Field(default="Prospect", example="Rohit Sharma")
    phone_number: str = Field(..., example="+919876543210")
    city: Optional[str] = Field(default=None, example="Noida")
    workspace_id: int = Field(default=1, example=1)
    agent_id: Optional[int] = Field(default=None, example=1)
    campaign_id: Optional[int] = Field(default=None, example=1)
    auto_dial: bool = Field(default=True, description="Whether to dial lead in < 30 seconds")
    custom_data: Optional[Dict[str, Any]] = Field(default_factory=dict, example={"ad_name": "DLF Luxury 3BHK", "budget": "2 Cr"})

