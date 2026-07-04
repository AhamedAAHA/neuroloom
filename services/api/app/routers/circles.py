import io
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pypdf import PdfReader
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.agents.orchestrator import AgentOrchestrator
from app.database import get_db
from app.models import (
    AgentRun,
    AgentStatus,
    CareCircle,
    CareEvent,
    CareRecipient,
    CheckIn,
    CircleMember,
    Document,
    FamilyTask,
    GraphNode,
    Handoff,
    Medication,
    MemberRole,
)
from app.schemas import (
    CheckInCreate,
    CheckInOut,
    CircleCreate,
    CircleOut,
    DocumentOut,
    EmergencyPackOut,
    EventCreate,
    EventOut,
    HandoffCreate,
    HandoffOut,
    MedicationCreate,
    MedicationExtract,
    MedicationOut,
    TaskCreate,
    TaskOut,
)

router = APIRouter(prefix="/api/circles", tags=["circles"])


@router.post("", response_model=CircleOut)
async def create_circle(payload: CircleCreate, db: AsyncSession = Depends(get_db)):
    circle = CareCircle(name=payload.name, care_modes=payload.care_modes)
    db.add(circle)
    await db.flush()

    db.add(CircleMember(
        circle_id=circle.id,
        name=payload.primary_member_name,
        email=payload.primary_member_email,
        role=MemberRole.PRIMARY,
    ))
    db.add(CareRecipient(
        circle_id=circle.id,
        name=payload.recipient_name,
        age=payload.recipient_age,
    ))
    await db.flush()

    orch = AgentOrchestrator(db, circle.id)
    await orch.log_agent("Conductor", f"Care circle '{payload.name}' initialized. Welcome to Neuroloom.", status=AgentStatus.COMPLETE)

    return CircleOut(
        id=circle.id,
        name=circle.name,
        care_modes=circle.care_modes,
        recipient_name=payload.recipient_name,
        created_at=circle.created_at,
    )


@router.get("", response_model=list[CircleOut])
async def list_circles(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CareCircle).options(selectinload(CareCircle.recipient)).order_by(CareCircle.created_at.desc())
    )
    circles = result.scalars().all()
    return [
        CircleOut(
            id=c.id,
            name=c.name,
            care_modes=c.care_modes,
            recipient_name=c.recipient.name if c.recipient else None,
            created_at=c.created_at,
        )
        for c in circles
    ]


@router.get("/{circle_id}")
async def get_circle(circle_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    circle = await _get_circle(db, circle_id)
    return {
        "id": str(circle.id),
        "name": circle.name,
        "care_modes": circle.care_modes,
        "recipient": {"name": circle.recipient.name, "age": circle.recipient.age} if circle.recipient else None,
        "members": [{"name": m.name, "email": m.email, "role": m.role.value} for m in circle.members],
    }


@router.get("/{circle_id}/medications", response_model=list[MedicationOut])
async def list_medications(circle_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await _get_circle(db, circle_id)
    result = await db.execute(select(Medication).where(Medication.circle_id == circle_id))
    return result.scalars().all()


@router.post("/{circle_id}/medications", response_model=MedicationOut)
async def add_medication(circle_id: uuid.UUID, payload: MedicationCreate, db: AsyncSession = Depends(get_db)):
    await _get_circle(db, circle_id)
    med = Medication(circle_id=circle_id, **payload.model_dump(), confirmed=True)
    db.add(med)
    await db.flush()
    return med


@router.post("/{circle_id}/medications/extract", response_model=list[MedicationOut])
async def extract_medications(circle_id: uuid.UUID, payload: MedicationExtract, db: AsyncSession = Depends(get_db)):
    await _get_circle(db, circle_id)
    orch = AgentOrchestrator(db, circle_id)
    meds = await orch.process_medication_text(payload.text)
    return meds


@router.post("/{circle_id}/medications/{med_id}/confirm", response_model=MedicationOut)
async def confirm_medication(circle_id: uuid.UUID, med_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    med = await db.get(Medication, med_id)
    if not med or med.circle_id != circle_id:
        raise HTTPException(404, "Medication not found")
    med.confirmed = True
    return med


@router.get("/{circle_id}/events", response_model=list[EventOut])
async def list_events(circle_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await _get_circle(db, circle_id)
    result = await db.execute(select(CareEvent).where(CareEvent.circle_id == circle_id))
    return result.scalars().all()


@router.post("/{circle_id}/events", response_model=EventOut)
async def create_event(circle_id: uuid.UUID, payload: EventCreate, db: AsyncSession = Depends(get_db)):
    await _get_circle(db, circle_id)
    orch = AgentOrchestrator(db, circle_id)
    return await orch.parse_schedule(payload.natural_language, payload.assigned_to)


@router.get("/{circle_id}/documents", response_model=list[DocumentOut])
async def list_documents(circle_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await _get_circle(db, circle_id)
    result = await db.execute(select(Document).where(Document.circle_id == circle_id))
    return result.scalars().all()


@router.post("/{circle_id}/documents", response_model=DocumentOut)
async def upload_document(
    circle_id: uuid.UUID,
    file: UploadFile = File(...),
    doc_type: str = Form("other"),
    db: AsyncSession = Depends(get_db),
):
    await _get_circle(db, circle_id)
    content = await file.read()
    extracted = ""

    if file.filename and file.filename.lower().endswith(".pdf"):
        try:
            reader = PdfReader(io.BytesIO(content))
            extracted = "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception:
            extracted = ""
    elif file.content_type and file.content_type.startswith("text"):
        extracted = content.decode("utf-8", errors="ignore")
    else:
        extracted = f"[Binary file: {file.filename}. OCR via Gemma multimodal on AMD in production.]"

    doc = Document(
        circle_id=circle_id,
        filename=file.filename or "upload",
        doc_type=doc_type,
        extracted_text=extracted,
        storage_path=f"circles/{circle_id}/{file.filename}",
    )
    db.add(doc)
    await db.flush()

    orch = AgentOrchestrator(db, circle_id)
    doc = await orch.process_document(doc)
    return doc


@router.get("/{circle_id}/check-ins", response_model=list[CheckInOut])
async def list_checkins(circle_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await _get_circle(db, circle_id)
    result = await db.execute(select(CheckIn).where(CheckIn.circle_id == circle_id).order_by(CheckIn.created_at.desc()))
    return result.scalars().all()


@router.post("/{circle_id}/check-ins", response_model=CheckInOut)
async def create_checkin(circle_id: uuid.UUID, payload: CheckInCreate, db: AsyncSession = Depends(get_db)):
    await _get_circle(db, circle_id)
    checkin = CheckIn(circle_id=circle_id, **payload.model_dump())
    db.add(checkin)
    await db.flush()

    orch = AgentOrchestrator(db, circle_id)
    await orch.process_check_in(checkin)
    return checkin


@router.get("/{circle_id}/handoffs", response_model=list[HandoffOut])
async def list_handoffs(circle_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await _get_circle(db, circle_id)
    result = await db.execute(select(Handoff).where(Handoff.circle_id == circle_id).order_by(Handoff.created_at.desc()))
    return result.scalars().all()


@router.post("/{circle_id}/handoffs", response_model=HandoffOut)
async def create_handoff(circle_id: uuid.UUID, payload: HandoffCreate, db: AsyncSession = Depends(get_db)):
    await _get_circle(db, circle_id)
    orch = AgentOrchestrator(db, circle_id)
    return await orch.create_handoff(payload.from_member, payload.to_member)


@router.post("/{circle_id}/handoffs/{handoff_id}/acknowledge", response_model=HandoffOut)
async def acknowledge_handoff(circle_id: uuid.UUID, handoff_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    handoff = await db.get(Handoff, handoff_id)
    if not handoff or handoff.circle_id != circle_id:
        raise HTTPException(404, "Handoff not found")
    handoff.acknowledged = True
    return handoff


@router.get("/{circle_id}/tasks", response_model=list[TaskOut])
async def list_tasks(circle_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await _get_circle(db, circle_id)
    result = await db.execute(select(FamilyTask).where(FamilyTask.circle_id == circle_id))
    return result.scalars().all()


@router.post("/{circle_id}/tasks", response_model=TaskOut)
async def create_task(circle_id: uuid.UUID, payload: TaskCreate, db: AsyncSession = Depends(get_db)):
    await _get_circle(db, circle_id)
    task = FamilyTask(circle_id=circle_id, **payload.model_dump())
    db.add(task)
    await db.flush()
    orch = AgentOrchestrator(db, circle_id)
    await orch.process_task(task)
    return task


@router.post("/{circle_id}/tasks/{task_id}/complete", response_model=TaskOut)
async def complete_task(circle_id: uuid.UUID, task_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    task = await db.get(FamilyTask, task_id)
    if not task or task.circle_id != circle_id:
        raise HTTPException(404, "Task not found")
    task.completed = True
    return task


@router.post("/{circle_id}/emergency-pack", response_model=EmergencyPackOut)
async def generate_emergency(circle_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await _get_circle(db, circle_id)
    orch = AgentOrchestrator(db, circle_id)
    return await orch.generate_emergency_pack()


@router.get("/{circle_id}/agents")
async def list_agent_runs(circle_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await _get_circle(db, circle_id)
    result = await db.execute(select(AgentRun).where(AgentRun.circle_id == circle_id).order_by(AgentRun.created_at.desc()).limit(50))
    runs = result.scalars().all()
    return [
        {
            "id": str(r.id),
            "agent_name": r.agent_name,
            "status": r.status.value,
            "message": r.message,
            "model_route": r.model_route,
            "metadata": r.metadata_json or {},
            "created_at": r.created_at.isoformat(),
        }
        for r in runs
    ]


@router.get("/{circle_id}/agents/stats")
async def agent_stats(circle_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await _get_circle(db, circle_id)
    result = await db.execute(select(AgentRun).where(AgentRun.circle_id == circle_id))
    runs = result.scalars().all()

    by_agent: dict[str, int] = {}
    by_status: dict[str, int] = {}
    pipelines: list[dict] = []
    for r in runs:
        by_agent[r.agent_name] = by_agent.get(r.agent_name, 0) + 1
        by_status[r.status.value] = by_status.get(r.status.value, 0) + 1
        if r.agent_name == "Conductor" and r.metadata_json.get("pipeline"):
            pipelines.append(
                {
                    "action": r.metadata_json.get("action"),
                    "pipeline": r.metadata_json.get("pipeline"),
                    "at": r.created_at.isoformat(),
                }
            )

    return {
        "total_runs": len(runs),
        "by_agent": by_agent,
        "by_status": by_status,
        "recent_pipelines": pipelines[:10],
    }


@router.get("/{circle_id}/activity")
async def activity_timeline(circle_id: uuid.UUID, limit: int = 30, db: AsyncSession = Depends(get_db)):
    await _get_circle(db, circle_id)
    items: list[dict] = []

    meds = (await db.execute(select(Medication).where(Medication.circle_id == circle_id))).scalars().all()
    for m in meds:
        items.append(
            {
                "type": "medication",
                "id": str(m.id),
                "title": m.name,
                "detail": f"{m.dose} · {m.schedule}",
                "timestamp": m.created_at.isoformat(),
            }
        )

    checkins = (await db.execute(select(CheckIn).where(CheckIn.circle_id == circle_id))).scalars().all()
    for c in checkins:
        items.append(
            {
                "type": "checkin",
                "id": str(c.id),
                "title": f"Mood {c.mood}/5",
                "detail": c.notes or "",
                "timestamp": c.created_at.isoformat(),
            }
        )

    handoffs = (await db.execute(select(Handoff).where(Handoff.circle_id == circle_id))).scalars().all()
    for h in handoffs:
        items.append(
            {
                "type": "handoff",
                "id": str(h.id),
                "title": f"{h.from_member} → {h.to_member}",
                "detail": (h.briefing or "")[:120],
                "timestamp": h.created_at.isoformat(),
            }
        )

    docs = (await db.execute(select(Document).where(Document.circle_id == circle_id))).scalars().all()
    for d in docs:
        items.append(
            {
                "type": "document",
                "id": str(d.id),
                "title": d.filename,
                "detail": (d.summary or "")[:120],
                "timestamp": d.created_at.isoformat(),
            }
        )

    tasks = (await db.execute(select(FamilyTask).where(FamilyTask.circle_id == circle_id))).scalars().all()
    for t in tasks:
        if not t.due_at:
            continue
        items.append(
            {
                "type": "task",
                "id": str(t.id),
                "title": t.title,
                "detail": "Completed" if t.completed else "Pending",
                "timestamp": t.due_at.isoformat(),
            }
        )

    agents = (await db.execute(select(AgentRun).where(AgentRun.circle_id == circle_id))).scalars().all()
    for a in agents:
        items.append(
            {
                "type": "agent",
                "id": str(a.id),
                "title": a.agent_name,
                "detail": a.message,
                "timestamp": a.created_at.isoformat(),
                "meta": {"status": a.status.value, "route": a.model_route, **(a.metadata_json or {})},
            }
        )

    items = [i for i in items if i.get("timestamp")]
    items.sort(key=lambda x: x["timestamp"], reverse=True)
    return items[:limit]


@router.get("/{circle_id}/graph")
async def get_knowledge_graph(circle_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await _get_circle(db, circle_id)
    result = await db.execute(select(GraphNode).where(GraphNode.circle_id == circle_id))
    nodes = result.scalars().all()

    graph_nodes = [{"id": str(n.id), "type": n.node_type, "label": n.label, "data": n.data} for n in nodes]
    edges: list[dict] = []
    seen: set[tuple[str, str, str]] = set()

    for n in nodes:
        for link in n.data.get("links", []):
            target_id = link.get("target_id")
            relation = link.get("relation", "related")
            if target_id:
                key = (str(n.id), target_id, relation)
                if key not in seen:
                    seen.add(key)
                    edges.append({"source": str(n.id), "target": target_id, "label": relation})

    type_relations = {
        ("document", "event"): "suggests",
        ("medication", "event"): "scheduled_as",
        ("checkin", "medication"): "monitors",
        ("handoff", "task"): "covers",
    }
    by_type: dict[str, list] = {}
    for n in nodes:
        by_type.setdefault(n.node_type, []).append(n)

    for (src_type, tgt_type), label in type_relations.items():
        for src in by_type.get(src_type, []):
            for tgt in by_type.get(tgt_type, []):
                key = (str(src.id), str(tgt.id), label)
                if key not in seen:
                    seen.add(key)
                    edges.append({"source": str(src.id), "target": str(tgt.id), "label": label})

    return {"nodes": graph_nodes, "edges": edges}


async def _get_circle(db: AsyncSession, circle_id: uuid.UUID) -> CareCircle:
    result = await db.execute(
        select(CareCircle)
        .where(CareCircle.id == circle_id)
        .options(selectinload(CareCircle.recipient), selectinload(CareCircle.members))
    )
    circle = result.scalar_one_or_none()
    if not circle:
        raise HTTPException(404, "Care circle not found")
    return circle
