import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(Integer, ForeignKey("audits.id", ondelete="CASCADE"), nullable=False, index=True)
    step = Column(String(100), nullable=False)  # e.g., PDF Uploaded, Security Agent Execution, Synthesis Complete
    status = Column(String(50), nullable=False, default="Completed")  # Started, In_Progress, Completed, Failed
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    finished_at = Column(DateTime, default=datetime.datetime.utcnow)
    message = Column(Text, nullable=True)

    audit = relationship("Audit", back_populates="audit_logs")
