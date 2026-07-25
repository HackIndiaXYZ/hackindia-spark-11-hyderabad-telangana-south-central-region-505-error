from typing import List, Optional
from pydantic import BaseModel, Field
from schemas.common import SeverityEnum, RiskLevelEnum

class SecurityIssue(BaseModel):
    issue: str = Field(..., description="Title of the security vulnerability")
    severity: SeverityEnum = Field(default=SeverityEnum.HIGH, description="Severity level")
    category: str = Field(..., description="Category of risk (e.g. Secrets Management, Authentication, Prompt Injection)")
    reason: str = Field(..., description="Technical explanation of the security risk")
    recommendation: str = Field(..., description="Actionable technical remediation step")
    reference: Optional[str] = Field(default="OWASP Top 10", description="OWASP, MITRE ATT&CK, or security standard reference")
    confidence: float = Field(default=0.95, ge=0.0, le=1.0, description="Confidence score of the finding")

class SecurityReport(BaseModel):
    overall_risk: RiskLevelEnum = Field(default=RiskLevelEnum.HIGH)
    risk_score: int = Field(default=50, ge=0, le=100)
    summary: str = Field(..., description="Executive summary of technical cybersecurity findings")
    issues: List[SecurityIssue] = Field(default_factory=list)
    attack_surface: List[str] = Field(default_factory=list, description="Identified attack vectors and surface areas")
