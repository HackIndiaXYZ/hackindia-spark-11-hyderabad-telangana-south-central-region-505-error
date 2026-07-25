from typing import Dict, Any
from schemas.legal import LegalReport
from utils.json_utils import parse_json, validate_with_schema
from utils.logger import get_logger

logger = get_logger("legal_parser")

def parse_legal_response(raw_output: str) -> Dict[str, Any]:
    """
    Parses and validates Legal LLM response using LegalReport Pydantic schema.
    Returns dictionary matching LegalReport.
    """
    logger.info("Parsing Legal LLM response...")
    data = parse_json(raw_output)

    # Normalize issues references if empty
    issues = data.get("issues", [])
    if isinstance(issues, list):
        for issue in issues:
            if isinstance(issue, dict):
                ref = issue.get("reference")
                if not ref or str(ref).strip().lower() in ["none", "n/a", "null", ""]:
                    issue["reference"] = "Not specified"

    validated = validate_with_schema(data, LegalReport)
    return validated.model_dump()
