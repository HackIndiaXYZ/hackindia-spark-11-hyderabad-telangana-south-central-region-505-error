import logging
from workers.celery_app import celery_app, CELERY_AVAILABLE
from services.audit_service import AuditService
from database.database import SessionLocal

logger = logging.getLogger("fastapi_app")

if CELERY_AVAILABLE and celery_app:
    @celery_app.task(name="execute_audit_task", bind=True, max_retries=2)
    def execute_audit_task(self, audit_id: int, file_path: str, filename: str, user_id: int, client_id: str = None):
        """
        Celery background worker task for executing PDF document audit.
        """
        logger.info(f"Celery Task [{self.request.id}]: Executing audit #{audit_id} for user #{user_id}")
        db = SessionLocal()
        try:
            result = AuditService.process_audit_job(
                db=db,
                audit_id=audit_id,
                file_path=file_path,
                filename=filename,
                user_id=user_id,
                client_id=client_id,
                task_id=self.request.id
            )
            return result
        except Exception as exc:
            logger.error(f"Celery Task [{self.request.id}] failed: {exc}")
            db.rollback()
            raise self.retry(exc=exc, countdown=10)
        finally:
            db.close()
else:
    class DummyTask:
        def delay(self, *args, **kwargs):
            raise NotImplementedError("Celery is not available.")

    execute_audit_task = DummyTask()
