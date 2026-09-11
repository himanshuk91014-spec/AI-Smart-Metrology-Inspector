"""
Integration Test for FastAPI Endpoints & Dual Database / MongoDB Atlas Sync
"""

import io
from PIL import Image
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_api_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"
    print("  --> /api/v1/health: OK")

def test_api_rules():
    response = client.get("/api/rules")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["rules"]) >= 6
    print(f"  --> /api/rules: OK ({data['total_rules']} statutory rules loaded)")

def test_api_units():
    response = client.get("/api/units")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["approved_metric_units"]) > 0
    assert len(data["prohibited_imperial_units"]) > 0
    print(f"  --> /api/units: OK ({data['total_approved']} approved, {data['total_prohibited']} prohibited units)")

def test_api_recent_audits():
    response = client.get("/api/recent-audits")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "audits" in data
    print(f"  --> /api/recent-audits: OK ({data['count']} audit logs retrieved)")

def test_api_db_status():
    response = client.get("/api/db-status")
    assert response.status_code == 200
    data = response.json()
    assert "database_mode" in data
    print(f"  --> /api/db-status: OK ({data['database_mode']})")

def test_api_samples():
    response = client.get("/api/v1/samples")
    assert response.status_code == 200
    data = response.json()
    assert len(data["samples"]) >= 4
    print(f"  --> /api/v1/samples: OK ({len(data['samples'])} demo scenarios available)")

def test_api_audit_text_compliant():
    text_payload = {
        "text": (
            "SUPER CRUNCH BISCUITS\n"
            "Net Qty: 200 g\n"
            "MRP Rs. 40.00 (Inclusive of all taxes)\n"
            "Mfg Date: 02/2026\n"
            "Helpline: 1800-222-3344 | Email: care@crunch.in\n"
            "Country of Origin: India"
        )
    }
    response = client.post("/api/audit/text", json=text_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "COMPLIANT"
    assert data["overall_score"] >= 90
    assert "audit_id" in data
    print(f"  --> /api/audit/text (Compliant Case, Audit ID: {data['audit_id']}): OK")

def test_api_audit_text_infringement():
    text_payload = {
        "text": (
            "SHINE SHAMPOO\n"
            "Net Vol: 12 fl oz\n"  # Illegal Imperial Unit
            "MRP Rs. 300\n"        # Missing tax suffix
            "Pkd: 01/2026\n"
            "Country of Origin: USA"
        )
    }
    response = client.post("/api/audit/text", json=text_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "NON_COMPLIANT"
    assert len(data["violations"]) >= 2
    print("  --> /api/audit/text (Infringement Case): OK")

def test_api_audit_image_upload():
    # Create a synthetic image in memory
    img = Image.new("RGB", (600, 400), color=(240, 240, 240))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    response = client.post(
        "/api/audit/image",
        files={"image": ("test_package.jpg", buf, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "status" in data
    assert "overall_score" in data
    assert "audit_id" in data
    print(f"  --> /api/audit/image (Multipart Upload, Audit ID: {data['audit_id']}): OK")

def test_api_verify_and_re_audit():
    payload = {
        "segments": [
            {"text": "PREMIUM TEA", "box": [[10, 10], [200, 10], [200, 40], [10, 40]], "confidence": 0.99},
            {"text": "Net Qty: 250 g", "box": [[10, 50], [200, 50], [200, 80], [10, 80]], "confidence": 0.98},
            {"text": "Mfd: 01/2026", "box": [[10, 90], [200, 90], [200, 120], [10, 120]], "confidence": 0.98}
        ],
        "manual_overrides": {
            "brand_name": "PREMIUM TEA",
            "mrp": "120.00",
            "taxes_included": True,
            "consumer_care_email": "care@tea.in",
            "consumer_care_phone": "1800-333-2222",
            "country_of_origin": "India"
        }
    }
    response = client.post("/api/v1/verify-and-audit", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "COMPLIANT"
    assert data["overall_score"] == 100
    assert data["is_manually_verified"] is True
    assert "mrp" in data["manual_fields_applied"]
    print("  --> /api/v1/verify-and-audit (Hybrid AI + Manual Correction Re-Audit): OK")

def test_api_vlm_info():
    response = client.get("/api/v1/vlm-info")
    assert response.status_code == 200
    data = response.json()
    assert data["vlm_enabled"] is True
    assert "supported_models" in data
    print("  --> /api/v1/vlm-info (Vision-Language Models Info): OK")

def test_api_recent_audit_detail_and_delete():
    # 1. First fetch recent audits
    res = client.get("/api/recent-audits")
    assert res.status_code == 200
    audits = res.json()["audits"]
    assert len(audits) > 0
    target_audit_id = audits[0]["audit_id"]
    
    # 2. Fetch specific audit by ID
    res_single = client.get(f"/api/recent-audits/{target_audit_id}")
    assert res_single.status_code == 200
    detail = res_single.json()["audit"]
    assert detail["audit_id"] == target_audit_id
    assert "product_name" in detail
    assert "thumbnail_base64" in detail or "status" in detail
    print(f"  --> /api/recent-audits/{target_audit_id}: OK (Retrieved detail for {detail.get('product_name')})")

    # 3. Create a temporary audit to test deletion
    temp_payload = {
        "text": "TEMP DISPOSABLE AUDIT\nNet Qty: 100 g\nMRP Rs. 20 (Inclusive of all taxes)\nMfg Date: 01/2026\nHelpline: 1800-111-222"
    }
    temp_res = client.post("/api/audit/text", json=temp_payload)
    assert temp_res.status_code == 200
    temp_audit_id = temp_res.json()["audit_id"]
    
    del_res = client.delete(f"/api/recent-audits/{temp_audit_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True
    print(f"  --> DELETE /api/recent-audits/{temp_audit_id}: OK")


def test_api_analyze_fmcg_specimen():
    # Create test package image
    img = Image.new("RGB", (600, 400), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    response = client.post(
        "/api/v1/analyze-fmcg-specimen",
        files={"image": ("maggi_packet.jpg", buf, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "mrp" in data
    assert "has_tax_suffix" in data
    assert "net_quantity" in data
    assert "mfg_date" in data
    assert "violations" in data
    print("  --> /api/v1/analyze-fmcg-specimen (4-Phase FMCG Engine): OK")


if __name__ == "__main__":
    print("=" * 60)
    print("RUNNING FASTAPI BACKEND INTEGRATION TESTS")
    print("=" * 60)
    test_api_health()
    test_api_rules()
    test_api_units()
    test_api_recent_audits()
    test_api_db_status()
    test_api_vlm_info()
    test_api_samples()
    test_api_audit_text_compliant()
    test_api_audit_text_infringement()
    test_api_audit_image_upload()
    test_api_verify_and_re_audit()
    test_api_recent_audit_detail_and_delete()
    test_api_analyze_fmcg_specimen()
    print("=" * 60)
    print("ALL API INTEGRATION TESTS PASSED CLEANLY! [SUCCESS]")
    print("=" * 60)

