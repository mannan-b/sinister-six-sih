"""
Comprehensive End-to-End Verification Script for NEXUS Case Management
Validates all requirements from the specification.
"""
import requests
import sys
import json

BASE_API = "http://127.0.0.1:8000/api/v1"
BASE_FE = "http://localhost:3000"

def get_data(resp):
    try:
        body = resp.json()
        if isinstance(body, dict) and "data" in body:
            return body["data"]
        return body
    except Exception:
        return resp.text

def test_seeded_state():
    print("\n--- Test 1: Seeded State Verification ---")
    resp = requests.get(f"{BASE_API}/cases")
    assert resp.status_code == 200, f"Failed to get cases: {resp.status_code}"
    cases = get_data(resp)
    print(f"Total cases returned: {len(cases)}")
    assert len(cases) == 1, f"Expected exactly 1 case, got {len(cases)}: {[c['name'] for c in cases]}"
    nexus = cases[0]
    assert nexus["name"] == "Operation Nexus", f"Expected Operation Nexus, got {nexus['name']}"
    assert nexus["fir_number"] == "FIR-1023/2026", f"Expected FIR-1023/2026, got {nexus.get('fir_number')}"
    assert nexus["police_station"] == "Cyber Crime Cell", f"Expected Cyber Crime Cell, got {nexus.get('police_station')}"
    assert nexus["investigating_officer"] == "Inspector Rajesh Sharma", f"Expected Inspector Rajesh Sharma, got {nexus.get('investigating_officer')}"
    assert nexus["status"] == "ACTIVE", f"Expected ACTIVE, got {nexus.get('status')}"
    print("PASS: Exactly 1 seeded case 'Operation Nexus' exists with correct FIR, Station, Officer, and ACTIVE status.")
    return nexus["id"]

def test_nexus_intelligence(nexus_id):
    print("\n--- Test 2: Operation Nexus Intelligence Verification ---")
    ent_resp = requests.get(f"{BASE_API}/entities", params={"case_id": nexus_id})
    assert ent_resp.status_code == 200
    entities = get_data(ent_resp)
    print(f"Operation Nexus entities: {len(entities)}")
    assert len(entities) == 96, f"Expected 96 entities, got {len(entities)}"

    alert_resp = requests.get(f"{BASE_API}/alerts", params={"case_id": nexus_id})
    assert alert_resp.status_code == 200
    alerts = get_data(alert_resp)
    print(f"Operation Nexus alerts: {len(alerts)}")
    assert len(alerts) > 0, "Expected alerts > 0"

    graph_resp = requests.get(f"{BASE_API}/cases/{nexus_id}/graph")
    assert graph_resp.status_code == 200
    graph = get_data(graph_resp)
    print(f"Operation Nexus graph nodes: {len(graph.get('nodes', []))}, edges: {len(graph.get('edges', []))}")
    assert len(graph.get("nodes", [])) > 0
    assert len(graph.get("edges", [])) > 0

    assistant_resp = requests.post(f"{BASE_API}/assistant/query", json={"case_id": nexus_id, "query": "Summarize case"})
    assert assistant_resp.status_code == 200
    assistant_data = get_data(assistant_resp)
    response_text = assistant_data.get("answer", "") if isinstance(assistant_data, dict) else str(assistant_data)
    print(f"Operation Nexus assistant responded: {bool(response_text)}")
    assert len(response_text) > 0

    print("PASS: Operation Nexus intelligence data fully populated and responsive.")

def test_create_case_and_duplicate():
    print("\n--- Test 3: Case Creation & Duplicate FIR Rejection ---")
    payload = {
        "name": "Test Investigation",
        "fir_number": "FIR-0001/2026",
        "police_station": "North Police Station",
        "investigating_officer": "Officer Test",
        "officer_rank": "Sub-Inspector",
        "description": "Test case for isolation validation"
    }
    resp = requests.post(f"{BASE_API}/cases", json=payload)
    assert resp.status_code in (200, 201), f"Failed to create case: {resp.status_code} {resp.text}"
    new_case = get_data(resp)
    print(f"Created new case: {new_case['name']} (ID: {new_case['id']})")
    assert new_case["name"] == payload["name"]
    assert new_case["fir_number"] == payload["fir_number"]

    # Test Duplicate FIR rejection
    dup_resp = requests.post(f"{BASE_API}/cases", json=payload)
    print(f"Duplicate FIR submission response code: {dup_resp.status_code}")
    assert dup_resp.status_code == 400, f"Expected 400 for duplicate FIR, got {dup_resp.status_code}"
    print("PASS: New case created successfully and duplicate FIR properly rejected with 400.")
    return new_case["id"]

def test_isolation_and_empty_state(new_case_id, nexus_id):
    print("\n--- Test 4: New Case Data Isolation & Empty State Verification ---")
    # Entities
    ent_resp = requests.get(f"{BASE_API}/entities", params={"case_id": new_case_id})
    assert ent_resp.status_code == 200
    entities = get_data(ent_resp)
    print(f"New case entities: {len(entities)}")
    assert len(entities) == 0, f"Expected 0 entities, got {len(entities)}"

    # Alerts
    alert_resp = requests.get(f"{BASE_API}/alerts", params={"case_id": new_case_id})
    assert alert_resp.status_code == 200
    alerts = get_data(alert_resp)
    print(f"New case alerts: {len(alerts)}")
    assert len(alerts) == 0, f"Expected 0 alerts, got {len(alerts)}"

    # Graph
    graph_resp = requests.get(f"{BASE_API}/cases/{new_case_id}/graph")
    assert graph_resp.status_code == 200
    graph = get_data(graph_resp)
    print(f"New case graph nodes: {len(graph.get('nodes', []))}, edges: {len(graph.get('edges', []))}")
    assert len(graph.get("nodes", [])) == 0
    assert len(graph.get("edges", [])) == 0

    # Assistant
    asst_resp = requests.post(f"{BASE_API}/assistant/query", json={"case_id": new_case_id, "query": "Status"})
    assert asst_resp.status_code == 200
    asst_data = get_data(asst_resp)
    resp_text = asst_data.get("answer", "") if isinstance(asst_data, dict) else str(asst_data)
    print(f"New case assistant message: {resp_text[:80]}...")
    assert "No entities" in resp_text

    # Re-verify Operation Nexus unaffected
    ent_resp_nexus = requests.get(f"{BASE_API}/entities", params={"case_id": nexus_id})
    assert ent_resp_nexus.status_code == 200
    assert len(get_data(ent_resp_nexus)) == 96, "Operation Nexus entities corrupted!"

    print("PASS: Bidirectional isolation verified. New case is 100% empty, Operation Nexus intact.")

def test_edit_case(case_id):
    print("\n--- Test 5: Edit Case Metadata ---")
    update_payload = {
        "name": "Test Investigation Updated",
        "description": "Updated description for testing",
        "investigating_officer": "Inspector Upgraded",
        "officer_rank": "Inspector"
    }
    resp = requests.put(f"{BASE_API}/cases/{case_id}", json=update_payload)
    assert resp.status_code == 200, f"Failed to update case: {resp.status_code} {resp.text}"
    updated = get_data(resp)
    assert updated["id"] == case_id, "Case ID must not change during update!"
    assert updated["name"] == "Test Investigation Updated"
    assert updated["investigating_officer"] == "Inspector Upgraded"
    assert updated["officer_rank"] == "Inspector"
    print("PASS: Case metadata successfully edited while preserving Case ID.")

def test_close_case_and_filtering(case_id):
    print("\n--- Test 6: Close Case & Status Filtering ---")
    # Patch status to CLOSED
    resp = requests.patch(f"{BASE_API}/cases/{case_id}/status", json={"status": "CLOSED"})
    assert resp.status_code == 200
    assert get_data(resp)["status"] == "CLOSED"

    # Filter ACTIVE
    active_resp = requests.get(f"{BASE_API}/cases", params={"status": "ACTIVE"})
    assert active_resp.status_code == 200
    active_cases = get_data(active_resp)
    active_ids = [c["id"] for c in active_cases]
    assert case_id not in active_ids, "Closed case appeared in ACTIVE filter!"

    # Filter CLOSED
    closed_resp = requests.get(f"{BASE_API}/cases", params={"status": "CLOSED"})
    assert closed_resp.status_code == 200
    closed_cases = get_data(closed_resp)
    closed_ids = [c["id"] for c in closed_cases]
    assert case_id in closed_ids, "Closed case not found in CLOSED filter!"

    print("PASS: Status transition to CLOSED and status filtering verified.")

def test_invalid_case_id():
    print("\n--- Test 7: Invalid Case ID Handling ---")
    invalid_id = "00000000-0000-0000-0000-000000000000"
    resp = requests.get(f"{BASE_API}/cases/{invalid_id}")
    assert resp.status_code == 404, f"Expected 404 for non-existent case, got {resp.status_code}"
    print(f"Backend correctly returned 404: {resp.status_code}")

    fe_resp = requests.get(f"{BASE_FE}/cases/{invalid_id}")
    assert fe_resp.status_code == 200, f"Expected 200 HTML page from frontend, got {fe_resp.status_code}"
    print("PASS: Invalid case ID returns 404 on API and renders gracefully on frontend.")

def cleanup(case_id):
    import sqlite3
    try:
        conn = sqlite3.connect("backend/app/nexus.db")
        cur = conn.cursor()
        cur.execute("DELETE FROM cases WHERE id = ?", (case_id,))
        conn.commit()
        conn.close()
        print(f"\nCleanup: Removed temporary test case {case_id} from database.")
    except Exception as e:
        print(f"Cleanup note: {e}")

if __name__ == "__main__":
    temp_case_id = None
    try:
        nexus_id = test_seeded_state()
        test_nexus_intelligence(nexus_id)
        temp_case_id = test_create_case_and_duplicate()
        test_isolation_and_empty_state(temp_case_id, nexus_id)
        test_edit_case(temp_case_id)
        test_close_case_and_filtering(temp_case_id)
        test_invalid_case_id()
        print("\n==================================================")
        print("ALL VERIFICATION SUITES PASSED SUCCESSFULLY!")
        print("==================================================")
    except Exception as e:
        print(f"\nFAILURE: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        if temp_case_id:
            cleanup(temp_case_id)
