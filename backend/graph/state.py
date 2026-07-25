from typing import TypedDict, Optional, Dict, Any, List

class AgentState(TypedDict, total=False):
    document_text: str
    cfo_result: Optional[Dict[str, Any]]
    legal_result: Optional[Dict[str, Any]]
    security_result: Optional[Dict[str, Any]]
    market_result: Optional[Dict[str, Any]]
    audit_result: Optional[Dict[str, Any]]
    final_report: Optional[Dict[str, Any]]
    errors: Optional[List[str]]
