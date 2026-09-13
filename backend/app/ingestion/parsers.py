import io
import csv
from dateutil import parser as dt_parser
from typing import List, Dict, Any, Tuple
from datetime import datetime

def _safe_parse_dt(val: str) -> datetime:
    if not val or not val.strip():
        return datetime.utcnow()
    try:
        return dt_parser.parse(val.strip())
    except Exception:
        return datetime.utcnow()

class FileParser:
    @staticmethod
    def parse_cdr_csv(content: str) -> Tuple[List[Dict[str, Any]], List[str]]:
        """
        Parses CDR CSV content. Expected columns: caller, receiver, date (or timestamp), duration.
        """
        errors = []
        records = []
        try:
            reader = csv.DictReader(io.StringIO(content))
            headers = [h.strip().lower() for h in (reader.fieldnames or [])]
            
            # Map column names flexibly
            caller_col = next((c for c in headers if "caller" in c or "from" in c or "src" in c), None)
            receiver_col = next((c for c in headers if "receiver" in c or "to" in c or "dst" in c), None)
            date_col = next((c for c in headers if "date" in c or "time" in c), None)
            dur_col = next((c for c in headers if "dur" in c or "sec" in c or "length" in c), None)

            if not caller_col or not receiver_col:
                return [], ["Missing required columns: 'caller' and 'receiver' must be present."]

            for row_idx, raw_row in enumerate(reader, start=2):
                row = {k.strip().lower(): v.strip() for k, v in raw_row.items() if k}
                caller = row.get(caller_col, "")
                receiver = row.get(receiver_col, "")
                date_str = row.get(date_col, "") if date_col else ""
                dur_str = row.get(dur_col, "0") if dur_col else "0"

                if not caller or not receiver:
                    errors.append(f"Row {row_idx}: Missing caller or receiver value.")
                    continue

                try:
                    duration = int(float(dur_str))
                except ValueError:
                    duration = 0

                ts = _safe_parse_dt(date_str)

                records.append({
                    "caller_phone": caller,
                    "receiver_phone": receiver,
                    "timestamp": ts,
                    "duration_seconds": duration,
                    "communication_type": "VOICE_CALL"
                })
        except Exception as e:
            errors.append(f"Failed to parse CSV: {str(e)}")

        return records, errors

    @staticmethod
    def parse_transaction_csv(content: str) -> Tuple[List[Dict[str, Any]], List[str]]:
        """
        Parses Transaction CSV content. Expected columns: sender, receiver, amount, date.
        """
        errors = []
        records = []
        try:
            reader = csv.DictReader(io.StringIO(content))
            headers = [h.strip().lower() for h in (reader.fieldnames or [])]

            sender_col = next((c for c in headers if "sender" in c or "from" in c or "src" in c), None)
            receiver_col = next((c for c in headers if "receiver" in c or "to" in c or "dst" in c), None)
            amt_col = next((c for c in headers if "amount" in c or "amt" in c or "value" in c), None)
            date_col = next((c for c in headers if "date" in c or "time" in c), None)

            if not sender_col or not receiver_col or not amt_col:
                return [], ["Missing required columns: 'sender', 'receiver', and 'amount' must be present."]

            for row_idx, raw_row in enumerate(reader, start=2):
                row = {k.strip().lower(): v.strip() for k, v in raw_row.items() if k}
                sender = row.get(sender_col, "")
                receiver = row.get(receiver_col, "")
                amt_str = row.get(amt_col, "0")
                date_str = row.get(date_col, "") if date_col else ""

                if not sender or not receiver:
                    errors.append(f"Row {row_idx}: Missing sender or receiver.")
                    continue

                try:
                    # Clean currency symbols
                    clean_amt = amt_str.replace("₹", "").replace(",", "").replace("$", "").strip()
                    amount = float(clean_amt)
                except ValueError:
                    errors.append(f"Row {row_idx}: Invalid numeric amount '{amt_str}'.")
                    continue

                ts = _safe_parse_dt(date_str)

                records.append({
                    "sender_account": sender,
                    "receiver_account": receiver,
                    "amount": amount,
                    "currency": "INR",
                    "timestamp": ts
                })
        except Exception as e:
            errors.append(f"Failed to parse CSV: {str(e)}")

        return records, errors

    @staticmethod
    def extract_text_from_file(filename: str, file_bytes: bytes) -> str:
        """
        Extracts plain text from .txt, .pdf, or .docx files.
        """
        ext = filename.lower().split('.')[-1]
        if ext == 'txt':
            return file_bytes.decode('utf-8', errors='ignore')
        elif ext == 'pdf':
            try:
                import pypdf
                reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                text = "\n".join([page.extract_text() or "" for page in reader.pages])
                return text
            except Exception:
                return file_bytes.decode('utf-8', errors='ignore')
        elif ext == 'docx':
            try:
                import docx
                doc = docx.Document(io.BytesIO(file_bytes))
                return "\n".join([p.text for p in doc.paragraphs])
            except Exception:
                return file_bytes.decode('utf-8', errors='ignore')
        return file_bytes.decode('utf-8', errors='ignore')

file_parser = FileParser()
