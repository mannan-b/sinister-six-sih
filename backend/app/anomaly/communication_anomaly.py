from collections import Counter
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.communication import Communication

class CommunicationAnomalyDetector:
    @staticmethod
    def detect_anomalies(db: Session, case_id: str) -> List[Dict[str, Any]]:
        comms = db.query(Communication).filter(Communication.case_id == case_id).all()
        if len(comms) < 5:
            return []

        # 1. Frequency per pair per day
        pair_counts = Counter()
        for c in comms:
            d = c.timestamp.date() if c.timestamp else None
            pair_counts[(c.caller_phone, c.receiver_phone, d)] += 1

        burst_pairs = {k for k, count in pair_counts.items() if count >= 5}

        anomalies = []
        for c in comms:
            d = c.timestamp.date() if c.timestamp else None
            hour = c.timestamp.hour if c.timestamp else 12
            duration = c.duration_seconds or 0

            is_burst = (c.caller_phone, c.receiver_phone, d) in burst_pairs
            is_night = hour >= 23 or hour <= 4
            is_extreme_duration = duration > 1800  # > 30 minutes

            is_anomalous = is_burst or (is_night and duration > 300)
            
            reasons = []
            if is_burst:
                reasons.append("High-frequency communication burst (>5 calls/day between pair)")
            if is_night:
                reasons.append(f"Unusual late-night communication ({hour:02d}:00)")
            if is_extreme_duration:
                reasons.append(f"Extended call duration ({duration // 60} minutes)")

            score = 0.85 if is_burst else (0.65 if is_night else 0.0)

            c.is_anomalous = is_anomalous
            c.anomaly_score = score
            c.anomaly_reason = "; ".join(reasons) if reasons else None

            if is_anomalous:
                anomalies.append({
                    "communication_id": c.id,
                    "caller_phone": c.caller_phone,
                    "receiver_phone": c.receiver_phone,
                    "caller_id": c.caller_id,
                    "receiver_id": c.receiver_id,
                    "timestamp": c.timestamp.isoformat() if c.timestamp else None,
                    "anomaly_score": score,
                    "reason": c.anomaly_reason,
                    "evidence": [
                        f"Caller: {c.caller_phone}",
                        f"Receiver: {c.receiver_phone}",
                        f"Duration: {c.duration_seconds} seconds",
                        f"Anomaly trigger: {c.anomaly_reason}"
                    ]
                })

        db.commit()
        return anomalies

communication_anomaly_detector = CommunicationAnomalyDetector()
