"""
NexoAgent - Authentication & User Pydantic Schemas
Defines request/response contracts for multi-tenant auth endpoints.
"""
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserRegisterRequest(BaseModel):
    """SaaS registration payload: Creates Workspace + Admin User."""
    company_name: str = Field(..., min_length=2, max_length=100, example="DLF CyberCity")
    full_name: str = Field(..., min_length=2, max_length=100, example="Rajesh Sharma")
    email: EmailStr = Field(..., example="admin@dlf.com")
    password: str = Field(..., min_length=6, max_length=50, example="StrongPassword123")


class UserLoginRequest(BaseModel):
    """User login request payload."""
    email: EmailStr = Field(..., example="admin@dlf.com")
    password: str = Field(..., example="StrongPassword123")


class WorkspaceResponse(BaseModel):
    id: int
    name: str
    slug: str
    balance_inr: float
    is_active: bool

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    workspace_id: int
    is_active: bool

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    workspace: WorkspaceResponse
