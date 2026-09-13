import pytest
from app.core.database import SessionLocal
from app.models.case import Case
from app.ai.investigation_assistant import investigation_assistant

def test_assistant_query_execution():
    db = SessionLocal()
    case = db.query(Case).filter((Case.name == "Operation Nexus") | (Case.case_number.in_(["FIR-1023/2026", "CAS-2026-NEXUS"]))).first()
    if case:
        res = investigation_assistant.process_query(
            db=db,
            case_id=case.id,
            query="How is Rohit Sharma connected to Sameer Khan?"
        )
        assert res.answer is not None
        assert "Rohit Sharma" in res.answer
        assert len(res.evidence) > 0
        assert res.confidence == "High"
    db.close()

def test_assistant_bridge_query():
    db = SessionLocal()
    case = db.query(Case).filter((Case.name == "Operation Nexus") | (Case.case_number.in_(["FIR-1023/2026", "CAS-2026-NEXUS"]))).first()
    if case:
        res = investigation_assistant.process_query(
            db=db,
            case_id=case.id,
            query="Which person connects the two largest communities?"
        )
        assert res.answer is not None
        assert "bridge" in res.answer.lower() or "intermediary" in res.answer.lower() or "amit" in res.answer.lower()
    db.close()
