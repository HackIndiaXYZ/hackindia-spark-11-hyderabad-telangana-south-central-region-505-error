import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_


from database.models import (
    User, Document, Audit, AgentResult, Finding,
    Recommendation, AuditLog, ApiKey, Notification, Setting
)
from database.schemas import UserCreate, DocumentCreate, SettingUpdate, ApiKeyCreate

# 1. Users CRUD
def create_user(db: Session, user: UserCreate) -> User:
    db_user = User(
        name=user.name,
        email=user.email,
        password_hash=user.password,  # Production apps hash password
        role=user.role or "auditor",
        company=user.company
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Initialize default settings for user
    db_setting = Setting(user_id=db_user.id)
    db.add(db_setting)
    db.commit()

    return db_user

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email, User.is_deleted == False).first()

def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id, User.is_deleted == False).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    return db.query(User).filter(User.is_deleted == False).offset(skip).limit(limit).all()


# 2. Documents CRUD
def create_document(db: Session, document: DocumentCreate) -> Document:
    db_doc = Document(
        filename=document.filename,
        file_type=document.file_type or "application/pdf",
        file_size=document.file_size,
        file_path=document.file_path,
        user_id=document.user_id,
        status="Uploaded"
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc

def get_document(db: Session, document_id: int) -> Optional[Document]:
    return db.query(Document).filter(Document.id == document_id, Document.is_deleted == False).first()

def get_documents(db: Session, user_id: Optional[int] = None) -> List[Document]:
    query = db.query(Document).filter(Document.is_deleted == False)
    if user_id:
        query = query.filter(or_(Document.user_id == user_id, Document.user_id.is_(None)))
    return query.order_by(Document.uploaded_at.desc()).all()




# 3. Complete Enterprise Audit Saver (SaaS Pipeline)
def save_audit_record(
    db: Session,
    filename: str,
    file_path: str,
    file_size: Optional[int],
    audit_result: Optional[Dict[str, Any]],
    agent_reports: Optional[Dict[str, Any]],
    processing_time: float,
    user_id: Optional[int] = None
) -> Audit:
    """
    SaaS Audit Saver: Stores Document, Audit, AgentResults, Findings, Recommendations,
    AuditLogs, and sends a Notification.
    """
    db_doc = Document(
        user_id=user_id,
        filename=filename,
        file_type="application/pdf",
        file_size=file_size,
        file_path=file_path,
        status="Completed"
    )
    db.add(db_doc)
    db.flush()

    overall_risk = "HIGH"
    overall_score = 50
    executive_summary = ""
    overall_health_verdict = ""
    findings_list = []
    action_plan_recs = []

    if isinstance(audit_result, dict):
        overall_risk = str(audit_result.get("overall_risk", "HIGH"))
        overall_score = int(audit_result.get("overall_score", 50))
        executive_summary = str(audit_result.get("executive_summary", ""))
        overall_health_verdict = str(audit_result.get("overall_health_verdict", ""))
        findings_list = audit_result.get("critical_findings", [])
        recs = audit_result.get("recommendations", [])
        if isinstance(recs, list):
            action_plan_recs = recs

    db_audit = Audit(
        document_id=db_doc.id,
        user_id=user_id,
        overall_score=overall_score,
        overall_risk=overall_risk,
        executive_summary=executive_summary,
        overall_health_verdict=overall_health_verdict,
        processing_time=processing_time,
        model_used="LangGraph + Ollama (qwen2.5:7b)",
        status="Completed"
    )
    db.add(db_audit)
    db.flush()

    save_findings_and_recommendations(db, db_audit.id, audit_result, agent_reports)
    return db_audit

def save_findings_and_recommendations(
    db: Session,
    audit_id: int,
    audit_result: Optional[Dict[str, Any]],
    agent_reports: Optional[Dict[str, Any]]
):
    """
    Saves AgentResults, Findings, Recommendations, and AuditLogs for an existing Audit record.
    """
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        return

    # 1. Save Specialist Agent Results
    if agent_reports and isinstance(agent_reports, dict):
        for agent_name, report_data in agent_reports.items():
            if report_data is not None:
                score = None
                verdict = None
                raw_json = None

                if isinstance(report_data, dict):
                    score = report_data.get("risk_score") or report_data.get("overall_score")
                    verdict = report_data.get("overall_health_verdict") or report_data.get("verdict")
                    raw_json = report_data
                elif hasattr(report_data, "dict"):
                    raw_json = report_data.dict()
                    score = raw_json.get("risk_score") or raw_json.get("overall_score")
                    verdict = raw_json.get("overall_health_verdict") or raw_json.get("verdict")

                agent_rec = AgentResult(
                    audit_id=audit_id,
                    agent_name=agent_name.upper(),
                    risk_score=int(score) if score is not None else None,
                    risk_level=str(verdict) if verdict is not None else None,
                    execution_time=2.0,
                    result_json=raw_json
                )
                db.add(agent_rec)

    # 2. Save Findings
    findings_list = audit_result.get("critical_findings", []) if isinstance(audit_result, dict) else []
    if findings_list and isinstance(findings_list, list):
        for finding in findings_list:
            if isinstance(finding, dict):
                f_title = finding.get("title") or finding.get("issue") or "Finding Issue Vector"
                f_severity = finding.get("severity", "High")
                f_category = finding.get("category", "General")
                f_reported_by = finding.get("reported_by", [])
                f_reason = finding.get("description") or finding.get("reason", "")
                f_recommendation = finding.get("recommendation", "")
            else:
                continue

            agent_source = f_reported_by[0] if (f_reported_by and isinstance(f_reported_by, list)) else "Coordinator"

            finding_rec = Finding(
                audit_id=audit_id,
                agent_name=str(agent_source),
                title=str(f_title),
                description=str(f_reason),
                severity=str(f_severity),
                category=str(f_category),
                confidence=0.95,
                recommendation=str(f_recommendation),
                status="Open"
            )
            db.add(finding_rec)

    # 3. Save Recommendations
    action_plan_recs = audit_result.get("recommendations", []) if isinstance(audit_result, dict) else []
    if action_plan_recs:
        for idx, rec_item in enumerate(action_plan_recs):
            prio = "High" if idx == 0 else "Medium"
            rec_str = rec_item.get("recommendation") if isinstance(rec_item, dict) else str(rec_item)
            rec_obj = Recommendation(
                audit_id=audit_id,
                priority=prio,
                recommendation=str(rec_str),
                estimated_effort="Medium"
            )
            db.add(rec_obj)

    # 4. Save Audit Logs
    logs_data = [
        ("PDF Document Upload", "Completed", f"Processed Audit #{audit_id} document."),
        ("Fan-Out Parallel Multi-Agent Execution", "Completed", "Executed CFO, Legal, Security, and Market agents concurrently."),
        ("Coordinator Synthesis", "Completed", "Consolidated risk scores and executive report."),
        ("PostgreSQL SaaS Persistence", "Completed", f"Saved Audit #{audit_id} record to database.")
    ]
    for step_title, step_stat, msg in logs_data:
        db.add(AuditLog(
            audit_id=audit_id,
            step=step_title,
            status=step_stat,
            message=msg
        ))

    db.commit()

def get_audits(db: Session, skip: int = 0, limit: int = 100) -> List[Audit]:
    return db.query(Audit).options(joinedload(Audit.document)).filter(Audit.is_deleted == False).order_by(Audit.created_at.desc()).offset(skip).limit(limit).all()

def get_audit_by_id(db: Session, audit_id: int) -> Optional[Audit]:
    return db.query(Audit).options(joinedload(Audit.document)).filter(Audit.id == audit_id, Audit.is_deleted == False).first()


def delete_audit(db: Session, audit_id: int) -> bool:
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if audit:
        audit.is_deleted = True
        db.commit()
        return True
    return False

# 4. Analytics & Search
def get_audit_analytics(db: Session) -> Dict[str, Any]:
    total_audits = db.query(func.count(Audit.id)).filter(Audit.is_deleted == False).scalar() or 0
    avg_score = db.query(func.avg(Audit.overall_score)).filter(Audit.is_deleted == False).scalar() or 0.0
    critical_findings_count = db.query(func.count(Finding.id)).filter(
        or_(Finding.severity == "Critical", Finding.severity == "High")
    ).scalar() or 0

    risk_counts = {
        "CRITICAL": db.query(func.count(Audit.id)).filter(Audit.overall_risk == "CRITICAL", Audit.is_deleted == False).scalar() or 0,
        "HIGH": db.query(func.count(Audit.id)).filter(Audit.overall_risk == "HIGH", Audit.is_deleted == False).scalar() or 0,
        "MEDIUM": db.query(func.count(Audit.id)).filter(Audit.overall_risk == "MEDIUM", Audit.is_deleted == False).scalar() or 0,
        "LOW": db.query(func.count(Audit.id)).filter(Audit.overall_risk == "LOW", Audit.is_deleted == False).scalar() or 0,
    }

    return {
        "total_audits": total_audits,
        "average_risk_score": round(float(avg_score), 2),
        "critical_findings_count": critical_findings_count,
        "audits_by_risk": risk_counts
    }

def search_findings(
    db: Session,
    query: Optional[str] = None,
    agent_name: Optional[str] = None,
    severity: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Finding]:
    q = db.query(Finding)
    if agent_name:
        q = q.filter(Finding.agent_name.ilike(f"%{agent_name}%"))
    if severity:
        q = q.filter(Finding.severity.ilike(f"%{severity}%"))
    if query:
        q = q.filter(or_(
            Finding.title.ilike(f"%{query}%"),
            Finding.description.ilike(f"%{query}%")
        ))
    return q.offset(skip).limit(limit).all()

def create_notification(db: Session, user_id: int, message: str) -> Notification:
    notif = Notification(user_id=user_id, message=message, status="Unread")
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif

def get_user_settings(db: Session, user_id: int) -> Setting:
    setting = db.query(Setting).filter(Setting.user_id == user_id).first()
    if not setting:
        setting = Setting(user_id=user_id)
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting

def update_user_settings(db: Session, user_id: int, updates: SettingUpdate) -> Setting:
    setting = get_user_settings(db, user_id)
    if updates.theme is not None:
        setting.theme = updates.theme
    if updates.language is not None:
        setting.language = updates.language
    if updates.notifications_enabled is not None:
        setting.notifications_enabled = updates.notifications_enabled

    db.commit()
    db.refresh(setting)
    return setting

def get_user_notifications(db: Session, user_id: int) -> List[Notification]:
    return db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).all()

def mark_notification_read(db: Session, notification_id: int) -> Optional[Notification]:
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if notif:
        notif.status = "Read"
        db.commit()
        db.refresh(notif)
    return notif

def create_api_key(db: Session, user_id: int, key_data: ApiKeyCreate) -> ApiKey:
    api_key = ApiKey(
        user_id=user_id,
        provider=key_data.provider,
        encrypted_key=key_data.encrypted_key
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)
    return api_key

def get_user_api_keys(db: Session, user_id: int) -> List[ApiKey]:
    return db.query(ApiKey).filter(ApiKey.user_id == user_id).all()
