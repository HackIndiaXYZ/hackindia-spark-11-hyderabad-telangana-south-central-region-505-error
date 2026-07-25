from typing import List, Optional
from pydantic import BaseModel, Field
from schemas.common import Issue, RiskLevelEnum

class CFOReport(BaseModel):
    overall_risk: RiskLevelEnum = Field(default=RiskLevelEnum.HIGH)
    risk_score: int = Field(default=50, ge=0, le=100)
    summary: str = Field(..., description="Summary of financial findings")
    issues: List[Issue] = Field(default_factory=list)
    missing_information: List[str] = Field(default_factory=list)
