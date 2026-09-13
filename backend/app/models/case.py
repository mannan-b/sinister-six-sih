import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Case(Base):
    __tablename__ = "cases"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_number = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, CLOSED, UNDER_INVESTIGATION
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Metadata & Core Investigation Attributes
    fir_number = Column(String(100), nullable=True, index=True)
    police_station = Column(String(255), nullable=True)
    investigating_officer = Column(String(255), nullable=True)
    officer_rank = Column(String(100), nullable=True)
    meta_info = Column(JSON, default=dict)

    # Relationships
    documents = relationship("Document", back_populates="case", cascade="all, delete-orphan")
    entities = relationship("Entity", back_populates="case", cascade="all, delete-orphan")
    relationships = relationship("Relationship", back_populates="case", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="case", cascade="all, delete-orphan")
    communications = relationship("Communication", back_populates="case", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="case", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="case", cascade="all, delete-orphan")
    analysis_runs = relationship("AnalysisRun", back_populates="case", cascade="all, delete-orphan")
