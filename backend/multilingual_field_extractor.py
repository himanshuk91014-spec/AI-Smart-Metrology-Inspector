"""
Multilingual Semantic Field Extractor for Legal Metrology (PCR 2011)
=====================================================================
Performs Unicode-safe text normalization, multi-script analysis,
and Spatial + Semantic extraction for statutory declarations:
1. Maximum Retail Price (MRP) & Tax Inclusive Declaration ("सभी कर सहित" / "Inclusive of all taxes")
2. Net Quantity ("कुल मात्रा : 200 ग्राम" -> "200 g", with Nutrition Table Disambiguation)
3. Manufacturing Date ("उत्पादन तिथि" / "MFG. DATE") & Best Before ("सर्वोत्तम उपयोग से पूर्व")
4. Consumer Redressal ("उपभोक्ता सेवा" / "Helpline" / "care@")
5. Country of Origin & Manufacturer Name/Address
"""

import re
from typing import Any, Dict, List, Optional, Tuple, Set

from multilingual_dictionary import (
    SCRIPT_UNICODE_RANGES,
    SCRIPT_LANGUAGE_NAMES,
    MULTILINGUAL_MRP_KEYWORDS,
    MULTILINGUAL_TAX_INCLUSIVE_PHRASES,
    MULTILINGUAL_NET_QUANTITY_KEYWORDS,
    MULTILINGUAL_MFG_DATE_KEYWORDS,
    MULTILINGUAL_BEST_BEFORE_KEYWORDS,
    MULTILINGUAL_CONSUMER_CARE_KEYWORDS,
    MULTILINGUAL_ORIGIN_KEYWORDS,
    MULTILINGUAL_METRIC_UNIT_MAP,
    MULTILINGUAL_CURRENCY_SYMBOLS,
    convert_indic_digits_to_arabic,
    get_all_tax_inclusive_patterns,
    get_all_mrp_keywords,
    get_all_net_quantity_keywords
)


# =============================================================================
# 1. UNICODE-SAFE NORMALIZATION & SCRIPT PROFILER
# =============================================================================

def normalize_unicode_text(text: str) -> str:
    """
    Cleans text without corrupting Devanagari or other Indic Unicode characters.
    Preserves all Indian script code points (U+0600 - U+0D7F).
    """
    if not text:
        return ""
    # Normalize varied whitespace and non-breaking spaces
    cleaned = re.sub(r"[\r\t\u00A0\u2000-\u200B\uFEFF]+", " ", str(text))
    # Replace weird decorative punctuation while preserving Indic punctuation (Danda ।)
    cleaned = cleaned.replace("“", "\"").replace("”", "\"").replace("‘", "'").replace("’", "'")
    # Clean excessive spaces
    cleaned = re.sub(r" +", " ", cleaned)
    return cleaned.strip()


def detect_multilingual_profile(full_text: str) -> Dict[str, Any]:
    """
    Accurately detects scripts and languages present by analyzing actual character codepoints.
    Returns composite label like 'Hindi (Devanagari) + English (Latin)'.
    """
    script_counts: Dict[str, int] = {script: 0 for script in SCRIPT_UNICODE_RANGES}
    latin_count = 0
    digit_count = 0

    for char in full_text:
        code = ord(char)
        if (0x0041 <= code <= 0x005A) or (0x0061 <= code <= 0x007A):
            latin_count += 1
        elif 0x0030 <= code <= 0x0039:
            digit_count += 1
        else:
            for script, (start_cp, end_cp) in SCRIPT_UNICODE_RANGES.items():
                if start_cp <= code <= end_cp:
                    script_counts[script] += 1
                    break

    total_regional_chars = sum(script_counts.values())
    dominant_script = "Latin"
    dominant_lang = "en"
    lang_name = "English (Latin)"

    detected_scripts_list: List[str] = []
    detected_langs_list: List[str] = []

    # Identify regional scripts with non-zero occurrence
    for script, count in script_counts.items():
        if count >= 3:  # minimum 3 characters threshold for confident script presence
            detected_scripts_list.append(script)
            if script == "Devanagari":
                # Disambiguate Hindi vs Marathi
                if any(w in full_text for w in ["कमाल", "किरकोळ", "करांसह", "निव्वळ", "पॅकिंग", "तक्रार", "दिनांक"]):
                    detected_langs_list.append("Marathi (मराठी)")
                else:
                    detected_langs_list.append("Hindi (हिंदी)")
            elif script == "Tamil":
                detected_langs_list.append("Tamil (தமிழ்)")
            elif script == "Telugu":
                detected_langs_list.append("Telugu (తెలుగు)")
            elif script == "Kannada":
                detected_langs_list.append("Kannada (ಕನ್ನಡ)")
            elif script == "Malayalam":
                detected_langs_list.append("Malayalam (മലയാളം)")
            elif script == "Bengali":
                detected_langs_list.append("Bengali (বাংলা)")
            elif script == "Gujarati":
                detected_langs_list.append("Gujarati (ગુજરાતી)")
            elif script == "Gurmukhi":
                detected_langs_list.append("Punjabi (ਪੰਜਾਬੀ)")
            elif script == "Odia":
                detected_langs_list.append("Odia (ଓଡ଼ିଆ)")
            elif script == "Arabic":
                detected_langs_list.append("Urdu (اردو)")

    if latin_count >= 4:
        detected_scripts_list.append("Latin")
        detected_langs_list.append("English (Latin)")

    if total_regional_chars > 0 and len(detected_langs_list) > 0:
        dominant_script = max(script_counts.items(), key=lambda x: x[1])[0]
        dominant_lang = "hi" if dominant_script == "Devanagari" else dominant_script.lower()[:2]
        composite_name = " + ".join(detected_langs_list)
        lang_name = composite_name
    elif latin_count > 0:
        dominant_script = "Latin"
        dominant_lang = "en"
        lang_name = "English (Latin)"
    else:
        lang_name = "English (Latin)"

    return {
        "dominant_language": dominant_lang,
        "language_name": lang_name,
        "dominant_script": dominant_script,
        "is_multilingual": len(detected_scripts_list) > 1 or total_regional_chars > 0,
        "scripts_present": detected_scripts_list or ["Latin"],
        "regional_char_count": total_regional_chars,
        "latin_char_count": latin_count
    }


# =============================================================================
# 2. SPATIAL & SEMANTIC MRP + TAX CLAUSE EXTRACTION
# =============================================================================

class MultilingualFieldExtractor:
    """
    Universal Multilingual Semantic & Spatial Field Extractor for FMCG / Packaged Commodities.
    Extracts statutory declarations, normalizes values, identifies original text,
    and determines exact compliance evidence under PCR 2011.
    """

    @classmethod
    def extract_mrp_and_tax_clause(
        cls,
        segments: List[Dict[str, Any]],
        full_text: str
    ) -> Dict[str, Any]:
        """
        Extracts MRP price, associated currency, and verifies the mandatory statutory tax clause.
        Handles multi-line split declarations, embedded parentheses (सभी कर सहित / Inclusive of GST),
        Indic numerals (Devanagari, Telugu, Tamil, Bengali, Gujarati, etc.), and currency symbol variants.
        """
        full_normalized = normalize_unicode_text(full_text)
        # Convert any Indic digits in text to standard ASCII digits
        full_converted = convert_indic_digits_to_arabic(full_normalized)
        lines = [normalize_unicode_text(l) for l in full_converted.split("\n") if l.strip()]

        # 1. Check for Tax Inclusive Clause across all languages (English & 12 Indic Languages)
        tax_clause_found = False
        tax_clause_matched_text = None
        tax_clause_lang = "en"

        # Regex for all tax phrases
        for lang_code, phrases in MULTILINGUAL_TAX_INCLUSIVE_PHRASES.items():
            for phrase in phrases:
                # Escape and make resilient to whitespace
                phrase_pattern = r"(?i)" + re.sub(r"\s+", r"\\s*", re.escape(phrase))
                m = re.search(phrase_pattern, full_converted)
                if m:
                    tax_clause_found = True
                    tax_clause_matched_text = m.group(0).strip()
                    tax_clause_lang = lang_code
                    break
            if tax_clause_found:
                break

        # Fallback condensed check for tax clause (including GST and curvature cutoffs)
        if not tax_clause_found:
            condensed = re.sub(r"[^\w\u0900-\u0D7F]+", "", full_converted.lower())
            if any(k in condensed for k in [
                "सभीकरसहित", "सभीकरोंसहित", "करसहित", "करोंसहित", "सबटैक्ससहित", "सर्वकरांसह",
                "जीएसटीसहित", "जीएसटीशामिल", "जीएसटीकरांसह", "జీఎస్టీసహా", "జీఎస్టీతోకలిపి",
                "அனைத்துவரிகளும்உட்பட", "ஜிஎஸ்டிஉட்பட", "সমস্তকরসহ", "জিএসটিসহ", "સારેટેਕਸਾਂਸਮੇਤ",
                "inclusiveofalltaxes", "inclofalltaxes", "inclusivealltaxes", "alltaxesincl",
                "alltaxesincluded", "inclusiveofgst", "inclofgst", "gstincluded", "includinggst",
                "inclusiveofalltax", "inclofalltax", "incoftaxes", "incloftaxes"
            ]):
                tax_clause_found = True
                if "gst" in condensed or "जीएसटी" in condensed or "జీఎస్టీ" in condensed or "ஜிஎஸ்டி" in condensed:
                    tax_clause_matched_text = "Inclusive of GST"
                elif "कर" in condensed or "करांसह" in condensed:
                    tax_clause_matched_text = "सभी कर सहित"
                else:
                    tax_clause_matched_text = "Inclusive of all taxes"

        # 2. Extract Candidate Prices with Semantic Proximity & Rupee Disambiguation Scoring
        price_candidates: List[Dict[str, Any]] = []

        # MRP Keyword pattern
        all_mrp_kws = get_all_mrp_keywords()
        mrp_kw_pattern = r"(?i)\b(?:" + "|".join([re.sub(r"\s+", r"\\s*", re.escape(k)) for k in all_mrp_kws]) + r")\b"

        # Currency symbol pattern (matches ₹, \u20b9, Rs., Rs, INR, Re., रु, र, ரூ, రూ, etc. and OCR artifacts ?, *, ~, |)
        currency_pattern = r"(?:₹|\u20B9|rs\.?|inr|re\.?|रु\.?|र\.?|రూ\.?|ரூ\.?|रू\.?|৳|`|~|\?|\*|\|)"

        for line_idx, line in enumerate(lines):
            line_lower = line.lower()
            has_line_mrp_kw = bool(re.search(mrp_kw_pattern, line)) or any(k in line_lower for k in ["mrp", "m.r.p", "price", "मूल्य", "दाम", "ధర", "விலை"])
            has_line_currency = bool(re.search(currency_pattern, line, re.I))
            has_line_tax = bool(re.search(r"(?:सभी\s*कर\s*सहित|inclusive\s*of\s*(?:all\s*taxes|gst)|incl\.?\s*of\s*(?:all\s*taxes|gst)|gst)", line, re.I))

            # Disambiguate Unit Sale Price (USP)
            usp_match = re.search(r"(?i)(?:u\.?s\.?p\.?|unit\s*(?:sale\s*)?price)\s*[:=-]*\s*(?:rs\.?|₹|inr)?\s*[:=-]*\s*(\d+(?:\.\d{1,2})?)\s*(?:per|\/)\s*([a-zA-Z\u0900-\u0D7F]+)", line)

            # Find price patterns:
            # Pattern A: Currency/MRP prefix followed by number: "MRP: ₹ 25.00", "MRP ₹25", "Rs. 450.00", "₹ 25.00"
            for p_m in re.finditer(r"(?:(?:mrp|price|मूल्य|ధర|விலை)\s*[:=-]*\s*)?" + currency_pattern + r"\s*[:=-]*\s*(\d+(?:,\d+)*(?:\.\d{1,2})?)|\b(\d{1,5}(?:\.\d{1,2})?)\s*\/\s*[\-]?|\b(\d{1,6}(?:\.\d{1,2})?)\b", line, re.I):
                num_str = p_m.group(1) or p_m.group(2) or p_m.group(3)
                if not num_str:
                    continue
                num_clean = re.sub(r",(\d{2})$", r".\1", num_str.strip()).replace(",", "").strip()
                try:
                    val = float(num_clean)
                except ValueError:
                    continue

                if val <= 0:
                    continue

                # STRICT DISQUALIFICATIONS:
                # 1. Barcode numbers (e.g. 880007107731) or numbers >= 10 digits
                if len(num_clean) >= 10 and num_clean.isdigit():
                    continue
                # 2. Toll-Free / Phone numbers (e.g. 1800 889 0270, 18008890270)
                if num_clean.startswith("1800") or any(kw in line_lower for kw in ["customer care", "helpline", "toll free", "care no", "phone"]):
                    if not has_line_mrp_kw:
                        continue
                # 3. 6-digit PIN Codes (e.g. 250002, 396195)
                if len(num_clean) == 6 and num_clean.isdigit() and not has_line_mrp_kw:
                    continue
                # 4. Dimension numbers (e.g. 23.5 in "Size: 23.5 X 17.5 cm")
                if re.search(r"(?:size|dim|dimensions?)\s*[:=-]*\s*" + re.escape(num_clean), line, re.I) or ("x" in line_lower and any(u in line_lower for u in ["cm", "mm", "m"])):
                    if not has_line_mrp_kw:
                        continue
                # 5. Page counts (e.g. "Pages : 80")
                if re.search(r"(?:pages?|sheets?|leaves?)\s*[:=-]*\s*" + re.escape(num_clean), line, re.I) and not has_line_mrp_kw:
                    continue
                # 6. Year numbers (1970 - 2035) without explicit MRP anchor
                if (1970 <= val <= 2035) and ("." not in num_clean) and not has_line_mrp_kw:
                    continue

                score = 0
                if has_line_mrp_kw:
                    score += 130
                elif line_idx > 0 and re.search(mrp_kw_pattern, lines[line_idx - 1]):
                    score += 90
                elif line_idx < len(lines) - 1 and re.search(mrp_kw_pattern, lines[line_idx + 1]):
                    score += 80

                if has_line_currency:
                    score += 65
                if re.search(currency_pattern + r"\s*[:=-]*\s*" + re.escape(num_str), line, re.I):
                    score += 75

                if "." in num_clean and len(num_clean.split(".")[1]) == 2:
                    score += 40
                if has_line_tax:
                    score += 45
                if "/-" in line or "/ -" in line:
                    score += 30

                if usp_match and num_clean == usp_match.group(1):
                    score -= 80

                if 1.0 <= val <= 99999.0:
                    score += 20
                else:
                    score -= 50

                price_candidates.append({
                    "val": val,
                    "val_str": f"{val:.2f}" if "." in num_clean else (f"{val:.2f}" if val < 100 else str(int(val))),
                    "score": score,
                    "line": line,
                    "line_idx": line_idx
                })

        found_mrp = None
        matched_line = ""
        if price_candidates:
            price_candidates.sort(key=lambda c: c["score"], reverse=True)
            top_cand = price_candidates[0]
            found_mrp = top_cand["val_str"]
            matched_line = top_cand["line"]

        # Ensure tax clause association
        if found_mrp and not tax_clause_found:
            if any(k in full_normalized.lower() for k in ["सभी कर", "कर सहित", "incl", "taxes", "gst"]):
                tax_clause_found = True
                tax_clause_matched_text = "सभी कर सहित" if "कर" in full_normalized else "Inclusive of all taxes"

        return {
            "mrp": found_mrp,
            "declared_price_str": f"₹ {found_mrp}" if found_mrp else None,
            "taxes_included": tax_clause_found,
            "tax_clause_text": tax_clause_matched_text or ("सभी कर सहित" if tax_clause_found else None),
            "tax_concept": "TAX_INCLUSIVE_DECLARATION" if tax_clause_found else None,
            "original_text": matched_line or (f"MRP: ₹ {found_mrp}" if found_mrp else None),
            "has_mrp_keyword": bool(re.search(mrp_kw_pattern, full_normalized)) or bool(found_mrp)
        }

    # =========================================================================
    # 3. SPATIAL & SEMANTIC NET QUANTITY EXTRACTION (NUTRITION DISAMBIGUATED)
    # =============================================================================

    @classmethod
    def extract_net_quantity(
        cls,
        segments: List[Dict[str, Any]],
        full_text: str
    ) -> Dict[str, Any]:
        """
        Extracts package net quantity, original unit, and normalized SI unit.
        Specifically disambiguates and rejects Nutrition Information rows (e.g. 7.5 g, 20.0 g, 67.0 g)
        and prioritizes explicit Net Quantity statutory anchors ("कुल मात्रा : 200 ग्राम").
        """
        full_normalized = normalize_unicode_text(full_text)
        lines = [normalize_unicode_text(l) for l in full_normalized.split("\n") if l.strip()]

        detected_qty = None
        detected_unit = None
        original_unit_str = None
        original_declaration_line = None
        extraction_conf = 0.85
        detection_lang = "en"

        # 1. Identify and Mask Nutrition Facts Section to eliminate false positives
        is_nutrition_context = False
        nutrition_keywords = [
            "nutritional information", "nutrition facts", "nutritional facts", "nutrition information",
            "poshan", "poshtik", "पोषण जानकारी", "पोषण संबंधी तथ्य", "प्रति 100 ग्राम", "per 100g",
            "per 100 g", "energy", "protein", "carbohydrate", "total fat", "saturated fat",
            "cholesterol", "sodium", "dietary fiber", "added sugars"
        ]

        # 2. Priority 1: Search for Explicit Multilingual Net Quantity Keyword Anchors
        # e.g., "कुल मात्रा : 200 ग्राम", "शुद्ध मात्रा : 500 g", "Net Qty: 200 g", "Net Quantity : 100 g"
        all_net_qty_kws = get_all_net_quantity_keywords()
        net_qty_kw_pattern = r"(?i)(?:" + "|".join([re.sub(r"\s+", r"\\s*", re.escape(k)) for k in all_net_qty_kws]) + r")"

        # Full pattern combining keyword + colon/separator + number + unit
        # Handles: "कुल मात्रा : 200 ग्राम", "कुल मात्रा 200 ग्राम", "Net Qty : 200g", "NET WT. 200 G"
        explicit_qty_pattern = re.compile(
            net_qty_kw_pattern + r"\s*[:=-]*\s*([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z\u0900-\u0D7F\.]+)",
            re.UNICODE
        )

        for line in lines:
            m = explicit_qty_pattern.search(line)
            if m:
                val_candidate = m.group(1).strip()
                unit_candidate = m.group(2).strip().rstrip(".,")
                unit_lower = unit_candidate.lower()

                # Match unit against Multilingual Unit Dictionary
                if unit_lower in MULTILINGUAL_METRIC_UNIT_MAP or unit_candidate in MULTILINGUAL_METRIC_UNIT_MAP:
                    unit_meta = MULTILINGUAL_METRIC_UNIT_MAP.get(unit_lower) or MULTILINGUAL_METRIC_UNIT_MAP.get(unit_candidate)
                    detected_qty = val_candidate
                    detected_unit = unit_meta["normalized_unit"]
                    original_unit_str = unit_candidate
                    original_declaration_line = line.strip()
                    extraction_conf = 0.98
                    detection_lang = "hi" if re.search(r"[\u0900-\u097F]", line) else "en"
                    break

        # Priority 2: Multi-line adjacent segment search (keyword on line N, value + unit on line N or N+1)
        if not detected_qty:
            for idx, line in enumerate(lines):
                if re.search(net_qty_kw_pattern, line):
                    # Check current line and next 2 lines
                    search_window = " ".join(lines[idx:min(len(lines), idx + 2)])
                    # Extract number + unit
                    m_win = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z\u0900-\u0D7F\.]+)", search_window)
                    if m_win:
                        val_cand = m_win.group(1).strip()
                        u_cand = m_win.group(2).strip().rstrip(".,")
                        u_lower = u_cand.lower()
                        if u_lower in MULTILINGUAL_METRIC_UNIT_MAP or u_cand in MULTILINGUAL_METRIC_UNIT_MAP:
                            unit_meta = MULTILINGUAL_METRIC_UNIT_MAP.get(u_lower) or MULTILINGUAL_METRIC_UNIT_MAP.get(u_cand)
                            detected_qty = val_cand
                            detected_unit = unit_meta["normalized_unit"]
                            original_unit_str = u_cand
                            original_declaration_line = search_window.strip()
                            extraction_conf = 0.92
                            detection_lang = "hi" if re.search(r"[\u0900-\u097F]", search_window) else "en"
                            break

        # Priority 3: Non-nutrition Metric Quantity Scan (with strict nutrition filter)
        if not detected_qty:
            non_nutrition_lines = []
            skip_nutrition_block = False

            for line in lines:
                line_lower = line.lower()
                if any(kw in line_lower for kw in nutrition_keywords):
                    skip_nutrition_block = True
                    continue
                if skip_nutrition_block:
                    # End nutrition block if we hit statutory keywords (MRP, Mfd, Batch, Customer Care)
                    if any(k in line_lower for k in ["mrp", "mfd", "mfg", "batch", "care@", "helpline", "marketed by"]):
                        skip_nutrition_block = False
                    else:
                        continue
                non_nutrition_lines.append(line)

            # Scan filtered lines for clean metric unit declarations
            metric_scan_pattern = re.compile(
                r"\b([0-9]+(?:\.[0-9]+)?)\s*(ग्राम|किग्रा|कि\.ग्रा\.|मिली|मि\.ली\.|लीटर|ली\.|नग|संख्या|g|gm|gms|gram|grams|kg|kgs|ml|mls|l|ltr|ltrs|pages|sheets|pens|units|n)\b",
                re.IGNORECASE | re.UNICODE
            )

            for line in non_nutrition_lines:
                # Disqualify dates (e.g. 16/09/2024, 09/24) and model numbers
                if re.search(r"\b\d{1,2}[\/\.-]\d{2,4}\b", line):
                    continue
                m_scan = metric_scan_pattern.search(line)
                if m_scan:
                    val_c = m_scan.group(1).strip()
                    u_c = m_scan.group(2).strip().rstrip(".,")
                    u_l = u_c.lower()
                    if u_l in MULTILINGUAL_METRIC_UNIT_MAP or u_c in MULTILINGUAL_METRIC_UNIT_MAP:
                        unit_meta = MULTILINGUAL_METRIC_UNIT_MAP.get(u_l) or MULTILINGUAL_METRIC_UNIT_MAP.get(u_c)
                        detected_qty = val_c
                        detected_unit = unit_meta["normalized_unit"]
                        original_unit_str = u_c
                        original_declaration_line = line.strip()
                        extraction_conf = 0.88
                        detection_lang = "hi" if re.search(r"[\u0900-\u097F]", line) else "en"
                        break

        # Priority 4: Count / Page / Stationery Specific Extraction
        if not detected_qty:
            pages_match = re.search(
                r"(?:total\s*(?:pages?|sheets?|leaves)|no\.?\s*of\s*(?:pages?|sheets?|leaves)|pages?|sheets?|leaves|कुल\s*पृष्ठ|पन्ने)\s*[:=-]*\s*(\d+)",
                full_normalized, re.I | re.UNICODE
            )
            if pages_match:
                detected_qty = pages_match.group(1).strip()
                detected_unit = "Pages / Units"
                original_unit_str = "Pages"
                original_declaration_line = pages_match.group(0).strip()
                extraction_conf = 0.90

        normalized_qty_str = f"{detected_qty} {detected_unit}" if (detected_qty and detected_unit) else None

        return {
            "net_quantity": detected_qty,
            "unit": detected_unit,
            "original_unit": original_unit_str,
            "normalized_value": normalized_qty_str,
            "original_text": original_declaration_line or normalized_qty_str,
            "confidence": extraction_conf,
            "language": detection_lang
        }

    # =========================================================================
    # 4. MANUFACTURING DATE & BEST BEFORE EXTRACTION
    # =========================================================================

    @classmethod
    def extract_mfg_and_expiry_dates(
        cls,
        segments: List[Dict[str, Any]],
        full_text: str
    ) -> Dict[str, Any]:
        """
        Extracts Manufacturing Date, Best Before Timeline, Batch Number, and License numbers
        from multilingual declarations ("उत्पादन तिथि", "सर्वोत्तम उपयोग से पूर्व", "MFG. DATE").
        """
        full_normalized = normalize_unicode_text(full_text)
        lines = [normalize_unicode_text(l) for l in full_normalized.split("\n") if l.strip()]

        mfg_date_val = None
        mfg_original_text = None

        best_before_val = None
        best_before_original_text = None

        batch_no_val = None
        fssai_no_val = None

        # Regex patterns
        all_mfg_kws = []
        for l_code, kws in MULTILINGUAL_MFG_DATE_KEYWORDS.items():
            all_mfg_kws.extend(kws)
        mfg_kw_pattern = r"(?i)(?:" + "|".join([re.sub(r"\s+", r"\\s*", re.escape(k)) for k in all_mfg_kws]) + r")"

        all_exp_kws = []
        for l_code, kws in MULTILINGUAL_BEST_BEFORE_KEYWORDS.items():
            all_exp_kws.extend(kws)
        exp_kw_pattern = r"(?i)(?:" + "|".join([re.sub(r"\s+", r"\\s*", re.escape(k)) for k in all_exp_kws]) + r")"

        # Date extractors: DD/MM/YYYY, MM/YYYY, MM/YY, DD-MM-YYYY
        date_pattern = r"((?:0[1-9]|[12][0-9]|3[01])[\/\.-](?:0[1-9]|1[0-2])[\/\.-](?:20\d{2}|\d{2})|(?:0[1-9]|1[0-2])[\/\.-](?:20\d{2}|\d{2})|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s\.-]*(?:20\d{2}|\d{2}))"

        for line in lines:
            # Check Mfg Date
            if re.search(mfg_kw_pattern, line):
                m_date = re.search(date_pattern, line, re.I)
                if m_date and not mfg_date_val:
                    mfg_date_val = m_date.group(1).strip()
                    mfg_original_text = line.strip()

            # Check Best Before / Expiry
            if re.search(exp_kw_pattern, line):
                e_date = re.search(date_pattern, line, re.I)
                if e_date and not best_before_val:
                    best_before_val = e_date.group(1).strip()
                    best_before_original_text = line.strip()

            # Check Batch Number (e.g. BATCH: A24G0916, B.No: 104)
            if not batch_no_val:
                b_match = re.search(r"(?i)\b(?:batch\s*(?:no\.?|#)?|b\.?\s*no\.?|lot\s*(?:no\.?|#)?|बैच\s*नं)\s*[:=-]*\s*([a-zA-Z0-9\-_/]+)", line)
                if b_match:
                    batch_no_val = b_match.group(1).strip()

            # Check FSSAI Lic Number (14 digits)
            if not fssai_no_val:
                f_match = re.search(r"(?i)\b(?:fssai(?:\s*lic(?:ence)?(?:\s*no\.?)?)?)\s*[:=-]*\s*([0-9]{14})\b", line)
                if f_match:
                    fssai_no_val = f_match.group(1).strip()

        # Fallback date search across text if keywords weren't on exact single line
        if not mfg_date_val:
            for idx, line in enumerate(lines):
                if re.search(mfg_kw_pattern, line):
                    win = " ".join(lines[idx:min(len(lines), idx + 2)])
                    m_d = re.search(date_pattern, win, re.I)
                    if m_d:
                        mfg_date_val = m_d.group(1).strip()
                        mfg_original_text = win.strip()
                        break

        if not best_before_val:
            for idx, line in enumerate(lines):
                if re.search(exp_kw_pattern, line):
                    win = " ".join(lines[idx:min(len(lines), idx + 2)])
                    e_d = re.search(date_pattern, win, re.I)
                    if e_d:
                        best_before_val = e_d.group(1).strip()
                        best_before_original_text = win.strip()
                        break

        return {
            "manufacturing_date": mfg_date_val,
            "mfg_original_text": mfg_original_text or (f"MFG: {mfg_date_val}" if mfg_date_val else None),
            "best_before": best_before_val,
            "best_before_original_text": best_before_original_text or (f"Best Before: {best_before_val}" if best_before_val else None),
            "batch_number": batch_no_val,
            "fssai_license": fssai_no_val
        }

    # =========================================================================
    # 5. CONSUMER CARE & REDRESSAL EXTRACTION under Rule 6(1)(g)
    # =========================================================================

    @classmethod
    def extract_consumer_care(
        cls,
        segments: List[Dict[str, Any]],
        full_text: str
    ) -> Dict[str, Any]:
        """
        Extracts Consumer Care Email, Toll-Free Helpline, Landline/Mobile Phone, and Postal Address.
        Disambiguates PIN codes, Barcodes, and GSTIN numbers from actual contact numbers.
        """
        full_normalized = normalize_unicode_text(full_text)
        lines = [normalize_unicode_text(l) for l in full_normalized.split("\n") if l.strip()]

        found_email = None
        found_phone = None
        found_website = None

        # 1. Email Extraction
        # Look for standard email patterns or split domain artifacts
        email_pattern = re.compile(r"\b[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+\b", re.I)
        m_email = email_pattern.search(full_normalized)
        if m_email:
            found_email = m_email.group(0).strip().rstrip(".,;")
        else:
            # Reconstruct split email (e.g. "wow @ writeonwhite . in" or "care @ brand . com")
            m_split = re.search(r"\b([a-zA-Z0-9_.+-]+)\s*@\s*([a-zA-Z0-9-]+)\s*\.\s*([a-zA-Z]{2,6}(?:\.[a-zA-Z]{2,4})?)\b", full_normalized)
            if m_split:
                found_email = f"{m_split.group(1)}@{m_split.group(2)}.{m_split.group(3)}"

        # 2. Website Extraction
        web_pattern = re.compile(r"\b(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.(?:com|in|co\.in|org|net|gov\.in))\b", re.I)
        m_web = web_pattern.search(full_normalized)
        if m_web:
            found_website = m_web.group(0).strip().rstrip(".,;")

        # 3. Phone / Helpline Extraction (Priority 1: Toll Free 1800-xxx-xxxx or 1800 xxx xxxx)
        toll_free_m = re.search(r"\b(1800[\s\-]*(?:\d{3}[\s\-]*\d{3,4}|\d{2}[\s\-]*\d{2}[\s\-]*\d{4}|\d{6,7}))\b", full_normalized)
        if toll_free_m:
            raw_tf = toll_free_m.group(1).strip()
            # Normalize to clean 1800 format
            digits = re.sub(r"\D", "", raw_tf)
            if len(digits) == 11:
                found_phone = f"{digits[:4]} {digits[4:7]} {digits[7:]}"
            elif len(digits) == 10:
                found_phone = f"{digits[:4]}-{digits[4:]}"
            else:
                found_phone = raw_tf

        # Priority 2: Phone with explicit customer care / helpline keyword
        if not found_phone:
            for line in lines:
                if any(kw in line.lower() for kw in ["care no", "customer care", "helpline", "toll free", "call", "ph:", "tel:", "contact no"]):
                    # Find 8-11 digit numbers, excluding 6-digit PIN codes and 12-13 digit barcodes
                    p_nums = re.findall(r"\b(?:\+91[\-\s]*)?(?:1800[\s\-]*\d{6,7}|[6-9]\d{9}|0\d{2,4}[\-\s]*\d{6,8})\b", line)
                    if p_nums:
                        found_phone = p_nums[0].strip()
                        break

        # Priority 3: Standard Mobile / Landline number on packaging
        if not found_phone:
            std_phone_m = re.search(r"\b(?:\+91[\-\s]*)?([6-9]\d{4}[\s\-]*\d{5}|0\d{2,4}[\-\s]*\d{6,8})\b", full_normalized)
            if std_phone_m:
                found_phone = std_phone_m.group(0).strip()

        return {
            "email": found_email,
            "phone": found_phone,
            "website": found_website,
            "is_valid": bool(found_email or found_phone)
        }

    # =========================================================================
    # 6. MANUFACTURER, PACKER & ORIGIN EXTRACTION under Rule 6(1)(a) & 6(10)
    # =========================================================================

    @classmethod
    def extract_manufacturer_and_origin(
        cls,
        segments: List[Dict[str, Any]],
        full_text: str
    ) -> Dict[str, Any]:
        """
        Extracts Manufacturer/Packer Name, Registered Address, PIN Code, and Country of Origin.
        """
        full_normalized = normalize_unicode_text(full_text)
        lines = [normalize_unicode_text(l) for l in full_normalized.split("\n") if l.strip()]

        found_mfg_name = None
        found_origin = "India"
        found_pin = None

        # 1. Check Country of Origin (Default India for domestic commodities)
        if any(k in full_normalized.lower() for k in ["made in india", "product of india", "origin: india", "origin india", "भारत में निर्मित", "భారతదేశంలో తయారు"]):
            found_origin = "India"

        # 2. Extract PIN Code (6 digits starting with 1-9)
        pin_match = re.search(r"\b([1-9]\d{5})\b", full_normalized)
        if pin_match:
            found_pin = pin_match.group(1).strip()

        # 3. Extract Manufacturer Name
        mfg_anchors = [
            "manufactured & marketed by", "manufactured and marketed by", "manufactured by",
            "marketed by", "mfg by", "packed by", "pkd by", "a quality product manufactured & marketed by",
            "उत्पादक", "निर्माता", "తయారీదారు", "தயாரிப்பாளர்"
        ]

        for idx, line in enumerate(lines):
            line_l = line.lower()
            for anchor in mfg_anchors:
                if anchor in line_l:
                    # Case A: Name on same line after colon: "Manufactured by: Linchpin Industries Pvt. Ltd."
                    parts = re.split(r"[:=-]", line, maxsplit=1)
                    if len(parts) > 1 and len(parts[1].strip()) >= 4:
                        cand = parts[1].strip()
                        if not any(sw in cand.lower() for sw in ["http", "@", "pages", "mrp", "size"]):
                            found_mfg_name = cand
                            break
                    # Case B: Name on next line
                    elif idx < len(lines) - 1:
                        next_l = lines[idx + 1].strip()
                        if len(next_l) >= 4 and not any(sw in next_l.lower() for sw in ["http", "@", "pages", "mrp", "size", "save earth"]):
                            found_mfg_name = next_l
                            break
            if found_mfg_name:
                break

        # If name has trailing legal suffixes (Pvt. Ltd., Limited, LLC, Inc.), verify clean string
        if found_mfg_name:
            found_mfg_name = re.sub(r"^[^\w]+|[^\w\.\)]+$", "", found_mfg_name).strip()

        return {
            "manufacturer_name": found_mfg_name,
            "country_of_origin": found_origin,
            "pin_code": found_pin
        }
