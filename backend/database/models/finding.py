import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database.database import Base

class Finding(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(Integer, ForeignKey("audits.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_name = Column(String(50), nullable=True, default="General", server_default="General")  # Security, Legal, CFO, Market, Coordinator
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(50), nullable=False, default="High", index=True)  # Low, Medium, High, Critical
    category = Column(String(100), nullable=False, default="General", index=True)
    confidence = Column(Float, default=0.90)
    recommendation = Column(Text, nullable=True)
    status = Column(String(50), default="Open")  # Open, Under_Review, Resolved, Ignored
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    audit = relationship("Audit", back_populates="findings")
