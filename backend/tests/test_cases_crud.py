import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.case import Case

client = TestClient(app)

def test_list_cases():
    response = client.get("/api/v1/cases")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) >= 1
    # Check that Operation Nexus is present with correct fields
    nexus = next((c for c in data["data"] if c["name"] == "Operation Nexus"), None)
    assert nexus is not None
    assert nexus["fir_number"] == "FIR-1023/2026"
    assert nexus["police_station"] == "Cyber Crime Cell"
    assert nexus["investigating_officer"] == "Inspector Rajesh Sharma"
    assert nexus["status"] == "ACTIVE"
    assert nexus["entity_count"] == 96

def test_create_read_update_delete_case_flow():
    # 1. Create a new case
    payload = {
        "name": "Test Investigation Alpha",
        "fir_number": "FIR-9999/2026",
        "police_station": "Special Task Force",
        "investigating_officer": "Inspector Vikram Roy",
        "officer_rank": "Inspector",
        "description": "Cross-border illicit contraband logistics network.",
        "status": "ACTIVE"
    }
    create_res = client.post("/api/v1/cases", json=payload)
    assert create_res.status_code == 200
    created = create_res.json()["data"]
    case_id = created["id"]
    assert created["name"] == payload["name"]
    assert created["fir_number"] == payload["fir_number"]
    assert created["entity_count"] == 0
    assert created["relationship_count"] == 0
    assert created["alert_count"] == 0

    # 2. Prevent duplicate FIR number
    dup_res = client.post("/api/v1/cases", json=payload)
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"].lower()

    # 3. Read case by ID
    get_res = client.get(f"/api/v1/cases/{case_id}")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["id"] == case_id
    assert get_res.json()["data"]["name"] == "Test Investigation Alpha"

    # 4. Search and Filter
    search_res = client.get("/api/v1/cases?search=Alpha")
    assert search_res.status_code == 200
    assert len(search_res.json()["data"]) == 1
    assert search_res.json()["data"][0]["id"] == case_id

    # 5. Update case (Edit)
    update_payload = {
        "name": "Test Investigation Alpha Renamed",
        "description": "Updated intelligence briefing."
    }
    put_res = client.put(f"/api/v1/cases/{case_id}", json=update_payload)
    assert put_res.status_code == 200
    updated = put_res.json()["data"]
    assert updated["id"] == case_id
    assert updated["name"] == "Test Investigation Alpha Renamed"
    assert updated["description"] == "Updated intelligence briefing."

    # 6. Patch Status to CLOSED
    patch_res = client.patch(f"/api/v1/cases/{case_id}/status", json={"status": "CLOSED"})
    assert patch_res.status_code == 200
    assert patch_res.json()["data"]["status"] == "CLOSED"

    # Filter closed cases
    closed_res = client.get("/api/v1/cases?status=CLOSED")
    assert closed_res.status_code == 200
    assert any(c["id"] == case_id for c in closed_res.json()["data"])

    # 7. Test invalid case returns 404
    non_existent = client.get("/api/v1/cases/00000000-0000-0000-0000-000000000000")
    assert non_existent.status_code == 404

    # 8. Clean up created test case from db to keep test environment clean
    db = SessionLocal()
    db_case = db.query(Case).filter(Case.id == case_id).first()
    if db_case:
        db.delete(db_case)
        db.commit()
    db.close()
