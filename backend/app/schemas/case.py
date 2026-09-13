from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class CaseBase(BaseModel):
    name: str
    fir_number: Optional[str] = None
    case_number: Optional[str] = None
    description: Optional[str] = None
    police_station: Optional[str] = None
    investigating_officer: Optional[str] = None
    officer_rank: Optional[str] = None
    status: Optional[str] = "ACTIVE"
    meta_info: Optional[Dict[str, Any]] = None

class CaseCreate(BaseModel):
    name: str
    fir_number: str
    case_number: Optional[str] = None
    description: Optional[str] = None
    police_station: Optional[str] = None
    investigating_officer: Optional[str] = None
    officer_rank: Optional[str] = None
    status: Optional[str] = "ACTIVE"
    meta_info: Optional[Dict[str, Any]] = None

class CaseUpdate(BaseModel):
    name: Optional[str] = None
    fir_number: Optional[str] = None
    case_number: Optional[str] = None
    description: Optional[str] = None
    police_station: Optional[str] = None
    investigating_officer: Optional[str] = None
    officer_rank: Optional[str] = None
    status: Optional[str] = None
    meta_info: Optional[Dict[str, Any]] = None

class CaseStatusUpdate(BaseModel):
    status: str

class CaseResponse(CaseBase):
    id: str
    case_number: str
    fir_number: str
    created_at: datetime
    updated_at: datetime
    entity_count: Optional[int] = 0
    relationship_count: Optional[int] = 0
    alert_count: Optional[int] = 0
    document_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)
