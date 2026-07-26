import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database.database import Base

class Audit(Base):
    __tablename__ = "audits"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    overall_score = Column(Integer, nullable=False, default=50)
    overall_risk = Column(String(50), nullable=False, default="HIGH")  # LOW, MEDIUM, HIGH, CRITICAL
    executive_summary = Column(Text, nullable=True)
    overall_health_verdict = Column(String(255), nullable=True)
    processing_time = Column(Float, nullable=True)
    model_used = Column(String(100), default="Ollama qwen2.5:7b")
    status = Column(String(50), default="queued")  # queued, running, completed, failed
    progress = Column(Integer, default=0)
    task_id = Column(String(255), nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    document = relationship("Document", back_populates="audits")
    user = relationship("User", back_populates="audits")
    agent_results = relationship("AgentResult", back_populates="audit", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="audit", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="audit", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="audit", cascade="all, delete-orphan")

    @property
    def filename(self) -> str:
        if self.document and self.document.filename:
            return self.document.filename
        return f"Audit_{self.id}.pdf"

