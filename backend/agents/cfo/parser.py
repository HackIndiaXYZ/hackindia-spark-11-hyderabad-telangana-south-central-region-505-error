from typing import Dict, Any
from schemas.cfo import CFOReport
from utils.json_utils import parse_json, validate_with_schema
from utils.logger import get_logger

logger = get_logger("cfo_parser")

def parse_cfo_response(raw_output: str) -> Dict[str, Any]:
    """
    Parses and validates CFO LLM output using CFOReport Pydantic schema.
    Returns dictionary matching CFOReport.
    """
    logger.info("Parsing CFO LLM response...")
    data = parse_json(raw_output)
    
    # Map legacy key 'financial_summary' to 'summary' if needed
    if "summary" not in data and "financial_summary" in data:
        data["summary"] = data["financial_summary"]
    elif "financial_summary" not in data and "summary" in data:
        data["financial_summary"] = data["summary"]

    validated = validate_with_schema(data, CFOReport)
    return validated.model_dump()
