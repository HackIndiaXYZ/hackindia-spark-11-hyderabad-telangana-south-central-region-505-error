from typing import Dict, Any
from schemas.audit import AuditReport
from utils.json_utils import parse_json, validate_with_schema
from utils.logger import get_logger

logger = get_logger("coordinator_parser")

def parse_audit_response(raw_output: str) -> Dict[str, Any]:
    """
    Parses and validates Coordinator LLM response using AuditReport Pydantic schema.
    """
    logger.info("Parsing Coordinator LLM response...")
    data = parse_json(raw_output)

    # Normalize executive summary key if needed
    if "executive_summary" not in data and "summary" in data:
        data["executive_summary"] = data["summary"]

    validated = validate_with_schema(data, AuditReport)
    return validated.model_dump()
