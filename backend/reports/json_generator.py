import os
import json
import logging
from typing import Dict, Any

logger = logging.getLogger("fastapi_app")

class JsonReportGenerator:
    @staticmethod
    def generate(audit_data: Dict[str, Any], output_dir: str) -> str:
        """
        Generates structured JSON data payload report.
        """
        os.makedirs(output_dir, exist_ok=True)
        audit_id = audit_data.get("id") or audit_data.get("audit_id") or "report"
        file_path = os.path.join(output_dir, f"Audit_{audit_id}.json")

        payload = {
            "platform": "Adversarial Corporate Auditor Enterprise SaaS",
            "version": "7.0.0",
            "audit_id": audit_id,
            "filename": audit_data.get("filename") or "Corporate_Document.pdf",
            "overall_score": audit_data.get("overall_score", 50),
            "overall_risk": audit_data.get("overall_risk", "HIGH"),
            "executive_summary": audit_data.get("executive_summary", ""),
            "overall_health_verdict": audit_data.get("overall_health_verdict", "Action Required"),
            "processing_time_seconds": audit_data.get("processing_time", 0.0),
            "created_at": audit_data.get("created_at"),
            "findings": audit_data.get("findings", []),
            "recommendations": audit_data.get("recommendations", []),
            "agent_results": audit_data.get("agent_results", {})
        }

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, default=str)

        logger.info(f"JSON Report generated: {file_path}")
        return file_path
