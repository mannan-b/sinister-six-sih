from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.core.database import get_db
from app.models.case import Case
from app.models.entity import Entity
from app.models.relationship import Relationship
from app.models.alert import Alert
from app.models.document import Document
from app.schemas.case import CaseCreate, CaseUpdate, CaseStatusUpdate, CaseResponse
from app.schemas.common import ApiResponse
from app.ai.investigation_assistant import investigation_assistant

router = APIRouter(prefix="/cases", tags=["Cases"])

def _serialize_case(c: Case, db: Session) -> CaseResponse:
    fir = c.fir_number or c.case_number
    return CaseResponse(
        id=c.id,
        case_number=c.case_number or fir,
        fir_number=fir,
        name=c.name,
        description=c.description,
        police_station=c.police_station,
        investigating_officer=c.investigating_officer,
        officer_rank=c.officer_rank,
        status=c.status or "ACTIVE",
        created_at=c.created_at,
        updated_at=c.updated_at,
        meta_info=c.meta_info or {},
        entity_count=db.query(Entity).filter(Entity.case_id == c.id).count(),
        relationship_count=db.query(Relationship).filter(Relationship.case_id == c.id).count(),
        alert_count=db.query(Alert).filter(Alert.case_id == c.id).count(),
        document_count=db.query(Document).filter(Document.case_id == c.id).count(),
    )

@router.get("", response_model=ApiResponse[List[CaseResponse]])
def list_cases(
    search: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Case)
    
    if status and status.upper() != "ALL":
        query = query.filter(Case.status == status.upper())
        
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Case.name.ilike(term),
                Case.case_number.ilike(term),
                Case.fir_number.ilike(term),
                Case.investigating_officer.ilike(term),
                Case.police_station.ilike(term)
            )
        )
        
    cases = query.order_by(Case.created_at.desc()).all()
    results = [_serialize_case(c, db) for c in cases]
    return ApiResponse(success=True, data=results)

@router.post("", response_model=ApiResponse[CaseResponse])
def create_case(req: CaseCreate, db: Session = Depends(get_db)):
    if not req.name or not req.name.strip():
        raise HTTPException(status_code=400, detail="Case name is required.")
    if not req.fir_number or not req.fir_number.strip():
        raise HTTPException(status_code=400, detail="FIR number is required.")

    fir_clean = req.fir_number.strip()
    
    # Check for existing duplicate FIR or case number
    existing = db.query(Case).filter(
        or_(
            Case.case_number == fir_clean,
            Case.fir_number == fir_clean
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"A case with FIR number '{fir_clean}' already exists.")

    new_case = Case(
        case_number=req.case_number or fir_clean,
        fir_number=fir_clean,
        name=req.name.strip(),
        description=req.description.strip() if req.description else None,
        police_station=req.police_station.strip() if req.police_station else None,
        investigating_officer=req.investigating_officer.strip() if req.investigating_officer else None,
        officer_rank=req.officer_rank.strip() if req.officer_rank else None,
        status=(req.status or "ACTIVE").upper(),
        meta_info=req.meta_info or {}
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)
    return ApiResponse(success=True, data=_serialize_case(new_case, db))

@router.get("/{case_id}", response_model=ApiResponse[CaseResponse])
def get_case(case_id: str, db: Session = Depends(get_db)):
    c = db.query(Case).filter(Case.id == case_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found.")
    return ApiResponse(success=True, data=_serialize_case(c, db))

@router.put("/{case_id}", response_model=ApiResponse[CaseResponse])
def update_case(case_id: str, req: CaseUpdate, db: Session = Depends(get_db)):
    c = db.query(Case).filter(Case.id == case_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found.")

    if req.name is not None:
        c.name = req.name.strip()

    if req.fir_number is not None and req.fir_number.strip():
        new_fir = req.fir_number.strip()
        if new_fir != c.fir_number and new_fir != c.case_number:
            conflict = db.query(Case).filter(
                or_(Case.case_number == new_fir, Case.fir_number == new_fir),
                Case.id != case_id
            ).first()
            if conflict:
                raise HTTPException(status_code=400, detail=f"A case with FIR number '{new_fir}' already exists.")
            c.fir_number = new_fir
            c.case_number = new_fir

    if req.description is not None:
        c.description = req.description
    if req.police_station is not None:
        c.police_station = req.police_station
    if req.investigating_officer is not None:
        c.investigating_officer = req.investigating_officer
    if req.officer_rank is not None:
        c.officer_rank = req.officer_rank
    if req.status is not None:
        c.status = req.status.upper()
    if req.meta_info is not None:
        c.meta_info = req.meta_info

    c.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(c)
    return ApiResponse(success=True, data=_serialize_case(c, db))

@router.patch("/{case_id}/status", response_model=ApiResponse[CaseResponse])
def update_case_status(case_id: str, req: CaseStatusUpdate, db: Session = Depends(get_db)):
    c = db.query(Case).filter(Case.id == case_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found.")

    valid_statuses = ["ACTIVE", "CLOSED", "UNDER_INVESTIGATION"]
    new_status = req.status.upper()
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    c.status = new_status
    c.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(c)
    return ApiResponse(success=True, data=_serialize_case(c, db))

@router.get("/{case_id}/summary")
def get_case_summary(case_id: str, db: Session = Depends(get_db)):
    c = db.query(Case).filter(Case.id == case_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found.")
    summary = investigation_assistant.generate_investigation_summary(db, case_id)
    return ApiResponse(success=True, data=summary)
