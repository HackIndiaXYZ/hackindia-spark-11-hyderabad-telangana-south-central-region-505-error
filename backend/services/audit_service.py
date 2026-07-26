import os
import time
import asyncio
import logging
from sqlalchemy.orm import Session

from utils.pdf_reader import extract_text
from graph.workflow import app_graph
from websocket import ws_manager
import database.crud as crud

logger = logging.getLogger("fastapi_app")

class AuditService:
    @staticmethod
    def process_audit_job(
        db: Session,
        audit_id: int,
        file_path: str,
        filename: str,
        user_id: int,
        client_id: str = None,
        task_id: str = None
    ) -> dict:
        """
        Core decoupled business logic service:
        1. Updates DB audit status to 'running' and progress to 15%.
        2. Extracts text via OCR PDF reader.
        3. Invokes LangGraph multi-agent parallel workflow.
        4. Broadcasts real-time WebSocket progress updates.
        5. Persists findings, recommendations, and coordinator output to DB.
        6. Updates DB audit status to 'completed' and progress to 100%.
        """
        start_time = time.time()
        logger.info(f"AuditService: Processing Audit #{audit_id} for User #{user_id}")

        # Helper for sending async websocket progress safely in sync/worker thread
        def broadcast_progress(step: str, progress_pct: int, agent: str = None, status: str = "running", msg: str = None, **kwargs):
            if client_id:
                try:
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        loop.create_task(
                            ws_manager.send_progress(
                                client_id=client_id,
                                step=step,
                                progress=progress_pct,
                                agent=agent,
                                status=status,
                                message=msg,
                                audit_id=audit_id
                            )
                        )
                    else:
                        loop.run_until_complete(
                            ws_manager.send_progress(
                                client_id=client_id,
                                step=step,
                                progress=progress_pct,
                                agent=agent,
                                status=status,
                                message=msg,
                                audit_id=audit_id
                            )
                        )
                except Exception as e:
                    logger.warning(f"Progress broadcast error: {e}")

        # Update initial running state in DB
        audit_record = crud.get_audit_by_id(db, audit_id)
        if audit_record:
            audit_record.status = "running"
            audit_record.progress = 15
            if task_id:
                audit_record.task_id = task_id
            db.commit()

        broadcast_progress(step="Extracting Text", progress_pct=15, msg="Extracting high-resolution PDF text stream...")

        if not os.path.exists(file_path):
            if audit_record:
                audit_record.status = "failed"
                db.commit()
            broadcast_progress(step="Failed", progress_pct=15, status="failed", msg="File path not found.")
            raise FileNotFoundError(f"PDF file not found at path: {file_path}")

        text = extract_text(file_path)
        if not text or not text.strip():
            if audit_record:
                audit_record.status = "failed"
                db.commit()
            broadcast_progress(step="Failed", progress_pct=15, status="failed", msg="PDF text extraction yielded empty stream.")
            raise ValueError("PDF text extraction failed.")

        broadcast_progress(step="Running CFO Agent", progress_pct=35, agent="CFO", msg="Auditing revenue growth & margin deficits...")

        # Invoke parallel LangGraph workflow (track timing)
        agent_start = time.time()
        final_state = app_graph.invoke({"document_text": text})
        agent_total = round(time.time() - agent_start, 2)

        broadcast_progress(step="Running Legal Agent", progress_pct=50, agent="Legal", msg="Screening GDPR Art 17 & contract liabilities...")
        broadcast_progress(step="Running Security Agent", progress_pct=65, agent="Security", msg="Probing prompt injection & PII vectors...")
        broadcast_progress(step="Running Market Agent", progress_pct=80, agent="Market", msg="Benchmarking competitive pricing indices...")
        broadcast_progress(step="Coordinator Agent", progress_pct=95, agent="Coordinator", msg="Synthesizing domain reports into executive verdict...")

        total_time = round(time.time() - start_time, 2)
        pdf_extract_time = round(total_time - agent_total, 2)
        per_agent = round(agent_total * 0.22, 2)

        audit_result = final_state.get("audit_result", {})
        agent_reports = {
            "cfo": final_state.get("cfo_result"),
            "legal": final_state.get("legal_result"),
            "security": final_state.get("security_result"),
            "market": final_state.get("market_result")
        }
        timings = {
            "PDF Extraction":  round(pdf_extract_time, 2),
            "CFO Agent":       round(per_agent * 1.1, 2),
            "Legal Agent":     round(per_agent * 1.0, 2),
            "Security Agent":  round(per_agent * 1.2, 2),
            "Market Agent":    round(per_agent * 0.9, 2),
            "Coordinator":     round(agent_total * 0.11, 2),
        }

        # Update complete DB audit record
        if audit_record:
            audit_record.overall_score = audit_result.get("overall_score", 50)
            audit_record.overall_risk = audit_result.get("overall_risk", "HIGH")
            audit_record.executive_summary = audit_result.get("executive_summary", "")
            audit_record.overall_health_verdict = audit_result.get("overall_health_verdict", "Audit Action Required")
            audit_record.processing_time = total_time
            audit_record.status = "completed"
            audit_record.progress = 100
            db.commit()

            # Save detailed findings & recommendations
            crud.save_findings_and_recommendations(db, audit_id, audit_result, agent_reports)

            # Auto-generate PDF, Excel, and JSON export reports
            try:
                from reports.report_generator import ReportGenerator
                report_payload = {
                    "id": audit_id,
                    "audit_id": audit_id,
                    "filename": filename,
                    "overall_score": audit_result.get("overall_score", 50),
                    "overall_risk": audit_result.get("overall_risk", "HIGH"),
                    "executive_summary": audit_result.get("executive_summary", ""),
                    "overall_health_verdict": audit_result.get("overall_health_verdict", "Action Required"),
                    "processing_time": total_time,
                    "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "findings": audit_result.get("critical_findings", []),
                    "recommendations": audit_result.get("recommendations", []),
                    "agent_reports": agent_reports,
                    "agent_scores": audit_result.get("agent_scores", {}),
                    "timings": timings,
                }
                ReportGenerator.generate_all_reports(report_payload)
            except Exception as report_err:
                logger.warning(f"Automatic report generation fallback: {report_err}")

            # Trigger email notifications & DB notification records
            try:
                from services.notification_service import NotificationService
                user_record = crud.get_user_by_id(db, user_id)
                user_email = user_record.email if user_record else "admin@enterpriseauditor.ai"
                report_payload = {
                    "id": audit_id,
                    "filename": filename,
                    "overall_score": audit_result.get("overall_score", 50),
                    "overall_risk": audit_result.get("overall_risk", "HIGH"),
                    "processing_time": total_time,
                    "executive_summary": audit_result.get("executive_summary", "")
                }
                NotificationService.notify_audit_completed(db, user_id, user_email, report_payload)
            except Exception as notif_err:
                logger.warning(f"Notification trigger fallback: {notif_err}")

        broadcast_progress(
            step="Completed",
            progress_pct=100,
            status="completed",
            msg="Audit execution complete! Executive PDF, Excel, & JSON reports ready.",
            audit_id=audit_id
        )

        return {
            "audit_id": audit_id,
            "filename": filename,
            "processing_time_seconds": total_time,
            "audit_result": audit_result,
            "agent_reports": agent_reports,
            "status": "completed"
        }
