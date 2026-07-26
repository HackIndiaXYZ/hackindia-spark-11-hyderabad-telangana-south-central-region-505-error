import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database.database import Base

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(Integer, ForeignKey("audits.id", ondelete="CASCADE"), nullable=False, index=True)
    priority = Column(String(50), nullable=False, default="High")  # Immediate, Short-Term, Long-Term
    recommendation = Column(Text, nullable=False)
    estimated_effort = Column(String(50), default="Medium")  # Low, Medium, High
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    audit = relationship("Audit", back_populates="recommendations")
