from typing import Dict, Any
from schemas.security import SecurityReport
from utils.json_utils import parse_json, validate_with_schema
from utils.logger import get_logger

logger = get_logger("security_parser")

def parse_security_response(raw_output: str) -> Dict[str, Any]:
    """
    Parses and validates Security LLM response using SecurityReport Pydantic schema.
    Normalizes severity levels, confidence scores, and risk scores.
    """
    logger.info("Parsing Security LLM response...")
    data = parse_json(raw_output)

    # Normalize issues list
    issues = data.get("issues", [])
    if isinstance(issues, list):
        for issue in issues:
            if isinstance(issue, dict):
                # Ensure category exists
                if not issue.get("category"):
                    issue["category"] = "General Technical Security"
                # Ensure reference exists
                ref = issue.get("reference")
                if not ref or str(ref).strip().lower() in ["none", "n/a", "null", ""]:
                    issue["reference"] = "OWASP Top 10"
                # Ensure confidence exists
                try:
                    conf = float(issue.get("confidence", 0.90))
                    issue["confidence"] = max(0.0, min(1.0, conf))
                except (ValueError, TypeError):
                    issue["confidence"] = 0.90

    validated = validate_with_schema(data, SecurityReport)
    res_dict = validated.model_dump()

    # Prioritize/sort findings by severity
    sev_weights = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}
    res_dict["issues"] = sorted(
        res_dict.get("issues", []),
        key=lambda x: sev_weights.get(x.get("severity", "Medium"), 1),
        reverse=True
    )

    return res_dict
