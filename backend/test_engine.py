"""
Unit and Integration Tests for Legal Metrology Compliance Engine
Standard Library + Pytest compatible.
"""

import sys
import io

# Ensure UTF-8 output encoding for Windows command line terminals
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from compliance_engine import LegalMetrologyComplianceEngine


def run_tests():
    engine = LegalMetrologyComplianceEngine()
    print("=" * 70)
    print("LEGAL METROLOGY COMPLIANCE ENGINE - VERIFICATION SUITE")
    print("=" * 70)

    # Test 1: Fully Compliant FMCG Package
    print("\n[TEST 1] Evaluating Fully Compliant Indian FMCG Package...")
    segments1 = [
        {
            "text": "PREMIUM ROASTED ALMONDS",
            "box": [[10, 10], [300, 10], [300, 40], [10, 40]],
            "confidence": 0.99,
        },
        {
            "text": "Net Quantity: 500 g",
            "box": [[10, 50], [250, 50], [250, 80], [10, 80]],
            "confidence": 0.98,
        },
        {
            "text": "MRP Rs. 450.00 (Inclusive of all taxes)",
            "box": [[10, 90], [400, 90], [400, 120], [10, 120]],
            "confidence": 0.99,
        },
        {
            "text": "Mfg Date: 02/2026",
            "box": [[10, 130], [200, 130], [200, 160], [10, 160]],
            "confidence": 0.97,
        },
        {
            "text": "Customer Care Email: support@almondsfresh.com",
            "box": [[10, 170], [450, 170], [450, 200], [10, 200]],
            "confidence": 0.98,
        },
        {
            "text": "Helpline: 1800-111-2233",
            "box": [[10, 210], [300, 210], [300, 240], [10, 240]],
            "confidence": 0.98,
        },
        {
            "text": "Country of Origin: India",
            "box": [[10, 250], [280, 250], [280, 280], [10, 280]],
            "confidence": 0.98,
        },
    ]
    res1 = engine.evaluate_compliance(segments1, (1000, 1000))
    assert res1["status"] == "COMPLIANT", f"Expected COMPLIANT, got {res1['status']}"
    assert res1["overall_score"] >= 90, (
        f"Expected score >= 90, got {res1['overall_score']}"
    )
    assert len(res1["violations"]) == 0, (
        f"Expected 0 violations, got {len(res1['violations'])}"
    )
    assert res1["rules_breakdown"]["rule_6_1_da_mrp"] is True
    assert res1["rules_breakdown"]["rule_11_12_net_quantity"] is True
    assert res1["rules_breakdown"]["rule_6_1_g_consumer_care"] is True
    assert res1["rules_breakdown"]["rule_6_1_c_mfg_date"] is True
    print(
        "  --> PASS: 100% Compliant Package correctly cleared with status:",
        res1["status"],
        "Score:",
        res1["overall_score"],
    )

    # Test 2: Prohibited Imperial Units (Rule 11/12)
    print("\n[TEST 2] Evaluating Package with Illegal Imperial Units (fl oz / oz)...")
    segments2 = [
        {
            "text": "IMPORTED LUXURY BODY WASH",
            "box": [[10, 10], [300, 10], [300, 40], [10, 40]],
            "confidence": 0.99,
        },
        {
            "text": "Net Contents: 16 fl oz (450 ml)",
            "box": [[10, 50], [350, 50], [350, 80], [10, 80]],
            "confidence": 0.98,
        },
        {
            "text": "MRP ₹ 799 (Inclusive of all taxes)",
            "box": [[10, 90], [380, 90], [380, 120], [10, 120]],
            "confidence": 0.98,
        },
        {
            "text": "Pkd: 01/2026",
            "box": [[10, 130], [150, 130], [150, 160], [10, 160]],
            "confidence": 0.98,
        },
        {
            "text": "Contact: care@luxwash.com | Phone: 9876543210",
            "box": [[10, 170], [450, 170], [450, 200], [10, 200]],
            "confidence": 0.98,
        },
    ]
    res2 = engine.evaluate_compliance(segments2, (1000, 1000))
    assert res2["status"] == "NON_COMPLIANT", (
        f"Expected NON_COMPLIANT, got {res2['status']}"
    )
    assert res2["rules_breakdown"]["rule_11_12_net_quantity"] is False
    assert any("RULE_11_12_PROHIBITED_UNIT" in v["rule_id"] for v in res2["violations"])
    print("  --> PASS: Prohibited Imperial Unit correctly flagged under Rule 11 & 12.")

    # Test 3: Missing Tax Suffix on MRP (Rule 6(1)(da))
    print("\n[TEST 3] Evaluating Missing 'Inclusive of all taxes' Suffix...")
    segments3 = [
        {
            "text": "CRUNCHY POTATO CHIPS",
            "box": [[10, 10], [300, 10], [300, 40], [10, 40]],
            "confidence": 0.99,
        },
        {
            "text": "Net Qty: 150 g",
            "box": [[10, 50], [200, 50], [200, 80], [10, 80]],
            "confidence": 0.98,
        },
        {
            "text": "MRP: Rs. 50.00",
            "box": [[10, 90], [220, 90], [220, 120], [10, 120]],
            "confidence": 0.98,
        },
        {
            "text": "Date of Pkg: 12/2025",
            "box": [[10, 130], [220, 130], [220, 160], [10, 160]],
            "confidence": 0.98,
        },
        {
            "text": "Helpline: 1800-444-5566 | Email: care@chips.in",
            "box": [[10, 170], [450, 170], [450, 200], [10, 200]],
            "confidence": 0.98,
        },
    ]
    res3 = engine.evaluate_compliance(segments3, (1000, 1000))
    assert res3["status"] == "NON_COMPLIANT", (
        f"Expected NON_COMPLIANT, got {res3['status']}"
    )
    assert res3["rules_breakdown"]["rule_6_1_da_mrp"] is False
    assert any(
        "RULE_6_1_DA_TAX_SUFFIX_MISSING" in v["rule_id"] for v in res3["violations"]
    )
    print("  --> PASS: Missing Tax Suffix correctly intercepted under Rule 6(1)(da).")

    # Test 4: Rule 6(1)(g) - Fuzzy & Resilient Consumer Care (care@ / helpline near manufacturing)
    print(
        "\n[TEST 4] Evaluating Consumer Care without strict 'Grievance Officer' keywords (care@ & Phone)..."
    )
    segments4 = [
        {
            "text": "AYURVEDIC HAIR OIL",
            "box": [[10, 10], [300, 10], [300, 40], [10, 40]],
            "confidence": 0.99,
        },
        {
            "text": "Net Vol: 200 ml",
            "box": [[10, 50], [200, 50], [200, 80], [10, 80]],
            "confidence": 0.98,
        },
        {
            "text": "MRP ₹ 180.00 (Incl. of all taxes)",
            "box": [[10, 90], [350, 90], [350, 120], [10, 120]],
            "confidence": 0.98,
        },
        {
            "text": "Mfd: 01/2026",
            "box": [[10, 130], [150, 130], [150, 160], [10, 160]],
            "confidence": 0.98,
        },
        {
            "text": "Manufactured by: Herbal Herbs Ltd, Vapi, Gujarat 396195",
            "box": [[10, 170], [450, 170], [450, 200], [10, 200]],
            "confidence": 0.98,
        },
        {
            "text": "care@herbalherbs.com | 9876543210",
            "box": [[10, 210], [350, 210], [350, 240], [10, 240]],
            "confidence": 0.98,
        },
    ]
    res4 = engine.evaluate_compliance(segments4, (1000, 1000))
    assert res4["status"] == "COMPLIANT", f"Expected COMPLIANT, got {res4['status']}"
    assert res4["rules_breakdown"]["rule_6_1_g_consumer_care"] is True
    print(
        "  --> PASS: care@ email & phone correctly cleared without false 'Consumer Care Missing' error! Status:",
        res4["status"],
    )

    # Test 5: Rule 6(10) - Country of Origin Inferred from Indian State & 6-Digit PIN Code
    print(
        "\n[TEST 5] Evaluating Country of Origin Inference from State ('Gujarat') & PIN Code ('396195')..."
    )
    segments5 = [
        {
            "text": "GLOW BODY LOTION",
            "box": [[10, 10], [300, 10], [300, 40], [10, 40]],
            "confidence": 0.99,
        },
        {
            "text": "Net Vol: 100 ml",
            "box": [[10, 50], [200, 50], [200, 80], [10, 80]],
            "confidence": 0.98,
        },
        {
            "text": "MRP Rs. 120 (Inclusive of all taxes)",
            "box": [[10, 90], [350, 90], [350, 120], [10, 120]],
            "confidence": 0.99,
        },
        {
            "text": "Mfg Date: 02/2026",
            "box": [[10, 130], [200, 130], [200, 160], [10, 160]],
            "confidence": 0.98,
        },
        {
            "text": "Manufactured by: Glow Cosmetics, Plot 14, GIDC Vapi, Gujarat - 396195",
            "box": [[10, 170], [500, 170], [500, 200], [10, 200]],
            "confidence": 0.98,
        },
        {
            "text": "For feedback: help@glow.com | Helpline: 1800-444-1122",
            "box": [[10, 210], [450, 210], [450, 240], [10, 240]],
            "confidence": 0.98,
        },
    ]
    res5 = engine.evaluate_compliance(segments5, (1000, 1000))
    assert res5["status"] == "COMPLIANT", f"Expected COMPLIANT, got {res5['status']}"
    assert "India" in res5["extracted_metadata"]["country_of_origin"]
    assert any("RULE_6_10_ORIGIN_ADVISORY" in w["rule_id"] for w in res5["warnings"])
    print(
        "  --> PASS: State ('Gujarat') & PIN Code ('396195') correctly inferred as India with Low Severity Advisory! Status: COMPLIANT"
    )

    # Test 6: Cylindrical Bottle Curvature & Partial Word Cut-Offs
    print(
        "\n[TEST 6] Evaluating Cylindrical Bottle with Curvature Cut-Offs ('incl of all ta', '200ml', 'mfd on 02/26')..."
    )
    segments6 = [
        {
            "text": "CITRUS ENERGY DRINK",
            "box": [[10, 10], [300, 10], [300, 40], [10, 40]],
            "confidence": 0.99,
        },
        {
            "text": "Net Vol: 200ml",
            "box": [[10, 50], [200, 50], [200, 80], [10, 80]],
            "confidence": 0.98,
        },
        {
            "text": "MRP Rs. 40.00 incl of all ta",
            "box": [[10, 90], [320, 90], [320, 120], [10, 120]],
            "confidence": 0.97,
        },
        {
            "text": "mfd on: 02/2026",
            "box": [[10, 130], [200, 130], [200, 160], [10, 160]],
            "confidence": 0.98,
        },
        {
            "text": "cust care: care@citrusdrink.co.in | 1800-999-8877",
            "box": [[10, 170], [450, 170], [450, 200], [10, 200]],
            "confidence": 0.98,
        },
        {
            "text": "Packed in Pune, MH - 411001",
            "box": [[10, 210], [300, 210], [300, 240], [10, 240]],
            "confidence": 0.98,
        },
    ]
    res6 = engine.evaluate_compliance(segments6, (1000, 1000))
    assert res6["status"] == "COMPLIANT", f"Expected COMPLIANT, got {res6['status']}"
    assert res6["rules_breakdown"]["rule_6_1_da_mrp"] is True
    assert res6["rules_breakdown"]["rule_11_12_net_quantity"] is True
    assert res6["rules_breakdown"]["rule_6_1_g_consumer_care"] is True
    assert res6["rules_breakdown"]["rule_6_1_c_mfg_date"] is True
    print(
        "  --> PASS: Bottle curvature partial words ('incl of all ta', '200ml', 'mfd on', 'cust care') pieced together and verified perfectly!"
    )

    # Test 7: Stationery Pen with ART NO. 3458 & Preposition Disambiguation
    print(
        "\n[TEST 7] Evaluating Stationery Pen with 'ART NO. 3458' and 'Made in India'..."
    )
    segments7 = [
        {
            "text": "PREMIUM GEL PEN - BLUE",
            "box": [[10, 10], [300, 10], [300, 40], [10, 40]],
            "confidence": 0.99,
        },
        {
            "text": "ART NO. 3458",
            "box": [[10, 50], [180, 50], [180, 80], [10, 80]],
            "confidence": 0.98,
        },
        {
            "text": "0.5 mm tip | Net Qty: 1 N",
            "box": [[10, 90], [280, 90], [280, 120], [10, 120]],
            "confidence": 0.99,
        },
        {
            "text": "MRP Rs. 50.00 (Inclusive of all taxes)",
            "box": [[10, 130], [420, 130], [420, 160], [10, 160]],
            "confidence": 0.99,
        },
        {
            "text": "Mfd: 03/2026 | Batch No: B-99",
            "box": [[10, 170], [320, 170], [320, 200], [10, 200]],
            "confidence": 0.98,
        },
        {
            "text": "Customer Care: care@gelpens.in | Helpline: 1800-222-3333",
            "box": [[10, 210], [550, 210], [550, 240], [10, 240]],
            "confidence": 0.98,
        },
        {
            "text": "Made in India by Pen Craft Industries, Gujarat",
            "box": [[10, 250], [450, 250], [450, 280], [10, 280]],
            "confidence": 0.98,
        },
    ]
    res7 = engine.evaluate_compliance(segments7, (1000, 1000))
    assert res7["status"] == "COMPLIANT", f"Expected COMPLIANT for pen specimen, got {res7['status']}"
    assert res7["extracted_metadata"]["net_quantity"] in ["1", "1 N"]
    assert res7["extracted_metadata"]["mrp"] == "50.00"
    assert res7["rules_breakdown"]["rule_6_1_da_mrp"] is True
    assert res7["rules_breakdown"]["rule_11_12_net_quantity"] is True
    print("  --> PASS: Stationery Pen with 'ART NO. 3458' and 'Net Qty: 1 N' cleared with status:", res7["status"])

    # Test 8: Regional Language - Telugu Compliant Label
    print("\n[TEST 8] Evaluating Regional Language - Telugu Compliant FMCG Label...")
    segments8 = [
        {"text": "హెర్బల్ హెయిర్ ఆయిల్", "box": [[10, 10], [300, 10], [300, 40], [10, 40]], "confidence": 0.99},
        {"text": "పరిమాణం: 200 ml", "box": [[10, 50], [250, 50], [250, 80], [10, 80]], "confidence": 0.98},
        {"text": "గరిష్ట రిటైల్ ధర ₹ 180.00 (అన్ని పన్నులతో కలిపి)", "box": [[10, 90], [450, 90], [450, 120], [10, 120]], "confidence": 0.99},
        {"text": "తయారీ తేదీ: 02/2026", "box": [[10, 130], [250, 130], [250, 160], [10, 160]], "confidence": 0.97},
        {"text": "వినియోగదారుల సంరక్షణ: care@teluguoil.in | హెల్ప్‌లైన్: 1800-425-0011", "box": [[10, 170], [500, 170], [500, 200], [10, 200]], "confidence": 0.98},
        {"text": "తయారీదారు: శ్రీ బాలాజీ ఇండస్ట్రీస్, హైదరాబాద్, తెలంగాణ", "box": [[10, 210], [450, 210], [450, 240], [10, 240]], "confidence": 0.98},
        {"text": "భారతదేశం లో తయారు చేయబడింది", "box": [[10, 250], [350, 250], [350, 280], [10, 280]], "confidence": 0.98}
    ]
    res8 = engine.evaluate_compliance(segments8, (1000, 1000))
    assert res8["status"] == "COMPLIANT", f"Expected COMPLIANT for Telugu label, got {res8['status']}"
    assert res8["extracted_metadata"]["detected_language"] == "te", f"Expected 'te', got {res8['extracted_metadata']['detected_language']}"
    assert res8["rules_breakdown"]["rule_6_1_da_mrp"] is True
    assert res8["rules_breakdown"]["rule_11_12_net_quantity"] is True
    assert res8["rules_breakdown"]["rule_6_1_g_consumer_care"] is True
    assert res8["rules_breakdown"]["rule_6_1_c_mfg_date"] is True
    print(f"  --> PASS: Telugu Regional Script Label accurately analyzed! Detected: {res8['extracted_metadata']['language_name']} | Status: {res8['status']}")

    # Test 9: Regional Language - Hindi Devanagari Compliant Label
    print("\n[TEST 9] Evaluating Regional Language - Hindi Devanagari Compliant Label...")
    segments9 = [
        {"text": "आयुर्वेदिक प्राकृतिक साबुन", "box": [[10, 10], [300, 10], [300, 40], [10, 40]], "confidence": 0.99},
        {"text": "शुद्ध मात्रा: 125 ग्राम", "box": [[10, 50], [250, 50], [250, 80], [10, 80]], "confidence": 0.98},
        {"text": "अधिकतम खुदरा मूल्य ₹ 65.00 (सभी करों सहित)", "box": [[10, 90], [450, 90], [450, 120], [10, 120]], "confidence": 0.99},
        {"text": "निर्माण तिथि: 01/2026 | बैच नं: H-12", "box": [[10, 130], [300, 130], [300, 160], [10, 160]], "confidence": 0.98},
        {"text": "ग्राहक सेवा: care@ayurved.in | 1800-222-1111", "box": [[10, 170], [450, 170], [450, 200], [10, 200]], "confidence": 0.98},
        {"text": "भारत में निर्मित | हरिद्वार, उत्तराखंड", "box": [[10, 210], [350, 210], [350, 240], [10, 240]], "confidence": 0.98}
    ]
    res9 = engine.evaluate_compliance(segments9, (1000, 1000))
    assert res9["status"] == "COMPLIANT", f"Expected COMPLIANT for Hindi label, got {res9['status']}"
    assert res9["extracted_metadata"]["detected_language"] == "hi", f"Expected 'hi', got {res9['extracted_metadata']['detected_language']}"
    assert res9["rules_breakdown"]["rule_6_1_da_mrp"] is True
    assert res9["rules_breakdown"]["rule_11_12_net_quantity"] is True
    assert res9["rules_breakdown"]["rule_6_1_g_consumer_care"] is True
    assert res9["rules_breakdown"]["rule_6_1_c_mfg_date"] is True
    print(f"  --> PASS: Hindi Regional Script Label accurately analyzed! Detected: {res9['extracted_metadata']['language_name']} | Status: {res9['status']}")

    # Test 10: Hybrid AI + Manual Verification Override (Eliminating False Positives)
    print("\n[TEST 10] Evaluating Hybrid AI + Manual Verification Override...")
    # Simulate a package image with blurry/missed MRP and tax suffix in OCR
    incomplete_segments = [
        {"text": "SUPER WHEAT FLOUR", "box": [[10, 10], [300, 10], [300, 40], [10, 40]], "confidence": 0.99},
        {"text": "Net Wt: 5 kg", "box": [[10, 50], [200, 50], [200, 80], [10, 80]], "confidence": 0.98},
        {"text": "Mfd: 02/2026", "box": [[10, 90], [200, 90], [200, 120], [10, 120]], "confidence": 0.98},
        {"text": "Customer Care: care@flour.in", "box": [[10, 130], [350, 130], [350, 160], [10, 160]], "confidence": 0.98},
        {"text": "Made in India", "box": [[10, 170], [200, 170], [200, 200], [10, 200]], "confidence": 0.98}
    ]
    # Initial scan without MRP should be NON_COMPLIANT
    initial_res = engine.evaluate_compliance(incomplete_segments, (1000, 1000))
    assert initial_res["status"] == "NON_COMPLIANT", "Expected initial scan to flag missing MRP"

    # Inspector manual verification override filling the missed MRP & taxes & helpline
    manual_overrides = {
        "brand_name": "SUPER WHEAT FLOUR",
        "mrp": "240.00",
        "taxes_included": True,
        "consumer_care_phone": "1800-444-5555"
    }
    corrected_res = engine.evaluate_compliance(incomplete_segments, (1000, 1000), manual_overrides=manual_overrides)
    assert corrected_res["status"] == "COMPLIANT", f"Expected COMPLIANT after manual correction, got {corrected_res['status']}"
    assert corrected_res["overall_score"] == 100, f"Expected 100 score, got {corrected_res['overall_score']}"
    assert corrected_res["is_manually_verified"] is True
    assert "mrp" in corrected_res["manual_fields_applied"]
    print(f"  --> PASS: Hybrid Inspector Override successfully verified! Status: {corrected_res['status']}, Score: {corrected_res['overall_score']}")
    # Test 11: Complex MRP Formats (Embedded Tax Clauses, Dot Matrix & Spaced Digits)
    print("\n[TEST 11] Evaluating Complex MRP Formats (Embedded Tax Clause, Dot Matrix & Spaced Digits)...")
    complex_mrp_cases = [
        ("MRP (INCL. OF ALL TAXES) : Rs. 120.00", "120.00"),
        ("MRP (INCLUSIVE OF ALL TAXES) 150.00", "150.00"),
        ("MRP (INCL. OF ALL TAXES) ₹ 250", "250"),
        ("M R P : 1 2 0 . 0 0 \n INCL. OF ALL TAXES", "120.00"),
        ("M . R . P . : Rs . 2 5 0 . 0 0 ( INCL OF ALL TAXES )", "250.00"),
        ("MRP Rs. 45/- (INCL. OF ALL TAXES)", "45"),
        ("MRP (INCL OF TAXES) : Rs. 50/-", "50"),
        ("MAX RETAIL PRICE (INCL. OF ALL TAXES): Rs 199.00", "199.00"),
        ("MRP / USP : Rs. 150.00 / Rs. 1.50 per g \n (INCL. OF ALL TAXES)", "150.00"),
        ("MRP : 99.00 (INCL. OF ALL TAXES)", "99.00")
    ]
    for text_case, expected_val in complex_mrp_cases:
        case_res = engine.evaluate_compliance([{"text": text_case, "box": [[10, 10], [300, 10], [300, 40], [10, 40]], "confidence": 0.98}])
        assert case_res["rules_breakdown"]["rule_6_1_da_mrp"] is True, f"Failed MRP rule on: {text_case}"
        assert case_res["extracted_metadata"]["taxes_included"] is True, f"Failed tax clause on: {text_case}"
        assert case_res["extracted_metadata"]["mrp"] == expected_val, f"Expected {expected_val}, got {case_res['extracted_metadata']['mrp']} for {text_case}"
    print("  --> PASS: All complex MRP variants (embedded tax clause, dot-matrix, spaced numbers) extracted perfectly!")

    # Test 12: Cylindrical Multi-Line Fragmented Segments
    print("\n[TEST 12] Evaluating Multi-Line Fragmented Segments on Cylindrical Bottle...")
    cyl_segments = [
        {"text": "MRP (INCL.", "box": [[10, 100], [100, 100], [100, 120], [10, 120]], "confidence": 0.98},
        {"text": "OF ALL TAXES)", "box": [[110, 102], [220, 102], [220, 122], [110, 122]], "confidence": 0.98},
        {"text": "Rs. 120.00", "box": [[230, 101], [310, 101], [310, 121], [230, 121]], "confidence": 0.98},
        {"text": "Net Qty:", "box": [[10, 140], [80, 140], [80, 160], [10, 160]], "confidence": 0.98},
        {"text": "250 ml", "box": [[90, 142], [140, 142], [140, 162], [90, 162]], "confidence": 0.98},
        {"text": "Customer Care:", "box": [[10, 180], [120, 180], [120, 200], [10, 200]], "confidence": 0.98},
        {"text": "care@cylbottle.in", "box": [[130, 180], [260, 180], [260, 200], [130, 200]], "confidence": 0.98},
        {"text": "Mfd: 02/2026", "box": [[10, 220], [120, 220], [120, 240], [10, 240]], "confidence": 0.98},
        {"text": "Country of Origin: India", "box": [[10, 260], [200, 260], [200, 280], [10, 280]], "confidence": 0.98}
    ]
    cyl_res = engine.evaluate_compliance(cyl_segments, (1000, 1000))
    assert cyl_res["status"] == "COMPLIANT", f"Expected COMPLIANT for cylindrical fragments, got {cyl_res['status']}"
    assert cyl_res["extracted_metadata"]["mrp"] == "120.00", f"Expected 120.00, got {cyl_res['extracted_metadata']['mrp']}"
    assert cyl_res["extracted_metadata"]["taxes_included"] is True
    assert cyl_res["extracted_metadata"]["net_quantity"] == "250"
    print("  --> PASS: Cylindrical multi-line fragmented segments correctly unified, extracted MRP ₹ 120.00, Status: COMPLIANT!")

    # Test 13: GST Tax Suffix Variants
    print("\n[TEST 13] Evaluating GST Tax Suffix Variants ('Inclusive of GST', 'Incl. of GST', 'GST Included', etc.)...")
    gst_cases = [
        ("MRP: ₹ 25.00 \n (Inclusive of GST)", "25.00"),
        ("MRP ₹ 25.00 (Inclusive of GST)", "25.00"),
        ("MRP: ₹ 35.00 (Incl. of GST)", "35.00"),
        ("MRP Rs. 50 (Incl of GST)", "50"),
        ("MRP ₹ 100.00 (GST Included)", "100.00"),
        ("MRP: 75.00 (GST Incl.)", "75.00"),
        ("MRP (INCLUSIVE OF GST) ₹ 120", "120"),
        ("MRP ₹ 200.00 (जीएसटी सहित)", "200.00"),
        ("MRP ₹ 150.00 (జీఎస్టీ సహా)", "150.00"),
        ("MRP ₹ 40.00 (జిఎస్టి সহ / GST Inclusive)", "40.00")
    ]
    for gst_text, exp_mrp in gst_cases:
        gst_res = engine.evaluate_compliance([{"text": gst_text, "box": [[10, 10], [300, 10], [300, 40], [10, 40]], "confidence": 0.98}])
        assert gst_res["rules_breakdown"]["rule_6_1_da_mrp"] is True, f"Failed MRP rule on GST case: {gst_text}"
        assert gst_res["extracted_metadata"]["taxes_included"] is True, f"Failed taxes_included on GST case: {gst_text}"
        assert gst_res["extracted_metadata"]["mrp"] == exp_mrp, f"Expected {exp_mrp}, got {gst_res['extracted_metadata']['mrp']} for {gst_text}"
    print("  --> PASS: All GST tax suffix variants verified and accepted as legally compliant under Rule 6(1)(da)!")

    # Test 14: Real Notebook Specimen (User's Exact Test Image)
    print("\n[TEST 14] Evaluating Real Notebook Back Cover Specimen (Linchpin / Nihar Classic Series)...")
    notebook_segments = [
        {"text": "Nihar CLASSIC SERIES", "box": [[10, 10], [200, 10], [200, 30], [10, 30]], "confidence": 0.99},
        {"text": "A quality product manufactured & marketed by:", "box": [[10, 40], [300, 40], [300, 60], [10, 60]], "confidence": 0.98},
        {"text": "Linchpin Industries Pvt. Ltd.", "box": [[10, 70], [250, 70], [250, 90], [10, 90]], "confidence": 0.99},
        {"text": "Khasara No. 160,161,162,152, Mohkampur Phase-1, Delhi Road, Meerut - 250002", "box": [[10, 100], [500, 100], [500, 120], [10, 120]], "confidence": 0.97},
        {"text": "Customer care no.: 1800 889 0270", "box": [[10, 130], [280, 130], [280, 150], [10, 150]], "confidence": 0.98},
        {"text": "wow@writeonwhite.in", "box": [[10, 160], [200, 160], [200, 180], [10, 180]], "confidence": 0.99},
        {"text": "Pages : 80 (Total Pages Include Index & Cover)", "box": [[300, 10], [550, 10], [550, 30], [300, 30]], "confidence": 0.98},
        {"text": "Size: 23.5 x 17.5 cm", "box": [[300, 40], [450, 40], [450, 60], [300, 60]], "confidence": 0.98},
        {"text": "MRP: ₹ 25.00", "box": [[300, 70], [420, 70], [420, 90], [300, 90]], "confidence": 0.99},
        {"text": "(Inclusive of GST)", "box": [[300, 100], [440, 100], [440, 120], [300, 120]], "confidence": 0.99},
        {"text": "MADE IN INDIA", "box": [[300, 130], [420, 130], [420, 150], [300, 150]], "confidence": 0.99}
    ]
    notebook_res = engine.evaluate_compliance(notebook_segments, (1000, 1000))
    assert notebook_res["status"] == "COMPLIANT", f"Expected COMPLIANT for notebook specimen, got {notebook_res['status']} with violations: {notebook_res['violations']}"
    assert notebook_res["extracted_metadata"]["mrp"] == "25.00", f"Expected MRP 25.00, got {notebook_res['extracted_metadata']['mrp']}"
    assert notebook_res["extracted_metadata"]["taxes_included"] is True, "Expected taxes_included True for '(Inclusive of GST)'"
    assert notebook_res["rules_breakdown"]["rule_6_1_da_mrp"] is True, "Rule 6(1)(da) must PASS for (Inclusive of GST)"
    assert len(notebook_res["violations"]) == 0, f"Expected 0 violations, found: {notebook_res['violations']}"
    print(f"  --> PASS: Real Notebook specimen (Linchpin / Nihar) cleared 100%! MRP: ₹{notebook_res['extracted_metadata']['mrp']}, Status: {notebook_res['status']}")

    # Test 15: Vardhman Industries Notebook Specimen (Pages: 428, MRP. Rs. : 110.00, Incl. of all taxes)
    print("\n[TEST 15] Evaluating Vardhman Industries Real Packaging Specimen (Pages: 428, MRP Rs. 110.00, 04/2025)...")
    vardhman_segments = [
        {"text": "Marketed by:", "box": [[10, 10], [100, 10], [100, 30], [10, 30]], "confidence": 0.98},
        {"text": "Vardhman Industries", "box": [[10, 35], [180, 35], [180, 55], [10, 55]], "confidence": 0.99},
        {"text": "Delhi Road, Meerut U.P. India.", "box": [[10, 60], [220, 60], [220, 80], [10, 80]], "confidence": 0.98},
        {"text": "Ph.: +91 121 2400423", "box": [[10, 85], [160, 85], [160, 105], [10, 105]], "confidence": 0.98},
        {"text": "E-mail: vardhmanindustries@yahoo.co.in", "box": [[10, 110], [280, 110], [280, 130], [10, 130]], "confidence": 0.99},
        {"text": "www.vardhmanindustries.co.in", "box": [[10, 135], [230, 135], [230, 155], [10, 155]], "confidence": 0.98},
        {"text": "Pages: 428", "box": [[300, 10], [380, 10], [380, 30], [300, 30]], "confidence": 0.99},
        {"text": "(Including Index & Cover)", "box": [[300, 35], [450, 35], [450, 55], [300, 55]], "confidence": 0.98},
        {"text": "Size: 20 x 28cm", "box": [[300, 60], [420, 60], [420, 80], [300, 80]], "confidence": 0.98},
        {"text": "MRP. Rs. : 110.00", "box": [[300, 85], [430, 85], [430, 105], [300, 105]], "confidence": 0.99},
        {"text": "Incl. of all taxes.", "box": [[300, 110], [420, 110], [420, 130], [300, 130]], "confidence": 0.99},
        {"text": "Mfd. on : 04/2025", "box": [[300, 135], [430, 135], [430, 155], [300, 155]], "confidence": 0.98}
    ]
    vardhman_res = engine.evaluate_compliance(vardhman_segments, (1000, 1000))
    assert vardhman_res["status"] == "COMPLIANT", f"Expected COMPLIANT for Vardhman specimen, got {vardhman_res['status']} with violations: {vardhman_res['violations']}"
    assert vardhman_res["extracted_metadata"]["mrp"] == "110.00", f"Expected MRP 110.00, got {vardhman_res['extracted_metadata']['mrp']}"
    assert vardhman_res["extracted_metadata"]["taxes_included"] is True, "Expected taxes_included True for 'Incl. of all taxes.'"
    assert vardhman_res["extracted_metadata"]["net_quantity"] == "428", f"Expected net_quantity 428, got {vardhman_res['extracted_metadata']['net_quantity']}"
    assert vardhman_res["extracted_metadata"]["manufacturing_date"] == "04/2025", f"Expected 04/2025, got {vardhman_res['extracted_metadata']['manufacturing_date']}"
    assert vardhman_res["overall_score"] == 100, f"Expected 100/100, got {vardhman_res['overall_score']}"
    print(f"  --> PASS: Vardhman Industries specimen cleared 100% with status: {vardhman_res['status']} and score: {vardhman_res['overall_score']}/100!")

    # Test 16: Post-OCR Intelligent Error Correction & Self-Healing Intelligence
    print("\n[TEST 16] Evaluating Post-OCR Intelligent Error Correction & Self-Healing Intelligence...")
    from compliance_engine import PostOCRErrorCorrectionEngine

    # Case 1: Notebook ₹25 misread as 225.00
    nb_raw = "Nihar Notebook 80 Pages MRP ₹ 25.00 (Inclusive of GST)"
    nb_meta = {"brand_name": "Nihar Notebook", "mrp": "225.00", "net_quantity": "80", "unit_of_measure": "Pages"}
    cleaned_nb_meta, nb_corrs = PostOCRErrorCorrectionEngine.apply_corrections(nb_raw, nb_meta)
    assert cleaned_nb_meta["mrp"] == "25.00", f"Expected 25.00, got {cleaned_nb_meta['mrp']}"
    assert any(c["field"] == "declared_mrp" for c in nb_corrs)
    print("  --> Subtest 16.1 Passed: Notebook ₹ 25 symbol artifact (225.00 -> 25.00) corrected.")

    # Case 2: Slogan prepending (2-Minute Noodles MRP ₹14 -> 214.00)
    slogan_raw = "Nestle Maggi 2-Minute Noodles MRP ₹ 14.00"
    slogan_meta = {"brand_name": "Maggi 2-Minute Noodles", "mrp": "214.00"}
    cleaned_slogan_meta, slogan_corrs = PostOCRErrorCorrectionEngine.apply_corrections(slogan_raw, slogan_meta)
    assert cleaned_slogan_meta["mrp"] == "14.00", f"Expected 14.00, got {cleaned_slogan_meta['mrp']}"
    assert any(c["field"] == "declared_mrp" for c in slogan_corrs)
    print("  --> Subtest 16.2 Passed: Marketing slogan '2-Minute' disambiguated (214.00 -> 14.00).")

    # Case 3: Unit glyph duplication (1 nN -> 1 N)
    apparel_meta = {"net_quantity": "1", "unit_of_measure": "nN"}
    cleaned_app_meta, app_corrs = PostOCRErrorCorrectionEngine.apply_corrections("Net Qty: 1 nN", apparel_meta)
    assert cleaned_app_meta["unit_of_measure"] == "N", f"Expected N, got {cleaned_app_meta['unit_of_measure']}"
    print("  --> Subtest 16.3 Passed: Unit double glyph ('nN' -> 'N') corrected.")

    # Case 4: Email domain comma typo (support@brand,com -> support@brand.com)
    email_meta = {"consumer_care_email": "support@brand,com"}
    cleaned_email_meta, email_corrs = PostOCRErrorCorrectionEngine.apply_corrections("support@brand,com", email_meta)
    assert cleaned_email_meta["consumer_care_email"] == "support@brand.com"
    print("  --> Subtest 16.4 Passed: Email comma typo ('@brand,com' -> '@brand.com') corrected.")

    # Test 17: Manual Overwrite / Verification Single Source of Truth Regression Test
    print("\n[TEST 17] Evaluating Manual Overwrite / Verification Regression (Forward & Reverse)...")
    
    # 17.1 Forward Test:
    # Initial OCR: Wrong MRP = ₹100 (Missing Tax Suffix), Net Quantity = Not Declared
    flawed_ocr_segments = [
        {"text": "CRUNCH PACKAGED COMMODITY", "box": [[10, 10], [300, 10], [300, 40], [10, 40]], "confidence": 0.99},
        {"text": "MRP Rs. 100", "box": [[10, 50], [200, 50], [200, 80], [10, 80]], "confidence": 0.98}, # Wrong MRP, missing tax suffix
        # Missing Net Quantity entirely
        {"text": "Mfg Date: 02/2026", "box": [[10, 90], [200, 90], [200, 120], [10, 120]], "confidence": 0.98},
        {"text": "Email: care@crunch.in | 1800-11-2222", "box": [[10, 130], [350, 130], [350, 160], [10, 160]], "confidence": 0.98},
        {"text": "Country of Origin: India", "box": [[10, 170], [250, 170], [250, 200], [10, 200]], "confidence": 0.98}
    ]

    initial_audit = engine.evaluate_compliance(flawed_ocr_segments, (1000, 1000))
    assert initial_audit["status"] == "NON_COMPLIANT", "Initial audit must fail due to OCR errors"
    assert initial_audit["overall_score"] < 100, f"Expected flawed initial score < 100, got {initial_audit['overall_score']}"
    assert any(v["rule_id"].startswith("RULE_11_12") for v in initial_audit["violations"]), "Initial audit must have Net Qty violation"
    assert any(v["rule_id"].startswith("RULE_6_1_DA") for v in initial_audit["violations"]), "Initial audit must have MRP tax suffix violation"

    # Inspector manual override: MRP = ₹40 (Inclusive of all taxes), Net Quantity = 200 g
    manual_corrections_payload = {
        "brand_name": "CRUNCH PACKAGED COMMODITY",
        "mrp": "40.00",
        "taxes_included": True,
        "net_quantity": "200",
        "unit_of_measure": "g",
        "manufacturing_date": "02/2026",
        "consumer_care_email": "care@crunch.in",
        "consumer_care_phone": "1800-11-2222",
        "country_of_origin": "India",
        "manufacturer_name": "Crunch Foods Pvt. Ltd."
    }

    final_verified_audit = engine.evaluate_compliance(
        flawed_ocr_segments,
        (1000, 1000),
        manual_overrides=manual_corrections_payload
    )

    # Verify 1: Compliance engine receives ₹40 and 200 g
    assert final_verified_audit["final_verified_fields"]["mrp"] == "40.00", f"Expected MRP 40.00, got {final_verified_audit['final_verified_fields']['mrp']}"
    assert final_verified_audit["final_verified_fields"]["net_quantity"] == "200", f"Expected Net Qty 200, got {final_verified_audit['final_verified_fields']['net_quantity']}"
    assert final_verified_audit["final_verified_fields"]["unit_of_measure"] == "g", f"Expected unit 'g', got {final_verified_audit['final_verified_fields']['unit_of_measure']}"

    # Verify 2: Old OCR values (₹100, None) are NOT used for final evaluation
    assert final_verified_audit["extracted_metadata"]["mrp"] == "40.00"
    assert final_verified_audit["extracted_metadata"]["net_quantity"] == "200"

    # Verify 3: Score is recalculated genuinely to 100
    assert final_verified_audit["overall_score"] == 100, f"Expected 100/100, got {final_verified_audit['overall_score']}"
    assert final_verified_audit["status"] == "COMPLIANT", f"Expected COMPLIANT, got {final_verified_audit['status']}"

    # Verify 4: Violations caused solely by old OCR values disappear
    assert len(final_verified_audit["violations"]) == 0, f"Expected 0 violations, found: {final_verified_audit['violations']}"
    assert final_verified_audit["rules_breakdown"]["rule_6_1_da_mrp"] is True
    assert final_verified_audit["rules_breakdown"]["rule_11_12_net_quantity"] is True

    # Verify 5: Audit trail & original OCR snapshot are preserved
    assert final_verified_audit["original_ocr_snapshot"] is not None
    assert final_verified_audit["original_ocr_snapshot"]["mrp"] == "100"
    assert len(final_verified_audit["corrections_made"]) > 0
    assert any(c["field"] == "declared_mrp" and "40" in c["corrected_value"] for c in final_verified_audit["corrections_made"])
    print("  --> Subtest 17.1 Passed: Forward Manual Override is 100% Single Source of Truth (₹100 -> ₹40, Not Declared -> 200g, Score: 100/100, 0 violations).")

    # 17.2 Reverse Test:
    # Initial OCR is 100% Compliant. Inspector changes net_quantity unit to illegal imperial 'fl oz'.
    compliant_segments = [
        {"text": "HERBAL SHAMPOO", "box": [[10, 10], [300, 10], [300, 40], [10, 40]], "confidence": 0.99},
        {"text": "Net Qty: 200 ml", "box": [[10, 50], [200, 50], [200, 80], [10, 80]], "confidence": 0.98},
        {"text": "MRP Rs. 150.00 (Inclusive of all taxes)", "box": [[10, 90], [350, 90], [350, 120], [10, 120]], "confidence": 0.98},
        {"text": "Mfg: 01/2026", "box": [[10, 130], [150, 130], [150, 160], [10, 160]], "confidence": 0.98},
        {"text": "Helpline: 1800-11-4444 | Email: care@herbal.in", "box": [[10, 170], [350, 170], [350, 200], [10, 200]], "confidence": 0.98},
        {"text": "Country of Origin: India", "box": [[10, 210], [200, 210], [200, 240], [10, 240]], "confidence": 0.98}
    ]
    comp_scan = engine.evaluate_compliance(compliant_segments, (1000, 1000))
    assert comp_scan["status"] == "COMPLIANT", "Initial scan must be compliant"

    # Inspector enters illegal imperial unit manually
    reverse_override = {
        "net_quantity": "8",
        "unit_of_measure": "fl oz" # Prohibited imperial unit under Rule 11 & 12
    }
    reverse_audit = engine.evaluate_compliance(compliant_segments, (1000, 1000), manual_overrides=reverse_override)
    assert reverse_audit["status"] == "NON_COMPLIANT", f"Expected NON_COMPLIANT when inspector inputs fl oz, got {reverse_audit['status']}"
    assert reverse_audit["overall_score"] < 100, f"Expected score < 100, got {reverse_audit['overall_score']}"
    assert any(v["rule_id"] == "RULE_11_12_PROHIBITED_IMPERIAL" for v in reverse_audit["violations"]), "Must flag RULE_11_12_PROHIBITED_IMPERIAL"
    assert reverse_audit["final_verified_fields"]["unit_of_measure"] == "fl oz"
    print("  --> Subtest 17.2 Passed: Reverse Manual Override genuinely controls audit (Compliant -> Non-Compliant fl oz flagged).")

    print("\n" + "=" * 70)
    print("ALL 17 COMPLIANCE & INTELLIGENCE PIPELINES PASSED VERIFICATION! [SUCCESS]")
    print("=" * 70)


if __name__ == "__main__":
    run_tests()


