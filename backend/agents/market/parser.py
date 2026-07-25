from typing import Dict, Any
from schemas.market import MarketReport
from utils.json_utils import parse_json, validate_with_schema
from utils.logger import get_logger

logger = get_logger("market_parser")

def parse_market_response(raw_output: str) -> Dict[str, Any]:
    """
    Parses and validates Market LLM response using MarketReport Pydantic schema.
    Normalizes risk scores, market readiness scores, and sorts issues by severity.
    """
    logger.info("Parsing Market LLM response...")
    data = parse_json(raw_output)

    # Normalize competitors if passed as simple strings
    competitors = data.get("competitors", [])
    normalized_competitors = []
    if isinstance(competitors, list):
        for comp in competitors:
            if isinstance(comp, str):
                normalized_competitors.append({
                    "name": comp,
                    "advantage": "Not specified",
                    "disadvantage": "Not specified"
                })
            elif isinstance(comp, dict):
                normalized_competitors.append({
                    "name": str(comp.get("name", "Unknown Competitor")),
                    "advantage": str(comp.get("advantage", "Not specified")),
                    "disadvantage": str(comp.get("disadvantage", "Not specified"))
                })
        data["competitors"] = normalized_competitors

    # Validate against MarketReport schema
    validated = validate_with_schema(data, MarketReport)
    res_dict = validated.model_dump()

    # Sort issues by severity weight
    sev_weights = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}
    res_dict["issues"] = sorted(
        res_dict.get("issues", []),
        key=lambda x: sev_weights.get(x.get("severity", "Medium"), 1),
        reverse=True
    )

    return res_dict
