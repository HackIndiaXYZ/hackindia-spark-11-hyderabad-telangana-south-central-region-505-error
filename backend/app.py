import os
import shutil
import time
import uuid
import logging
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Query, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from utils.logger import get_logger
from database.database import get_db, engine, SessionLocal
from database.models import Base
from database.models.user import User
from database.models.audit import Audit
from database.models.document import Document
import database.crud as crud
import database.schemas as schemas

from auth.routes import router as auth_router
from auth.dependencies import get_current_user
from websocket import ws_manager
from services.audit_service import AuditService

try:
    from workers.tasks import execute_audit_task
    from workers.celery_app import CELERY_AVAILABLE
except ImportError:
    CELERY_AVAILABLE = False
    execute_audit_task = None

# Ensure all 10 Enterprise SaaS database tables exist
Base.metadata.create_all(bind=engine)

logger = get_logger("fastapi_app")

app = FastAPI(
    title="Adversarial Corporate Auditor Enterprise API",
    version="8.0.0",
    description="Enterprise Multi-Agent Corporate Auditor with PDF, Excel, & JSON Report Generation"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Authentication Router
app.include_router(auth_router)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Serve uploaded avatars at /static/avatars/<filename>
AVATAR_DIR = os.path.join(UPLOAD_DIR, "avatars")
os.makedirs(AVATAR_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=UPLOAD_DIR), name="static")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "Adversarial Corporate Auditor Enterprise SaaS Platform",
        "reports": "Multi-Format PDF, Excel, JSON, & Print View Generation Active",
        "task_queue": f"Celery ({'Active' if CELERY_AVAILABLE else 'Fallback Mode'}) + Redis Background Workers",
        "workflow": "Parallel LangGraph Fan-Out/Fan-In",
        "agents": ["CFO", "Legal", "Security", "Market", "Coordinator"],
        "database": "Neon PostgreSQL (10 Core SaaS Tables Active)"
    }

@app.websocket("/ws/audit/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await ws_manager.connect(client_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(client_id)
    except Exception as e:
        logger.warning(f"WebSocket connection error for '{client_id}': {e}")
        ws_manager.disconnect(client_id)

def _run_background_audit_job(audit_id: int, file_path: str, filename: str, user_id: int, client_id: str = None, task_id: str = None):
    db = SessionLocal()
    try:
        AuditService.process_audit_job(
            db=db,
            audit_id=audit_id,
            file_path=file_path,
            filename=filename,
            user_id=user_id,
            client_id=client_id,
            task_id=task_id
        )
    finally:
        db.close()

@app.post("/audit")
async def audit_full(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    client_id: Optional[str] = Query(None, description="Optional WebSocket Client ID for real-time streaming"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    start_time = time.time()
    logger.info(f"Upload Received from user '{current_user.email}': File '{file.filename}'")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    path = os.path.join(UPLOAD_DIR, file.filename)
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(path)

    doc = Document(
        filename=file.filename,
        file_type="application/pdf",
        file_size=file_size,
        file_path=path,
        user_id=current_user.id
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    task_id_str = f"task_{uuid.uuid4().hex[:12]}"
    audit_rec = Audit(
        document_id=doc.id,
        user_id=current_user.id,
        overall_score=50,
        overall_risk="HIGH",
        status="queued",
        progress=0,
        task_id=task_id_str,
        executive_summary="Audit queued for background execution."
    )
    db.add(audit_rec)
    db.commit()
    db.refresh(audit_rec)

    celery_dispatched = False
    if CELERY_AVAILABLE and execute_audit_task and hasattr(execute_audit_task, "delay"):
        try:
            celery_task = execute_audit_task.delay(
                audit_id=audit_rec.id,
                file_path=path,
                filename=file.filename,
                user_id=current_user.id,
                client_id=client_id
            )
            task_id_str = celery_task.id
            audit_rec.task_id = task_id_str
            db.commit()
            celery_dispatched = True
        except Exception as e:
            background_tasks.add_task(
                _run_background_audit_job,
                audit_id=audit_rec.id,
                file_path=path,
                filename=file.filename,
                user_id=current_user.id,
                client_id=client_id,
                task_id=task_id_str
            )
    else:
        background_tasks.add_task(
            _run_background_audit_job,
            audit_id=audit_rec.id,
            file_path=path,
            filename=file.filename,
            user_id=current_user.id,
            client_id=client_id,
            task_id=task_id_str
        )

    return {
        "task_id": task_id_str,
        "audit_id": audit_rec.id,
        "status": "queued",
        "progress": 0,
        "celery_active": celery_dispatched,
        "message": "Audit task queued successfully for background execution."
    }

@app.post("/audit/existing/{document_id}")
async def audit_existing_document(
    document_id: int,
    background_tasks: BackgroundTasks,
    client_id: Optional[str] = Query(None, description="Optional WebSocket Client ID for real-time streaming"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = crud.get_document(db=db, document_id=document_id)
    if not doc:
        # Fallback search by document_id or user's latest uploaded file in uploads directory
        uploads_files = [f for f in os.listdir(UPLOAD_DIR) if f.lower().endswith(".pdf")]
        filename = uploads_files[0] if uploads_files else "proposal.pdf"
        path = os.path.join(UPLOAD_DIR, filename)
        if not os.path.exists(path):
            sample_path = os.path.join(os.path.dirname(__file__), "tests", "sample_documents", "proposal.pdf")
            if os.path.exists(sample_path):
                shutil.copy(sample_path, path)
        doc = Document(
            filename=filename,
            file_type="application/pdf",
            file_size=os.path.getsize(path) if os.path.exists(path) else 1000,
            file_path=path,
            user_id=current_user.id
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
    else:
        path = doc.file_path
        filename = doc.filename

    task_id_str = f"task_{uuid.uuid4().hex[:12]}"
    audit_rec = Audit(
        document_id=doc.id,
        user_id=current_user.id,
        overall_score=50,
        overall_risk="HIGH",
        status="queued",
        progress=0,
        task_id=task_id_str,
        executive_summary="Audit queued for background execution."
    )
    db.add(audit_rec)
    db.commit()
    db.refresh(audit_rec)

    background_tasks.add_task(
        _run_background_audit_job,
        audit_id=audit_rec.id,
        file_path=path,
        filename=filename,
        user_id=current_user.id,
        client_id=client_id,
        task_id=task_id_str
    )

    return {
        "task_id": task_id_str,
        "audit_id": audit_rec.id,
        "filename": filename,
        "status": "queued",
        "progress": 0,
        "message": f"Audit execution queued for document '{filename}'."
    }


# --- Phase 4 Report Download Endpoints ---
def _ensure_report_payload(audit: Audit):
    # Build agent_reports from stored AgentResult rows
    agent_reports = {}
    if hasattr(audit, "agent_results") and audit.agent_results:
        for ar in audit.agent_results:
            name = str(ar.agent_name or "").lower()
            agent_reports[name] = ar.result_json or {}

    findings_data = []
    if audit.findings:
        for f in audit.findings:
            try:
                d = {c.key: getattr(f, c.key) for c in f.__table__.columns}
                findings_data.append(d)
            except Exception:
                findings_data.append(f.__dict__ if hasattr(f, "__dict__") else {})

    recs_data = []
    if audit.recommendations:
        for r in audit.recommendations:
            try:
                d = {c.key: getattr(r, c.key) for c in r.__table__.columns}
                recs_data.append(d)
            except Exception:
                recs_data.append(r.__dict__ if hasattr(r, "__dict__") else {})

    return {
        "id": audit.id,
        "audit_id": audit.id,
        "filename": audit.document.filename if audit.document else f"Audit_{audit.id}.pdf",
        "overall_score": audit.overall_score,
        "overall_risk": audit.overall_risk,
        "executive_summary": audit.executive_summary or "Audit complete.",
        "overall_health_verdict": audit.overall_health_verdict or "Action Required",
        "processing_time": audit.processing_time or 0.0,
        "created_at": str(audit.created_at),
        "findings": findings_data,
        "recommendations": recs_data,
        "agent_reports": agent_reports,
        "agent_scores": {},
        "timings": {},
    }

@app.get("/reports/{audit_id}/pdf")
def export_pdf_report(audit_id: int, db: Session = Depends(get_db)):
    audit = crud.get_audit_by_id(db=db, audit_id=audit_id)
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")

    file_path = os.path.join(os.path.dirname(__file__), "generated_reports", "pdf", f"Audit_{audit_id}.pdf")
    # Always regenerate for freshest enterprise-grade data
    from reports.report_generator import ReportGenerator
    ReportGenerator.generate_all_reports(_ensure_report_payload(audit))

    return FileResponse(file_path, media_type="application/pdf", filename=f"Audit_{audit_id}_Enterprise_Report.pdf")

@app.get("/reports/{audit_id}/excel")
def export_excel_report(audit_id: int, db: Session = Depends(get_db)):
    audit = crud.get_audit_by_id(db=db, audit_id=audit_id)
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    file_path = os.path.join(os.path.dirname(__file__), "generated_reports", "excel", f"Audit_{audit_id}.xlsx")
    if not os.path.exists(file_path):
        from reports.report_generator import ReportGenerator
        ReportGenerator.generate_all_reports(_ensure_report_payload(audit))
        
    return FileResponse(file_path, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename=f"Audit_{audit_id}_Report.xlsx")

@app.get("/reports/{audit_id}/json")
def export_json_report(audit_id: int, db: Session = Depends(get_db)):
    audit = crud.get_audit_by_id(db=db, audit_id=audit_id)
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    file_path = os.path.join(os.path.dirname(__file__), "generated_reports", "json", f"Audit_{audit_id}.json")
    if not os.path.exists(file_path):
        from reports.report_generator import ReportGenerator
        ReportGenerator.generate_all_reports(_ensure_report_payload(audit))
        
    return FileResponse(file_path, media_type="application/json", filename=f"Audit_{audit_id}_Data.json")

# --- Protected Audits & History Endpoints ---
@app.get("/audits", response_model=List[schemas.AuditResponse])
def get_audit_history(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return crud.get_audits(db=db, skip=skip, limit=limit)

@app.get("/audits/{audit_id}", response_model=schemas.AuditResponse)
def get_audit_detail(
    audit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    audit = crud.get_audit_by_id(db=db, audit_id=audit_id)
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    return audit

@app.delete("/audits/{audit_id}")
def delete_audit_endpoint(
    audit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = crud.delete_audit(db=db, audit_id=audit_id)
    if not result:
        raise HTTPException(status_code=404, detail="Audit not found")
    return {"message": f"Audit #{audit_id} successfully deleted."}

# --- Protected Analytics & Search ---
@app.get("/analytics", response_model=schemas.AuditAnalyticsSummary)
def get_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return crud.get_audit_analytics(db=db)

@app.get("/findings/search", response_model=List[schemas.FindingResponse])
def search_findings_endpoint(
    q: Optional[str] = Query(None, description="Keyword search title/description"),
    agent: Optional[str] = Query(None, description="Filter by agent (e.g., CFO, Security, Legal)"),
    severity: Optional[str] = Query(None, description="Filter by severity (e.g., Critical, High)"),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return crud.search_findings(db=db, query=q, agent_name=agent, severity=severity, skip=skip, limit=limit)

@app.get("/documents", response_model=List[schemas.DocumentResponse])
def get_user_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    docs = crud.get_documents(db=db, user_id=current_user.id)
    existing_filenames = {d.filename for d in docs}
    
    if os.path.exists(UPLOAD_DIR):
        for fname in os.listdir(UPLOAD_DIR):
            if fname.lower().endswith((".pdf", ".docx", ".xlsx")) and fname not in existing_filenames:
                fpath = os.path.join(UPLOAD_DIR, fname)
                fsize = os.path.getsize(fpath) if os.path.isfile(fpath) else 1024
                new_doc = Document(
                    filename=fname,
                    file_type="application/pdf",
                    file_size=fsize,
                    file_path=fpath,
                    user_id=current_user.id,
                    status="Uploaded"
                )
                db.add(new_doc)
                try:
                    db.commit()
                    db.refresh(new_doc)
                    docs.append(new_doc)
                    existing_filenames.add(fname)
                except Exception:
                    db.rollback()

    return docs



# --- User & Account Management ---
@app.get("/users", response_model=List[schemas.UserResponse])
def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return crud.get_users(db=db, skip=skip, limit=limit)

# --- Protected User Settings, Notifications, & API Keys ---
@app.get("/settings", response_model=schemas.SettingResponse)
def get_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return crud.get_user_settings(db=db, user_id=current_user.id)

@app.put("/settings", response_model=schemas.SettingResponse)
def update_settings(
    updates: schemas.SettingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return crud.update_user_settings(db=db, user_id=current_user.id, updates=updates)

@app.get("/notifications", response_model=List[schemas.NotificationResponse])
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return crud.get_user_notifications(db=db, user_id=current_user.id)

@app.post("/notifications/{notification_id}/read", response_model=schemas.NotificationResponse)
def mark_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = crud.mark_notification_read(db=db, notification_id=notification_id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notif

@app.get("/api-keys", response_model=List[schemas.ApiKeyResponse])
def list_api_keys(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return crud.get_user_api_keys(db=db, user_id=current_user.id)

@app.post("/api-keys", response_model=schemas.ApiKeyResponse)
def add_api_key(
    key_data: schemas.ApiKeyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return crud.create_api_key(db=db, user_id=current_user.id, key_data=key_data)
