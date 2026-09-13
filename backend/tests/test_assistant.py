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

def test_assistant_stateful_history():
    db = SessionLocal()
    case = db.query(Case).filter((Case.name == "Operation Nexus") | (Case.case_number.in_(["FIR-1023/2026", "CAS-2026-NEXUS"]))).first()
    if case:
        context = {
            "type": "alert",
            "data": {
                "title": "Concurrent Vehicle Co-Travel: Praveen Kumar & Manish Sisodia",
                "explanation": "Praveen Kumar and Manish Sisodia were detected traveling concurrently in Vehicle DL09GH7788.",
                "entity_name": "DL09GH7788"
            }
        }
        # Simulate past turn where initial explanation was already given
        history = [
            {"role": "user", "content": "Why is DL09GH7788 considered high risk?"},
            {"role": "assistant", "content": "The anomaly Concurrent Vehicle Co-Travel was flagged because: Praveen Kumar and Manish Sisodia were detected..."}
        ]
        res = investigation_assistant.process_query(
            db=db,
            case_id=case.id,
            query="what is suspicious about travelling concurrently in DL09GH7788",
            context=context,
            history=history
        )
        assert res.answer is not None
        assert "Investigative Risk Explanation" in res.answer or "Covert Physical Rendezvous" in res.answer
    db.close()
