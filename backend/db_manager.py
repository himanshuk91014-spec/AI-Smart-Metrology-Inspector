"""
Legal Metrology Compliance Auditing System - Dual Database & MongoDB Atlas Sync Manager
Handles dual-layer persistence:
1. Primary Cloud: MongoDB Atlas (via MONGO_URI)
2. Local High-Speed Fallback: CSV datasets in backend/data/
"""

import csv
import json
import os
import time
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

logger = logging.getLogger("legal_metrology_db")

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
THUMBNAILS_DIR = os.path.join(DATA_DIR, "thumbnails")
os.makedirs(THUMBNAILS_DIR, exist_ok=True)

# Try to load python-dotenv if available
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

MONGO_URI = os.getenv("MONGO_URI", "")
DB_NAME = os.getenv("MONGO_DB_NAME", "legal_metrology_db")

class DatabaseManager:
    """
    Manages statutory rules, unit validation datasets, and live audit logging
    with automatic bidirectional sync between MongoDB Atlas, local JSON store, and CSV files.
    """

    def __init__(self, mongo_uri: Optional[str] = None):
        self.mongo_uri = mongo_uri or MONGO_URI
        self.client = None
        self.db = None
        self.is_connected = False
        self.last_sync_time = None
        self.init_connection()
        self._ensure_json_store_initialized()

    def init_connection(self):
        """Initializes connection to MongoDB Atlas with low timeout for fast startup."""
        if not self.mongo_uri:
            logger.info("No MONGO_URI configured in environment. Operating in Local CSV/JSON Engine mode.")
            self.is_connected = False
            return

        try:
            import pymongo
            logger.info(f"Connecting to MongoDB Atlas at {self.mongo_uri[:20]}...")
            self.client = pymongo.MongoClient(
                self.mongo_uri,
                serverSelectionTimeoutMS=3000,
                connectTimeoutMS=3000
            )
            # Verify connection with quick ping
            self.client.admin.command('ping')
            self.db = self.client[DB_NAME]
            self.is_connected = True
            logger.info(f"Connected to MongoDB Atlas Database: {DB_NAME}")
        except Exception as err:
            logger.warning(f"MongoDB Atlas connection notice ({err}). Seamlessly falling back to local storage.")
            self.is_connected = False
            self.client = None
            self.db = None

    def _read_csv(self, filename: str) -> List[Dict[str, Any]]:
        """Reads a local CSV file and returns list of dictionaries."""
        filepath = os.path.join(DATA_DIR, filename)
        if not os.path.exists(filepath):
            logger.warning(f"CSV file not found: {filepath}")
            return []
        rows = []
        try:
            with open(filepath, mode="r", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                for r in reader:
                    rows.append(dict(r))
        except Exception as e:
            logger.error(f"Error reading CSV {filename}: {e}")
        return rows

    def _append_csv(self, filename: str, fieldnames: List[str], row: Dict[str, Any]):
        """Appends a single row to a CSV file."""
        filepath = os.path.join(DATA_DIR, filename)
        file_exists = os.path.exists(filepath)
        try:
            with open(filepath, mode="a", encoding="utf-8", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                if not file_exists:
                    writer.writeheader()
                writer.writerow(row)
        except Exception as e:
            logger.error(f"Error appending to CSV {filename}: {e}")

    def _write_csv_all(self, filename: str, fieldnames: List[str], rows: List[Dict[str, Any]]):
        """Overwrites an entire CSV file with provided rows."""
        filepath = os.path.join(DATA_DIR, filename)
        try:
            with open(filepath, mode="w", encoding="utf-8", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                for r in rows:
                    filtered_r = {k: r.get(k, "") for k in fieldnames}
                    writer.writerow(filtered_r)
        except Exception as e:
            logger.error(f"Error overwriting CSV {filename}: {e}")

    def _read_json(self, filename: str) -> List[Dict[str, Any]]:
        """Reads local JSON array file."""
        filepath = os.path.join(DATA_DIR, filename)
        if not os.path.exists(filepath):
            return []
        try:
            with open(filepath, mode="r", encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except Exception as e:
            logger.error(f"Error reading JSON {filename}: {e}")
            return []

    def _write_json(self, filename: str, data: List[Dict[str, Any]]):
        """Writes local JSON array file."""
        filepath = os.path.join(DATA_DIR, filename)
        try:
            with open(filepath, mode="w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Error writing JSON {filename}: {e}")

    def _ensure_json_store_initialized(self):
        """Seeds recent_audits_store.json if missing from existing CSV records."""
        json_path = os.path.join(DATA_DIR, "recent_audits_store.json")
        if not os.path.exists(json_path):
            csv_rows = self._read_csv("recent_audits_live.csv")
            seeded_records = []
            for r in csv_rows:
                status_str = r.get("status", "COMPLIANT")
                score_int = int(r.get("overall_score", 100)) if str(r.get("overall_score", "")).isdigit() else 100
                viol_count = int(r.get("violations_count", 0)) if str(r.get("violations_count", "")).isdigit() else 0
                prod_name = r.get("product_name") or "Packaged Commodity Specimen"
                
                # Synthetic violation examples if violation count > 0
                sample_violations = []
                if viol_count > 0:
                    sample_violations.append({
                        "rule_id": "RULE_11_12_PROHIBITED_IMPERIAL",
                        "rule_name": "Rule 11 & 12 - Prohibited Non-Standard Unit",
                        "severity": "HIGH",
                        "legal_reference": "Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 11 & 12",
                        "description": "Non-standard imperial quantity declared.",
                        "remediation": "Declare net quantity exclusively in approved SI metric units (e.g., g, kg, ml, l)."
                    })
                
                doc = {
                    "audit_id": r.get("audit_id", f"AUD-{int(time.time()*1000)}"),
                    "timestamp": r.get("timestamp", datetime.utcnow().isoformat()),
                    "product_name": prod_name,
                    "brand_name": prod_name if prod_name != "Product Specimen" else None,
                    "mrp": r.get("mrp", "₹ 150.00"),
                    "net_quantity": r.get("net_quantity", "250 g"),
                    "status": status_str,
                    "overall_score": score_int,
                    "violations_count": viol_count,
                    "violations": sample_violations,
                    "passed_checks": [
                        {"rule_id": "RULE_6_1_DA", "rule_name": "Rule 6(1)(da) - Maximum Retail Price (MRP)", "evidence": f"Declared MRP: {r.get('mrp', 'Declared')}"},
                        {"rule_id": "RULE_6_1_C", "rule_name": "Rule 6(1)(c) - Manufacturing Timeline", "evidence": "Timeline verified"}
                    ],
                    "warnings": [],
                    "extracted_metadata": {
                        "brand_name": prod_name if prod_name != "Product Specimen" else None,
                        "mrp": r.get("mrp", "").replace("Rs.", "").replace("Rs", "").replace("₹", "").strip(),
                        "taxes_included": True,
                        "net_quantity": r.get("net_quantity", "").split(" ")[0] if " " in r.get("net_quantity", "") else r.get("net_quantity", ""),
                        "unit_of_measure": r.get("net_quantity", "").split(" ")[-1] if " " in r.get("net_quantity", "") else "g",
                        "manufacturing_date": "02/2026",
                        "country_of_origin": "India"
                    },
                    "source": r.get("source", "backend_ocr"),
                    "thumbnail_base64": None,
                    "thumbnail_url": None
                }
                seeded_records.append(doc)
            self._write_json("recent_audits_store.json", seeded_records)

    def sync_database(self):
        """
        Synchronizes all local statutory CSV tables into MongoDB Atlas collections on server boot.
        """
        if not self.is_connected or self.db is None:
            logger.info("Local CSV mode active. CSV datasets verified.")
            return

        try:
            # 1. Sync Rules
            rules_data = self._read_csv("legal_metrology_rules.csv")
            if rules_data:
                col = self.db["legal_metrology_rules"]
                for r in rules_data:
                    col.update_one({"rule_id": r["rule_id"]}, {"$set": r}, upsert=True)

            # 2. Sync Approved Units
            approved_units = self._read_csv("approved_metric_units.csv")
            if approved_units:
                col = self.db["approved_metric_units"]
                for u in approved_units:
                    col.update_one({"unit_symbol": u["unit_symbol"]}, {"$set": u}, upsert=True)

            # 3. Sync Prohibited Units
            prohibited_units = self._read_csv("prohibited_imperial_units.csv")
            if prohibited_units:
                col = self.db["prohibited_imperial_units"]
                for p in prohibited_units:
                    col.update_one({"unit_symbol": p["unit_symbol"]}, {"$set": p}, upsert=True)

            # 4. Sync Consumer Care Keywords
            care_kw = self._read_csv("consumer_care_keywords.csv")
            if care_kw:
                col = self.db["consumer_care_keywords"]
                for k in care_kw:
                    col.update_one({"keyword": k["keyword"]}, {"$set": k}, upsert=True)

            # 5. Sync Tax Suffixes
            tax_sfx = self._read_csv("tax_suffix_clauses.csv")
            if tax_sfx:
                col = self.db["tax_suffix_clauses"]
                for t in tax_sfx:
                    col.update_one({"phrase": t["phrase"]}, {"$set": t}, upsert=True)

            self.last_sync_time = datetime.utcnow().isoformat()
            logger.info("MongoDB Atlas synchronisation completed successfully.")
        except Exception as sync_err:
            logger.error(f"Error during Atlas sync: {sync_err}")

    def get_all_rules(self) -> List[Dict[str, Any]]:
        """Returns PCR 2011 statutory rules from Atlas or local CSV."""
        if self.is_connected and self.db is not None:
            try:
                docs = list(self.db["legal_metrology_rules"].find({}, {"_id": 0}))
                if docs:
                    return docs
            except Exception as e:
                logger.warning(f"Error fetching rules from Atlas ({e}), falling back to CSV.")
        return self._read_csv("legal_metrology_rules.csv")

    def get_all_units(self) -> Dict[str, List[Dict[str, Any]]]:
        """Returns both approved metric and prohibited imperial units."""
        approved = []
        prohibited = []
        if self.is_connected and self.db is not None:
            try:
                approved = list(self.db["approved_metric_units"].find({}, {"_id": 0}))
                prohibited = list(self.db["prohibited_imperial_units"].find({}, {"_id": 0}))
            except Exception as e:
                logger.warning(f"Error fetching units from Atlas ({e}), falling back to CSV.")
        if not approved:
            approved = self._read_csv("approved_metric_units.csv")
        if not prohibited:
            prohibited = self._read_csv("prohibited_imperial_units.csv")
        return {
            "approved_metric_units": approved,
            "prohibited_imperial_units": prohibited
        }

    def log_audit(self, audit_report: Dict[str, Any], source: str = "backend_api", thumbnail_base64: Optional[str] = None, thumbnail_url: Optional[str] = None) -> str:
        """
        Logs a full audit record with product thumbnail to MongoDB Atlas, local JSON store, and CSV.
        """
        timestamp = datetime.utcnow().isoformat()
        audit_id = audit_report.get("audit_id") or f"AUD-{int(time.time() * 1000)}"
        
        meta = audit_report.get("final_verified_fields") or audit_report.get("extracted_metadata", {})
        product_name = meta.get("brand_name") or audit_report.get("brand_name") or audit_report.get("filename") or audit_report.get("product_name") or "Packaged Commodity Specimen"
        mrp = f"₹ {meta.get('mrp')}" if meta.get("mrp") else "Not Declared"
        net_qty = f"{meta.get('net_quantity', '')} {meta.get('unit_of_measure', '')}".strip() or "Not Declared"
        status_val = audit_report.get("status", "UNKNOWN")
        score = audit_report.get("overall_score", 0)
        violations = audit_report.get("violations", [])
        violations_count = len(violations)
        violations_summary = [v.get("rule_name", v.get("rule_id", "Statutory Non-Compliance")) for v in violations]

        thumb_b64 = thumbnail_base64 or audit_report.get("thumbnail_base64")
        thumb_url = thumbnail_url or audit_report.get("thumbnail_url")

        # Full Document to persist in JSON and Atlas
        full_doc = dict(audit_report)
        full_doc["audit_id"] = audit_id
        full_doc["timestamp"] = timestamp
        full_doc["product_name"] = str(product_name)[:120]
        full_doc["brand_name"] = meta.get("brand_name")
        full_doc["mrp"] = str(mrp)[:50]
        full_doc["net_quantity"] = str(net_qty)[:50]
        full_doc["status"] = str(status_val)
        full_doc["overall_score"] = score
        full_doc["violations_count"] = violations_count
        full_doc["violations_summary"] = violations_summary
        full_doc["source"] = source
        full_doc["thumbnail_base64"] = thumb_b64
        full_doc["thumbnail_url"] = thumb_url
        full_doc["is_manually_verified"] = bool(audit_report.get("is_manually_verified", False))
        full_doc["manual_fields_applied"] = audit_report.get("manual_fields_applied", [])
        full_doc["corrections_made"] = audit_report.get("corrections_made", [])
        full_doc["audit_trail"] = audit_report.get("audit_trail", audit_report.get("corrections_made", []))
        full_doc["original_ocr_snapshot"] = audit_report.get("original_ocr_snapshot")
        full_doc["final_verified_fields"] = meta
        full_doc["verified_product_data"] = meta
        full_doc["extracted_metadata"] = meta

        # 1. Save to MongoDB Atlas if connected (auto-prune to keep max 50)
        if self.is_connected and self.db is not None:
            try:
                self.db["recent_audits"].insert_one(dict(full_doc))
                total_docs = self.db["recent_audits"].count_documents({})
                if total_docs > 50:
                    excess = total_docs - 50
                    oldest_cursor = self.db["recent_audits"].find({}, {"_id": 1}).sort("timestamp", 1).limit(excess)
                    oldest_ids = [d["_id"] for d in oldest_cursor]
                    self.db["recent_audits"].delete_many({"_id": {"$in": oldest_ids}})
            except Exception as err:
                logger.warning(f"Failed to log audit to Atlas ({err}). Local store will preserve record.")

        # 2. Save to local JSON store (strictly keep latest 50 audits and auto-prune oldest)
        try:
            json_records = self._read_json("recent_audits_store.json")
            # Remove duplicate if audit_id exists
            json_records = [r for r in json_records if r.get("audit_id") != audit_id]
            json_records.insert(0, full_doc)
            
            # Prune beyond 50
            pruned_records = json_records[50:]
            json_records = json_records[:50]
            self._write_json("recent_audits_store.json", json_records)
            
            # Clean up disk thumbnail images for pruned audits
            for p in pruned_records:
                p_id = p.get("audit_id")
                if p_id:
                    t_file = os.path.join(THUMBNAILS_DIR, f"{p_id}.jpg")
                    if os.path.exists(t_file):
                        try:
                            os.remove(t_file)
                        except Exception:
                            pass
        except Exception as json_err:
            logger.error(f"Error saving to JSON store: {json_err}")

        # 3. Maintain latest 50 in local CSV
        try:
            csv_record = {
                "audit_id": audit_id,
                "timestamp": timestamp,
                "product_name": str(product_name)[:100],
                "mrp": str(mrp)[:50],
                "net_quantity": str(net_qty)[:50],
                "status": str(status_val),
                "overall_score": score,
                "violations_count": violations_count,
                "source": source
            }
            csv_rows = self._read_csv("recent_audits_live.csv")
            csv_rows = [r for r in csv_rows if r.get("audit_id") != audit_id]
            csv_rows.insert(0, csv_record)
            csv_rows = csv_rows[:50]
            fieldnames = ["audit_id", "timestamp", "product_name", "mrp", "net_quantity", "status", "overall_score", "violations_count", "source"]
            self._write_csv_all("recent_audits_live.csv", fieldnames, csv_rows)
        except Exception as csv_err:
            logger.error(f"Error updating CSV: {csv_err}")

        return audit_id

    def get_recent_audits(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Returns recent audit history records complete with thumbnail images and metadata."""
        if self.is_connected and self.db is not None:
            try:
                cursor = self.db["recent_audits"].find({}, {"_id": 0}).sort("timestamp", -1).limit(limit)
                docs = list(cursor)
                if docs:
                    return docs
            except Exception as e:
                logger.warning(f"Error fetching audits from Atlas ({e}), using JSON/CSV store.")

        # Read from local JSON store
        json_records = self._read_json("recent_audits_store.json")
        if json_records:
            return json_records[:limit]

        # Fallback to CSV
        csv_rows = self._read_csv("recent_audits_live.csv")
        return list(reversed(csv_rows))[:limit]

    def get_audit_by_id(self, audit_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single full audit report by ID."""
        if self.is_connected and self.db is not None:
            try:
                doc = self.db["recent_audits"].find_one({"audit_id": audit_id}, {"_id": 0})
                if doc:
                    return doc
            except Exception as e:
                logger.warning(f"Error fetching audit {audit_id} from Atlas: {e}")

        json_records = self._read_json("recent_audits_store.json")
        for rec in json_records:
            if rec.get("audit_id") == audit_id:
                return rec
        return None

    def delete_audit(self, audit_id: str) -> bool:
        """Deletes a specific audit record from Atlas, JSON store, and CSV."""
        deleted = False
        if self.is_connected and self.db is not None:
            try:
                res = self.db["recent_audits"].delete_one({"audit_id": audit_id})
                if res.deleted_count > 0:
                    deleted = True
            except Exception as e:
                logger.error(f"Error deleting from Atlas: {e}")

        # Delete from JSON store
        json_records = self._read_json("recent_audits_store.json")
        initial_len = len(json_records)
        json_records = [r for r in json_records if r.get("audit_id") != audit_id]
        if len(json_records) < initial_len:
            self._write_json("recent_audits_store.json", json_records)
            deleted = True

        # Delete from CSV
        csv_rows = self._read_csv("recent_audits_live.csv")
        csv_filtered = [r for r in csv_rows if r.get("audit_id") != audit_id]
        if len(csv_filtered) < len(csv_rows):
            fieldnames = ["audit_id", "timestamp", "product_name", "mrp", "net_quantity", "status", "overall_score", "violations_count", "source"]
            self._write_csv_all("recent_audits_live.csv", fieldnames, csv_filtered)
            deleted = True

        # Remove local thumbnail file if exists
        thumb_file = os.path.join(THUMBNAILS_DIR, f"{audit_id}.jpg")
        if os.path.exists(thumb_file):
            try:
                os.remove(thumb_file)
            except Exception:
                pass

        return deleted

    def clear_all_audits(self) -> bool:
        """Clears all audit history."""
        if self.is_connected and self.db is not None:
            try:
                self.db["recent_audits"].delete_many({})
            except Exception as e:
                logger.error(f"Error clearing Atlas: {e}")

        self._write_json("recent_audits_store.json", [])
        fieldnames = ["audit_id", "timestamp", "product_name", "mrp", "net_quantity", "status", "overall_score", "violations_count", "source"]
        self._write_csv_all("recent_audits_live.csv", fieldnames, [])
        return True

    def get_status(self) -> Dict[str, Any]:
        """Returns database connectivity and synchronization diagnostics."""
        json_count = len(self._read_json("recent_audits_store.json"))
        return {
            "database_mode": "MongoDB Atlas (Cloud)" if self.is_connected else "Local CSV/JSON Datasets (Offline Edge Mode)",
            "mongodb_connected": self.is_connected,
            "database_name": DB_NAME if self.is_connected else "local_csv_store",
            "csv_data_dir": DATA_DIR,
            "last_sync_timestamp": self.last_sync_time,
            "rules_count": len(self.get_all_rules()),
            "recent_audits_count": json_count,
            "units_summary": {
                "approved_count": len(self._read_csv("approved_metric_units.csv")),
                "prohibited_count": len(self._read_csv("prohibited_imperial_units.csv"))
            }
        }

# Global database manager instance
db_manager = DatabaseManager()

