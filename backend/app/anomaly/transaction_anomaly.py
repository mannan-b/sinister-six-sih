import numpy as np
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.models.alert import Alert

class TransactionAnomalyDetector:
    @staticmethod
    def detect_anomalies(db: Session, case_id: str) -> List[Dict[str, Any]]:
        transactions = db.query(Transaction).filter(Transaction.case_id == case_id).all()
        if len(transactions) < 3:
            return []

        amounts = np.array([float(t.amount) for t in transactions], dtype=float)
        mean_amt = float(np.mean(amounts))
        std_amt = float(np.std(amounts)) if len(amounts) > 1 else 1.0
        p95 = float(np.percentile(amounts, 95))

        # Isolation Forest on amount and time features with robust fallback
        try:
            from sklearn.ensemble import IsolationForest
            features = np.array([[float(t.amount), t.timestamp.hour if t.timestamp else 12] for t in transactions])
            iso = IsolationForest(contamination=0.15, random_state=42)
            preds = iso.fit_predict(features)
            scores = -iso.score_samples(features)
        except Exception:
            # Fallback to pure statistical z-score
            z_scores = np.abs((amounts - mean_amt) / (std_amt + 1e-6))
            preds = np.where(z_scores > 2.0, -1, 1)
            scores = z_scores / 3.0

        anomalies = []
        for idx, t in enumerate(transactions):
            amt = float(t.amount)
            hour = t.timestamp.hour if t.timestamp else 12
            is_anomaly = bool((preds[idx] == -1) or (amt >= p95 and amt > 200000))
            score = float(scores[idx])

            t.is_anomalous = is_anomaly
            t.anomaly_score = round(score, 3)

            if is_anomaly:
                reasons = []
                if amt >= p95:
                    reasons.append(f"Amount ₹{amt:,.2f} exceeds 95th percentile threshold (₹{p95:,.2f})")
                if amt > mean_amt + (1.5 * std_amt):
                    reasons.append(f"Statistically unusual transfer value (Z-score > 1.5)")
                if hour < 6 or hour > 22:
                    reasons.append(f"Transaction occurred during unusual hours ({hour:02d}:00)")
                
                reason_text = "; ".join(reasons) if reasons else "High anomaly score detected by model"
                t.anomaly_reason = reason_text

                anomalies.append({
                    "transaction_id": t.id,
                    "sender_account": t.sender_account,
                    "receiver_account": t.receiver_account,
                    "sender_id": t.sender_id,
                    "receiver_id": t.receiver_id,
                    "amount": t.amount,
                    "anomaly_score": t.anomaly_score,
                    "reason": reason_text,
                    "evidence": [
                        f"Amount: ₹{t.amount:,.2f}",
                        f"Sender Account: {t.sender_account}",
                        f"Receiver Account: {t.receiver_account}",
                        f"Deviation: {(t.amount / (mean_amt + 1e-6)):.1f}x higher than average transaction size"
                    ]
                })

        db.commit()
        return anomalies

transaction_anomaly_detector = TransactionAnomalyDetector()
