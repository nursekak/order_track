from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class StatusEnum(str, Enum):
    new = "new"
    in_progress = "in_progress"
    done = "done"


class PriorityEnum(str, Enum):
    low = "low"
    normal = "normal"
    high = "high"


class TicketCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=120)
    description: Optional[str] = Field(None, max_length=1000)
    status: StatusEnum = StatusEnum.new
    priority: PriorityEnum = PriorityEnum.normal


class TicketUpdate(BaseModel):
    status: Optional[StatusEnum] = None
    priority: Optional[PriorityEnum] = None
    title: Optional[str] = Field(None, min_length=3, max_length=120)
    description: Optional[str] = Field(None, max_length=1000)


class TicketResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: StatusEnum
    priority: PriorityEnum
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaginatedTickets(BaseModel):
    items: List[TicketResponse]
    total: int
    page: int
    page_size: int
    pages: int


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
