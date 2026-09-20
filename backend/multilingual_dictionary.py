"""
Centralized Multilingual Semantic Dictionary & Regulatory Rules
================================================================
Defines statutory field concepts, multilingual keywords, regex patterns,
and metric unit normalization mappings across English and 12 Indian Languages
(Hindi, Marathi, Tamil, Telugu, Kannada, Malayalam, Bengali, Gujarati, Punjabi, Odia, Urdu, Assamese/Sanskrit)
under the Legal Metrology Act 2009 and Legal Metrology (Packaged Commodities) Rules, 2011 (as amended).
"""

from typing import Any, Dict, List, Set, Tuple

# =============================================================================
# 1. UNICODE SCRIPT RANGES, INDIC DIGIT MAPS & SCRIPT DETECTION
# =============================================================================

INDIC_DIGIT_MAP: Dict[str, str] = {
    # Devanagari (Hindi, Marathi, Sanskrit, Nepali)
    "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
    "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
    # Bengali & Assamese
    "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
    "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
    # Gurmukhi (Punjabi)
    "੦": "0", "੧": "1", "੨": "2", "੩": "3", "੪": "4",
    "੫": "5", "੬": "6", "੭": "7", "੮": "8", "੯": "9",
    # Gujarati
    "૦": "0", "૧": "1", "૨": "2", "૩": "3", "૪": "4",
    "૫": "5", "૬": "6", "૭": "7", "૮": "8", "૯": "9",
    # Odia
    "୦": "0", "୧": "1", "୨": "2", "୩": "3", "୪": "4",
    "୫": "5", "୬": "6", "୭": "7", "୮": "8", "୯": "9",
    # Telugu
    "౦": "0", "౧": "1", "౨": "2", "౩": "3", "౪": "4",
    "౫": "5", "౬": "6", "౭": "7", "౮": "8", "౯": "9",
    # Kannada
    "೦": "0", "೧": "1", "೨": "2", "೩": "3", "೪": "4",
    "೫": "5", "೬": "6", "೭": "7", "೮": "8", "೯": "9",
    # Malayalam
    "൦": "0", "൧": "1", "൨": "2", "൩": "3", "൪": "4",
    "൫": "5", "൬": "6", "൭": "7", "൮": "8", "൯": "9",
    # Tamil
    "௧": "1", "௨": "2", "௩": "3", "௪": "4", "௫": "5",
    "௬": "6", "௭": "7", "௮": "8", "௯": "9",
    # Arabic / Urdu (Eastern Arabic-Indic)
    "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
    "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9"
}

MULTILINGUAL_CURRENCY_SYMBOLS: List[str] = [
    "₹", "\u20B9", "Rs.", "Rs", "INR", "Re.", "Re", "रु.", "रु", "र.", "र",
    "ரூ.", "ரூ", "రూ.", "రూ", "ರೂ.", "ರೂ", "৳", "₹"
]

def convert_indic_digits_to_arabic(text: str) -> str:
    """Converts any regional Indic numerals in string to standard ASCII digits 0-9."""
    if not text:
        return ""
    result = []
    for ch in str(text):
        result.append(INDIC_DIGIT_MAP.get(ch, ch))
    return "".join(result)

SCRIPT_UNICODE_RANGES: Dict[str, Tuple[int, int]] = {
    "Devanagari": (0x0900, 0x097F),  # Hindi, Marathi, Sanskrit, Konkani, Nepali, Bodo
    "Bengali": (0x0980, 0x09FF),     # Bengali, Assamese
    "Gurmukhi": (0x0A00, 0x0A7F),    # Punjabi
    "Gujarati": (0x0A80, 0x0AFF),    # Gujarati
    "Odia": (0x0B00, 0x0B7F),        # Odia
    "Tamil": (0x0B80, 0x0BFF),       # Tamil
    "Telugu": (0x0C00, 0x0C7F),      # Telugu
    "Kannada": (0x0C80, 0x0CFF),     # Kannada
    "Malayalam": (0x0D00, 0x0D7F),   # Malayalam
    "Arabic": (0x0600, 0x06FF),      # Urdu, Kashmiri, Sindhi
}

SCRIPT_LANGUAGE_NAMES: Dict[str, Dict[str, str]] = {
    "Devanagari": {"hi": "Hindi (हिंदी)", "mr": "Marathi (मराठी)", "sa": "Sanskrit (संस्कृतम्)"},
    "Bengali": {"bn": "Bengali (বাংলা)", "as": "Assamese (অসমীয়া)"},
    "Gurmukhi": {"pa": "Punjabi (ਪੰਜਾਬੀ)"},
    "Gujarati": {"gu": "Gujarati (ગુજરાતી)"},
    "Odia": {"or": "Odia (ଓଡ଼ିଆ)"},
    "Tamil": {"ta": "Tamil (தமிழ்)"},
    "Telugu": {"te": "Telugu (తెలుగు)"},
    "Kannada": {"kn": "Kannada (ಕನ್ನಡ)"},
    "Malayalam": {"ml": "Malayalam (മലയാളം)"},
    "Arabic": {"ur": "Urdu (اردو)"},
    "Latin": {"en": "English (Latin)"}
}

# =============================================================================
# 2. CENTRALIZED MULTILINGUAL FIELD KEYWORDS
# =============================================================================

# Field: Maximum Retail Price (MRP)
MULTILINGUAL_MRP_KEYWORDS: Dict[str, List[str]] = {
    "en": [
        "mrp", "m.r.p.", "m r p", "maximum retail price", "max retail price",
        "max. retail price", "retail price", "m.r.p", "price", "unit sale price", "usp"
    ],
    "hi": [
        "अधिकतम खुदरा मूल्य", "अधिकतम खुदरा मुल्य", "अधिकतम खुदरा", "अधिकतम विक्रय मूल्य",
        "खुदरा मूल्य", "अ.खु.मू.", "अ०खु०मू०", "एमआरपी", "एम.आर.पी.", "मूल्य", "दाम"
    ],
    "mr": [
        "कमाल किरकोळ किंमत", "कमाल किरकोळ भाव", "किरकोळ किंमत", "किंमत", "एमआरपी"
    ],
    "ta": [
        "அதிகபட்ச சில்லறை விலை", "அதிகபட்ச சில்லறை", "சில்லறை விலை", "விலை", "எம்ஆர்பி"
    ],
    "te": [
        "గరిష్ట చిల్లర ధర", "గరిష్ట రిటైల్ ధర", "చిల్లర ధర", "ధర", "ఎంఆర్పీ"
    ],
    "kn": [
        "ಗರಿಷ್ಠ ಚಿಲ್ಲರೆ ಬೆಲೆ", "ಚಿಲ್ಲರೆ ಬೆಲೆ", "ಬೆಲೆ", "ಎಂಆರ್‌ಪಿ"
    ],
    "ml": [
        "പരമാവധി ചില്ലറ വില", "ചില്ലറ വില", "വില", "എംആർപി"
    ],
    "bn": [
        "সর্বোচ্চ খুচরা মূল্য", "খুচরা মূল্য", "সর্বোচ্চ মূল্য", "মূল্য", "দাম", "এমআরপি"
    ],
    "gu": [
        "મહત્તમ છૂટક કિંમત", "મહત્તમ છૂટક ભાવ", "છૂટક કિંમત", "કિંમત", "ભાવ", "એમઆરપી"
    ],
    "pa": [
        "ਵੱਧ ਤੋਂ ਵੱਧ ਪ੍ਰਚੂਨ ਕੀਮਤ", "ਪ੍ਰਚੂਨ ਮੁੱਲ", "ਮੁੱਲ", "ਕੀਮਤ", "ਐਮਆਰਪੀ"
    ],
    "or": [
        "ସର୍ବାଧିକ ଖୁଚୁରା ମୂଲ୍ୟ", "ଖୁଚୁରା ମୂଲ୍ୟ", "ମୂଲ୍ୟ"
    ],
    "ur": [
        "زیادہ سے زیادہ خوردہ قیمت", "خوردہ قیمت", "قیمت", "ایم آر پی"
    ]
}

# Field: Statutory Tax Inclusive Clause under Rule 6(1)(da)
MULTILINGUAL_TAX_INCLUSIVE_PHRASES: Dict[str, List[str]] = {
    "en": [
        "inclusive of all taxes", "incl. of all taxes", "incl of all taxes",
        "inclusive of all tax", "incl. of all tax", "incl of all tax",
        "inclusive all taxes", "incl all taxes", "all taxes inclusive",
        "all taxes included", "all taxes incl.", "all taxes incl",
        "taxes included", "tax included", "taxes incl.", "tax incl.",
        "inclusive of taxes", "incl. of taxes", "incl of taxes", "inclusive of tax",
        "inclusive of gst", "incl. of gst", "incl of gst", "inclusive gst", "gst included",
        "including gst", "inclusive of all taxes & duties", "inclusive of all duties & taxes",
        "inclusive of vat", "incl. of vat", "vat included", "incl. of all taxes."
    ],
    "hi": [
        "सभी कर सहित", "सभी करों सहित", "सभी करों को मिलाकर", "करों सहित", "कर सहित",
        "सभी टैक्स सहित", "सब टैक्स सहित", "टैक्स सहित", "जीएसटी सहित", "जी.एस.टी. सहित",
        "जीएसटी शामिल", "सभी कर शामिल", "सभी करों सहित।"
    ],
    "mr": [
        "सर्व करांसह", "सर्व कर समाविष्ट", "करांसह", "जीएसटी करांसह", "जीएसटी समाविष्ट",
        "सर्व कर धरून"
    ],
    "ta": [
        "அனைத்து வரிகளும் உட்பட", "அனைத்து வரிகள் உட்பட", "வரிகள் உட்பட", "ஜிஎஸ்டி உட்பட",
        "வரி உட்பட"
    ],
    "te": [
        "అన్ని పన్నులతో కలిపి", "అన్ని పన్నులు కలుపుకొని", "అన్ని పన్నులు సహా", "పన్నులు సహా",
        "పన్నులతో కలిపి", "జీఎస్టీ సహా", "జీఎస్టీతో కలిపి", "జీఎస్టీ కలుపుకొని"
    ],
    "kn": [
        "ಎಲ್ಲಾ ತೆರಿಗೆಗಳು ಸೇರಿವೆ", "ಎಲ್ಲಾ ತೆರಿಗೆಗಳು ಸೇರಿದಂತೆ", "ತೆರಿಗೆ ಸಹಿತ", "ಜಿಎಸ್‌ಟಿ ಸೇರಿವೆ",
        "ಜಿಎಸ್‌ಟಿ ಸಹಿತ"
    ],
    "ml": [
        "എല്ലാ നികുതികളും ഉൾപ്പെടെ", "എല്ലാ നികുതികളും അടക്കം", "നികുതി ഉൾപ്പെടെ",
        "ജിഎസ്ടി ഉൾപ്പെടെ"
    ],
    "bn": [
        "সমস্ত কর সহ", "সমস্ত কর অন্তর্ভুক্ত", "সব ট্যাক্স সহ", "জিএসটি সহ", "জিএসটি অন্তর্ভুক্ত",
        "কর সহ"
    ],
    "gu": [
        "તમામ કર સહિત", "બધા કર સહિત", "કર સહિત", "જીએસટી સહિત", "બધા વેરા સહિત"
    ],
    "pa": [
        "ਸਾਰੇ ਟੈਕਸਾਂ ਸਮੇਤ", "ਸਾਰੇ ਟੈਕਸ ਸਮੇਤ", "ਸਾਰੇ ਟੈਕਸ ਸ਼ਾਮਲ", "ਜੀਐਸਟੀ ਸਮੇਤ", "ਜੀਐਸਟੀ ਸ਼ਾਮਲ"
    ],
    "or": [
        "ସମସ୍ତ କର ସହିତ", "କର ସହିତ", "ସମସ୍ତ ଟ୍ୟାକ୍ସ ସହିତ", "ଜିଏସଟି ସହିତ"
    ],
    "ur": [
        "تمام ٹیکسز سمیت", "تمام ٹیکس شامل", "جی ایس ٹی سمیت", "جی ایس ٹی شامل", "ٹیکس سمیت"
    ]
}

# Field: Net Quantity & Commodity Count under Rule 11 & 12
MULTILINGUAL_NET_QUANTITY_KEYWORDS: Dict[str, List[str]] = {
    "en": [
        "net quantity", "net qty", "net qty.", "net weight", "net wt", "net wt.",
        "net content", "net contents", "net volume", "net vol", "quantity", "qty",
        "qty.", "weight", "volume", "count", "total pages", "no. of pages", "pages",
        "sheets", "pieces", "units", "items", "leaves"
    ],
    "hi": [
        "कुल मात्रा", "शुद्ध मात्रा", "शुद्ध वजन", "कुल वजन", "मात्रा", "वजन",
        "कुल सामग्री", "शुद्ध सामग्री", "संख्या", "नग", "कुल पृष्ठ", "पृष्ठ संख्या", "पन्ने"
    ],
    "mr": [
        "निव्वळ प्रमाण", "एकूण प्रमाण", "निव्वळ वजन", "एकूण वजन", "प्रमाण", "वजन",
        "संख्या", "एकूण पाने", "पाने"
    ],
    "ta": [
        "நிகர அளவு", "நிகர எடை", "மொத்த அளவு", "அளவு", "எடை", "எண்ணிக்கை", "பக்கங்கள்"
    ],
    "te": [
        "నికర పరిమాణం", "నికర బరువు", "పరిమాణం", "బరువు", "నెట్ క్వాంటిటీ", "సంఖ్య",
        "నెం", "మొత్తం పేజీలు", "పేజీలు"
    ],
    "kn": [
        "ನಿವ್ವಳ ಪ್ರಮಾಣ", "ನಿವ್ವಳ ತೂಕ", "ಪ್ರಮಾಣ", "ತೂಕ", "ಸಂಖ್ಯೆ", "ಪುಟಗಳು"
    ],
    "ml": [
        "ആകെ അളവ്", "അറ്റ അളവ്", "അളവ്", "തൂക്കം", "എണ്ണം", "പേജുകൾ"
    ],
    "bn": [
        "নিট পরিমাণ", "মোট পরিমাণ", "নিট ওজন", "পরিমাণ", "ওজন", "সংখ্যা", "পৃষ্ঠা"
    ],
    "gu": [
        "ચોખ્ખી માત્રા", "કુલ માત્રા", "ચોખ્ખું વજન", "કુલ વજન", "માત્રા", "વજન",
        "નંગ", "પાના"
    ],
    "pa": [
        "ਕੁੱਲ ਮਾਤਰਾ", "ਸ਼ੁੱਧ ਮਾਤਰਾ", "ਕੁੱਲ ਵਜ਼ਨ", "ਸ਼ੁੱਧ ਵਜ਼ਨ", "ਮਾਤਰਾ", "ਵਜ਼ਨ",
        "ਨੰਬਰ", "ਪੰਨੇ"
    ],
    "or": [
        "ମୋଟ ପରିମାଣ", "ନିଟ୍ ପରିମାଣ", "ନିଟ୍ ଓଜନ", "ପରିମାଣ", "ଓଜନ", "ସଂଖ୍ୟା", "ପୃଷ୍ଠା"
    ],
    "ur": [
        "کل مقدار", "خالص مقدار", "کل وزن", "خالص وزن", "مقدار", "وزن", "تعداد", "صفحات"
    ]
}

# Field: Manufacturing & Packaging Date under Rule 6(1)(c)
MULTILINGUAL_MFG_DATE_KEYWORDS: Dict[str, List[str]] = {
    "en": [
        "mfg", "mfg.", "mfg date", "mfg. date", "date of mfg", "date of manufacture",
        "manufactured", "manufacturing", "mfd", "mfd.", "mfd on", "mfd. on",
        "pkd", "pkd.", "pkd date", "date of pkd", "packed", "date of packaging",
        "packed on", "pkg", "pkg date", "import date", "imported on", "date of import"
    ],
    "hi": [
        "उत्पादन तिथि", "उत्पादन दिनांक", "निर्माण तिथि", "निर्माण दिनांक", "पैकिंग तिथि",
        "पैकिंग दिनांक", "तैयार तिथि", "उत्पादन", "पैकिंग", "आयात तिथि"
    ],
    "mr": [
        "उत्पादन दिनांक", "पॅकिंग दिनांक", "निर्माण दिनांक", "तयार दिनांक"
    ],
    "ta": [
        "தயாரிப்பு தேதி", "பேக்கிங் தேதி", "தயாரித்த தேதி"
    ],
    "te": [
        "తయారీ తేదీ", "ప్యాకింగ్ తేదీ", "ఉత్పత్తి తేదీ"
    ],
    "kn": [
        "ಉತ್ಪಾದನಾ ದಿನಾಂಕ", "ಪ್ಯಾಕಿಂಗ್ ದಿನಾಂಕ"
    ],
    "ml": [
        "ഉത്പാദന തീയതി", "പാക്കിംഗ് തീയതി"
    ],
    "bn": [
        "উত্পাদন তারিখ", "প্যাকিং তারিখ", "তৈরির তারিখ"
    ],
    "gu": [
        "ઉત્પાદન તારીખ", "પેકિંગ તારીખ", "બનાવટ તારીખ"
    ],
    "pa": [
        "ਤਿਆਰੀ ਮਿਤੀ", "ਪੈਕਿੰਗ ਮਿਤੀ", "ਬਣਨ ਦੀ ਮਿਤੀ"
    ],
    "or": [
        "ଉତ୍ପାଦନ ତାରିଖ", "ପ୍ୟାକିଂ ତାରିଖ"
    ],
    "ur": [
        "تاریخ تیاری", "پیکنگ تاریخ", "بنانے کی تاریخ"
    ]
}

# Field: Best Before & Expiry Timeline
MULTILINGUAL_BEST_BEFORE_KEYWORDS: Dict[str, List[str]] = {
    "en": [
        "best before", "best before date", "best bef", "expiry date", "exp date",
        "exp. date", "exp", "exp.", "use by", "use before", "consume within",
        "expiry", "valid upto", "valid till"
    ],
    "hi": [
        "सर्वोत्तम उपयोग से पूर्व", "उपयोग से पहले", "सर्वोत्तम उपयोग", "अवसान तिथि",
        "समाप्ति तिथि", "उपयोग अवधि", "खपत से पूर्व", "अंतिम तिथि"
    ],
    "mr": [
        "वापरासाठी सर्वोत्तम कालावधी", "समाप्ती दिनांक", "वापराची अंतिम मुदत"
    ],
    "ta": [
        "சிறந்த பயன்பாட்டு காலம்", "காலாவதி தேதி", "பயன்படுத்த வேண்டிய கடைசி தேதி"
    ],
    "te": [
        "ఉత్తమ వినియోగ గడువు", "గడువు తేదీ", "ఉపయోగించవలసిన చివరి తేదీ"
    ],
    "kn": [
        "ಉತ್ತಮ ಬಳಕೆ ಅವಧಿ", "ಮುಕ್ತಾಯ ದಿನಾಂಕ"
    ],
    "ml": [
        "ഉപയോഗ കാലാവധി", "കാലാവധി തീയതി"
    ],
    "bn": [
        "ব্যবহারের মেয়াদ", "মেয়াদ উত্তীর্ণের তারিখ", "শেষ তারিখ"
    ],
    "gu": [
        "શ્રેષ્ઠ ઉપયોગ પહેલાં", "સમાપ્તિ તારીખ", "છેલ્લી તારીખ"
    ],
    "pa": [
        "ਵਰਤੋਂ ਤੋਂ ਪਹਿਲਾਂ", "ਮਿਆਦ ਪੁੱਗਣ ਦੀ ਮਿਤੀ", "ਆਖਰੀ ਮਿਤੀ"
    ],
    "or": [
        "ବ୍ୟବହାରର ଶେଷ ତାରିଖ", "ସମାପ୍ତି ତାରିଖ"
    ],
    "ur": [
        "استعمال کی آخری تاریخ", "میعاد ختم ہونے کی تاریخ", "آخری تاریخ"
    ]
}

# Field: Consumer Care & Redressal under Rule 6(1)(g)
MULTILINGUAL_CONSUMER_CARE_KEYWORDS: Dict[str, List[str]] = {
    "en": [
        "customer care", "consumer care", "customer service", "consumer feedback",
        "consumer redressal", "helpline", "toll free", "toll-free", "complaint",
        "complaints", "feedback", "queries", "query", "contact us", "reach us",
        "write to us", "grievance officer", "support", "care executive", "care cell",
        "care@", "help@", "support@", "contact@", "feedback@", "customercare@"
    ],
    "hi": [
        "उपभोक्ता सेवा", "ग्राहक सेवा", "उपभोक्ता शिकायत", "ग्राहक शिकायत", "हेल्पलाइन",
        "टोल फ्री", "शिकायत निवारण अधिकारी", "संपर्क करें", "सुझाव", "सहायता"
    ],
    "mr": [
        "ग्राहक सेवा", "ग्राहक तक्रार", "ग्राहक मदत", "हेल्पलाइन", "टोल फ्री", "संपर्क"
    ],
    "ta": [
        "வாடிக்கையாளர் சேவை", "உதவி எண்", "புகார் பிரிவு", "தொடர்புக்கு"
    ],
    "te": [
        "వినియోగదారుల సంరక్షణ", "వినియోగదారుల ఫిర్యాదులు", "హెల్ప్‌లైన్", "టోల్ ఫ్రీ", "సంప్రదించండి"
    ],
    "kn": [
        "ಗ್ರಾಹಕರ ಸೇವೆ", "ಸಹಾಯವಾಣಿ", "ದೂರು ವಿಭಾಗ", "ಸಂಪರ್ಕಿಸಿ"
    ],
    "ml": [
        "ഉപഭോക്തൃ സേവനം", "ഹെൽപ്പ്‌ലൈൻ", "പരാതി പരിഹാരം"
    ],
    "bn": [
        "গ্রাহক সেবা", "গ্রাহক সহায়তা", "অভিযোগ সেল", "হেল্পলাইন", "যোগাযোগ"
    ],
    "gu": [
        "ગ્રાહક સેવા", "સહાયતા", "ફરિયાદ નિવારણ", "હેલ્પલાઇન", "સંપર્ક"
    ],
    "pa": [
        "ਗ੍ਰਾਹਕ ਸੇਵਾ", "ਸਹਾਇਤਾ", "ਸ਼ਿਕਾਇਤ ਨਿਵਾਰਣ", "ਹੈਲਪਲਾਈਨ", "ਸੰਪਰਕ"
    ],
    "or": [
        "ଗ୍ରାହକ ସେବା", "ସହାୟତା", "ହେଲ୍ପଲାଇନ୍", "ଯୋଗାଯୋଗ"
    ],
    "ur": [
        "صارفین کی دیکھ بھال", "شکایات سیل", "ہیلپ لائن", "رابطہ کریں"
    ]
}

# Field: Country of Origin under Rule 6(10)
MULTILINGUAL_ORIGIN_KEYWORDS: Dict[str, List[str]] = {
    "en": [
        "country of origin", "made in india", "product of india", "origin: india",
        "manufactured in india", "packed in india", "origin india"
    ],
    "hi": [
        "मूल देश", "भारत में निर्मित", "उत्पत्ति देश", "भारत का उत्पाद", "भारत में बना", "भारत"
    ],
    "mr": [
        "मूळ देश", "भारतात निर्मित", "भारतात तयार", "भारत"
    ],
    "ta": [
        "தோற்ற நாடு", "இந்தியாவில் தயாரிக்கப்பட்டது", "இந்தியா"
    ],
    "te": [
        "మూల దేశం", "భారతదేశంలో తయారు చేయబడింది", "భారత్", "భారతదేశం"
    ],
    "kn": [
        "ಮೂಲ ದೇಶ", "ಭಾರತದಲ್ಲಿ ತಯಾರಿಸಲಾಗಿದೆ", "ಭಾರತ"
    ],
    "ml": [
        "ഉത്ഭവ രാജ്യം", "ഇന്ത്യയിൽ നിർമ്മിച്ചത്", "ഇന്ത്യ"
    ],
    "bn": [
        "উৎপত্তি দেশ", "ভারতে তৈরি", "ভারত"
    ],
    "gu": [
        "મૂળ દેશ", "ભારતમાં બનેલું", "ભારત"
    ],
    "pa": [
        "ਮੂਲ ਦੇਸ਼", "ਭਾਰਤ ਵਿੱਚ ਬਣਿਆ", "ਭਾਰਤ"
    ],
    "or": [
        "ମୂଳ ଦେଶ", "ଭାରତରେ ନିର୍ମିତ", "ଭାରତ"
    ],
    "ur": [
        "ملک پیدائش", "ہندوستان میں تیار کردہ", "بھارت"
    ]
}

# =============================================================================
# 3. METRIC & COMMODITY UNIT NORMALIZATION MAPPING
# =============================================================================

MULTILINGUAL_METRIC_UNIT_MAP: Dict[str, Dict[str, Any]] = {
    # Mass (Grams)
    "g": {"normalized_unit": "g", "unit_type": "mass", "multiplier": 1.0, "display_name": "Gram"},
    "gm": {"normalized_unit": "g", "unit_type": "mass", "multiplier": 1.0, "display_name": "Gram"},
    "gms": {"normalized_unit": "g", "unit_type": "mass", "multiplier": 1.0, "display_name": "Gram"},
    "gram": {"normalized_unit": "g", "unit_type": "mass", "multiplier": 1.0, "display_name": "Gram"},
    "grams": {"normalized_unit": "g", "unit_type": "mass", "multiplier": 1.0, "display_name": "Gram"},
    "g.": {"normalized_unit": "g", "unit_type": "mass", "multiplier": 1.0, "display_name": "Gram"},
    "gm.": {"normalized_unit": "g", "unit_type": "mass", "multiplier": 1.0, "display_name": "Gram"},
    "ग्राम": {"normalized_unit": "g", "unit_type": "mass", "multiplier": 1.0, "display_name": "ग्राम (g)"},
    "ग्रॅम": {"normalized_unit": "g", "unit_type": "mass", "multiplier": 1.0, "display_name": "ग्रॅम (g)"},
    "ഗ്രാം": {"normalized_unit": "g", "unit_type": "mass", "multiplier": 1.0, "display_name": "ഗ്രാം (g)"},
    "கிராம்": {"normalized_unit": "g", "unit_type": "mass", "multiplier": 1.0, "display_name": "கிராம் (g)"},
    "గ్రాములు": {"normalized_unit": "g", "unit_type": "mass", "multiplier": 1.0, "display_name": "గ్రాములు (g)"},
    "గ్రా": {"normalized_unit": "g", "unit_type": "mass", "multiplier": 1.0, "display_name": "గ్రా (g)"},
    "গ্রাম": {"normalized_unit": "g", "unit_type": "mass", "multiplier": 1.0, "display_name": "গ্রাম (g)"},
    "ਗ੍ਰਾਮ": {"normalized_unit": "g", "unit_type": "mass", "multiplier": 1.0, "display_name": "ਗ੍ਰਾਮ (g)"},
    "ગ્રામ": {"normalized_unit": "g", "unit_type": "mass", "multiplier": 1.0, "display_name": "ગ્રામ (g)"},
    "ಗ್ರಾಂ": {"normalized_unit": "g", "unit_type": "mass", "multiplier": 1.0, "display_name": "ಗ್ರಾಂ (g)"},
    "ଗ୍ରାମ": {"normalized_unit": "g", "unit_type": "mass", "multiplier": 1.0, "display_name": "ଗ୍ରାମ (g)"},
    "گرام": {"normalized_unit": "g", "unit_type": "mass", "multiplier": 1.0, "display_name": "گرام (g)"},

    # Mass (Kilograms)
    "kg": {"normalized_unit": "kg", "unit_type": "mass", "multiplier": 1000.0, "display_name": "Kilogram"},
    "kgs": {"normalized_unit": "kg", "unit_type": "mass", "multiplier": 1000.0, "display_name": "Kilogram"},
    "kilogram": {"normalized_unit": "kg", "unit_type": "mass", "multiplier": 1000.0, "display_name": "Kilogram"},
    "kilograms": {"normalized_unit": "kg", "unit_type": "mass", "multiplier": 1000.0, "display_name": "Kilogram"},
    "kg.": {"normalized_unit": "kg", "unit_type": "mass", "multiplier": 1000.0, "display_name": "Kilogram"},
    "किग्रा": {"normalized_unit": "kg", "unit_type": "mass", "multiplier": 1000.0, "display_name": "किग्रा (kg)"},
    "किलोग्राम": {"normalized_unit": "kg", "unit_type": "mass", "multiplier": 1000.0, "display_name": "किलोग्राम (kg)"},
    "कि.ग्रा.": {"normalized_unit": "kg", "unit_type": "mass", "multiplier": 1000.0, "display_name": "कि.ग्रा. (kg)"},
    "कि.ग्रॅ.": {"normalized_unit": "kg", "unit_type": "mass", "multiplier": 1000.0, "display_name": "कि.ग्रॅ. (kg)"},
    "കിലോഗ്രാം": {"normalized_unit": "kg", "unit_type": "mass", "multiplier": 1000.0, "display_name": "കിലോഗ്രാം (kg)"},
    "கிலோகிராம்": {"normalized_unit": "kg", "unit_type": "mass", "multiplier": 1000.0, "display_name": "கிலோகிராம் (kg)"},
    "கிலோ": {"normalized_unit": "kg", "unit_type": "mass", "multiplier": 1000.0, "display_name": "கிலோ (kg)"},
    "కిలోగ్రాములు": {"normalized_unit": "kg", "unit_type": "mass", "multiplier": 1000.0, "display_name": "కిలోగ్రాములు (kg)"},
    "కేజీ": {"normalized_unit": "kg", "unit_type": "mass", "multiplier": 1000.0, "display_name": "కేజీ (kg)"},
    "కిలో": {"normalized_unit": "kg", "unit_type": "mass", "multiplier": 1000.0, "display_name": "కిలో (kg)"},
    "কেজি": {"normalized_unit": "kg", "unit_type": "mass", "multiplier": 1000.0, "display_name": "কেজি (kg)"},
    "ਕਿਲੋਗ੍ਰਾਮ": {"normalized_unit": "kg", "unit_type": "mass", "multiplier": 1000.0, "display_name": "ਕਿਲੋਗ੍ਰਾਮ (kg)"},
    "ਕਿਲੋ": {"normalized_unit": "kg", "unit_type": "mass", "multiplier": 1000.0, "display_name": "ਕਿਲੋ (kg)"},
    "કિલોગ્રામ": {"normalized_unit": "kg", "unit_type": "mass", "multiplier": 1000.0, "display_name": "કિલોગ્રામ (kg)"},
    "કિલો": {"normalized_unit": "kg", "unit_type": "mass", "multiplier": 1000.0, "display_name": "કિલો (kg)"},
    "ಕೆಜಿ": {"normalized_unit": "kg", "unit_type": "mass", "multiplier": 1000.0, "display_name": "ಕೆಜಿ (kg)"},
    "କିଲୋଗ୍ରାମ": {"normalized_unit": "kg", "unit_type": "mass", "multiplier": 1000.0, "display_name": "କିଲୋଗ୍ରାମ (kg)"},
    "କିଲୋ": {"normalized_unit": "kg", "unit_type": "mass", "multiplier": 1000.0, "display_name": "କିଲୋ (kg)"},
    "کلوگرام": {"normalized_unit": "kg", "unit_type": "mass", "multiplier": 1000.0, "display_name": "کلوگرام (kg)"},
    "کلو": {"normalized_unit": "kg", "unit_type": "mass", "multiplier": 1000.0, "display_name": "کلو (kg)"},

    # Mass (Milligrams)
    "mg": {"normalized_unit": "mg", "unit_type": "mass", "multiplier": 0.001, "display_name": "Milligram"},
    "milligram": {"normalized_unit": "mg", "unit_type": "mass", "multiplier": 0.001, "display_name": "Milligram"},
    "milligrams": {"normalized_unit": "mg", "unit_type": "mass", "multiplier": 0.001, "display_name": "Milligram"},
    "मिलीग्राम": {"normalized_unit": "mg", "unit_type": "mass", "multiplier": 0.001, "display_name": "मिलीग्राम (mg)"},
    "मिग्रा": {"normalized_unit": "mg", "unit_type": "mass", "multiplier": 0.001, "display_name": "मिग्रा (mg)"},

    # Volume (Millilitres)
    "ml": {"normalized_unit": "ml", "unit_type": "volume", "multiplier": 1.0, "display_name": "Millilitre"},
    "mls": {"normalized_unit": "ml", "unit_type": "volume", "multiplier": 1.0, "display_name": "Millilitre"},
    "millilitre": {"normalized_unit": "ml", "unit_type": "volume", "multiplier": 1.0, "display_name": "Millilitre"},
    "millilitres": {"normalized_unit": "ml", "unit_type": "volume", "multiplier": 1.0, "display_name": "Millilitre"},
    "milliliter": {"normalized_unit": "ml", "unit_type": "volume", "multiplier": 1.0, "display_name": "Millilitre"},
    "milliliters": {"normalized_unit": "ml", "unit_type": "volume", "multiplier": 1.0, "display_name": "Millilitre"},
    "ml.": {"normalized_unit": "ml", "unit_type": "volume", "multiplier": 1.0, "display_name": "Millilitre"},
    "मिलीलीटर": {"normalized_unit": "ml", "unit_type": "volume", "multiplier": 1.0, "display_name": "मिलीलीटर (ml)"},
    "मिली": {"normalized_unit": "ml", "unit_type": "volume", "multiplier": 1.0, "display_name": "मिली (ml)"},
    "मि.ली.": {"normalized_unit": "ml", "unit_type": "volume", "multiplier": 1.0, "display_name": "मि.ली. (ml)"},
    "മില്ലിലിറ്റർ": {"normalized_unit": "ml", "unit_type": "volume", "multiplier": 1.0, "display_name": "മില്ലിലിറ്റർ (ml)"},
    "മില്ലി": {"normalized_unit": "ml", "unit_type": "volume", "multiplier": 1.0, "display_name": "മില്ലി (ml)"},
    "மில்லிலிட்டர்": {"normalized_unit": "ml", "unit_type": "volume", "multiplier": 1.0, "display_name": "மில்லிலிட்டர் (ml)"},
    "மில்லி": {"normalized_unit": "ml", "unit_type": "volume", "multiplier": 1.0, "display_name": "மில்லி (ml)"},
    "మిల్లీలీటర్లు": {"normalized_unit": "ml", "unit_type": "volume", "multiplier": 1.0, "display_name": "మిల్లీలీటర్లు (ml)"},
    "మి.లీ": {"normalized_unit": "ml", "unit_type": "volume", "multiplier": 1.0, "display_name": "మి.లీ (ml)"},
    "మిలీ": {"normalized_unit": "ml", "unit_type": "volume", "multiplier": 1.0, "display_name": "మిలీ (ml)"},
    "মিলিমিটার": {"normalized_unit": "ml", "unit_type": "volume", "multiplier": 1.0, "display_name": "মিলি (ml)"},
    "মিলি": {"normalized_unit": "ml", "unit_type": "volume", "multiplier": 1.0, "display_name": "মিলি (ml)"},
    "ਮਿਲੀਲਿਟਰ": {"normalized_unit": "ml", "unit_type": "volume", "multiplier": 1.0, "display_name": "ਮਿਲੀਲਿਟਰ (ml)"},
    "ਮਿਲੀ": {"normalized_unit": "ml", "unit_type": "volume", "multiplier": 1.0, "display_name": "ਮਿਲੀ (ml)"},
    "મિલિલિટર": {"normalized_unit": "ml", "unit_type": "volume", "multiplier": 1.0, "display_name": "મિલિલિટર (ml)"},
    "મિલી": {"normalized_unit": "ml", "unit_type": "volume", "multiplier": 1.0, "display_name": "મિલી (ml)"},
    "ಮಿಲಿಲೀಟರ್": {"normalized_unit": "ml", "unit_type": "volume", "multiplier": 1.0, "display_name": "ಮಿಲಿಲೀಟರ್ (ml)"},
    "ಮಿಲಿ": {"normalized_unit": "ml", "unit_type": "volume", "multiplier": 1.0, "display_name": "ಮಿಲಿ (ml)"},
    "ମିଲିଲିଟର": {"normalized_unit": "ml", "unit_type": "volume", "multiplier": 1.0, "display_name": "ମିଲିଲିଟର (ml)"},
    "ମିଲି": {"normalized_unit": "ml", "unit_type": "volume", "multiplier": 1.0, "display_name": "ମିଲି (ml)"},
    "ملی لیٹر": {"normalized_unit": "ml", "unit_type": "volume", "multiplier": 1.0, "display_name": "ملی لیٹر (ml)"},
    "ملی": {"normalized_unit": "ml", "unit_type": "volume", "multiplier": 1.0, "display_name": "ملی (ml)"},

    # Volume (Litres)
    "l": {"normalized_unit": "L", "unit_type": "volume", "multiplier": 1000.0, "display_name": "Litre"},
    "ltr": {"normalized_unit": "L", "unit_type": "volume", "multiplier": 1000.0, "display_name": "Litre"},
    "ltrs": {"normalized_unit": "L", "unit_type": "volume", "multiplier": 1000.0, "display_name": "Litre"},
    "litre": {"normalized_unit": "L", "unit_type": "volume", "multiplier": 1000.0, "display_name": "Litre"},
    "litres": {"normalized_unit": "L", "unit_type": "volume", "multiplier": 1000.0, "display_name": "Litre"},
    "liter": {"normalized_unit": "L", "unit_type": "volume", "multiplier": 1000.0, "display_name": "Litre"},
    "liters": {"normalized_unit": "L", "unit_type": "volume", "multiplier": 1000.0, "display_name": "Litre"},
    "l.": {"normalized_unit": "L", "unit_type": "volume", "multiplier": 1000.0, "display_name": "Litre"},
    "लीटर": {"normalized_unit": "L", "unit_type": "volume", "multiplier": 1000.0, "display_name": "लीटर (L)"},
    "ली.": {"normalized_unit": "L", "unit_type": "volume", "multiplier": 1000.0, "display_name": "ली. (L)"},
    "लिटर": {"normalized_unit": "L", "unit_type": "volume", "multiplier": 1000.0, "display_name": "लिटर (L)"},
    "ലിറ്റർ": {"normalized_unit": "L", "unit_type": "volume", "multiplier": 1000.0, "display_name": "ലിറ്റർ (L)"},
    "லிட்டர்": {"normalized_unit": "L", "unit_type": "volume", "multiplier": 1000.0, "display_name": "லிட்டர் (L)"},
    "లీటర్లు": {"normalized_unit": "L", "unit_type": "volume", "multiplier": 1000.0, "display_name": "లీటర్లు (L)"},
    "లీటర్": {"normalized_unit": "L", "unit_type": "volume", "multiplier": 1000.0, "display_name": "లీటర్ (L)"},
    "লিটার": {"normalized_unit": "L", "unit_type": "volume", "multiplier": 1000.0, "display_name": "লিটার (L)"},
    "ਲਿਟਰ": {"normalized_unit": "L", "unit_type": "volume", "multiplier": 1000.0, "display_name": "ਲਿਟਰ (L)"},
    "લિટર": {"normalized_unit": "L", "unit_type": "volume", "multiplier": 1000.0, "display_name": "લિટર (L)"},
    "ಲೀಟರ್": {"normalized_unit": "L", "unit_type": "volume", "multiplier": 1000.0, "display_name": "ಲೀಟರ್ (L)"},
    "ଲିଟର": {"normalized_unit": "L", "unit_type": "volume", "multiplier": 1000.0, "display_name": "ଲିଟର (L)"},
    "لیٹر": {"normalized_unit": "L", "unit_type": "volume", "multiplier": 1000.0, "display_name": "لیٹر (L)"},

    # Numbers / Count / Units
    "n": {"normalized_unit": "N", "unit_type": "count", "multiplier": 1.0, "display_name": "Number (N)"},
    "nn": {"normalized_unit": "N", "unit_type": "count", "multiplier": 1.0, "display_name": "Number (N)"},
    "u": {"normalized_unit": "Units", "unit_type": "count", "multiplier": 1.0, "display_name": "Units"},
    "unit": {"normalized_unit": "Units", "unit_type": "count", "multiplier": 1.0, "display_name": "Units"},
    "units": {"normalized_unit": "Units", "unit_type": "count", "multiplier": 1.0, "display_name": "Units"},
    "piece": {"normalized_unit": "Pieces", "unit_type": "count", "multiplier": 1.0, "display_name": "Pieces"},
    "pieces": {"normalized_unit": "Pieces", "unit_type": "count", "multiplier": 1.0, "display_name": "Pieces"},
    "pcs": {"normalized_unit": "Pieces", "unit_type": "count", "multiplier": 1.0, "display_name": "Pieces"},
    "pc": {"normalized_unit": "Pieces", "unit_type": "count", "multiplier": 1.0, "display_name": "Pieces"},
    "count": {"normalized_unit": "Count", "unit_type": "count", "multiplier": 1.0, "display_name": "Count"},
    "ct": {"normalized_unit": "Count", "unit_type": "count", "multiplier": 1.0, "display_name": "Count"},
    "nos": {"normalized_unit": "Number (Nos)", "unit_type": "count", "multiplier": 1.0, "display_name": "Numbers"},
    "no.": {"normalized_unit": "Number (Nos)", "unit_type": "count", "multiplier": 1.0, "display_name": "Number"},
    "set": {"normalized_unit": "Set", "unit_type": "count", "multiplier": 1.0, "display_name": "Set"},
    "sets": {"normalized_unit": "Set", "unit_type": "count", "multiplier": 1.0, "display_name": "Sets"},
    "pair": {"normalized_unit": "Pair", "unit_type": "count", "multiplier": 1.0, "display_name": "Pair"},
    "pairs": {"normalized_unit": "Pair", "unit_type": "count", "multiplier": 1.0, "display_name": "Pairs"},

    # Stationery & Commodity Specific
    "pens": {"normalized_unit": "Pens", "unit_type": "count", "multiplier": 1.0, "display_name": "Pens"},
    "pen": {"normalized_unit": "Pen", "unit_type": "count", "multiplier": 1.0, "display_name": "Pen"},
    "pencils": {"normalized_unit": "Pencils", "unit_type": "count", "multiplier": 1.0, "display_name": "Pencils"},
    "pencil": {"normalized_unit": "Pencil", "unit_type": "count", "multiplier": 1.0, "display_name": "Pencil"},
    "refills": {"normalized_unit": "Refills", "unit_type": "count", "multiplier": 1.0, "display_name": "Refills"},
    "refill": {"normalized_unit": "Refill", "unit_type": "count", "multiplier": 1.0, "display_name": "Refill"},
    "pages": {"normalized_unit": "Pages", "unit_type": "count", "multiplier": 1.0, "display_name": "Pages"},
    "page": {"normalized_unit": "Pages", "unit_type": "count", "multiplier": 1.0, "display_name": "Pages"},
    "sheets": {"normalized_unit": "Sheets", "unit_type": "count", "multiplier": 1.0, "display_name": "Sheets"},
    "sheet": {"normalized_unit": "Sheets", "unit_type": "count", "multiplier": 1.0, "display_name": "Sheet"},
    "leaves": {"normalized_unit": "Leaves", "unit_type": "count", "multiplier": 1.0, "display_name": "Leaves"},
    "leaf": {"normalized_unit": "Leaves", "unit_type": "count", "multiplier": 1.0, "display_name": "Leaf"},
    "tablets": {"normalized_unit": "Tablets", "unit_type": "count", "multiplier": 1.0, "display_name": "Tablets"},
    "capsules": {"normalized_unit": "Capsules", "unit_type": "count", "multiplier": 1.0, "display_name": "Capsules"},

    # Regional Numbers / Counts
    "नग": {"normalized_unit": "N", "unit_type": "count", "multiplier": 1.0, "display_name": "नग (N)"},
    "संख्या": {"normalized_unit": "N", "unit_type": "count", "multiplier": 1.0, "display_name": "संख्या (N)"},
    "సంఖ్య": {"normalized_unit": "N", "unit_type": "count", "multiplier": 1.0, "display_name": "సంఖ్య (N)"},
    "నెం": {"normalized_unit": "N", "unit_type": "count", "multiplier": 1.0, "display_name": "నెం (N)"},
    "সংখ্যা": {"normalized_unit": "N", "unit_type": "count", "multiplier": 1.0, "display_name": "সংখ্যা (N)"},
    "ਨੰਬਰ": {"normalized_unit": "N", "unit_type": "count", "multiplier": 1.0, "display_name": "ਨੰਬਰ (N)"},
    "નંગ": {"normalized_unit": "N", "unit_type": "count", "multiplier": 1.0, "display_name": "નંગ (N)"},
    "ಸಂಖ್ಯೆ": {"normalized_unit": "N", "unit_type": "count", "multiplier": 1.0, "display_name": "ಸಂಖ್ಯೆ (N)"},
    "തവണ": {"normalized_unit": "N", "unit_type": "count", "multiplier": 1.0, "display_name": "എണ്ണം (N)"},
    "تعداد": {"normalized_unit": "N", "unit_type": "count", "multiplier": 1.0, "display_name": "تعداد (N)"},

    # Length & Area
    "cm": {"normalized_unit": "cm", "unit_type": "length", "multiplier": 1.0, "display_name": "Centimetre"},
    "mm": {"normalized_unit": "mm", "unit_type": "length", "multiplier": 0.1, "display_name": "Millimetre"},
    "m": {"normalized_unit": "m", "unit_type": "length", "multiplier": 100.0, "display_name": "Metre"},
    "meter": {"normalized_unit": "m", "unit_type": "length", "multiplier": 100.0, "display_name": "Metre"},
    "metre": {"normalized_unit": "m", "unit_type": "length", "multiplier": 100.0, "display_name": "Metre"},
    "centimeter": {"normalized_unit": "cm", "unit_type": "length", "multiplier": 1.0, "display_name": "Centimetre"},
    "centimetre": {"normalized_unit": "cm", "unit_type": "length", "multiplier": 1.0, "display_name": "Centimetre"},
    "millimeter": {"normalized_unit": "mm", "unit_type": "length", "multiplier": 0.1, "display_name": "Millimetre"},
    "millimetre": {"normalized_unit": "mm", "unit_type": "length", "multiplier": 0.1, "display_name": "Millimetre"},
    "मीटर": {"normalized_unit": "m", "unit_type": "length", "multiplier": 100.0, "display_name": "मीटर (m)"},
    "सेमी": {"normalized_unit": "cm", "unit_type": "length", "multiplier": 1.0, "display_name": "सेमी (cm)"},
    "मी": {"normalized_unit": "m", "unit_type": "length", "multiplier": 100.0, "display_name": "मी (m)"},
    "sq.cm": {"normalized_unit": "sq.cm", "unit_type": "area", "multiplier": 1.0, "display_name": "Square Centimetre"},
    "sq.m": {"normalized_unit": "sq.m", "unit_type": "area", "multiplier": 10000.0, "display_name": "Square Metre"},
    "sqm": {"normalized_unit": "sq.m", "unit_type": "area", "multiplier": 10000.0, "display_name": "Square Metre"}
}

def get_all_tax_inclusive_patterns() -> List[str]:
    """Flattens all statutory tax inclusive phrases across all languages."""
    all_phrases = []
    for lang_code, phrases in MULTILINGUAL_TAX_INCLUSIVE_PHRASES.items():
        all_phrases.extend(phrases)
    return all_phrases

def get_all_mrp_keywords() -> List[str]:
    """Flattens all MRP keywords across all languages."""
    all_kws = []
    for lang_code, kws in MULTILINGUAL_MRP_KEYWORDS.items():
        all_kws.extend(kws)
    return all_kws

def get_all_net_quantity_keywords() -> List[str]:
    """Flattens all Net Quantity keywords across all languages."""
    all_kws = []
    for lang_code, kws in MULTILINGUAL_NET_QUANTITY_KEYWORDS.items():
        all_kws.extend(kws)
    return all_kws
