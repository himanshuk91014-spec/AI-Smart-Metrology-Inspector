"""
Unit Test Suite for FMCG Legal Metrology Pipeline
Tests critical real-world edge cases:
1. Marketing Slogans ("2-Minute Noodles MRP ₹14.00" -> 14.0, not 214.0)
2. Multiline Tax Suffix underneath price row (Spatial linking within 50px delta Y)
3. Date De-contamination ("11/26" vs "70 g" -> prevents "26 L" false match)
4. Apparel Specimen ("MRP ₹ 290.00", "1 nN" -> "1 N", "03/2026")
5. Rule 6(1)(da) & Rule 11/12 Statutory Violation Interception
"""

import os
import json
from fmcg_metrology_pipeline import (
    OCRSpatialGrouper,
    FMCGDeclarationExtractor,
    FMCGMetrologyAuditor
)

def run_fmcg_unit_tests():
    print("=" * 70)
    print("FMCG LEGAL METROLOGY PIPELINE - VERIFICATION SUITE")
    print("=" * 70)

    # -------------------------------------------------------------------------
    # TEST 1: Marketing Slogan & Currency Noise Cleansing (Maggi 2-Minute Noodles)
    # -------------------------------------------------------------------------
    print("\n[TEST 1] Slogan Cleansing: '2-Minute Noodles MRP ₹14.00'...")
    maggi_rows = [
        {
            "row_index": 0,
            "y_center": 50.0,
            "y_min": 40.0,
            "y_max": 60.0,
            "row_text": "Nestle Maggi 2-Minute Noodles Masala",
            "tokens": []
        },
        {
            "row_index": 1,
            "y_center": 90.0,
            "y_min": 80.0,
            "y_max": 100.0,
            "row_text": "MRP ` ₹ 14.00 (incl. of all taxes)",
            "tokens": []
        },
        {
            "row_index": 2,
            "y_center": 130.0,
            "y_min": 120.0,
            "y_max": 140.0,
            "row_text": "Net Weight: 70 g | Pkd: 11/26",
            "tokens": []
        }
    ]
    full_text_1 = "\n".join(r["row_text"] for r in maggi_rows)
    mfg_date_1, decontaminated_1 = FMCGDeclarationExtractor.extract_mfg_date(full_text_1)
    mrp_1, tax_1 = FMCGDeclarationExtractor.extract_mrp_and_tax_clause(maggi_rows, full_text_1)
    net_qty_1 = FMCGDeclarationExtractor.extract_net_quantity(full_text_1, decontaminated_1)

    assert mrp_1 == 14.0, f"Expected MRP 14.0, got {mrp_1} (misread marketing '2-Minute'?)"
    assert tax_1 is True, "Expected tax suffix True"
    assert net_qty_1 == "70 g", f"Expected '70 g', got {net_qty_1}"
    assert mfg_date_1 == "11/26", f"Expected '11/26', got {mfg_date_1}"
    print(f"  --> PASS: Extracted MRP: ₹{mrp_1}, Tax: {tax_1}, Net Qty: {net_qty_1}, Date: {mfg_date_1}")

    # -------------------------------------------------------------------------
    # TEST 2: Multiline Tax Suffix Printed Directly Underneath Price
    # -------------------------------------------------------------------------
    print("\n[TEST 2] Multiline Spatial Linking: '(incl. of all taxes)' on row below...")
    multiline_rows = [
        {
            "row_index": 0,
            "y_center": 100.0,
            "y_min": 90.0,
            "y_max": 110.0,
            "row_text": "MRP Rs. : 250.00",
            "tokens": []
        },
        {
            "row_index": 1,
            "y_center": 135.0,  # 35px vertical gap (<= 50px threshold)
            "y_min": 125.0,
            "y_max": 145.0,
            "row_text": "(Inclusive of all taxes)",
            "tokens": []
        },
        {
            "row_index": 2,
            "y_center": 175.0,
            "y_min": 165.0,
            "y_max": 185.0,
            "row_text": "Net Qty: 500 ml | Mfd: 04/2026",
            "tokens": []
        }
    ]
    full_text_2 = "\n".join(r["row_text"] for r in multiline_rows)
    mfg_date_2, decontaminated_2 = FMCGDeclarationExtractor.extract_mfg_date(full_text_2)
    mrp_2, tax_2 = FMCGDeclarationExtractor.extract_mrp_and_tax_clause(multiline_rows, full_text_2)
    net_qty_2 = FMCGDeclarationExtractor.extract_net_quantity(full_text_2, decontaminated_2)

    assert mrp_2 == 250.0, f"Expected MRP 250.0, got {mrp_2}"
    assert tax_2 is True, "Expected Multiline Tax Suffix linked across rows!"
    assert net_qty_2 == "500 ml", f"Expected '500 ml', got {net_qty_2}"
    print(f"  --> PASS: Multiline MRP: ₹{mrp_2} successfully linked with Tax Clause (Gap: 35px)!")

    # -------------------------------------------------------------------------
    # TEST 3: Date De-Contamination (Preventing '11/26' from yielding '26 L')
    # -------------------------------------------------------------------------
    print("\n[TEST 3] Date De-Contamination: '11/26' string alongside '70 g'...")
    tricky_text = "MAGGI NOODLES BATCH B-102 PKD ON 11/26 L-NO 490 NET WT 70 g"
    mfg_date_3, decontaminated_3 = FMCGDeclarationExtractor.extract_mfg_date(tricky_text)
    net_qty_3 = FMCGDeclarationExtractor.extract_net_quantity(tricky_text, decontaminated_3)

    assert mfg_date_3 == "11/26", f"Expected '11/26', got {mfg_date_3}"
    assert net_qty_3 == "70 g", f"Expected '70 g', got {net_qty_3} (confused with 26 L?)"
    assert "26 L" not in str(net_qty_3), f"Fatal: Date was confused as Net Quantity: {net_qty_3}"
    print(f"  --> PASS: Date '{mfg_date_3}' safely isolated without contaminating Net Qty '{net_qty_3}'!")

    # -------------------------------------------------------------------------
    # TEST 4: Apparel & General Retail Tag (Savana / Urbanic Specimen)
    # -------------------------------------------------------------------------
    print("\n[TEST 4] Apparel Specimen: 'MRP ₹ 290.00', '1 nN' count, '03/2026'...")
    savana_rows = [
        {
            "row_index": 0,
            "y_center": 40.0,
            "y_min": 30.0,
            "y_max": 50.0,
            "row_text": "Savana by Urbanic",
            "tokens": []
        },
        {
            "row_index": 1,
            "y_center": 80.0,
            "y_min": 70.0,
            "y_max": 90.0,
            "row_text": "Net Quantity: 1 nN",
            "tokens": []
        },
        {
            "row_index": 2,
            "y_center": 120.0,
            "y_min": 110.0,
            "y_max": 130.0,
            "row_text": "MRP: ₹ 290.00",
            "tokens": []
        },
        {
            "row_index": 3,
            "y_center": 155.0,  # 35px vertical gap
            "y_min": 145.0,
            "y_max": 165.0,
            "row_text": "(Inclusive of all taxes)",
            "tokens": []
        },
        {
            "row_index": 4,
            "y_center": 195.0,
            "y_min": 185.0,
            "y_max": 205.0,
            "row_text": "Month & Year of Pkg: 03/2026 | Country of Origin: India",
            "tokens": []
        }
    ]
    full_text_4 = "\n".join(r["row_text"] for r in savana_rows)
    mfg_date_4, decontaminated_4 = FMCGDeclarationExtractor.extract_mfg_date(full_text_4)
    mrp_4, tax_4 = FMCGDeclarationExtractor.extract_mrp_and_tax_clause(savana_rows, full_text_4)
    net_qty_4 = FMCGDeclarationExtractor.extract_net_quantity(full_text_4, decontaminated_4)

    assert mrp_4 == 290.0, f"Expected MRP 290.0, got {mrp_4}"
    assert tax_4 is True, "Expected Tax suffix True for Savana tag!"
    assert net_qty_4 == "1 N", f"Expected '1 N', got {net_qty_4} (fixed 1 nN double-glyph)"
    assert mfg_date_4 == "03/2026", f"Expected '03/2026', got {mfg_date_4}"
    print(f"  --> PASS: Savana Specimen cleared: MRP=₹{mrp_4}, Tax={tax_4}, NetQty={net_qty_4}, Date={mfg_date_4}")

    # -------------------------------------------------------------------------
    # TEST 5: Statutory Violations Interception
    # -------------------------------------------------------------------------
    print("\n[TEST 5] Intercepting Missing Tax Suffix & Missing Quantity Violations...")
    violating_rows = [
        {"row_index": 0, "y_center": 50.0, "y_min": 40.0, "y_max": 60.0, "row_text": "MRP Rs. 500", "tokens": []}
    ]
    full_text_5 = "MRP Rs. 500"
    mfg_date_5, decontaminated_5 = FMCGDeclarationExtractor.extract_mfg_date(full_text_5)
    mrp_5, tax_5 = FMCGDeclarationExtractor.extract_mrp_and_tax_clause(violating_rows, full_text_5)
    net_qty_5 = FMCGDeclarationExtractor.extract_net_quantity(full_text_5, decontaminated_5)

    violations_5 = []
    if mrp_5 is None:
        violations_5.append("Violation of Rule 6(1)(da): Mandatory Declaration Missing - Maximum Retail Price (MRP) is not declared.")
    elif not tax_5:
        violations_5.append("Violation of Rule 6(1)(da): Retail sale price declaration missing explicit '(incl. of all taxes)' suffix.")
    if net_qty_5 is None:
        violations_5.append("Violation of Rule 11 & 12: Mandatory Declaration Missing - Standard Net Quantity is not declared on Principal Display Panel.")

    assert len(violations_5) == 2, f"Expected 2 violations, got {violations_5}"
    assert any("Rule 6(1)(da)" in v for v in violations_5)
    assert any("Rule 11 & 12" in v for v in violations_5)
    print(f"  --> PASS: Violations correctly identified: {violations_5}")

    print("\n" + "=" * 70)
    print("ALL 5 FMCG METROLOGY UNIT TESTS PASSED PERFECTLY! [SUCCESS]")
    print("=" * 70)

if __name__ == "__main__":
    run_fmcg_unit_tests()
