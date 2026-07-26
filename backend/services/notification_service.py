import asyncio
import logging
from sqlalchemy.orm import Session

import database.crud as crud
from email_module.email_service import EmailService

logger = logging.getLogger("fastapi_app")

class NotificationService:
    @staticmethod
    def notify_user_registration(db: Session, user):
        """
        Creates in-app DB notification and dispatches Welcome Email safely in sync or async threads.
        """
        msg = f"Welcome to Corporate Auditor, {user.name}! Your enterprise account is active."
        crud.create_notification(db, user_id=user.id, message=msg)

        try:
            try:
                loop = asyncio.get_running_loop()
                loop.create_task(EmailService.send_welcome_email(user.email, user.name, user.company or "Enterprise"))
            except RuntimeError:
                asyncio.run(EmailService.send_welcome_email(user.email, user.name, user.company or "Enterprise"))
        except Exception as e:
            logger.warning(f"Registration email trigger fallback: {e}")

    @staticmethod
    def notify_audit_completed(db: Session, user_id: int, user_email: str, audit_data: dict):
        """
        Creates in-app DB notification and dispatches Audit Completed and High Risk Emails.
        """
        audit_id = audit_data.get("id") or audit_data.get("audit_id")
        score = audit_data.get("overall_score", 50)
        risk = audit_data.get("overall_risk", "HIGH")

        msg = f"Audit #{audit_id} for '{audit_data.get('filename')}' completed with risk score {score}/100 ({risk})."
        crud.create_notification(db, user_id=user_id, message=msg)

        try:
            try:
                loop = asyncio.get_running_loop()
                loop.create_task(EmailService.send_audit_completed_email(user_email, audit_data))
                if score > 75 or risk.upper() in ["HIGH", "CRITICAL"]:
                    loop.create_task(EmailService.send_high_risk_alert_email(user_email, audit_data))
            except RuntimeError:
                asyncio.run(EmailService.send_audit_completed_email(user_email, audit_data))
                if score > 75 or risk.upper() in ["HIGH", "CRITICAL"]:
                    asyncio.run(EmailService.send_high_risk_alert_email(user_email, audit_data))
        except Exception as e:
            logger.warning(f"Audit completion email trigger fallback: {e}")
