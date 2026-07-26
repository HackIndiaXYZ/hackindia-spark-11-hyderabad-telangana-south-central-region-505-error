import os
import logging
from typing import Dict, Any

from reports.json_generator import JsonReportGenerator
from reports.excel_generator import ExcelReportGenerator
from reports.pdf_generator import PdfReportGenerator

logger = logging.getLogger("fastapi_app")

BASE_REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "generated_reports")

class ReportGenerator:
    @staticmethod
    def generate_all_reports(audit_data: Dict[str, Any]) -> Dict[str, str]:
        """
        Orchestrates export generation across PDF, Excel, and JSON formats.
        """
        pdf_dir = os.path.join(BASE_REPORTS_DIR, "pdf")
        excel_dir = os.path.join(BASE_REPORTS_DIR, "excel")
        json_dir = os.path.join(BASE_REPORTS_DIR, "json")

        os.makedirs(pdf_dir, exist_ok=True)
        os.makedirs(excel_dir, exist_ok=True)
        os.makedirs(json_dir, exist_ok=True)

        pdf_path = PdfReportGenerator.generate(audit_data, pdf_dir)
        excel_path = ExcelReportGenerator.generate(audit_data, excel_dir)
        json_path = JsonReportGenerator.generate(audit_data, json_dir)

        logger.info(f"All 3 report formats generated for Audit #{audit_data.get('id') or audit_data.get('audit_id')}")

        return {
            "pdf": pdf_path,
            "excel": excel_path,
            "json": json_path
        }
