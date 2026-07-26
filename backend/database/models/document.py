import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), default="application/pdf")
    file_size = Column(Integer, nullable=True)
    file_path = Column(String(500), nullable=False)
    status = Column(String(50), default="Uploaded")  # Uploaded, Processing, Completed, Failed
    is_deleted = Column(Boolean, default=False)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="documents")
    audits = relationship("Audit", back_populates="document", cascade="all, delete-orphan")
