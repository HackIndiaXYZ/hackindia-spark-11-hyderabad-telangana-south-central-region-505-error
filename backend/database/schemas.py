import datetime
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, ConfigDict

# 1. User Schemas
class UserBase(BaseModel):
    name: str
    email: str
    role: Optional[str] = "auditor"
    company: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_deleted: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


# 2. Document Schemas
class DocumentCreate(BaseModel):
    filename: str
    file_type: Optional[str] = "application/pdf"
    file_size: Optional[int] = None
    file_path: str
    user_id: Optional[int] = None

class DocumentResponse(DocumentCreate):
    id: int
    status: str
    uploaded_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


# 3. Finding Schemas
class FindingCreate(BaseModel):
    agent_name: str = "General"
    title: str
    description: Optional[str] = None
    severity: str = "High"
    category: str = "General"
    confidence: Optional[float] = 0.90
    recommendation: Optional[str] = None
    status: Optional[str] = "Open"

class FindingResponse(FindingCreate):
    id: int
    audit_id: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


# 4. Recommendation Schemas
class RecommendationCreate(BaseModel):
    priority: str = "High"
    recommendation: str
    estimated_effort: str = "Medium"

class RecommendationResponse(RecommendationCreate):
    id: int
    audit_id: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


# 5. Agent Result Schemas
class AgentResultCreate(BaseModel):
    agent_name: str
    risk_score: Optional[int] = None
    risk_level: Optional[str] = None
    execution_time: Optional[float] = None
    result_json: Optional[Dict[str, Any]] = None

class AgentResultResponse(AgentResultCreate):
    id: int
    audit_id: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


# 6. Audit Log Schemas
class AuditLogCreate(BaseModel):
    step: str
    status: str = "Completed"
    message: Optional[str] = None
    started_at: Optional[datetime.datetime] = None
    finished_at: Optional[datetime.datetime] = None

class AuditLogResponse(AuditLogCreate):
    id: int
    audit_id: int

    model_config = ConfigDict(from_attributes=True)


# 7. Audit Schemas
class AuditCreate(BaseModel):
    document_id: Optional[int] = None
    user_id: Optional[int] = None
    overall_score: int = 50
    overall_risk: str = "HIGH"
    executive_summary: Optional[str] = None
    overall_health_verdict: Optional[str] = None
    processing_time: Optional[float] = None
    model_used: Optional[str] = "Ollama qwen2.5:7b"
    status: Optional[str] = "queued"
    progress: Optional[int] = 0
    task_id: Optional[str] = None

class AuditResponse(AuditCreate):
    id: int
    created_at: datetime.datetime
    filename: Optional[str] = None
    document: Optional[DocumentResponse] = None
    agent_results: List[AgentResultResponse] = []
    findings: List[FindingResponse] = []
    recommendations: List[RecommendationResponse] = []
    audit_logs: List[AuditLogResponse] = []

    model_config = ConfigDict(from_attributes=True)



# 8. API Key Schemas
class ApiKeyCreate(BaseModel):
    provider: str
    encrypted_key: str

class ApiKeyResponse(BaseModel):
    id: int
    user_id: int
    provider: str
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


# 9. Notification Schemas
class NotificationCreate(BaseModel):
    message: str
    user_id: int

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    message: str
    status: str
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


# 10. Setting Schemas
class SettingUpdate(BaseModel):
    selected_model: Optional[str] = None
    theme: Optional[str] = None
    language: Optional[str] = None
    notifications_enabled: Optional[bool] = None

class SettingResponse(BaseModel):
    id: int
    user_id: int
    selected_model: str
    theme: str
    language: str
    notifications_enabled: bool
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


# Analytics Summary Schema
class AuditAnalyticsSummary(BaseModel):
    total_audits: int
    average_risk_score: float
    critical_findings_count: int
    audits_by_risk: Dict[str, int]
