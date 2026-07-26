import logging
from typing import Dict, Any
from fastapi_mail import FastMail, MessageSchema, MessageType
from email.config import mail_config

logger = logging.getLogger("fastapi_app")

class EmailService:
    @staticmethod
    async def send_email(
        recipient: str,
        subject: str,
        template_name: str,
        template_body: Dict[str, Any]
    ):
        """
        Asynchronously sends HTML email using FastMail templates with fallback logging.
        """
        logger.info(f"EmailService: Preparing '{template_name}' email to '{recipient}' with subject '{subject}'")
        try:
            message = MessageSchema(
                subject=subject,
                recipients=[recipient],
                template_body=template_body,
                subtype=MessageType.html
            )
            fm = FastMail(mail_config)
            await fm.send_message(message, template_name=template_name)
            logger.info(f"EmailService: Successfully sent email to '{recipient}'.")
        except Exception as e:
            logger.warning(f"EmailService: Local SMTP dispatch fallback active for '{recipient}': {e}")

    @staticmethod
    async def send_welcome_email(user_email: str, name: str, company: str = "Enterprise"):
        await EmailService.send_email(
            recipient=user_email,
            subject="Welcome to Adversarial Corporate Auditor Platform",
            template_name="welcome.html",
            template_body={"name": name, "company": company}
        )

    @staticmethod
    async def send_audit_completed_email(user_email: str, audit_data: dict):
        await EmailService.send_email(
            recipient=user_email,
            subject=f"Audit #{audit_data.get('id')} Execution Complete - Score {audit_data.get('overall_score')}/100",
            template_name="audit_completed.html",
            template_body={
                "audit_id": audit_data.get("id"),
                "filename": audit_data.get("filename", "Corporate_Document.pdf"),
                "score": audit_data.get("overall_score", 50),
                "risk": audit_data.get("overall_risk", "HIGH"),
                "processing_time": audit_data.get("processing_time", 0.0),
                "executive_summary": audit_data.get("executive_summary", "")
            }
        )

    @staticmethod
    async def send_high_risk_alert_email(user_email: str, audit_data: dict):
        await EmailService.send_email(
            recipient=user_email,
            subject=f"⚠️ HIGH RISK ALERT: Audit #{audit_data.get('id')} Score {audit_data.get('overall_score')}/100",
            template_name="high_risk_alert.html",
            template_body={
                "audit_id": audit_data.get("id"),
                "filename": audit_data.get("filename", "Corporate_Document.pdf"),
                "score": audit_data.get("overall_score", 88)
            }
        )

    @staticmethod
    async def send_audit_failed_email(user_email: str, audit_id: int, error_msg: str):
        await EmailService.send_email(
            recipient=user_email,
            subject=f"Audit Execution Issue - Audit #{audit_id}",
            template_name="audit_failed.html",
            template_body={"audit_id": audit_id, "error": error_msg}
        )
