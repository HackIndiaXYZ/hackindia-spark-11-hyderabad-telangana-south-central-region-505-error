from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from schemas.common import Issue, RiskLevelEnum

class CriticalFinding(BaseModel):
    title: str = Field(..., description="Title of the finding")
    severity: str = Field(default="High", description="Severity level (Low, Medium, High, Critical)")
    category: str = Field(default="General", description="Domain or security category")
    reported_by: List[str] = Field(default_factory=list, description="Agents that identified this issue (e.g. ['Security', 'Legal'])")
    reason: str = Field(default="", description="Detailed rationale")
    recommendation: str = Field(default="", description="Actionable recommendation")

class ActionPlan(BaseModel):
    immediate: List[str] = Field(default_factory=list, description="Immediate 0-7 day high priority remediations")
    short_term: List[str] = Field(default_factory=list, description="Short-term 30-day operational improvements")
    long_term: List[str] = Field(default_factory=list, description="Long-term strategic roadmap goals")

class AuditReport(BaseModel):
    overall_risk: RiskLevelEnum = Field(default=RiskLevelEnum.HIGH, description="Consolidated corporate risk rating")
    overall_score: int = Field(default=50, ge=0, le=100, description="Consolidated corporate risk score (0-100)")
    executive_summary: str = Field(..., description="High-level executive synthesis across all specialist domains")
    critical_findings: List[CriticalFinding] = Field(default_factory=list, description="Deduplicated and prioritized issues across all domains")
    action_plan: ActionPlan = Field(default_factory=ActionPlan, description="Structured roadmap action plan")
    recommendations: List[str] = Field(default_factory=list, description="Key prioritized recommendations")
    next_steps: List[str] = Field(default_factory=list, description="Next steps for leadership and execution")
    agent_scores: Dict[str, int] = Field(default_factory=dict, description="Individual agent risk scores")
    overall_health_verdict: str = Field(default="High Risk - Requires Remediation", description="Executive decision verdict")
