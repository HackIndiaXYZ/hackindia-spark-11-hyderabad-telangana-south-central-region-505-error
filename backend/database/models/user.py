import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from database.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)
    role = Column(String(50), default="auditor")
    company = Column(String(100), nullable=True)

    # Extended profile fields
    phone      = Column(String(50),  nullable=True)
    department = Column(String(100), nullable=True)
    job_title  = Column(String(100), nullable=True)
    country    = Column(String(100), nullable=True)
    timezone   = Column(String(100), nullable=True)
    bio        = Column(String(500), nullable=True)
    avatar_url = Column(String(500), nullable=True)  # Relative URL or absolute URL

    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    documents     = relationship("Document",     back_populates="user", cascade="all, delete-orphan")
    audits        = relationship("Audit",        back_populates="user", cascade="all, delete-orphan")
    api_keys      = relationship("ApiKey",       back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    settings      = relationship("Setting",      back_populates="user", cascade="all, delete-orphan", uselist=False)
