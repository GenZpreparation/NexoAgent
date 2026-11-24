"""
NexoAgent - Voice Agent Pydantic Schemas
Defines request and response contracts for Voice Agent Studio CRUD.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class AgentCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, example="Pooja - Real Estate")
    system_prompt: str = Field(..., min_length=10, example="Tu Pooja hai, ek polite telecaller...")
    first_message: str = Field(..., min_length=5, max_length=500, example="Namaste! Nexo Homes se Pooja bol rahi hu.")
    voice_provider: str = Field(default="sarvam", example="sarvam")
    voice_id: str = Field(default="bulbul:v3/pooja", example="bulbul:v3/pooja")
    language: str = Field(default="hi-IN", example="hi-IN")
    temperature: float = Field(default=0.3, ge=0.0, le=1.0)


class AgentUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    system_prompt: Optional[str] = Field(default=None, min_length=10)
    first_message: Optional[str] = Field(default=None, min_length=5, max_length=500)
    voice_provider: Optional[str] = None
    voice_id: Optional[str] = None
    language: Optional[str] = None
    temperature: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    is_active: Optional[bool] = None


class AgentResponse(BaseModel):
    id: int
    workspace_id: int
    name: str
    system_prompt: str
    first_message: str
    voice_provider: str
    voice_id: str
    language: str
    temperature: float
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AgentKnowledgeRequest(BaseModel):
    knowledge_type: str = Field(default="text", description="Type of knowledge: text, faq, or document")
    content: str = Field(..., min_length=5, description="Factual knowledge, rules, or FAQs")
    source_name: Optional[str] = Field(default="Manual Entry", description="Title or source of this knowledge")


class AgentKnowledgeResponse(BaseModel):
    agent_id: int
    status: str = "ingested"
    source_name: str
    appended_characters: int
    updated_system_prompt_length: int
