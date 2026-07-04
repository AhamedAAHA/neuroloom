import enum
import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Enum, ForeignKey, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CareMode(str, enum.Enum):
    POST_HOSPITAL = "post_hospital"
    DEMENTIA = "dementia"
    CHRONIC = "chronic"
    LONG_DISTANCE = "long_distance"


class MemberRole(str, enum.Enum):
    PRIMARY = "primary"
    SIBLING = "sibling"
    VIEWER = "viewer"
    SENIOR = "senior"


class AgentStatus(str, enum.Enum):
    IDLE = "idle"
    RUNNING = "running"
    COMPLETE = "complete"
    ERROR = "error"


class CareCircle(Base):
    __tablename__ = "care_circles"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255))
    care_modes: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    members: Mapped[list["CircleMember"]] = relationship(back_populates="circle", cascade="all, delete-orphan")
    recipient: Mapped["CareRecipient | None"] = relationship(back_populates="circle", uselist=False, cascade="all, delete-orphan")
    medications: Mapped[list["Medication"]] = relationship(back_populates="circle", cascade="all, delete-orphan")
    events: Mapped[list["CareEvent"]] = relationship(back_populates="circle", cascade="all, delete-orphan")
    documents: Mapped[list["Document"]] = relationship(back_populates="circle", cascade="all, delete-orphan")
    check_ins: Mapped[list["CheckIn"]] = relationship(back_populates="circle", cascade="all, delete-orphan")
    handoffs: Mapped[list["Handoff"]] = relationship(back_populates="circle", cascade="all, delete-orphan")
    tasks: Mapped[list["FamilyTask"]] = relationship(back_populates="circle", cascade="all, delete-orphan")
    agent_runs: Mapped[list["AgentRun"]] = relationship(back_populates="circle", cascade="all, delete-orphan")
    graph_nodes: Mapped[list["GraphNode"]] = relationship(back_populates="circle", cascade="all, delete-orphan")


class CircleMember(Base):
    __tablename__ = "circle_members"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    circle_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("care_circles.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255))
    role: Mapped[MemberRole] = mapped_column(Enum(MemberRole, native_enum=False), default=MemberRole.SIBLING)

    circle: Mapped["CareCircle"] = relationship(back_populates="members")


class CareRecipient(Base):
    __tablename__ = "care_recipients"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    circle_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("care_circles.id", ondelete="CASCADE"), unique=True)
    name: Mapped[str] = mapped_column(String(255))
    age: Mapped[int | None] = mapped_column(default=None)
    conditions: Mapped[list] = mapped_column(JSON, default=list)

    circle: Mapped["CareCircle"] = relationship(back_populates="recipient")


class Medication(Base):
    __tablename__ = "medications"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    circle_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("care_circles.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(255))
    dose: Mapped[str] = mapped_column(String(100))
    schedule: Mapped[str] = mapped_column(String(255))
    instructions: Mapped[str | None] = mapped_column(Text, default=None)
    source: Mapped[str] = mapped_column(String(50), default="manual")
    confirmed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    circle: Mapped["CareCircle"] = relationship(back_populates="medications")


class CareEvent(Base):
    __tablename__ = "care_events"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    circle_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("care_circles.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(255))
    event_type: Mapped[str] = mapped_column(String(50), default="appointment")
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    assigned_to: Mapped[str | None] = mapped_column(String(255), default=None)
    notes: Mapped[str | None] = mapped_column(Text, default=None)

    circle: Mapped["CareCircle"] = relationship(back_populates="events")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    circle_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("care_circles.id", ondelete="CASCADE"))
    filename: Mapped[str] = mapped_column(String(255))
    doc_type: Mapped[str] = mapped_column(String(50), default="other")
    summary: Mapped[str | None] = mapped_column(Text, default=None)
    extracted_text: Mapped[str | None] = mapped_column(Text, default=None)
    storage_path: Mapped[str | None] = mapped_column(String(500), default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    circle: Mapped["CareCircle"] = relationship(back_populates="documents")


class CheckIn(Base):
    __tablename__ = "check_ins"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    circle_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("care_circles.id", ondelete="CASCADE"))
    mood: Mapped[int] = mapped_column(default=3)
    sleep_hours: Mapped[float | None] = mapped_column(default=None)
    appetite: Mapped[str | None] = mapped_column(String(50), default=None)
    notes: Mapped[str | None] = mapped_column(Text, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    circle: Mapped["CareCircle"] = relationship(back_populates="check_ins")


class Handoff(Base):
    __tablename__ = "handoffs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    circle_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("care_circles.id", ondelete="CASCADE"))
    from_member: Mapped[str] = mapped_column(String(255))
    to_member: Mapped[str] = mapped_column(String(255))
    briefing: Mapped[str | None] = mapped_column(Text, default=None)
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    circle: Mapped["CareCircle"] = relationship(back_populates="handoffs")


class FamilyTask(Base):
    __tablename__ = "family_tasks"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    circle_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("care_circles.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(255))
    assigned_to: Mapped[str | None] = mapped_column(String(255), default=None)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    circle: Mapped["CareCircle"] = relationship(back_populates="tasks")


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    circle_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("care_circles.id", ondelete="CASCADE"))
    agent_name: Mapped[str] = mapped_column(String(100))
    status: Mapped[AgentStatus] = mapped_column(Enum(AgentStatus, native_enum=False), default=AgentStatus.RUNNING)
    message: Mapped[str] = mapped_column(Text)
    model_route: Mapped[str] = mapped_column(String(100), default="gemma-amd")
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    circle: Mapped["CareCircle"] = relationship(back_populates="agent_runs")


class GraphNode(Base):
    __tablename__ = "graph_nodes"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    circle_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("care_circles.id", ondelete="CASCADE"))
    node_type: Mapped[str] = mapped_column(String(50))
    label: Mapped[str] = mapped_column(String(255))
    data: Mapped[dict] = mapped_column(JSON, default=dict)

    circle: Mapped["CareCircle"] = relationship(back_populates="graph_nodes")


class EmergencyPack(Base):
    __tablename__ = "emergency_packs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    circle_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("care_circles.id", ondelete="CASCADE"))
    share_token: Mapped[str] = mapped_column(String(64), unique=True)
    content: Mapped[str] = mapped_column(Text)
    pin: Mapped[str] = mapped_column(String(6), default="0000")
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class MagicLinkToken(Base):
    __tablename__ = "magic_link_tokens"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), index=True)
    token: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    used: Mapped[bool] = mapped_column(Boolean, default=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
