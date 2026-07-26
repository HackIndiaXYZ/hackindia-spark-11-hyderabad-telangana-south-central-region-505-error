import logging
from sqlalchemy.orm import Session
import database.crud as crud

logger = logging.getLogger("fastapi_app")

def update_audit_progress(db: Session, audit_id: int, status: str, progress: int, task_id: str = None):
    audit = crud.get_audit_by_id(db, audit_id)
    if audit:
        audit.status = status
        audit.progress = progress
        if task_id:
            audit.task_id = task_id
        db.commit()
        logger.info(f"Progress updated for Audit #{audit_id}: {status} ({progress}%)")
