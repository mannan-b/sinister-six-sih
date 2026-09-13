import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.case import Case
from app.models.entity import Entity
from app.models.relationship import Relationship
from app.models.transaction import Transaction
from app.models.communication import Communication
from app.models.alert import Alert
from app.models.event import Event
from app.graph.graph_queries import graph_query_service
from app.graph.community_detection import community_detector
from app.schemas.assistant import AssistantQueryResponse, AssistantEvidenceItem, InvestigationSummaryResponse
from app.ai.llm_provider import get_llm_provider

class InvestigationAssistant:
    def process_query(self, db: Session, case_id: str, query: str) -> AssistantQueryResponse:
        """
        Processes an investigator query using structured graph retrieval and evidence extraction.
        """
        q_lower = query.lower()
        entities = db.query(Entity).filter(Entity.case_id == case_id).all()
        ent_by_name = {e.display_name.lower(): e for e in entities}
        ent_by_canonical = {e.canonical_name.lower(): e for e in entities}

        # Intent 1: Connection / Shortest Path between two entities
        # e.g., "How is Rohit Sharma connected to Sameer Khan?"
        path_match = re.search(r'how\s+is\s+([a-zA-Z\s]+)\s+(?:connected|linked|related)\s+to\s+([a-zA-Z\s\?]+)', query, re.IGNORECASE)
        if path_match:
            name1 = path_match.group(1).strip().rstrip('?')
            name2 = path_match.group(2).strip().rstrip('?')
            
            e1 = self._find_entity(entities, name1)
            e2 = self._find_entity(entities, name2)

            if e1 and e2:
                sp_res = graph_query_service.find_shortest_path(db, case_id, e1.id, e2.id)
                if sp_res.found:
                    evidence_items = []
                    rel_entities = []
                    rel_edges = []
                    
                    for step in sp_res.steps:
                        rel_entities.append({"id": step.node_id, "name": step.node_label, "type": step.node_type})
                        if step.relationship_to_next:
                            evidence_items.append(AssistantEvidenceItem(
                                title=f"Connection Step: {step.node_label} → {step.relationship_to_next}",
                                description=step.evidence or f"Direct {step.relationship_to_next} relationship in knowledge graph.",
                                source="Knowledge Graph",
                                confidence=0.95
                            ))

                    # Check for direct calls or transactions
                    comms = db.query(Communication).filter(
                        Communication.case_id == case_id,
                        ((Communication.caller_id == e1.id) & (Communication.receiver_id == e2.id)) |
                        ((Communication.caller_id == e2.id) & (Communication.receiver_id == e1.id))
                    ).all()

                    txs = db.query(Transaction).filter(
                        Transaction.case_id == case_id,
                        ((Transaction.sender_id == e1.id) & (Transaction.receiver_id == e2.id)) |
                        ((Transaction.sender_id == e2.id) & (Transaction.receiver_id == e1.id))
                    ).all()

                    if comms:
                        evidence_items.append(AssistantEvidenceItem(
                            title=f"Call Detail Records ({len(comms)} calls)",
                            description=f"Direct communication log indicates {len(comms)} phone calls exchanged between {e1.display_name} and {e2.display_name}.",
                            source="CDR Dataset",
                            confidence=0.98
                        ))

                    if txs:
                        tot_amount = sum(t.amount for t in txs)
                        evidence_items.append(AssistantEvidenceItem(
                            title=f"Financial Transfers (₹{tot_amount:,.2f})",
                            description=f"{len(txs)} financial transfer(s) recorded between accounts associated with {e1.display_name} and {e2.display_name}.",
                            source="Banking Records",
                            confidence=0.96
                        ))

                    answer_text = (
                        f"**{e1.display_name}** is connected to **{e2.display_name}** through a network path with **{sp_res.path_length}** intermediary hop(s).\n\n"
                        f"{sp_res.explanation}\n\n"
                        f"Key intermediaries include entities such as **{sp_res.steps[1].node_label if len(sp_res.steps) > 2 else 'Direct Link'}**."
                    )

                    return AssistantQueryResponse(
                        answer=answer_text,
                        evidence=evidence_items,
                        relevant_entities=rel_entities,
                        relevant_relationships=[],
                        confidence="High",
                        suggested_queries=[
                            f"Why is {sp_res.steps[1].node_label if len(sp_res.steps) > 2 else e1.display_name} considered high risk?",
                            f"Show unusual transactions involving {e1.display_name}",
                            "Who connects the two largest communities?"
                        ]
                    )

        # Intent 2: Influential / Central Individuals
        # e.g., "Who are the most influential people?"
        if any(k in q_lower for k in ["influential", "central", "key people", "important people", "leaders", "most connected"]):
            top_central = sorted([e for e in entities if e.type == "PERSON"], key=lambda x: (x.pagerank_score or 0.0), reverse=True)[:5]
            evidence_items = []
            rel_entities = []

            for ent in top_central:
                rel_entities.append({"id": ent.id, "name": ent.display_name, "type": ent.type, "risk_score": ent.risk_score})
                evidence_items.append(AssistantEvidenceItem(
                    title=f"Centrality Metrics for {ent.display_name}",
                    description=f"PageRank: {ent.pagerank_score:.3f}, Degree Centrality: {ent.degree_centrality:.2f}, Risk Score: {ent.risk_score}/100",
                    source="Graph Centrality Engine",
                    confidence=0.96
                ))

            names_str = ", ".join([f"**{e.display_name}** (PageRank: {e.pagerank_score:.3f}, Risk: {e.risk_score})" for e in top_central])
            answer_text = (
                f"Graph analytics identified the following top influential entities based on PageRank and network connectivity:\n\n"
                f"{names_str}\n\n"
                f"These entities exhibit high connection density and centrality across communications, meetings, and financial transactions."
            )

            return AssistantQueryResponse(
                answer=answer_text,
                evidence=evidence_items,
                relevant_entities=rel_entities,
                relevant_relationships=[],
                confidence="High",
                suggested_queries=[
                    f"How is {top_central[0].display_name if top_central else 'Rohit Sharma'} connected to Sameer Khan?",
                    "Which person connects the two largest communities?",
                    "Show unusual transactions"
                ]
            )

        # Intent 3: Bridge Nodes / Intermediaries / Community connectors
        # e.g., "Which person connects the two largest communities?" or "Why is Amit Verma important?"
        if any(k in q_lower for k in ["bridge", "intermediary", "connects the", "between communities", "two largest communities", "amit verma"]):
            bridges = community_detector.identify_bridge_nodes(db, case_id)
            if bridges:
                top_bridge = bridges[0]
                b_ent = db.query(Entity).filter(Entity.id == top_bridge["id"]).first()
                
                evidence_items = [
                    AssistantEvidenceItem(
                        title=f"Betweenness Centrality ({top_bridge['betweenness']:.3f})",
                        description=f"{top_bridge['name']} has the highest betweenness centrality score in the network, acting as a crucial bottleneck for information flow.",
                        source="NetworkX Centrality",
                        confidence=0.98
                    ),
                    AssistantEvidenceItem(
                        title="Cluster Bridging Evidence",
                        description=f"{top_bridge['reason']} (Cluster {top_bridge['primary_community']} to Cluster {top_bridge['connected_communities']}).",
                        source="Community Detection Engine",
                        confidence=0.95
                    )
                ]

                answer_text = (
                    f"**{top_bridge['name']}** acts as the primary intermediary / bridge node in this network.\n\n"
                    f"• **Betweenness Centrality**: {top_bridge['betweenness']:.3f}\n"
                    f"• **Role**: Bridges Community {top_bridge['primary_community']} and Community {top_bridge['connected_communities']}\n"
                    f"• **Significance**: Communications and fund flows between disparate sub-networks pass primarily through {top_bridge['name']}."
                )

                return AssistantQueryResponse(
                    answer=answer_text,
                    evidence=evidence_items,
                    relevant_entities=[{"id": top_bridge["id"], "name": top_bridge["name"], "type": top_bridge["type"]}],
                    relevant_relationships=[],
                    confidence="High",
                    suggested_queries=[
                        f"Why is {top_bridge['name']} considered high risk?",
                        "Show unusual transactions",
                        "Give me a summary of this investigation"
                    ]
                )

        # Intent 4: Why is Entity X considered high risk?
        # e.g., "Why is Rohit considered high risk?"
        risk_match = re.search(r'why\s+is\s+([a-zA-Z\s]+)\s+(?:considered|flagged|high\s+risk|important)', query, re.IGNORECASE)
        if risk_match:
            name = risk_match.group(1).strip()
            ent = self._find_entity(entities, name)
            if ent:
                evidence_items = []
                for factor in (ent.risk_factors or []):
                    evidence_items.append(AssistantEvidenceItem(
                        title="Investigative Risk Factor",
                        description=factor,
                        source="Risk Scoring Engine",
                        confidence=0.92
                    ))

                # Check alerts for this entity
                ent_alerts = db.query(Alert).filter(Alert.case_id == case_id, Alert.entity_id == ent.id).all()
                for al in ent_alerts:
                    evidence_items.append(AssistantEvidenceItem(
                        title=f"Flagged Alert: {al.category}",
                        description=al.explanation,
                        source="Alert Engine",
                        confidence=al.confidence
                    ))

                factors_list = "\n".join([f"• {f}" for f in (ent.risk_factors or ["No specific elevated factors"])])
                answer_text = (
                    f"**{ent.display_name}** has an investigative risk indicator score of **{ent.risk_score:.1f}/100** ({ent.risk_level} indicator level).\n\n"
                    f"**Key Measurable Factors**:\n{factors_list}\n\n"
                    f"*(Note: This represents investigative risk indicators for analytical prioritization, not a determination of criminality.)*"
                )

                return AssistantQueryResponse(
                    answer=answer_text,
                    evidence=evidence_items,
                    relevant_entities=[{"id": ent.id, "name": ent.display_name, "type": ent.type, "risk_score": ent.risk_score}],
                    relevant_relationships=[],
                    confidence="High",
                    suggested_queries=[
                        f"How is {ent.display_name} connected to Sameer Khan?",
                        "Show unusual transactions",
                        "Show recent timeline events"
                    ]
                )

        # Intent 5: Unusual Transactions / Financial Activity
        # e.g., "Show unusual transactions"
        if any(k in q_lower for k in ["transaction", "money", "transfer", "hawala", "financial", "bank"]):
            anom_tx = db.query(Transaction).filter(Transaction.case_id == case_id, Transaction.is_anomalous == True).all()
            evidence_items = []
            rel_entities = []

            for t in anom_tx:
                s_name = ent_by_name.get(str(t.sender_account).lower(), None)
                evidence_items.append(AssistantEvidenceItem(
                    title=f"Anomalous Transfer: ₹{t.amount:,.2f}",
                    description=f"{t.sender_account} → {t.receiver_account} on {t.timestamp.strftime('%Y-%m-%d')}. Trigger: {t.anomaly_reason}",
                    source="Transaction Isolation Forest",
                    confidence=0.94
                ))

            answer_text = (
                f"**{len(anom_tx)} anomalous financial transaction(s)** were flagged by the anomaly detection engine.\n\n"
                f"Top suspicious transfers include:\n" +
                "\n".join([f"• **₹{t.amount:,.2f}** from `{t.sender_account}` to `{t.receiver_account}` ({t.anomaly_reason})" for t in anom_tx[:5]])
            )

            return AssistantQueryResponse(
                answer=answer_text,
                evidence=evidence_items,
                relevant_entities=rel_entities,
                relevant_relationships=[],
                confidence="High",
                suggested_queries=[
                    "Who are the most influential people?",
                    "Which person connects the two largest communities?",
                    "Give me a summary of this investigation"
                ]
            )

        case = db.query(Case).filter(Case.id == case_id).first()
        case_name = case.name if case else "Active Investigation"

        # Handle empty case with zero entities
        if len(entities) == 0:
            fir_str = f" ({case.fir_number or case.case_number})" if case and (case.fir_number or case.case_number) else ""
            return AssistantQueryResponse(
                answer=(
                    f"### Investigation Status for {case_name}{fir_str}\n\n"
                    f"No entities, relationships, or evidence records have been ingested yet for this case.\n\n"
                    f"Please ingest investigation sources (FIR reports, Call Detail Records, or banking transactions) to begin AI-powered link analysis and anomaly detection."
                ),
                evidence=[],
                relevant_entities=[],
                relevant_relationships=[],
                confidence="High",
                suggested_queries=[
                    "Upload investigation documents",
                    "Ingest CDR call records",
                    "Import bank statements"
                ]
            )

        # Intent 6: Investigation Summary
        # e.g., "Give me a summary of this investigation"
        top_risk_ents = sorted(entities, key=lambda x: (x.risk_score or 0.0), reverse=True)[:5]
        alerts = db.query(Alert).filter(Alert.case_id == case_id).all()
        bridges = community_detector.identify_bridge_nodes(db, case_id)

        evidence_items = [
            AssistantEvidenceItem(
                title=f"Network Size",
                description=f"{len(entities)} entities, {db.query(Relationship).filter(Relationship.case_id == case_id).count()} relationships, {len(alerts)} alerts generated.",
                source="Case Database",
                confidence=1.0
            )
        ]

        bridge_summary = f"Key bridge node: **{bridges[0]['name']}** (Betweenness: {bridges[0]['betweenness']:.3f})" if bridges else "No single critical bridge node identified."

        answer_text = (
            f"### Investigation Summary for {case.name if case else 'Operation Nexus'}\n\n"
            f"**Network Overview**:\n"
            f"• **Entities Analyzed**: {len(entities)}\n"
            f"• **Active Alerts**: {len(alerts)}\n"
            f"• **Intermediary Analysis**: {bridge_summary}\n\n"
            f"**Highest Priority Investigative Indicators**:\n" +
            "\n".join([f"• **{e.display_name}** ({e.type}): Risk Score {e.risk_score}/100 ({e.risk_level})" for e in top_risk_ents]) +
            f"\n\n**Investigative Focus**: Focus inquiry on bridge nodes and transaction routes connecting primary clusters."
        )

        return AssistantQueryResponse(
            answer=answer_text,
            evidence=evidence_items,
            relevant_entities=[{"id": e.id, "name": e.display_name, "type": e.type, "risk_score": e.risk_score} for e in top_risk_ents],
            relevant_relationships=[],
            confidence="High",
            suggested_queries=[
                "How is Rohit Sharma connected to Sameer Khan?",
                "Why is Amit Verma important?",
                "Show unusual transactions"
            ]
        )

    def _find_entity(self, entities: List[Entity], name_query: str) -> Optional[Entity]:
        nq = name_query.lower().strip()
        for e in entities:
            if nq == e.display_name.lower() or nq == e.canonical_name.lower():
                return e
        for e in entities:
            if nq in e.display_name.lower() or nq in e.canonical_name.lower():
                return e
        return None

    def generate_investigation_summary(self, db: Session, case_id: str) -> InvestigationSummaryResponse:
        case = db.query(Case).filter(Case.id == case_id).first()
        entities = db.query(Entity).filter(Entity.case_id == case_id).all()
        
        if len(entities) == 0:
            case_title = case.name if case else "Investigation"
            fir_str = f" ({case.fir_number or case.case_number})" if case and (case.fir_number or case.case_number) else ""
            return InvestigationSummaryResponse(
                case_id=case_id,
                case_name=case.name if case else "Active Investigation",
                executive_summary=f"Investigation {case_title}{fir_str} currently contains no intelligence records or extracted entities. Upload sources or ingest evidence to generate knowledge graph analytics.",
                key_entities=[],
                important_relationships=[],
                major_anomalies=[],
                communities=[],
                potential_intermediaries=[],
                timeline_highlights=[]
            )

        relationships = db.query(Relationship).filter(Relationship.case_id == case_id).all()
        alerts = db.query(Alert).filter(Alert.case_id == case_id).all()
        events = db.query(Event).filter(Event.case_id == case_id).order_by(Event.timestamp.asc()).all()
        
        top_entities = sorted(entities, key=lambda x: (x.risk_score or 0.0), reverse=True)[:6]
        bridges = community_detector.identify_bridge_nodes(db, case_id)
        communities = community_detector.detect_and_save_communities(db, case_id)

        exec_summary = (
            f"Investigation {case.name if case else 'Operation Nexus'} comprises {len(entities)} recognized entities and "
            f"{len(relationships)} multi-modal relationships across CDR communications, banking transfers, surveillance logs, and FIR reports. "
            f"Graph analytics identified {len(communities)} distinct operational clusters connected primarily through intermediary nodes."
        )

        return InvestigationSummaryResponse(
            case_id=case_id,
            case_name=case.name if case else "Operation Nexus",
            executive_summary=exec_summary,
            key_entities=[{"id": e.id, "name": e.display_name, "type": e.type, "risk_score": e.risk_score, "risk_level": e.risk_level} for e in top_entities],
            important_relationships=[{"source": r.source_entity.display_name if r.source_entity else r.source_id, "target": r.target_entity.display_name if r.target_entity else r.target_id, "type": r.relationship_type, "confidence": r.confidence} for r in relationships[:8]],
            major_anomalies=[{"title": a.title, "category": a.category, "severity": a.severity, "explanation": a.explanation} for a in alerts[:6]],
            communities=communities,
            potential_intermediaries=bridges,
            timeline_highlights=[{"time": ev.timestamp.strftime("%Y-%m-%d %H:%M") if ev.timestamp else "N/A", "title": ev.title, "location": ev.location_name, "severity": ev.severity} for ev in events[:6]]
        )

investigation_assistant = InvestigationAssistant()
