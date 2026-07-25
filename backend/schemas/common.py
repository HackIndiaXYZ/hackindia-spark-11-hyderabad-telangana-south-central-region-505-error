from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class SeverityEnum(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class RiskLevelEnum(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class Issue(BaseModel):
    issue: str = Field(..., description="Title of the issue")
    severity: SeverityEnum = Field(default=SeverityEnum.MEDIUM, description="Severity level")
    reason: str = Field(..., description="Detailed explanation of the issue")
    recommendation: str = Field(..., description="Actionable recommendation")
    reference: Optional[str] = Field(default="Not specified", description="Regulatory or standard reference")
