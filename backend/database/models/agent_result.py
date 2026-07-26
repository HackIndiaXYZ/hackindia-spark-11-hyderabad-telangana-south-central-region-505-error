import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database.database import Base

class AgentResult(Base):
    __tablename__ = "agent_results"

    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(Integer, ForeignKey("audits.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_name = Column(String(50), nullable=False)  # CFO, Legal, Security, Market, Coordinator
    risk_score = Column(Integer, nullable=True)
    risk_level = Column(String(50), nullable=True)
    execution_time = Column(Float, nullable=True)
    result_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    audit = relationship("Audit", back_populates="agent_results")
