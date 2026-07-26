import os
import logging

logger = logging.getLogger("fastapi_app")

try:
    from celery import Celery
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    celery_app = Celery(
        "corporate_auditor_workers",
        broker=REDIS_URL,
        backend=REDIS_URL,
        include=["workers.tasks"]
    )
    celery_app.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
        task_track_started=True,
        task_time_limit=300,
    )
    CELERY_AVAILABLE = True
except Exception as e:
    logger.warning(f"Celery module import fallback: {e}")
    celery_app = None
    CELERY_AVAILABLE = False
