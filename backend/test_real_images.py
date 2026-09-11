import os, json
from rapidocr_onnxruntime import RapidOCR
from compliance_engine import LegalMetrologyComplianceEngine

engine = LegalMetrologyComplianceEngine()
ocr = RapidOCR()

images = [
    'media_1789105168268.jpg', # Vardhman notebook
    'media_1789102722682.jpg', # Linchpin Nihar notebook
    'media_1789102513747.jpg'  # First specimen
]

for img_name in images:
    img_path = os.path.join(r'C:\Users\himan\.gemini\antigravity-ide\brain\874ab979-6f3f-49b3-9925-1a2c7c42d3fd\.user_uploaded', img_name)
    if not os.path.exists(img_path):
        continue
    results, _ = ocr(img_path)
    segments = [{'text': r[1], 'box': r[0], 'confidence': float(r[2])} for r in results] if results else []
    audit = engine.evaluate_compliance(segments, (1000, 1000))
    print(f"\n==================== {img_name} ====================")
    print("STATUS:", audit.get("status"))
    print("SCORE:", audit.get("overall_score"))
    print("VIOLATIONS:", [f"{v['rule_id']}: {v['found_text']}" for v in audit.get("violations", [])])
    print("EXTRACTED METADATA:", json.dumps(audit.get("extracted_metadata", {}), indent=2))
