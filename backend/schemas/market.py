from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from schemas.common import Issue, RiskLevelEnum

class CompetitorInfo(BaseModel):
    name: str = Field(..., description="Name of the competitor")
    advantage: Optional[str] = Field(default="Not specified", description="Competitor advantage")
    disadvantage: Optional[str] = Field(default="Not specified", description="Competitor disadvantage")

class SWOTAnalysis(BaseModel):
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    opportunities: List[str] = Field(default_factory=list)
    threats: List[str] = Field(default_factory=list)

class MarketReport(BaseModel):
    overall_risk: RiskLevelEnum = Field(default=RiskLevelEnum.HIGH)
    risk_score: int = Field(default=50, ge=0, le=100)
    market_readiness_score: int = Field(default=50, ge=0, le=100)
    summary: str = Field(..., description="Executive summary of market viability and strategy")
    business_model: str = Field(default="Undefined", description="Identified business model (SaaS, B2B, B2C, Marketplace, etc.)")
    issues: List[Issue] = Field(default_factory=list)
    opportunities: List[str] = Field(default_factory=list)
    competitors: List[CompetitorInfo] = Field(default_factory=list)
    swot: SWOTAnalysis = Field(default_factory=SWOTAnalysis)
