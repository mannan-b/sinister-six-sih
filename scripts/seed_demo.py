import os
import sys
import csv
import glob
from datetime import datetime

# Add parent directory to sys.path so app modules import cleanly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from app.core.database import SessionLocal, Base, engine
from app.models.case import Case
from app.models.document import Document
from app.models.entity import Entity
from app.models.relationship import Relationship
from app.models.transaction import Transaction
from app.models.communication import Communication
from app.models.event import Event
from app.models.alert import Alert
from app.models.analysis_run import AnalysisRun
from app.graph.graph_builder import graph_repository
from app.graph.graph_metrics import graph_metrics_calculator
from app.graph.community_detection import community_detector
from app.anomaly.transaction_anomaly import transaction_anomaly_detector
from app.anomaly.communication_anomaly import communication_anomaly_detector
from app.anomaly.location_anomaly import location_anomaly_detector
from app.services.alert_engine import alert_engine
from app.services.risk_scoring import risk_scoring_service
from app.ingestion.parsers import file_parser

def seed():
    print("=" * 60)
    print("NEXUS INVESTIGATION INTELLIGENCE SYSTEM — DATABASE SEEDER")
    print("=" * 60)

    # 1. Create tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing data for a clean reproducible demo
    db.query(Alert).delete()
    db.query(Event).delete()
    db.query(Transaction).delete()
    db.query(Communication).delete()
    db.query(Relationship).delete()
    db.query(Document).delete()
    db.query(Entity).delete()
    db.query(AnalysisRun).delete()
    db.query(Case).delete()
    db.commit()

    print("[OK] Cleared existing demo database.")

    # 2. Create Cases (Strictly ONE seeded case: Operation Nexus)
    case_nexus = Case(
        case_number="FIR-1023/2026",
        fir_number="FIR-1023/2026",
        name="Operation Nexus",
        description="Trans-national organized network intelligence, financial trace, and communication topology investigation.",
        police_station="Cyber Crime Cell",
        investigating_officer="Inspector Rajesh Sharma",
        officer_rank="Inspector",
        status="ACTIVE",
        meta_info={"lead_agency": "Cyber Crime Cell", "priority": "CRITICAL"}
    )
    db.add(case_nexus)
    db.commit()
    db.refresh(case_nexus)
    case_id = case_nexus.id

    print(f"[OK] Created Case: {case_nexus.name} (ID: {case_id})")

    # 3. Load Persons CSV
    data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "demo"))
    persons_file = os.path.join(data_dir, "persons.csv")
    
    person_entities = {}
    phone_entities = {}
    vehicle_entities = {}
    account_entities = {}

    if os.path.exists(persons_file):
        with open(persons_file, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = row["name"].strip()
                aliases = [a.strip() for a in row.get("aliases", "").split(",") if a.strip()]
                phone = row.get("primary_phone", "").strip()
                vehicle = row.get("primary_vehicle", "").strip()
                account = row.get("primary_account", "").strip()

                # Person Entity
                p_ent = Entity(
                    case_id=case_id,
                    type="PERSON",
                    canonical_name=name.lower(),
                    display_name=name,
                    aliases=aliases,
                    confidence=0.98,
                    source_references=[{"source": "persons.csv", "type": "RECORD_INGEST"}],
                    meta_info={"role": row.get("role"), "notes": row.get("notes")}
                )
                db.add(p_ent)
                db.flush()
                person_entities[name] = p_ent

                # Phone Entity
                if phone:
                    if phone not in phone_entities:
                        ph_ent = Entity(
                            case_id=case_id,
                            type="PHONE",
                            canonical_name=phone,
                            display_name=phone,
                            meta_info={"carrier": "Airtel / Jio", "registered_user": name}
                        )
                        db.add(ph_ent)
                        db.flush()
                        phone_entities[phone] = ph_ent

                    # USES relationship
                    db.add(Relationship(
                        case_id=case_id,
                        source_id=p_ent.id,
                        target_id=phone_entities[phone].id,
                        relationship_type="USES",
                        confidence=0.98,
                        source_document="persons.csv",
                        evidence_text=f"{name} is the registered primary subscriber of phone {phone}."
                    ))

                # Vehicle Entity
                if vehicle:
                    if vehicle not in vehicle_entities:
                        v_ent = Entity(
                            case_id=case_id,
                            type="VEHICLE",
                            canonical_name=vehicle,
                            display_name=vehicle,
                            meta_info={"registration": vehicle}
                        )
                        db.add(v_ent)
                        db.flush()
                        vehicle_entities[vehicle] = v_ent

                    # OWNS / USES relationship
                    db.add(Relationship(
                        case_id=case_id,
                        source_id=p_ent.id,
                        target_id=vehicle_entities[vehicle].id,
                        relationship_type="OWNS",
                        confidence=0.95,
                        source_document="persons.csv",
                        evidence_text=f"{name} is recorded as registered owner/primary user of vehicle {vehicle}."
                    ))

                # Bank Account Entity
                if account:
                    if account not in account_entities:
                        acc_ent = Entity(
                            case_id=case_id,
                            type="BANK_ACCOUNT",
                            canonical_name=account,
                            display_name=f"Acc {account}",
                            meta_info={"account_number": account, "holder": name}
                        )
                        db.add(acc_ent)
                        db.flush()
                        account_entities[account] = acc_ent

                    db.add(Relationship(
                        case_id=case_id,
                        source_id=p_ent.id,
                        target_id=account_entities[account].id,
                        relationship_type="USES",
                        confidence=0.99,
                        source_document="persons.csv",
                        evidence_text=f"{name} holds signatory authority over bank account {account}."
                    ))

        db.commit()
        print(f"[OK] Loaded {len(person_entities)} Person entities, {len(phone_entities)} Phone entities, {len(vehicle_entities)} Vehicles, {len(account_entities)} Bank Accounts.")

    # 4. Load Vehicles CSV (with shared users)
    vehicles_file = os.path.join(data_dir, "vehicles.csv")
    if os.path.exists(vehicles_file):
        with open(vehicles_file, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                reg = row["registration"].strip()
                v_category = row.get("vehicle_category", "PERSONAL_VEHICLE").strip()
                owner_name = row.get("registered_owner", "").strip()
                driver_name = row.get("primary_driver", "").strip()

                v_ent = vehicle_entities.get(reg)
                if not v_ent:
                    v_ent = Entity(
                        case_id=case_id,
                        type="VEHICLE",
                        canonical_name=reg,
                        display_name=reg,
                        meta_info={
                            "make_model": row.get("make_model"),
                            "registered_owner": owner_name,
                            "primary_driver": driver_name,
                            "vehicle_category": v_category,
                            "notes": row.get("notes")
                        }
                    )
                    db.add(v_ent)
                    db.flush()
                    vehicle_entities[reg] = v_ent
                else:
                    v_ent.meta_info = {
                        **(v_ent.meta_info or {}),
                        "registered_owner": owner_name,
                        "primary_driver": driver_name,
                        "vehicle_category": v_category,
                        "make_model": row.get("make_model"),
                        "notes": row.get("notes")
                    }

                # 1. Registered Owner OWNS vehicle edge
                if owner_name:
                    o_ent = person_entities.get(owner_name)
                    if o_ent:
                        db.add(Relationship(
                            case_id=case_id,
                            source_id=o_ent.id,
                            target_id=v_ent.id,
                            relationship_type="OWNS",
                            confidence=0.98,
                            source_document="vehicles.csv",
                            timestamp=datetime(2026, 8, 10, 9, 0),
                            evidence_text=f"{owner_name} is registered legal owner of vehicle {reg} ({v_category})."
                        ))

                # 2. Driver DRIVES vehicle edge
                if driver_name:
                    d_ent = person_entities.get(driver_name)
                    if d_ent:
                        db.add(Relationship(
                            case_id=case_id,
                            source_id=d_ent.id,
                            target_id=v_ent.id,
                            relationship_type="DRIVES",
                            confidence=0.96,
                            source_document="vehicles.csv",
                            timestamp=datetime(2026, 8, 12, 14, 30),
                            evidence_text=f"{driver_name} operates as designated driver for vehicle {reg} ({v_category})."
                        ))

                # 3. Passengers TRAVELED_IN vehicle edges
                shared_users = [u.strip() for u in row.get("shared_users", "").split(",") if u.strip()]
                user_ents = []
                for user_name in shared_users:
                    u_ent = person_entities.get(user_name)
                    if u_ent:
                        user_ents.append(u_ent)
                        if user_name != driver_name and user_name != owner_name:
                            db.add(Relationship(
                                case_id=case_id,
                                source_id=u_ent.id,
                                target_id=v_ent.id,
                                relationship_type="TRAVELED_IN",
                                confidence=0.91,
                                source_document="vehicles.csv",
                                timestamp=datetime(2026, 8, 12, 14, 30),
                                evidence_text=f"{user_name} observed as passenger in vehicle {reg} ({v_category})."
                            ))

                # 4. Person-to-Person SHARED_VEHICLE links for co-travelers
                for i in range(len(user_ents)):
                    for j in range(i + 1, len(user_ents)):
                        db.add(Relationship(
                            case_id=case_id,
                            source_id=user_ents[i].id,
                            target_id=user_ents[j].id,
                            relationship_type="SHARED_VEHICLE",
                            confidence=0.94,
                            source_document="vehicles.csv",
                            timestamp=datetime(2026, 8, 12, 14, 30),
                            evidence_text=f"{user_ents[i].display_name} and {user_ents[j].display_name} observed co-traveling in vehicle {reg} at 2026-08-12 14:30."
                        ))
        db.commit()
        print(f"[OK] Loaded Vehicle records and shared user associations.")

    # 5. Load Locations CSV
    locations_file = os.path.join(data_dir, "locations.csv")
    location_entities = {}
    if os.path.exists(locations_file):
        with open(locations_file, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                loc_name = row["name"].strip()
                loc_ent = Entity(
                    case_id=case_id,
                    type="LOCATION",
                    canonical_name=loc_name.lower(),
                    display_name=loc_name,
                    meta_info={
                        "category": row.get("category"),
                        "city": row.get("city"),
                        "coordinates": row.get("coordinates"),
                        "significance": row.get("significance")
                    }
                )
                db.add(loc_ent)
                db.flush()
                location_entities[loc_name] = loc_ent
        db.commit()
        print(f"[OK] Loaded {len(location_entities)} Location entities.")

    # 6. Load CDR CSV
    cdr_file = os.path.join(data_dir, "cdr.csv")
    cdr_count = 0
    if os.path.exists(cdr_file):
        with open(cdr_file, mode="r", encoding="utf-8") as f:
            content = f.read()
            records, _ = file_parser.parse_cdr_csv(content)
            for rec in records:
                c_phone = rec["caller_phone"]
                r_phone = rec["receiver_phone"]

                if c_phone not in phone_entities:
                    c_ent = Entity(case_id=case_id, type="PHONE", canonical_name=c_phone, display_name=c_phone)
                    db.add(c_ent)
                    db.flush()
                    phone_entities[c_phone] = c_ent

                if r_phone not in phone_entities:
                    r_ent = Entity(case_id=case_id, type="PHONE", canonical_name=r_phone, display_name=r_phone)
                    db.add(r_ent)
                    db.flush()
                    phone_entities[r_phone] = r_ent

                comm = Communication(
                    case_id=case_id,
                    caller_id=phone_entities[c_phone].id,
                    receiver_id=phone_entities[r_phone].id,
                    caller_phone=c_phone,
                    receiver_phone=r_phone,
                    timestamp=rec["timestamp"],
                    duration_seconds=rec["duration_seconds"],
                    communication_type=rec["communication_type"]
                )
                db.add(comm)

                # Add CALLED relationship edge
                db.add(Relationship(
                    case_id=case_id,
                    source_id=phone_entities[c_phone].id,
                    target_id=phone_entities[r_phone].id,
                    relationship_type="CALLED",
                    confidence=0.98,
                    weight=1.0,
                    source_document="cdr.csv",
                    evidence_text=f"CDR log: duration {rec['duration_seconds']}s on {rec['timestamp']}",
                    timestamp=rec["timestamp"]
                ))
                cdr_count += 1
        db.commit()
        print(f"[OK] Ingested {cdr_count} CDR communications.")

    # 7. Load Transactions CSV
    trans_file = os.path.join(data_dir, "transactions.csv")
    tx_count = 0
    if os.path.exists(trans_file):
        with open(trans_file, mode="r", encoding="utf-8") as f:
            content = f.read()
            records, _ = file_parser.parse_transaction_csv(content)
            for rec in records:
                s_acc = rec["sender_account"]
                r_acc = rec["receiver_account"]

                if s_acc not in account_entities:
                    s_ent = Entity(case_id=case_id, type="BANK_ACCOUNT", canonical_name=s_acc, display_name=f"Acc {s_acc}")
                    db.add(s_ent)
                    db.flush()
                    account_entities[s_acc] = s_ent

                if r_acc not in account_entities:
                    r_ent = Entity(case_id=case_id, type="BANK_ACCOUNT", canonical_name=r_acc, display_name=f"Acc {r_acc}")
                    db.add(r_ent)
                    db.flush()
                    account_entities[r_acc] = r_ent

                tx = Transaction(
                    case_id=case_id,
                    sender_id=account_entities[s_acc].id,
                    receiver_id=account_entities[r_acc].id,
                    sender_account=s_acc,
                    receiver_account=r_acc,
                    amount=rec["amount"],
                    currency=rec["currency"],
                    timestamp=rec["timestamp"]
                )
                db.add(tx)

                # Add TRANSFERRED_MONEY relationship edge
                db.add(Relationship(
                    case_id=case_id,
                    source_id=account_entities[s_acc].id,
                    target_id=account_entities[r_acc].id,
                    relationship_type="TRANSFERRED_MONEY",
                    confidence=0.99,
                    weight=rec["amount"] / 10000.0,
                    source_document="transactions.csv",
                    evidence_text=f"Bank Transfer: ₹{rec['amount']:,.2f} on {rec['timestamp']}",
                    timestamp=rec["timestamp"]
                ))
                tx_count += 1
        db.commit()
        print(f"[OK] Ingested {tx_count} Banking transactions.")

    # 8. Load FIR and Intelligence Reports
    fir_dir = os.path.join(data_dir, "fir_reports")
    fir_files = glob.glob(os.path.join(fir_dir, "*.txt"))
    for fpath in fir_files:
        fname = os.path.basename(fpath)
        with open(fpath, mode="r", encoding="utf-8") as f:
            text = f.read()
            doc = Document(
                case_id=case_id,
                title=fname.replace(".txt", "").upper(),
                document_type="FIR" if "fir" in fname else "INTELLIGENCE",
                file_path=fpath,
                raw_text=text,
                processed_status="PROCESSED"
            )
            db.add(doc)
    db.commit()
    print(f"[OK] Loaded {len(fir_files)} FIR & Intelligence Documents.")

    # 9. Key semantic relationships between major actors
    rohit = person_entities.get("Rohit Sharma")
    amit = person_entities.get("Amit Verma")
    sameer = person_entities.get("Sameer Khan")
    neha = person_entities.get("Neha Kapoor")
    vikram = person_entities.get("Vikram Singh")
    cp_loc = location_entities.get("Connaught Place")
    bk_loc = location_entities.get("Bandra Kurla Complex")

    if rohit and amit:
        db.add(Relationship(
            case_id=case_id, source_id=rohit.id, target_id=amit.id,
            relationship_type="MET", confidence=0.96,
            source_document="FIR-1023",
            evidence_text="Rohit Sharma met Amit Verma near Connaught Place on 12 August 2026."
        ))
        db.add(Relationship(
            case_id=case_id, source_id=rohit.id, target_id=amit.id,
            relationship_type="ASSOCIATED_WITH", confidence=0.94,
            source_document="SURVEILLANCE_REPORT",
            evidence_text="High-frequency communications and regular tactical rendezvous."
        ))

    if amit and sameer:
        db.add(Relationship(
            case_id=case_id, source_id=amit.id, target_id=sameer.id,
            relationship_type="CONTACTED", confidence=0.95,
            source_document="INT-1045",
            evidence_text="Amit Verma contacted Sameer Khan via encrypted phone routing western fund transfers."
        ))
        db.add(Relationship(
            case_id=case_id, source_id=amit.id, target_id=sameer.id,
            relationship_type="ASSOCIATED_WITH", confidence=0.92,
            source_document="SURVEILLANCE_REPORT",
            evidence_text="Liaison link between northern distribution syndicate and western financial group."
        ))

    if rohit and neha:
        db.add(Relationship(
            case_id=case_id, source_id=rohit.id, target_id=neha.id,
            relationship_type="SHARED_VEHICLE", confidence=0.94,
            source_document="FIR-1023",
            evidence_text="Neha Kapoor observed co-travelling with Rohit Sharma in vehicle DL01AB1234."
        ))

    if rohit and cp_loc:
        db.add(Relationship(
            case_id=case_id, source_id=rohit.id, target_id=cp_loc.id,
            relationship_type="VISITED", confidence=0.95,
            source_document="FIR-1023",
            evidence_text="Rohit Sharma observed at Connaught Place rendezvous point on 12 August 2026."
        ))

    if amit and cp_loc:
        db.add(Relationship(
            case_id=case_id, source_id=amit.id, target_id=cp_loc.id,
            relationship_type="VISITED", confidence=0.95,
            source_document="FIR-1023",
            evidence_text="Amit Verma observed at Connaught Place meeting point."
        ))

    if sameer and bk_loc:
        db.add(Relationship(
            case_id=case_id, source_id=sameer.id, target_id=bk_loc.id,
            relationship_type="VISITED", confidence=0.94,
            source_document="INT-1045",
            evidence_text="Sameer Khan operating from Bandra Kurla Complex office."
        ))

    db.commit()

    # 10. Create Timeline Events
    events_data = [
        {"title": "Liaison Meeting at Connaught Place", "desc": "Rohit Sharma and Amit Verma met near Block B, Connaught Place. Discussion observed regarding northern route shipments.", "type": "MEETING", "time": datetime(2026, 8, 12, 11, 0), "loc": "Connaught Place", "ents": [rohit.id, amit.id, neha.id] if rohit and amit and neha else [], "sev": "WARNING"},
        {"title": "CDR Communication Burst Detected", "desc": "Burst of 6 high-duration calls recorded between phone 9876543210 (Rohit Sharma) and 9811223344 (Amit Verma).", "type": "COMMUNICATION", "time": datetime(2026, 8, 13, 14, 15), "loc": "New Delhi", "ents": [rohit.id, amit.id] if rohit and amit else [], "sev": "WARNING"},
        {"title": "Anomalous Fund Transfer (₹8,50,000)", "desc": "Transfer of ₹8,50,000 executed from Account ACC88990011 to Account ACC88990066 under Hawala layering structure.", "type": "TRANSACTION", "time": datetime(2026, 8, 14, 2, 15), "loc": "New Delhi - Gurugram", "ents": [rohit.id] if rohit else [], "sev": "CRITICAL"},
        {"title": "Vehicle Sighting at Cyber City", "desc": "Vehicle HR26DQ9999 driven by Vikram Singh sighted at Cyber City Gurugram meeting front company director.", "type": "SURVEILLANCE", "time": datetime(2026, 8, 15, 18, 0), "loc": "Cyber City", "ents": [vikram.id] if vikram else [], "sev": "INFO"},
        {"title": "Western Sector Fund Layering Intercept", "desc": "Sameer Khan coordinated cash disbursement in Andheri East following encrypted call from Amit Verma.", "type": "MOVEMENT", "time": datetime(2026, 8, 16, 12, 30), "loc": "Andheri East", "ents": [sameer.id, amit.id] if sameer and amit else [], "sev": "CRITICAL"}
    ]
    for ed in events_data:
        ev = Event(
            case_id=case_id,
            title=ed["title"],
            description=ed["desc"],
            event_type=ed["type"],
            timestamp=ed["time"],
            location_name=ed["loc"],
            involved_entity_ids=ed["ents"],
            severity=ed["sev"],
            source_reference="Operation Nexus Field Intelligence"
        )
        db.add(ev)
    db.commit()
    print(f"[OK] Created {len(events_data)} Timeline Events.")

    # 11. Run Full Graph Analytics, Centrality, Communities, Anomalies, and Risk Scoring
    print("[*] Computing Graph Topology & NetworkX Centrality...")
    graph_repository.build_graph_for_case(db, case_id)
    metrics_result = graph_metrics_calculator.calculate_and_save_metrics(db, case_id)
    print(f"[OK] Network Metrics Calculated (Nodes: {metrics_result['node_count']}, Edges: {metrics_result['edge_count']}, Density: {metrics_result['density']})")

    print("[*] Running Community Detection (Louvain/Modularity)...")
    communities = community_detector.detect_and_save_communities(db, case_id)
    bridges = community_detector.identify_bridge_nodes(db, case_id)
    print(f"[OK] Found {len(communities)} distinct communities. Detected {len(bridges)} bridge node(s). Primary Bridge: {bridges[0]['name'] if bridges else 'None'}")

    print("[*] Executing Isolation Forest & Communication Anomaly Detectors...")
    alerts = alert_engine.generate_case_alerts(db, case_id)
    print(f"[✓] Generated {len(alerts)} structured alerts with explainable evidence.")

    print("[*] Computing Transparent Weighted Risk Indicator Scores (0-100)...")
    risk_scoring_service.calculate_entity_risk_scores(db, case_id)
    print("[✓] Entity risk scoring complete.")

    # 12. Create Analysis Run
    run = AnalysisRun(
        case_id=case_id,
        run_type="FULL_PIPELINE",
        status="COMPLETED",
        input_files=["persons.csv", "cdr.csv", "transactions.csv", "vehicles.csv", "locations.csv", "fir_reports/*.txt"],
        entities_extracted=db.query(Entity).filter(Entity.case_id == case_id).count(),
        relationships_extracted=db.query(Relationship).filter(Relationship.case_id == case_id).count(),
        alerts_generated=len(alerts),
        completed_at=datetime.utcnow(),
        duration_seconds=2.45,
        summary_stats=metrics_result
    )
    db.add(run)
    db.commit()

    print("=" * 60)
    print("DEMO DATABASE SEEDING COMPLETED SUCCESSFULLY!")
    print(f"Case: Operation Nexus ({case_id})")
    print(f"Total Entities: {db.query(Entity).filter(Entity.case_id == case_id).count()}")
    print(f"Total Relationships: {db.query(Relationship).filter(Relationship.case_id == case_id).count()}")
    print(f"Total Alerts: {len(alerts)}")
    print(f"Total Timeline Events: {len(events_data)}")
    print("=" * 60)
    db.close()

if __name__ == "__main__":
    seed()
