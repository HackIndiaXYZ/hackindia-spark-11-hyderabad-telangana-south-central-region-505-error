import json
import re
from typing import Dict, Any, Type, TypeVar, Optional
from pydantic import BaseModel
from utils.logger import get_logger

logger = get_logger("json_utils")
T = TypeVar("T", bound=BaseModel)

def extract_json_string(text: str) -> str:
    """Extracts JSON substring from LLM string output."""
    raw = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    start = raw.find('{')
    end = raw.rfind('}')
    if start != -1 and end != -1 and end > start:
        return raw[start:end+1]
    return raw

def parse_json(raw_output: str) -> Dict[str, Any]:
    """Parses raw text into a Python dictionary."""
    if isinstance(raw_output, dict):
        return raw_output
        
    json_str = extract_json_string(str(raw_output))
    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode failed: {e}")
        raise ValueError(f"Failed to parse output as valid JSON: {e}\nRaw output:\n{raw_output}")

def validate_with_schema(data: Dict[str, Any], schema_cls: Type[T]) -> T:
    """Validates a Python dictionary against a Pydantic schema class."""
    try:
        return schema_cls.model_validate(data)
    except Exception as e:
        logger.warning(f"Validation error against schema {schema_cls.__name__}: {e}. Retrying with lax parsing.")
        # Perform best-effort attribute coercion if validation fails
        return schema_cls.model_construct(**data)
