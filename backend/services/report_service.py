import logging
from sqlalchemy.orm import Session
import database.crud as crud

logger = logging.getLogger("fastapi_app")

class ReportService:
    @staticmethod
    def get_executive_report(db: Session, audit_id: int) -> dict:
        audit = crud.get_audit_by_id(db, audit_id)
        if not audit:
            return None
        return {
            "id": audit.id,
            "filename": audit.document.filename if audit.document else f"Audit_{audit.id}.pdf",
            "overall_score": audit.overall_score,
            "overall_risk": audit.overall_risk,
            "executive_summary": audit.executive_summary,
            "overall_health_verdict": audit.overall_health_verdict,
            "processing_time": audit.processing_time,
            "status": audit.status,
            "progress": audit.progress,
            "created_at": audit.created_at.isoformat() if audit.created_at else None,
            "findings": [f.__dict__ for f in audit.findings] if audit.findings else [],
            "recommendations": [r.__dict__ for r in audit.recommendations] if audit.recommendations else []
        }
