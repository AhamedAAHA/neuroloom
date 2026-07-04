from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class CircleCreate(BaseModel):
    name: str
    care_modes: list[str] = Field(default_factory=list)
    recipient_name: str
    recipient_age: int | None = None
    primary_member_name: str
    primary_member_email: str


class MemberCreate(BaseModel):
    name: str
    email: str
    role: str = "sibling"


class MedicationCreate(BaseModel):
    name: str
    dose: str
    schedule: str
    instructions: str | None = None


class MedicationExtract(BaseModel):
    text: str


class EventCreate(BaseModel):
    natural_language: str
    assigned_to: str | None = None


class HandoffCreate(BaseModel):
    from_member: str
    to_member: str


class CheckInCreate(BaseModel):
    mood: int = Field(ge=1, le=5)
    sleep_hours: float | None = None
    appetite: str | None = None
    notes: str | None = None


class TaskCreate(BaseModel):
    title: str
    assigned_to: str | None = None


class MedicationOut(BaseModel):
    id: UUID
    name: str
    dose: str
    schedule: str
    instructions: str | None
    source: str
    confirmed: bool

    model_config = {"from_attributes": True}


class EventOut(BaseModel):
    id: UUID
    title: str
    event_type: str
    scheduled_at: datetime | None
    assigned_to: str | None
    notes: str | None

    model_config = {"from_attributes": True}


class DocumentOut(BaseModel):
    id: UUID
    filename: str
    doc_type: str
    summary: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class CheckInOut(BaseModel):
    id: UUID
    mood: int
    sleep_hours: float | None
    appetite: str | None
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class HandoffOut(BaseModel):
    id: UUID
    from_member: str
    to_member: str
    briefing: str | None
    acknowledged: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TaskOut(BaseModel):
    id: UUID
    title: str
    assigned_to: str | None
    completed: bool

    model_config = {"from_attributes": True}


class AgentRunOut(BaseModel):
    id: UUID
    agent_name: str
    status: str
    message: str
    model_route: str
    created_at: datetime

    model_config = {"from_attributes": True}


class GraphNodeOut(BaseModel):
    id: UUID
    node_type: str
    label: str
    data: dict

    model_config = {"from_attributes": True}


class EmergencyPackOut(BaseModel):
    id: UUID
    share_token: str
    content: str
    pin: str
    expires_at: datetime | None

    model_config = {"from_attributes": True}


class CircleOut(BaseModel):
    id: UUID
    name: str
    care_modes: list
    recipient_name: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
