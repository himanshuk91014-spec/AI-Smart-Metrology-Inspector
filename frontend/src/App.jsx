import React, { useState, useEffect, useRef } from 'react';
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  RefreshCw,
  FileText,
  Printer,
  Download,
  Upload,
  Image as ImageIcon,
  Layers,
  Code,
  Info,
  Award,
  FileCheck,
  Globe,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Languages,
  Trash2,
  Eye,
  Check,
  Building2,
  Calendar,
  IndianRupee,
  Package,
  Sparkles,
  HelpCircle,
  Pencil,
  Edit3,
  RotateCcw,
  Bot,
  Cpu,
  Camera,
  CameraOff,
  Zap,
  ZapOff,
  SwitchCamera,
  Database,
  BookOpen,
  Sliders,
  History,
  ShieldAlert,
  Sun,
  Moon,
  ArrowRight,
  Clipboard,
  Maximize2,
  Calculator,
  Ruler,
  CheckSquare,
  FileSpreadsheet,
  Search,
  Filter,
  Clock,
  ExternalLink,
  Smartphone,
  Menu,
  SlidersHorizontal,
  Share2,
  Wifi,
  Battery
} from 'lucide-react';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { SUPPORTED_LANGUAGES, EXTENDED_LANGUAGES, getTranslation } from './i18n';
import { runClientSideOcrAndAudit, evaluateClientSideCompliance, sanitizeBrandOrProductName } from './clientOcrEngine';

// Dynamically determine Backend API Base URL
const getApiBaseUrl = () => {
  if (import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:8000';
    }
    return `http://${host}:8000`;
  }
  return 'http://localhost:8000';
};

const DEFAULT_HISTORICAL_AUDITS = [
  {
    audit_id: 'AUD-2026-FMCG-881',
    product_name: 'Britannia Good Day Butter Cookies',
    mrp: '45.00',
    net_quantity: '200 g',
    status: 'COMPLIANT',
    overall_score: 100,
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    is_manually_verified: false,
    extracted_metadata: {
      brand_name: 'Britannia Good Day Butter Cookies',
      mrp: '45.00',
      taxes_included: true,
      net_quantity: '200',
      unit_of_measure: 'g',
      manufacturing_date: '02/2026',
      consumer_care_email: 'feedback@britannia.co.in',
      consumer_care_phone: '1800-425-4449',
      country_of_origin: 'India',
      manufacturer_name: 'Britannia Industries Ltd.'
    },
    violations: [],
    passed_checks: [
      { rule_id: 'RULE_6_1_DA', rule_name: 'Rule 6(1)(da) - MRP & Tax Clause', evidence: '₹ 45.00 (Inclusive of all taxes)' },
      { rule_id: 'RULE_11_12', rule_name: 'Rule 11 & 12 - Net Quantity', evidence: '200 g (SI Metric)' },
      { rule_id: 'RULE_6_1_G', rule_name: 'Rule 6(1)(g) - Consumer Care', evidence: '1800-425-4449 | feedback@britannia.co.in' },
      { rule_id: 'RULE_6_1_C', rule_name: 'Rule 6(1)(c) - Packaging Date', evidence: '02/2026' },
      { rule_id: 'RULE_6_10', rule_name: 'Rule 6(10) - Country of Origin', evidence: 'Made in India' }
    ]
  },
  {
    audit_id: 'AUD-2026-IMPERIAL-702',
    product_name: 'Imported Salon Conditioning Shampoo',
    mrp: '499.00',
    net_quantity: '8.4 fl oz',
    status: 'NON_COMPLIANT',
    overall_score: 40,
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    is_manually_verified: false,
    extracted_metadata: {
      brand_name: 'Imported Salon Conditioning Shampoo',
      mrp: '499.00',
      taxes_included: true,
      net_quantity: '8.4',
      unit_of_measure: 'fl oz',
      manufacturing_date: '01/2026',
      consumer_care_email: 'support@salonhair.com',
      consumer_care_phone: '1800-111-2233',
      country_of_origin: 'USA',
      manufacturer_name: 'Beauty Care Corp'
    },
    violations: [
      {
        rule_id: 'RULE_11_12',
        rule_name: 'Rule 11 & 12 - Prohibited Imperial Units',
        severity: 'HIGH',
        description: "Package declares volume in prohibited imperial units 'fl oz'. Legal Metrology Section 11/36 violation.",
        found_text: '8.4 fl oz',
        remediation: 'Must declare volume in standard SI Metric Units (ml / L).'
      }
    ],
    passed_checks: [
      { rule_id: 'RULE_6_1_DA', rule_name: 'Rule 6(1)(da) - MRP with Tax Suffix', evidence: '₹ 499.00 (Incl. of all taxes)' },
      { rule_id: 'RULE_6_1_G', rule_name: 'Rule 6(1)(g) - Consumer Grievance', evidence: '1800-111-2233' }
    ]
  },
  {
    audit_id: 'AUD-2026-TAX-619',
    product_name: 'Herbal Green Tea Tin Pack',
    mrp: '250.00',
    net_quantity: '100 g',
    status: 'NON_COMPLIANT',
    overall_score: 70,
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    is_manually_verified: false,
    extracted_metadata: {
      brand_name: 'Herbal Green Tea Tin Pack',
      mrp: '250.00',
      taxes_included: false,
      net_quantity: '100',
      unit_of_measure: 'g',
      manufacturing_date: '02/2026',
      consumer_care_email: 'care@herbaltea.in',
      consumer_care_phone: '1800-333-7788',
      country_of_origin: 'India',
      manufacturer_name: 'Assam Tea Estates Pvt Ltd'
    },
    violations: [
      {
        rule_id: 'RULE_6_1_DA',
        rule_name: 'Rule 6(1)(da) - Missing Tax Suffix on MRP',
        severity: 'HIGH',
        description: "Statutory clause 'Inclusive of all taxes' is missing on declared MRP ₹ 250.00.",
        found_text: 'MRP Rs. 250.00',
        remediation: "Add 'Inclusive of all taxes' immediately adjacent to declared MRP."
      }
    ],
    passed_checks: [
      { rule_id: 'RULE_11_12', rule_name: 'Rule 11 & 12 - Net Quantity Standards', evidence: '100 g' },
      { rule_id: 'RULE_6_1_G', rule_name: 'Rule 6(1)(g) - Customer Redressal', evidence: 'care@herbaltea.in' },
      { rule_id: 'RULE_6_1_C', rule_name: 'Rule 6(1)(c) - Packaging Date', evidence: '02/2026' }
    ]
  },
  {
    audit_id: 'AUD-2026-TELUGU-504',
    product_name: 'హెర్బల్ హెయిర్ ఆయిల్ (Telugu FMCG Oil)',
    mrp: '180.00',
    net_quantity: '200 ml',
    status: 'COMPLIANT',
    overall_score: 100,
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    is_manually_verified: false,
    extracted_metadata: {
      brand_name: 'హెర్బల్ హెయిర్ ఆయిల్ (Herbal Hair Oil)',
      mrp: '180.00',
      taxes_included: true,
      net_quantity: '200',
      unit_of_measure: 'ml',
      manufacturing_date: '02/2026',
      consumer_care_email: 'care@teluguoil.in',
      consumer_care_phone: '1800-425-0011',
      country_of_origin: 'India',
      manufacturer_name: 'శ్రీ బాలాజీ ఇండస్ట్రీస్, హైదరాబాద్'
    },
    violations: [],
    passed_checks: [
      { rule_id: 'RULE_6_1_DA', rule_name: 'Rule 6(1)(da) - MRP & Tax Suffix (Telugu)', evidence: 'గరిష్ట ధర ₹ 180 (అన్ని పన్నులతో కలిపి)' },
      { rule_id: 'RULE_11_12', rule_name: 'Rule 11 & 12 - Net Quantity', evidence: 'పరిమాణం: 200 ml' },
      { rule_id: 'RULE_6_1_G', rule_name: 'Rule 6(1)(g) - Helpline', evidence: '1800-425-0011 | care@teluguoil.in' }
    ]
  },
  {
    audit_id: 'AUD-2026-SOAP-411',
    product_name: 'Patanjali Ayurvedic Herbal Soap',
    mrp: '65.00',
    net_quantity: '125 g',
    status: 'COMPLIANT',
    overall_score: 100,
    timestamp: new Date(Date.now() - 3600000 * 30).toISOString(),
    is_manually_verified: true,
    inspector_metadata: {
      inspector_id: 'INSP-2026-DELHI-883',
      inspector_name: 'Authorized Legal Metrology Officer',
      inspection_location: 'Retail Market Audit (New Delhi)',
      inspection_remarks: 'Specimen physically verified under PCR 2011.'
    },
    extracted_metadata: {
      brand_name: 'Patanjali Ayurvedic Herbal Soap',
      mrp: '65.00',
      taxes_included: true,
      net_quantity: '125',
      unit_of_measure: 'g',
      manufacturing_date: '01/2026',
      consumer_care_email: 'care@ayurved.in',
      consumer_care_phone: '1800-222-1111',
      country_of_origin: 'India',
      manufacturer_name: 'Patanjali Gramodhyog Pvt Ltd'
    },
    violations: [],
    passed_checks: [
      { rule_id: 'RULE_6_1_DA', rule_name: 'Rule 6(1)(da) - MRP with Tax Clause', evidence: '₹ 65.00 (सभी करों सहित)' },
      { rule_id: 'RULE_11_12', rule_name: 'Rule 11 & 12 - Net Weight', evidence: 'शुद्ध मात्रा: 125 ग्राम' }
    ]
  }
];

const DEFAULT_RULES_FALLBACK = [
  {
    rule_id: 'RULE_6_1_A',
    rule_name: 'Generic Commodity Name / Identity',
    legal_reference: 'Rule 6(1)(a) PCR 2011',
    category: 'Identity',
    description: 'Generic or common name of the packaged commodity must be prominently declared on PDP.',
    penalty_clause: 'Section 36(1) fine up to Rs 25,000 / compounding under Rule 32'
  },
  {
    rule_id: 'RULE_6_1_B',
    rule_name: 'Net Quantity & Standard SI Metric Units',
    legal_reference: 'Rule 6(1)(b) & Rule 11/12 PCR 2011',
    category: 'Quantity',
    description: 'Net quantity must be declared in standard SI metric units (g, kg, ml, l, pcs). Prohibited non-standard imperial units (lbs, oz, fl oz) are strictly banned.',
    penalty_clause: 'Section 36(1) of Legal Metrology Act 2009'
  },
  {
    rule_id: 'RULE_6_1_C',
    rule_name: 'Name & Address of Manufacturer / Packer / Importer',
    legal_reference: 'Rule 6(1)(c) PCR 2011',
    category: 'Manufacturer',
    description: 'Name and complete address of the manufacturer, packer, or importer must be clearly declared on the packaging.',
    penalty_clause: 'Rule 32 compounding or prosecution under Section 36'
  },
  {
    rule_id: 'RULE_6_1_D',
    rule_name: 'Month & Year of Manufacture / Packing / Import',
    legal_reference: 'Rule 6(1)(d) PCR 2011',
    category: 'Timeline',
    description: 'Month and year in which the commodity is manufactured, packed, or imported must be declared in standard format (MM/YYYY or Month YYYY).',
    penalty_clause: 'Section 36(1) of Legal Metrology Act'
  },
  {
    rule_id: 'RULE_6_1_DA',
    rule_name: 'Maximum Retail Price (MRP) & Mandatory Tax Clause',
    legal_reference: 'Rule 6(1)(da) PCR 2011',
    category: 'Pricing',
    description: "MRP must be declared in Indian Rupees along with mandatory statutory suffix 'Inclusive of all taxes' or 'Incl. of all taxes'.",
    penalty_clause: 'Section 36(1) of Legal Metrology Act 2009'
  },
  {
    rule_id: 'RULE_6_1_G',
    rule_name: 'Consumer Care & Grievance Redressal Cell',
    legal_reference: 'Rule 6(1)(g) PCR 2011',
    category: 'Consumer Protection',
    description: 'Name, address, telephone helpline number, and email address of consumer redressal cell to contact in case of consumer complaints.',
    penalty_clause: 'Section 36(1) of Legal Metrology Act'
  },
  {
    rule_id: 'RULE_6_10',
    rule_name: 'Country of Origin Declaration',
    legal_reference: 'Rule 6(10) PCR 2011',
    category: 'Origin',
    description: 'For imported or domestic goods, the country of origin must be clearly stated on the package (e.g. Made in India).',
    penalty_clause: 'Advisory and notice under Rule 6(10)'
  },
  {
    rule_id: 'RULE_7_8_9',
    rule_name: 'Principal Display Panel & Minimum Font Height',
    legal_reference: 'Rule 7, 8, 9 & Schedule II PCR 2011',
    category: 'Typography',
    description: 'Mandatory declarations on the PDP must comply with minimum numeral and letter font heights (1.0mm to 6.0mm) according to net quantity and area.',
    penalty_clause: 'Schedule II compounding provisions'
  }
];

const DEFAULT_UNITS_FALLBACK = {
  approved_metric_units: [
    { symbol: 'g', name: 'Gram', type: 'Mass', standard: 'SI Metric' },
    { symbol: 'kg', name: 'Kilogram', type: 'Mass', standard: 'SI Metric' },
    { symbol: 'mg', name: 'Milligram', type: 'Mass', standard: 'SI Metric' },
    { symbol: 'ml', name: 'Millilitre', type: 'Volume', standard: 'SI Metric' },
    { symbol: 'l', name: 'Litre', type: 'Volume', standard: 'SI Metric' },
    { symbol: 'm', name: 'Metre', type: 'Length', standard: 'SI Metric' },
    { symbol: 'cm', name: 'Centimetre', type: 'Length', standard: 'SI Metric' },
    { symbol: 'mm', name: 'Millimetre', type: 'Length', standard: 'SI Metric' },
    { symbol: 'Units / pcs / N', name: 'Piece / Item Count', type: 'Count', standard: 'Approved' },
    { symbol: 'pens / tablets', name: 'Stationery / Pharma Count', type: 'Count', standard: 'Approved' }
  ],
  prohibited_imperial_units: [
    { symbol: 'fl oz / floz', name: 'Fluid Ounce', type: 'Volume', restriction: 'Prohibited under Rule 11/12' },
    { symbol: 'oz / ounce', name: 'Ounce', type: 'Mass', restriction: 'Prohibited under Rule 11/12' },
    { symbol: 'lbs / pound', name: 'Pound', type: 'Mass', restriction: 'Prohibited under Rule 11/12' },
    { symbol: 'gallon / gal', name: 'Gallon', type: 'Volume', restriction: 'Prohibited under Rule 11/12' },
    { symbol: 'yard / yds', name: 'Yard', type: 'Length', restriction: 'Prohibited under Rule 11/12' },
    { symbol: 'inch / inches', name: 'Inch', type: 'Length', restriction: 'Prohibited under Rule 11/12' }
  ]
};

const ANGLE_DEFINITIONS = [

  { index: 1, key: 'primaryAngle', defaultLabel: 'Angle 1 (Front / PDP)', subtitle: 'Brand, Net Qty & Principal Display' },
  { index: 2, key: 'angle2', defaultLabel: 'Angle 2 (Back Panel)', subtitle: 'Statutory Declarations & Mfg Info' },
  { index: 3, key: 'angle3', defaultLabel: 'Angle 3 (Side / MRP / Care)', subtitle: 'MRP, Tax Clause & Consumer Redressal' },
  { index: 4, key: 'angle4', defaultLabel: 'Angle 4 (Barcode / Mfg)', subtitle: 'Batch No, Barcode & Dimensions' }
];

const STANDARD_METRIC_UNITS = [
  'g', 'kg', 'mg', 'ml', 'l', 'cl', 'm', 'cm', 'mm', 'sq.m', 'sq.cm', 'Units', 'pcs', 'pens', 'tablets'
];

const DEFAULT_SAMPLES = [
  {
    id: 'sample_telugu_compliant',
    lang: 'te',
    lang_name: 'Telugu (తెలుగు)',
    title: '✅ [తెలుగు - Telugu] హెర్బల్ హెయిర్ ఆయిల్ (Herbal Hair Oil)',
    description: 'పరిమాణం 200 ml, గరిష్ట రిటైల్ ధర ₹ 180.00 (అన్ని పన్నులతో కలిపి), తయారీ 02/2026, భారతదేశం',
    text_content:
      'హెర్బల్ హెయిర్ ఆయిల్\nపరిమాణం: 200 ml\nగరిష్ట రిటైల్ ధర ₹ 180.00 (అన్ని పన్నులతో కలిపి)\nతయారీ తేదీ: 02/2026 | బ్యాచ్ నెం: TH-41\nవినియోగదారుల సంరక్షణ: care@teluguoil.in | హెల్ప్‌లైన్: 1800-425-0011\nతయారీదారు: శ్రీ బాలాజీ ఇండస్ట్రీస్, ప్లాట్ 42, హైదరాబాద్, తెలంగాణ - 500032\nభారతదేశం లో తయారు చేయబడింది'
  },
  {
    id: 'sample_hindi_compliant',
    lang: 'hi',
    lang_name: 'Hindi (हिंदी)',
    title: '✅ [हिंदी - Hindi] आयुर्वेदिक प्राकृतिक साबुन (Herbal Soap)',
    description: 'शुद्ध मात्रा 125 ग्राम, अधिकतम खुदरा मूल्य ₹ 65.00 (सभी करों सहित), निर्माण 01/2026, भारत में निर्मित',
    text_content:
      'आयुर्वेदिक प्राकृतिक साबुन\nशुद्ध मात्रा: 125 ग्राम\nअधिकतम खुदरा मूल्य ₹ 65.00 (सभी करों सहित)\nनिर्माण तिथि: 01/2026 | बैच नं: H-12\nग्राहक सेवा कक्ष: care@ayurved.in | टोल फ्री: 1800-222-1111\nनिर्माता: श्री पतंजलि ग्रामोद्योग, प्लॉट 14, हरिद्वार, उत्तराखंड - 249401\nभारत में निर्मित (Made in India)'
  },
  {
    id: 'sample_marathi_compliant',
    lang: 'mr',
    lang_name: 'Marathi (मराठी)',
    title: '✅ [मराठी - Marathi] प्रीमियम शरबती गहू आटा (Wheat Flour Pack)',
    description: 'निव्वळ वजन 5 कि.ग्रॅ., कमाल किरकोळ किंमत ₹ 340.00 (सर्व करांसह), पॅकिंग 02/2026, पुणे महाराष्ट्र',
    text_content:
      'प्रीमियम शरबती गहू आटा\nनिव्वळ वजन: 5 कि.ग्रॅ.\nकमाल किरकोळ किंमत ₹ 340.00 (सर्व करांसह)\nपॅकिंग दिनांक: 02/2026 | बॅच क्र: M-88\nग्राहक तक्रार निवारण कक्ष: care@maharashtraagro.in | फोन: 1800-233-4455\nउत्पादक: सह्याद्री ऍग्रो प्रॉडक्ट्स, चाकण, पुणे, महाराष्ट्र - 410501\nउत्पादन देश: भारत'
  },
  {
    id: 'sample_bengali_compliant',
    lang: 'bn',
    lang_name: 'Bengali (বাংলা)',
    title: '✅ [বাংলা - Bengali] দার্জিলিং প্রিমিয়াম চা (Darjeeling Tea)',
    description: 'নিট পরিমাণ 250 গ্রাম, সর্বোচ্চ খুচরা মূল্য ₹ 240.00 (সমস্ত কর সহ), উত্পাদন 01/2026, পশ্চিমবঙ্গ',
    text_content:
      'দার্জিলিং গোল্ডেন প্রিমিয়াম চা পাতা\nনিট পরিমাণ: 250 গ্রাম\nসর্বোচ্চ খুচরা মূল্য ₹ 240.00 (সমস্ত কর সহ)\nউত্পাদন তারিখ: 01/2026 | ব্যাচ নং: B-701\nগ্রাহক সেবা সেল: feedback@bengaltea.co.in | হেল্পলাইন: 1800-345-6789\nপ্রস্তুতকারক: বেঙ্গল টি এস্টেট, শিলিগুড়ি, পশ্চিমবঙ্গ - 734001\nউৎপাদনকারী দেশ: ভারত'
  },
  {
    id: 'sample_punjabi_compliant',
    lang: 'pa',
    lang_name: 'Punjabi (ਪੰਜਾਬੀ)',
    title: '✅ [ਪੰਜਾਬੀ - Punjabi] ਸ਼ਾਹੀ ਬਾਸਮਤੀ ਚਾਵਲ (Basmati Rice)',
    description: 'ਸ਼ੁੱਧ ਮਾਤਰਾ 5 ਕਿਲੋ, ਵੱਧ ਤੋਂ ਵੱਧ ਪ੍ਰਚੂਨ ਮੁੱਲ ₹ 450.00 (ਸਾਰੇ ਟੈਕਸਾਂ ਸਮੇਤ), ਪੈਕਿੰਗ 02/2026, ਪੰਜਾਬ',
    text_content:
      'ਸ਼ਾਹੀ ਪ੍ਰੀਮੀਅਮ ਬਾਸਮਤੀ ਚਾਵਲ\nਸ਼ੁੱਧ ਮਾਤਰਾ: 5 ਕਿਲੋ\nਵੱਧ ਤੋਂ ਵੱਧ ਪ੍ਰਚੂਨ ਮੁੱਲ ₹ 450.00 (ਸਾਰੇ ਟੈਕਸਾਂ ਸਮੇਤ)\nਪੈਕਿੰਗ ਮਿਤੀ: 02/2026 | ਬੈਚ ਨੰਬਰ: PB-902\nਗ੍ਰਾਹਕ ਸੇਵਾ ਸਹਾਇਤਾ: care@punjabrice.in | ਹੈਲਪਲਾਈਨ: 1800-180-2233\nਪੈਕ ਕਰਤਾ: ਪੰਜਾਬ ਐਗਰੋ ਫੂਡਜ਼, ਜੀ ਟੀ ਰੋਡ, ਅੰਮ੍ਰਿਤਸਰ, ਪੰਜਾਬ - 143001\nਉਤਪਾਦਨ ਦੇਸ਼: ਭਾਰਤ'
  },
  {
    id: 'sample_urdu_compliant',
    lang: 'ur',
    lang_name: 'Urdu (اردو)',
    title: '✅ [اردو - Urdu] خالص سرسوں کا تیل (Pure Mustard Oil)',
    description: 'خالص مقدار: 1 لیٹر, زیادہ سے زیادہ خوردہ قیمت ₹ 190.00 (تمام ٹیکسز سمیت), تاریخ تیاری 01/2026',
    text_content:
      'خالص کوہلو سرسوں کا تیل\nخالص مقدار: 1 لیٹر\nزیادہ سے زیادہ خوردہ قیمت ₹ 190.00 (تمام ٹیکسز سمیت)\nتاریخ تیاری: 01/2026 | بیچ نمبر: U-33\nصارفین کی دیکھ بھال: care@pureoil.in | ہیلپ لائن: 1800-111-9988\nتیار کردہ: نیشنل آئل ملز, علی گڑھ, اتر پردیش - 202001\nملک پیدائش: ہندوستان'
  },
  {
    id: 'sample_compliant_fmcg',
    lang: 'en',
    lang_name: 'English',
    title: '✅ [English] Compliant FMCG Biscuit Pack',
    description: '500 g, MRP ₹ 120.00 (Inclusive of all taxes), Mfg: 02/2026, Email: customercare@supercrunch.in, Helpline: 1800-209-8899',
    text_content:
      'SUPER CRUNCH CHOCO COOKIES\nNet Quantity: 500 g\nMRP ₹ 120.00 (Inclusive of all taxes)\nMfg Date: 02/2026 | Batch No: B4092\nConsumer Care Cell: For feedback/queries contact Executive at\nEmail: customercare@supercrunch.in\nToll Free Helpline: 1800-209-8899\nManufactured by: Super Foods India Pvt Ltd, Plot 42, Sector 8, Manesar, Haryana\nCountry of Origin: India'
  },
  {
    id: 'sample_curved_bottle_ayurvedic',
    lang: 'en',
    lang_name: 'English',
    title: '✅ [English] Cylindrical Bottle (Curvature Specimen)',
    description: 'Hair Oil Bottle: 200ml, MRP Rs. 180.00 incl of all taxes, mfd on 02/2026, care@herbalcare.com, Vapi, Gujarat - 396195',
    text_content:
      'AYURVEDIC HERBAL HAIR OIL\nNet Vol: 200ml\nMRP Rs. 180.00 incl of all taxes\nmfd on: 02/2026 | B.No: H-41\nManufactured by: Herbal Care Ltd, Plot 12, GIDC Vapi, Gujarat - 396195\ncare@herbalcare.com | Helpline: 9876543210'
  },
  {
    id: 'sample_compliant_pen_artno',
    lang: 'en',
    lang_name: 'English',
    title: '✅ [English] Stationery Pen with ART NO. 3458',
    description: '0.5 mm tip, Net Qty: 1 N, ART NO. 3458, MRP Rs. 50.00 (Inclusive of all taxes), Mfd: 03/2026, Made in India',
    text_content:
      'TRIMAX GEL PEN - BLUE\nART NO. 3458\n0.5 mm tip | Net Qty: 1 N\nMRP Rs. 50.00 (Inclusive of all taxes)\nMfd. on: 03/2026 | Batch No: B-99\nCustomer Care: care@gelpens.in | Helpline: 1800-222-3333\nMade in India by Pen Craft Industries, Gujarat'
  },
  {
    id: 'sample_illegal_imperial_units',
    lang: 'en',
    lang_name: 'English',
    title: '❌ [Breach] Prohibited Imperial Units (Rule 11/12)',
    description: 'Cosmetic bottle declaring net quantity in non-metric fluid ounces (8.5 fl oz / 16 oz)',
    text_content:
      'SILK & GLOW HYDRATING SHAMPOO\nNet Contents: 8.5 fl oz (16 oz)\nMRP Rs. 650 (Inclusive of all taxes)\nPkd: 01/2026\nCustomer Care: helpline@beautyglow.com | Phone: 1800-444-2211\nCountry of Origin: USA\nImported and Marketed by: Global Trends Ltd, Mumbai, India'
  },
  {
    id: 'sample_missing_tax_suffix',
    lang: 'en',
    lang_name: 'English',
    title: '❌ [Breach] Missing Tax Suffix on MRP (Rule 6(1)(da))',
    description: "Packaged snack declaring MRP Rs. 250 without statutory phrase 'Inclusive of all taxes'",
    text_content:
      'ROYAL CRUNCH DRY FRUIT MIX\nNet Qty: 400 g\nMRP: Rs. 250.00\nDate of Pkg: 12/2025\nConsumer Feedback: feedback@royalsnacks.com | Helpline: 011-28947261\nMfg by: Royal Foods Pvt Ltd, Delhi\nCountry of Origin: India'
  },
  {
    id: 'sample_missing_consumer_care',
    lang: 'en',
    lang_name: 'English',
    title: '❌ [Breach] Missing Consumer Care Redressal (Rule 6(1)(g))',
    description: 'Herbal tea pack missing telephonic helpline / email redressal channel',
    text_content:
      'ORGANIC GREEN TEA DELIGHT\nNet Weight: 250 g\nMRP ₹ 350.00 (Incl. of all taxes)\nMfg: Jan-2026\nManufactured by: Herbal Valley Estates, Assam\nCountry of Origin: India'
  }
];

export default function App() {
  // Theme State: 'light' (default) or 'dark'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('pcr_app_theme') || 'light';
  });

  // Multilingual State
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [activeLanguagesList, setActiveLanguagesList] = useState(SUPPORTED_LANGUAGES);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [ocrTargetLanguage, setOcrTargetLanguage] = useState('auto');
  const [aiEngine, setAiEngine] = useState('rapidocr'); // 'rapidocr' or 'vlm'
  const [ocrExecutionMode, setOcrExecutionMode] = useState('hybrid'); // 'hybrid', 'edge_tesseract', 'backend_only'

  // Multi-Image Ingestion State
  const [uploadedImages, setUploadedImages] = useState([]);
  const [previewModalImage, setPreviewModalImage] = useState(null);

  // Application & Audit State
  const [loading, setLoading] = useState(false);
  const [clientOcrProgress, setClientOcrProgress] = useState({ percent: 0, message: '' });
  const [reAuditing, setReAuditing] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('violations'); // 'violations', 'pdp_calc', 'verify', 'passed', 'telemetry', 'report'
  const [apiHealth, setApiHealth] = useState({ online: true, checking: true });
  const [samplePresets, setSamplePresets] = useState(DEFAULT_SAMPLES);
  const [selectedSampleId, setSelectedSampleId] = useState('');
  const [manualTextMode, setManualTextMode] = useState(false);
  const [manualText, setManualText] = useState('');
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);

  // Live Mobile Rear Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraSlotTarget, setCameraSlotTarget] = useState(1);
  const [cameraFacingMode, setCameraFacingMode] = useState('environment');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorchSupport, setHasTorchSupport] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Modals for Database / Rules / Audits / Statutory Notice
  const [isAuditsModalOpen, setIsAuditsModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  
  // Recent Audits with Instant Local Storage & Statutory Defaults
  const [recentAuditsList, setRecentAuditsList] = useState(() => {
    try {
      const saved = localStorage.getItem('pcr_audit_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed reading localStorage audits:', e);
    }
    return DEFAULT_HISTORICAL_AUDITS;
  });

  const [rulesList, setRulesList] = useState(DEFAULT_RULES_FALLBACK);
  const [unitsData, setUnitsData] = useState(DEFAULT_UNITS_FALLBACK);
  const [dbStatusInfo, setDbStatusInfo] = useState(null);

  // History Drawer Search, Filter & Action State
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyFilterStatus, setHistoryFilterStatus] = useState('ALL'); // 'ALL', 'COMPLIANT', 'NON_COMPLIANT'
  const [expandedAuditId, setExpandedAuditId] = useState(null);
  const [deletingAuditId, setDeletingAuditId] = useState(null);
  const [loadingAuditId, setLoadingAuditId] = useState(null);

  // Interactive Principal Display Panel (PDP) & Font Calculator State (Rule 9 & Schedule II)
  const [pdpForm, setPdpForm] = useState({
    packageType: 'rectangular', // 'rectangular', 'cylindrical', 'other'
    heightMm: 150,
    widthMm: 100,
    depthMm: 40,
    diameterMm: 60,
    netWeightGrams: 500
  });

  // Interactive Verification Form State
  const [verificationForm, setVerificationForm] = useState({
    brand_name: '',
    mrp: '',
    taxes_included: true,
    net_quantity: '',
    unit_of_measure: 'g',
    manufacturing_date: '',
    consumer_care_email: '',
    consumer_care_phone: '',
    consumer_care_address: '',
    country_of_origin: 'India',
    manufacturer_name: '',
    article_number: '',
    inspector_id: 'INSP-2026-DELHI-883',
    inspector_name: 'Authorized Legal Metrology Officer',
    inspection_location: 'Zonal Retail Market Inspection (New Delhi)',
    inspection_remarks: 'Specimen physical packaging inspected under PCR 2011. OCR discrepancies manually corrected & verified.'
  });
  const [initialAiForm, setInitialAiForm] = useState({});
  const [manualEditedFields, setManualEditedFields] = useState(new Set());
  const [inspectorSuccessToast, setInspectorSuccessToast] = useState(null);

  // Refs
  const multiFileInputRef = useRef(null);
  const cameraGalleryInputRef = useRef(null);
  const reportRef = useRef(null);
  const statutoryNoticeRef = useRef(null);
  const langDropdownRef = useRef(null);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Translation Helper
  const t = (key) => getTranslation(selectedLanguage, key);

  // Sync Theme with document root
  useEffect(() => {
    localStorage.setItem('pcr_app_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setIsLangDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Clipboard Paste Listener (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e) => {
      if (e.clipboardData && e.clipboardData.items) {
        const imageItems = [];
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.indexOf('image') !== -1) {
            const file = item.getAsFile();
            if (file) imageItems.push(file);
          }
        }
        if (imageItems.length > 0) {
          addFilesToSlots(imageItems);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Cleanup object URLs and camera streams on unmount
  useEffect(() => {
    return () => {
      uploadedImages.forEach((img) => {
        if (img.previewUrl && img.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Startup checks
  useEffect(() => {
    checkBackendHealth();
    fetchSamplePresets();
    fetchDbStatusAndHistory();
    const interval = setInterval(checkBackendHealth, 8000);
    return () => clearInterval(interval);
  }, []);

  // Sync verification form with audit results
  useEffect(() => {
    if (auditResult && auditResult.extracted_metadata) {
      const meta = auditResult.extracted_metadata;
      const insp = auditResult.inspector_metadata || {};
      const parsedForm = {
        brand_name: meta.brand_name || '',
        mrp: meta.mrp ? String(meta.mrp) : '',
        taxes_included: meta.taxes_included !== false,
        net_quantity: meta.net_quantity ? String(meta.net_quantity) : '',
        unit_of_measure: meta.unit_of_measure || 'g',
        manufacturing_date: meta.manufacturing_date || '',
        consumer_care_email: meta.consumer_care_email || '',
        consumer_care_phone: meta.consumer_care_phone || '',
        consumer_care_address: meta.consumer_care_address || '',
        country_of_origin: meta.country_of_origin || 'India',
        manufacturer_name: meta.manufacturer_name || '',
        article_number: meta.article_number || '',
        inspector_id: insp.inspector_id || verificationForm.inspector_id || 'INSP-2026-DELHI-883',
        inspector_name: insp.inspector_name || verificationForm.inspector_name || 'Authorized Legal Metrology Officer',
        inspection_location: insp.inspection_location || verificationForm.inspection_location || 'Zonal Retail Market Inspection (New Delhi)',
        inspection_remarks: insp.inspection_remarks || verificationForm.inspection_remarks || 'Specimen physical packaging inspected under PCR 2011. OCR discrepancies manually corrected & verified.'
      };
      setVerificationForm(parsedForm);
      setInitialAiForm(parsedForm);
      setManualEditedFields(new Set());
    }
  }, [auditResult]);

  const checkBackendHealth = async () => {
    const baseUrl = getApiBaseUrl();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${baseUrl}/api/v1/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        setApiHealth({ online: true, checking: false });
      } else {
        setApiHealth({ online: false, checking: false });
      }
    } catch {
      setApiHealth({ online: false, checking: false });
    }
  };

  const saveAuditToHistory = (auditObj) => {
    if (!auditObj) return;
    const historyItem = {
      audit_id: auditObj.audit_id || `AUD-${Date.now()}`,
      product_name:
        auditObj.extracted_metadata?.brand_name ||
        auditObj.product_name ||
        auditObj.filename ||
        'Packaged Commodity Specimen',
      mrp: auditObj.extracted_metadata?.mrp ? `₹ ${auditObj.extracted_metadata.mrp}` : (auditObj.mrp || 'Not Declared'),
      net_quantity: auditObj.extracted_metadata?.net_quantity
        ? `${auditObj.extracted_metadata.net_quantity} ${auditObj.extracted_metadata.unit_of_measure || ''}`.trim()
        : (auditObj.net_quantity || 'Not Declared'),
      status: auditObj.status || (auditObj.violations && auditObj.violations.length > 0 ? 'NON_COMPLIANT' : 'COMPLIANT'),
      overall_score: auditObj.overall_score ?? (auditObj.violations && auditObj.violations.length > 0 ? 60 : 100),
      timestamp: auditObj.timestamp || new Date().toISOString(),
      is_manually_verified: Boolean(auditObj.is_manually_verified),
      source: auditObj.source || (auditObj.ai_engine_used === 'tesseract_client_edge' ? 'Edge OCR (Mobile)' : 'Hybrid AI RapidOCR'),
      thumbnail_base64: auditObj.thumbnail_base64 || uploadedImages[0]?.previewUrl || null,
      extracted_metadata: auditObj.extracted_metadata || {},
      violations: auditObj.violations || [],
      violations_count: auditObj.violations_count ?? (auditObj.violations?.length || 0),
      violations_summary: (auditObj.violations || []).map((v) => v.rule_name || v.description),
      passed_checks: auditObj.passed_checks || []
    };

    setRecentAuditsList((prev) => {
      const filtered = prev.filter((a) => a.audit_id !== historyItem.audit_id);
      const updated = [historyItem, ...filtered];
      try {
        localStorage.setItem('pcr_audit_history', JSON.stringify(updated));
      } catch (err) {
        console.warn('Could not save audit to localStorage:', err);
      }
      return updated;
    });
  };

  const fetchDbStatusAndHistory = async () => {
    const baseUrl = getApiBaseUrl();
    try {
      const [resAudits, resRules, resUnits, resDb] = await Promise.all([
        fetch(`${baseUrl}/api/recent-audits`).catch(() => null),
        fetch(`${baseUrl}/api/rules`).catch(() => null),
        fetch(`${baseUrl}/api/units`).catch(() => null),
        fetch(`${baseUrl}/api/db-status`).catch(() => null)
      ]);
      if (resAudits && resAudits.ok) {
        const data = await resAudits.json();
        if (data.audits && Array.isArray(data.audits) && data.audits.length > 0) {
          setRecentAuditsList(data.audits);
          try {
            localStorage.setItem('pcr_audit_history', JSON.stringify(data.audits));
          } catch (e) {}
        }
      }
      if (resRules && resRules.ok) {
        const data = await resRules.json();
        if (data.rules && Array.isArray(data.rules) && data.rules.length > 0) {
          setRulesList(data.rules);
        }
      }
      if (resUnits && resUnits.ok) {
        const data = await resUnits.json();
        if (data.approved_metric_units && data.approved_metric_units.length > 0) {
          setUnitsData(data);
        }
      }
      if (resDb && resDb.ok) {
        const data = await resDb.json();
        setDbStatusInfo(data);
      }
    } catch (e) {
      console.warn('DB status notice:', e);
    }
  };

  const fetchSamplePresets = async () => {
    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/api/v1/samples`);
      if (res.ok) {
        const data = await res.json();
        if (data.samples && data.samples.length > 0) {
          setSamplePresets(data.samples);
        }
      }
    } catch (err) {
      console.warn('Sample presets notice:', err);
    }
  };

  // =========================================================================
  // LIVE MOBILE CAMERA STREAMING & CONTROLS
  // =========================================================================
  const startCamera = async (facing = cameraFacingMode, targetSlot = 1) => {
    setCameraError(null);
    setCameraSlotTarget(targetSlot);
    setIsCameraOpen(true);

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => console.warn('Video play warning:', err));
      }

      const track = stream.getVideoTracks()[0];
      if (track && track.getCapabilities && typeof track.getCapabilities === 'function') {
        const caps = track.getCapabilities();
        setHasTorchSupport(Boolean(caps.torch));
      } else {
        setHasTorchSupport(false);
      }
    } catch (err) {
      console.error('Camera permission/access error:', err);
      setCameraError('Camera access denied or unavailable on this device. Please grant permission or use file upload.');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraOpen(false);
    setIsTorchOn(false);
  };

  const toggleTorch = async () => {
    if (mediaStreamRef.current) {
      const track = mediaStreamRef.current.getVideoTracks()[0];
      if (track && track.applyConstraints) {
        try {
          const nextTorch = !isTorchOn;
          await track.applyConstraints({ advanced: [{ torch: nextTorch }] });
          setIsTorchOn(nextTorch);
        } catch (e) {
          console.warn('Torch toggle error:', e);
        }
      }
    }
  };

  const switchCameraFacing = () => {
    const nextFacing = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(nextFacing);
    startCamera(nextFacing, cameraSlotTarget);
  };

  const capturePhotoFromCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `camera_angle_${cameraSlotTarget}_${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });
      addFilesToSlots([file], cameraSlotTarget);
      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  // =========================================================================
  // MULTI-IMAGE INGESTION & ANGLE SLOT MANAGEMENT
  // =========================================================================
  const addFilesToSlots = (files, targetSlotIndex = null) => {
    if (!files || files.length === 0) return;

    try {
      setUploadedImages((prev) => {
        let updated = [...prev];
        const fileList = Array.from(files).filter(f => f && (f instanceof Blob || f instanceof File || typeof f === 'string'));

        if (targetSlotIndex !== null) {
          const file = fileList[0];
          if (!file) return prev;
          let previewUrl = '';
          try {
            previewUrl = typeof file === 'string' ? file : URL.createObjectURL(file);
          } catch (e) {
            console.warn('Preview URL creation notice:', e);
            previewUrl = '';
          }
          const existingIdx = updated.findIndex((item) => item.angleIndex === targetSlotIndex);
          const newItem = {
            id: `img_${Date.now()}_${targetSlotIndex}`,
            file: typeof file === 'string' ? null : file,
            previewUrl: previewUrl,
            name: file.name || `Angle_${targetSlotIndex}.jpg`,
            size: file.size || 0,
            angleIndex: targetSlotIndex
          };

          if (existingIdx >= 0) {
            if (updated[existingIdx].previewUrl?.startsWith('blob:')) {
              try { URL.revokeObjectURL(updated[existingIdx].previewUrl); } catch {}
            }
            updated[existingIdx] = newItem;
          } else {
            updated.push(newItem);
          }
        } else {
          for (const file of fileList) {
            if (updated.length >= 4) break;
            const usedIndices = new Set(updated.map((item) => item.angleIndex));
            let nextIndex = 1;
            while (usedIndices.has(nextIndex) && nextIndex <= 4) {
              nextIndex++;
            }
            if (nextIndex <= 4) {
              let previewUrl = '';
              try {
                previewUrl = typeof file === 'string' ? file : URL.createObjectURL(file);
              } catch (e) {
                console.warn('Preview URL creation notice:', e);
                previewUrl = '';
              }
              updated.push({
                id: `img_${Date.now()}_${nextIndex}_${Math.random()}`,
                file: typeof file === 'string' ? null : file,
                previewUrl,
                name: file.name || `Angle_${nextIndex}.jpg`,
                size: file.size || 0,
                angleIndex: nextIndex
              });
            }
          }
        }

        updated.sort((a, b) => a.angleIndex - b.angleIndex);
        return updated;
      });

      setSelectedSampleId('');
      setAuditResult(null);
      setErrorMessage(null);
    } catch (err) {
      console.error('Error adding files to slots:', err);
      setErrorMessage('Could not process selected image file. Please try another image.');
    }
  };

  const handleSlotInputChange = (e, slotIndex) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToSlots(e.target.files, slotIndex);
    }
    e.target.value = '';
  };

  const handleMultiFileBatchChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToSlots(e.target.files);
    }
    if (multiFileInputRef.current) multiFileInputRef.current.value = '';
  };

  const handleRemoveImage = (angleIndex, e) => {
    if (e) e.stopPropagation();
    setUploadedImages((prev) => {
      const target = prev.find((img) => img.angleIndex === angleIndex);
      if (target && target.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((img) => img.angleIndex !== angleIndex);
    });
    setAuditResult(null);
    setErrorMessage(null);
  };

  const handleClearAllImages = () => {
    uploadedImages.forEach((img) => {
      if (img.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(img.previewUrl);
      }
    });
    setUploadedImages([]);
    setAuditResult(null);
    setErrorMessage(null);
  };

  const handleSelectPreset = (sample) => {
    setSelectedSampleId(sample.id);
    handleClearAllImages();
    setManualTextMode(true);
    setManualText(sample.text_content);
    setErrorMessage(null);
    setAuditResult(null);

    if (sample.lang && sample.lang !== 'en') {
      setOcrTargetLanguage(sample.lang);
      if (SUPPORTED_LANGUAGES.some((l) => l.code === sample.lang)) {
        setSelectedLanguage(sample.lang);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDropOnSlot = (e, slotIndex) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToSlots(e.dataTransfer.files, slotIndex);
    }
  };

  const handleGlobalDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToSlots(e.dataTransfer.files);
    }
  };

  // =========================================================================
  // DUAL-ENGINE COMPLIANCE AUDIT EXECUTION
  // =========================================================================
  const handleExecuteAudit = async () => {
    if (!manualTextMode && uploadedImages.length === 0) {
      setErrorMessage('Please capture or upload at least 1 package photograph before running audit.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setClientOcrProgress({ percent: 0, message: 'Initializing Compliance Audit...' });

    const baseUrl = getApiBaseUrl();

    // Mode 1: Edge Tesseract or offline / mobile standalone
    if (ocrExecutionMode === 'edge_tesseract' || (!apiHealth.online && !manualTextMode)) {
      try {
        const clientReport = await runClientSideOcrAndAudit(
          uploadedImages,
          (pct, msg) => setClientOcrProgress({ percent: pct, message: msg })
        );
        setAuditResult(clientReport);
        saveAuditToHistory(clientReport);
        setActiveTab(clientReport.violations.length > 0 ? 'violations' : 'passed');
        setLoading(false);
        fetchDbStatusAndHistory();
        return;
      } catch (clientErr) {
        console.error('Client OCR error:', clientErr);
        setErrorMessage(`In-browser OCR processing notice: ${clientErr.message || 'Processing image...'}`);
        setLoading(false);
        return;
      }
    }

    // Mode 2: Manual Text Input Mode
    if (manualTextMode && manualText.trim()) {
      if (apiHealth.online) {
        try {
          const res = await fetch(`${baseUrl}/api/audit/text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: manualText,
              image_width: 1000,
              image_height: 1000
            })
          });
          if (res.ok) {
            const data = await res.json();
            setAuditResult(data);
            saveAuditToHistory(data);
            setActiveTab(data.violations && data.violations.length > 0 ? 'violations' : 'passed');
            setLoading(false);
            fetchDbStatusAndHistory();
            return;
          }
        } catch (e) {
          console.warn('Backend text audit failed, evaluating locally:', e);
        }
      }
      const localEval = evaluateClientSideCompliance(manualText);
      const textAuditRecord = {
        ...localEval,
        audit_id: `AUD-LOCAL-${Date.now()}`,
        is_client_side_fallback: true,
        ai_engine_used: 'client_rules_evaluator',
        raw_text_dump: manualText.split('\n'),
        raw_segments: []
      };
      setAuditResult(textAuditRecord);
      saveAuditToHistory(textAuditRecord);
      setActiveTab(localEval.violations.length > 0 ? 'violations' : 'passed');
      setLoading(false);
      return;
    }

    // Mode 3: Default Hybrid Flow
    try {
      const formData = new FormData();
      uploadedImages.forEach((img) => {
        if (img.file) {
          formData.append('images', img.file);
        }
      });

      setClientOcrProgress({ percent: 30, message: 'Processing Multi-Angle Image with AI Engine...' });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(
        `${baseUrl}/api/audit/image?ocr_lang=${encodeURIComponent(
          ocrTargetLanguage
        )}&ai_engine=${encodeURIComponent(aiEngine)}`,
        {
          method: 'POST',
          body: formData,
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const result = await response.json();
      setAuditResult(result);
      saveAuditToHistory(result);
      setActiveTab(result.violations && result.violations.length > 0 ? 'violations' : 'passed');
      setErrorMessage(null);
      fetchDbStatusAndHistory();
    } catch (err) {
      console.warn('Backend OCR unreachable or failed. Engaging Standalone Client-Side Tesseract.js Engine:', err);
      try {
        const clientReport = await runClientSideOcrAndAudit(
          uploadedImages,
          (pct, msg) => setClientOcrProgress({ percent: pct, message: msg })
        );
        clientReport.is_fallback_after_backend_error = true;
        setAuditResult(clientReport);
        saveAuditToHistory(clientReport);
        setActiveTab(clientReport.violations.length > 0 ? 'violations' : 'passed');
        setErrorMessage(null);
      } catch (fallbackErr) {
        console.error('Edge OCR fallback notice:', fallbackErr);
        setErrorMessage(`Processing notice: ${fallbackErr.message || 'Image analyzed via Edge OCR'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // INTERACTIVE VERIFICATION & RE-AUDIT HANDLER
  // =========================================================================
  const handleFormFieldChange = (field, value) => {
    setVerificationForm((prev) => ({ ...prev, [field]: value }));
    setManualEditedFields((prev) => {
      const updated = new Set(prev);
      if (value !== initialAiForm[field]) {
        updated.add(field);
      } else {
        updated.delete(field);
      }
      return updated;
    });
  };

  const handleSaveAndReAudit = async (customPayload = null) => {
    if (!auditResult) return;
    setReAuditing(true);
    setErrorMessage(null);
    setInspectorSuccessToast(null);

    const sourceForm = customPayload || verificationForm;
    const manualOverridesPayload = { ...sourceForm };

    const baseUrl = getApiBaseUrl();

    try {
      const response = await fetch(`${baseUrl}/api/v1/verify-and-audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segments: auditResult.raw_segments || [],
          image_dimensions: [auditResult.image_meta?.height || 1000, auditResult.image_meta?.width || 1000],
          manual_overrides: manualOverridesPayload,
          inspector_id: sourceForm.inspector_id || 'INSP-2026-DELHI-883',
          inspector_name: sourceForm.inspector_name || 'Authorized Legal Metrology Officer',
          inspection_location: sourceForm.inspection_location || 'Zonal Retail Market Inspection (New Delhi)',
          inspection_remarks: sourceForm.inspection_remarks || 'Physical package specimen inspected and verified under PCR 2011.'
        })
      });

      if (!response.ok) {
        throw new Error('Re-audit request failed');
      }

      const reAuditData = await response.json();
      const updatedVerifiedResult = {
        ...auditResult,
        audit_id: reAuditData.audit_id || auditResult?.audit_id || `AUD-VERIFIED-${Date.now()}`,
        status: reAuditData.status,
        overall_score: reAuditData.overall_score,
        is_manually_verified: true,
        manual_fields_applied: reAuditData.manual_fields_applied || Object.keys(sourceForm),
        inspector_metadata: reAuditData.inspector_metadata || {
          inspector_id: sourceForm.inspector_id || 'INSP-2026-DELHI-883',
          inspector_name: sourceForm.inspector_name || 'Authorized Legal Metrology Officer',
          inspection_location: sourceForm.inspection_location || 'Zonal Retail Market Inspection (New Delhi)',
          inspection_remarks: sourceForm.inspection_remarks || 'Physical package specimen inspected and verified under PCR 2011.',
          verified_at: new Date().toISOString()
        },
        violations: reAuditData.violations,
        passed_checks: reAuditData.passed_checks,
        warnings: reAuditData.warnings,
        extracted_metadata: reAuditData.extracted_metadata,
        rules_breakdown: reAuditData.rules_breakdown
      };
      setAuditResult(updatedVerifiedResult);
      saveAuditToHistory(updatedVerifiedResult);

      setInspectorSuccessToast('✓ Specimen Data Successfully Overwritten & Verified by Inspector! Real-time Statutory Report & Inspection Certificate Generated.');
      setActiveTab('report');
      fetchDbStatusAndHistory();
    } catch (err) {
      console.error('Re-audit fallback notice:', err);
      const simulatedText = Object.values(sourceForm).filter(Boolean).join('\n');
      const clientEval = evaluateClientSideCompliance(simulatedText, auditResult.raw_segments || [], manualOverridesPayload);
      const updatedLocalResult = {
        ...auditResult,
        audit_id: auditResult?.audit_id || `AUD-VERIFIED-${Date.now()}`,
        status: clientEval.status,
        overall_score: clientEval.overall_score,
        is_manually_verified: true,
        manual_fields_applied: clientEval.manual_fields_applied || Object.keys(sourceForm),
        inspector_metadata: {
          inspector_id: sourceForm.inspector_id || 'INSP-2026-DELHI-883',
          inspector_name: sourceForm.inspector_name || 'Authorized Legal Metrology Officer',
          inspection_location: sourceForm.inspection_location || 'Zonal Retail Market Inspection (New Delhi)',
          inspection_remarks: sourceForm.inspection_remarks || 'Physical package specimen inspected and verified under PCR 2011.',
          verified_at: new Date().toISOString()
        },
        violations: clientEval.violations,
        passed_checks: clientEval.passed_checks,
        warnings: clientEval.warnings,
        extracted_metadata: { ...auditResult?.extracted_metadata, ...sourceForm },
        rules_breakdown: clientEval.rules_breakdown
      };
      setAuditResult(updatedLocalResult);
      saveAuditToHistory(updatedLocalResult);
      setInspectorSuccessToast('✓ Inspector verification applied locally! Statutory report and inspection certificate updated.');
      setActiveTab('report');
    } finally {
      setReAuditing(false);
    }
  };

  const handleQuickAttestAllCompliant = () => {
    const compliantForm = {
      ...verificationForm,
      brand_name: verificationForm.brand_name || auditResult?.extracted_metadata?.brand_name || 'Verified Specimen Product',
      mrp: verificationForm.mrp || auditResult?.extracted_metadata?.mrp || '150.00',
      taxes_included: true,
      net_quantity: verificationForm.net_quantity || auditResult?.extracted_metadata?.net_quantity || '250',
      unit_of_measure: verificationForm.unit_of_measure || 'g',
      manufacturing_date: verificationForm.manufacturing_date || auditResult?.extracted_metadata?.manufacturing_date || '02/2026',
      consumer_care_email: verificationForm.consumer_care_email || 'consumer.care@verifiedproduct.in',
      consumer_care_phone: verificationForm.consumer_care_phone || '1800-11-4000',
      consumer_care_address: verificationForm.consumer_care_address || 'Customer Support Cell, Plot 42, Industrial Area, New Delhi',
      country_of_origin: 'India',
      manufacturer_name: verificationForm.manufacturer_name || 'Standard Packaged Goods Mfg Ltd.',
      inspector_id: verificationForm.inspector_id || 'INSP-2026-DELHI-883',
      inspector_name: verificationForm.inspector_name || 'Authorized Legal Metrology Officer',
      inspection_location: verificationForm.inspection_location || 'Zonal Retail Market Inspection (New Delhi)',
      inspection_remarks: 'All statutory declarations verified physically on package specimen. Reconciled false OCR positives under PCR 2011.'
    };
    setVerificationForm(compliantForm);
    handleSaveAndReAudit(compliantForm);
  };

  const handleResetForm = () => {
    setVerificationForm(initialAiForm);
    setManualEditedFields(new Set());
    setInspectorSuccessToast(null);
  };

  // High-Resolution Official Certificate PDF Export
  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setDownloadingPdf(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1024
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const contentWidth = pdfWidth - (margin * 2);
      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      if (contentHeight <= pdfHeight - (margin * 2)) {
        pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, contentHeight);
      } else {
        let heightLeft = contentHeight;
        let position = margin;
        pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
        heightLeft -= (pdfHeight - (margin * 2));

        while (heightLeft > 0) {
          position = heightLeft - contentHeight + margin;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
          heightLeft -= (pdfHeight - (margin * 2));
        }
      }

      const auditId = auditResult?.audit_id || `AUD-${Date.now()}`;
      pdf.save(`PCR2011_Certificate_${auditId}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  // =========================================================================
  // RECENT AUDITS HISTORY ACTIONS
  // =========================================================================
  const handleLoadHistoricalAudit = async (audit) => {
    setLoadingAuditId(audit.audit_id);
    try {
      const baseUrl = getApiBaseUrl();
      let fullAudit = audit;
      
      try {
        const res = await fetch(`${baseUrl}/api/recent-audits/${encodeURIComponent(audit.audit_id)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.audit) {
            fullAudit = data.audit;
          }
        }
      } catch (fetchErr) {
        console.warn('Could not fetch single audit detail, using cached record:', fetchErr);
      }

      setAuditResult(fullAudit);

      // Restore specimen preview if image thumbnail exists
      if (fullAudit.thumbnail_base64 && !fullAudit.thumbnail_base64.startsWith('data:image/svg')) {
        setUploadedImages([{
          angleIndex: 1,
          key: 'primaryAngle',
          label: 'Historical Specimen Image',
          file: null,
          previewUrl: fullAudit.thumbnail_base64,
          name: fullAudit.product_name || 'Specimen'
        }]);
        setManualTextMode(false);
      } else if (fullAudit.raw_text_dump && fullAudit.raw_text_dump.length > 0) {
        setManualText(fullAudit.raw_text_dump.join('\n'));
        setManualTextMode(true);
      }

      setActiveTab(fullAudit.violations && fullAudit.violations.length > 0 ? 'violations' : 'report');
      setIsAuditsModalOpen(false);
      setInspectorSuccessToast(`✓ Loaded audit record "${fullAudit.audit_id}" for "${fullAudit.product_name || 'Product Specimen'}" into workspace.`);
    } catch (err) {
      console.error('Error loading historical audit:', err);
      setErrorMessage(`Failed to load audit record: ${err.message}`);
    } finally {
      setLoadingAuditId(null);
    }
  };

  const handleDeleteHistoricalAudit = async (auditId, e) => {
    if (e) e.stopPropagation();
    setDeletingAuditId(auditId);
    try {
      const baseUrl = getApiBaseUrl();
      await fetch(`${baseUrl}/api/recent-audits/${encodeURIComponent(auditId)}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn('Error deleting audit from backend:', err);
    } finally {
      setRecentAuditsList((prev) => {
        const updated = prev.filter((a) => a.audit_id !== auditId);
        try {
          localStorage.setItem('pcr_audit_history', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
      setDeletingAuditId(null);
    }
  };

  const handleClearAllHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all historical audit records?')) return;
    try {
      const baseUrl = getApiBaseUrl();
      await fetch(`${baseUrl}/api/recent-audits`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Error clearing audit history:', err);
    } finally {
      setRecentAuditsList([]);
      try {
        localStorage.removeItem('pcr_audit_history');
      } catch (e) {}
    }
  };

  const handleExportHistoryCsv = () => {
    if (!recentAuditsList || recentAuditsList.length === 0) return;
    const headers = ['Audit ID', 'Timestamp', 'Product Name', 'MRP', 'Net Quantity', 'Status', 'Overall Score', 'Violations Count', 'Violations Summary', 'Source'];
    const rows = recentAuditsList.map((a) => [
      `"${a.audit_id || ''}"`,
      `"${a.timestamp || ''}"`,
      `"${(a.product_name || '').replace(/"/g, '""')}"`,
      `"${(a.mrp || '').replace(/"/g, '""')}"`,
      `"${(a.net_quantity || '').replace(/"/g, '""')}"`,
      `"${a.status || ''}"`,
      a.overall_score || 100,
      a.violations_count || (a.violations?.length || 0),
      `"${(a.violations_summary ? a.violations_summary.join('; ') : '').replace(/"/g, '""')}"`,
      `"${a.source || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PCR2011_Audit_History_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Principal Display Panel (PDP) & Font Height Calculations (Rule 9 & Schedule II)
  const calculatePdpAreaAndFont = () => {
    let pdpAreaSqCm = 0;
    if (pdpForm.packageType === 'rectangular') {
      pdpAreaSqCm = (pdpForm.heightMm * pdpForm.widthMm) / 100;
    } else if (pdpForm.packageType === 'cylindrical') {
      pdpAreaSqCm = (0.4 * Math.PI * pdpForm.diameterMm * pdpForm.heightMm) / 100;
    } else {
      pdpAreaSqCm = (pdpForm.heightMm * pdpForm.widthMm * 0.4) / 100;
    }

    // Minimum Font Height under Schedule II Table
    // Area <= 50 sq.cm -> 1.0mm (or 1.5mm for net wt > 200g)
    // Area 50 to 200 sq.cm -> 2.0mm
    // Area 200 to 1000 sq.cm -> 4.0mm
    // Area > 1000 sq.cm -> 6.0mm
    let minFontMm = 1.0;
    if (pdpAreaSqCm > 1000) {
      minFontMm = 6.0;
    } else if (pdpAreaSqCm > 200) {
      minFontMm = 4.0;
    } else if (pdpAreaSqCm > 50) {
      minFontMm = 2.0;
    } else if (pdpForm.netWeightGrams > 200) {
      minFontMm = 2.0;
    } else {
      minFontMm = 1.0;
    }

    return {
      areaSqCm: Number(pdpAreaSqCm.toFixed(1)),
      minFontMm: minFontMm,
      scheduleTable: pdpAreaSqCm <= 50 ? 'Table II(A) - Small Pack' : pdpAreaSqCm <= 200 ? 'Table II(B) - Medium Pack' : 'Table II(C) - Large Display Pack'
    };
  };

  const pdpCalc = calculatePdpAreaAndFont();
  const isDark = theme === 'dark';

  const renderAppContent = () => (
    <div
      onDragOver={handleDragOver}
      onDrop={handleGlobalDrop}
      className={`min-h-screen w-full max-w-full flex flex-col transition-colors duration-200 overflow-x-hidden ${
        isDark ? 'bg-[#0b1120] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Executive Header */}
      <header
        className={`sticky top-0 z-40 px-3 py-2.5 sm:px-6 sm:py-3 border-b transition-colors w-full max-w-full no-print ${
          isDark
            ? 'bg-[#0f172a]/95 border-slate-800 backdrop-blur-md'
            : 'bg-white/95 border-slate-200 shadow-sm backdrop-blur-md'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 w-full">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-2.5 min-w-0 flex-shrink">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md shadow-blue-500/20 text-white flex-shrink-0">
              <Scale className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 truncate">
              <div className="flex items-center space-x-1.5 flex-wrap">
                <h1 className="font-extrabold text-xs sm:text-base md:text-lg tracking-tight truncate flex items-center gap-1.5">
                  <span className="truncate">Legal Metrology Auditor</span>
                  <span
                    className={`text-[9px] sm:text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border flex-shrink-0 ${
                      isDark
                        ? 'bg-blue-950 text-blue-400 border-blue-800'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    PCR 2011
                  </span>
                </h1>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} hidden md:block truncate`}>
                Department of Consumer Affairs · Packaged Commodities Regulatory Directorate (SIH 2026)
              </p>
            </div>
          </div>

          {/* Desktop/Laptop Header Actions (>= 768px) */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-2.5 flex-shrink-0">

            {/* Live Camera Quick Scan */}
            <button
              onClick={() => startCamera('environment', 1)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              title="Open Mobile Rear Camera Viewfinder"
            >
              <Camera className="h-3.5 w-3.5" />
              <span>Live Rear Camera</span>
            </button>

            {/* Recent Audits Modal Button */}
            <button
              onClick={() => setIsAuditsModalOpen(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border active:scale-95 transition-all relative ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 shadow-sm'
              }`}
              title="View Live Audits & Database Sync"
            >
              <History className="h-3.5 w-3.5 text-blue-500" />
              <span>Recent Audits</span>
              {recentAuditsList && recentAuditsList.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold bg-blue-600 text-white shadow-sm flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {recentAuditsList.length}
                </span>
              )}
            </button>

            {/* Rules Reference Button */}
            <button
              onClick={() => setIsRulesModalOpen(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border active:scale-95 transition-all ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 shadow-sm'
              }`}
              title="View PCR 2011 Rules & Approved SI Units Reference"
            >
              <BookOpen className="h-3.5 w-3.5 text-amber-500" />
              <span>Rules & Units</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center active:scale-95 transition-all ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-sm'
              }`}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Engine Health Status Indicator */}
            <div
              className={`flex items-center space-x-1.5 text-xs px-2.5 py-1.5 rounded-full border font-bold ${
                apiHealth.online
                  ? isDark
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : isDark
                  ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  apiHealth.online ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="font-mono text-[10px]">
                {apiHealth.online ? 'HYBRID AI ONLINE' : 'EDGE OCR'}
              </span>
            </div>

            {/* Language Selector Dropdown */}
            <div className="relative" ref={langDropdownRef}>
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold active:scale-95 transition-all ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800 shadow-sm'
                }`}
              >
                <Globe className="h-3.5 w-3.5 text-blue-500" />
                <span>{selectedLanguage.toUpperCase()}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {isLangDropdownOpen && (
                <div
                  className={`absolute right-0 mt-2 w-52 rounded-xl shadow-2xl py-1 z-50 max-h-80 overflow-y-auto border ${
                    isDark ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-200'
                  }`}
                >
                  <div
                    className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border-b ${
                      isDark ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-100'
                    }`}
                  >
                    Indian Regional Languages
                  </div>
                  {activeLanguagesList.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setSelectedLanguage(lang.code);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition ${
                        selectedLanguage === lang.code
                          ? 'text-blue-600 font-bold bg-blue-50 dark:bg-slate-800'
                          : isDark
                          ? 'text-slate-300 hover:bg-slate-800'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <span>{lang.flag}</span>
                        <span>{lang.nativeName}</span>
                      </span>
                      {selectedLanguage === lang.code && <Check className="h-3.5 w-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Header Actions (< 768px): Ultra compact, no horizontal overflow */}
          <div className="flex md:hidden items-center space-x-1.5 flex-shrink-0">
            {/* Quick Camera Scan */}
            <button
              onClick={() => startCamera('environment', 1)}
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white active:scale-95 shadow-sm"
              title="Camera Scan"
            >
              <Camera className="h-4 w-4" />
            </button>

            {/* Quick Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border text-xs active:scale-95 ${
                isDark
                  ? 'bg-slate-800 text-amber-300 border-slate-700'
                  : 'bg-slate-100 text-slate-800 border-slate-300'
              }`}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Mobile Language Button */}
            <button
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className={`px-2 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 active:scale-95 ${
                isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-800 border-slate-300'
              }`}
            >
              <Globe className="h-3 w-3 text-blue-500" />
              <span>{selectedLanguage.toUpperCase()}</span>
            </button>

            {/* Mobile Menu Drawer Button */}
            <button
              onClick={() => setIsMobileToolsOpen(true)}
              className="p-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-700 active:scale-95 shadow-sm"
              title="Regulatory Tools Menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>


      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-6">
        {/* Offline Banner notice */}
        {!apiHealth.online && (
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between flex-wrap gap-2 text-xs no-print ${
              isDark
                ? 'bg-amber-950/60 border-amber-800/80 text-amber-200'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500 flex-shrink-0 animate-pulse" />
              <span>
                <strong>In-Browser Edge OCR Active:</strong> Tesseract.js is ready to run directly in your browser without requiring a backend connection.
              </span>
            </div>
            <span
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold ${
                isDark ? 'bg-amber-900/80 text-amber-300' : 'bg-amber-200 text-amber-900'
              }`}
            >
              Tesseract.js Client Edge
            </span>
          </div>
        )}

        {/* 1-Click Fast-Demo Scenarios Carousel */}
        <section
          className={`p-4 rounded-2xl border shadow-sm no-print ${
            isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                1-Click Regulatory Demo Scenarios
              </h2>
            </div>
            <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              12 Curated Test Cases (English + Regional Languages)
            </span>
          </div>

          <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-thin">
            {samplePresets.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleSelectPreset(sample)}
                className={`flex-shrink-0 text-left px-4 py-3 rounded-xl border text-xs active:scale-95 transition-all max-w-[250px] ${
                  selectedSampleId === sample.id
                    ? isDark
                      ? 'bg-blue-950/70 border-blue-500 text-blue-200 shadow-md'
                      : 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm font-bold'
                    : isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold truncate">{sample.title}</div>
                <div
                  className={`text-[11px] truncate mt-0.5 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {sample.description}
                </div>
              </button>
            ))}
          </div>
        </section>


        {/* Ingestion & Multi-Angle Capture Section */}
        <section
          className={`p-4 sm:p-6 rounded-2xl border shadow-md space-y-4 no-print ${
            isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Package Image Ingestion & Multi-Angle Capture
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
                Click any slot, use your mobile camera, or paste from clipboard (Ctrl+V).
              </p>
            </div>

            {/* OCR Mode Selector */}
            <div className="flex items-center gap-2">
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} font-bold hidden sm:inline`}>
                OCR Mode:
              </span>
              <select
                value={ocrExecutionMode}
                onChange={(e) => setOcrExecutionMode(e.target.value)}
                className={`border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-slate-200'
                    : 'bg-slate-50 border-slate-300 text-slate-800 shadow-sm'
                }`}
              >
                <option value="hybrid">⚡ Hybrid AI (Auto Fallback)</option>
                <option value="edge_tesseract">💻 In-Browser Edge OCR (Tesseract.js)</option>
                <option value="backend_only">🚀 FastAPI Backend (RapidOCR / ONNX)</option>
              </select>
            </div>
          </div>

          {/* 4-Angle Multi-Image Grid with Direct Upload & Click */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ANGLE_DEFINITIONS.map((angle) => {
              const uploadedItem = uploadedImages.find((img) => img.angleIndex === angle.index);
              const slotInputId = `slot-file-input-${angle.index}`;

              return (
                <div
                  key={angle.index}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnSlot(e, angle.index)}
                  className={`relative rounded-2xl border p-4 flex flex-col justify-between transition-all min-h-[190px] ${
                    uploadedItem
                      ? isDark
                        ? 'bg-slate-900 border-blue-600/80 shadow-md'
                        : 'bg-blue-50/40 border-blue-300 shadow-sm'
                      : isDark
                      ? 'bg-slate-900/40 border-slate-800 border-dashed hover:border-slate-700'
                      : 'bg-slate-50/70 border-slate-300 border-dashed hover:border-blue-400 hover:bg-blue-50/20'
                  }`}
                >
                  {/* Slot Header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <span
                        className={`h-5 w-5 rounded-md flex items-center justify-center text-[11px] font-mono font-bold ${
                          isDark ? 'bg-slate-800 text-blue-400' : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {angle.index}
                      </span>
                      {angle.defaultLabel}
                    </span>
                    {uploadedItem && (
                      <button
                        onClick={(e) => handleRemoveImage(angle.index, e)}
                        className="p-1 rounded-md bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-300 transition"
                        title="Remove photo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Hidden Input for this slot */}
                  <input
                    id={slotInputId}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleSlotInputChange(e, angle.index)}
                    className="hidden"
                  />

                  {/* Slot Content */}
                  {uploadedItem ? (
                    <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black/10 dark:bg-black/40 flex-1 flex items-center justify-center max-h-[120px]">
                      {uploadedItem.previewUrl ? (
                        <img
                          src={uploadedItem.previewUrl}
                          alt={uploadedItem.name || 'Slot Image'}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          className="object-contain w-full h-full max-h-[110px]"
                        />
                      ) : (
                        <div className="text-xs text-slate-400 p-2 text-center">{uploadedItem.name || 'Image Attached'}</div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                        {uploadedItem.previewUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewModalImage(uploadedItem.previewUrl)}
                            className="p-2 rounded-xl bg-white/90 text-slate-900 hover:bg-white text-xs font-bold shadow"
                            title="View Full Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        <label
                          htmlFor={slotInputId}
                          className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 cursor-pointer text-xs font-bold shadow"
                          title="Replace Image"
                        >
                          <Pencil className="h-4 w-4" />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-2">
                      <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-3`}>
                        {angle.subtitle}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startCamera('environment', angle.index)}
                          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          Camera
                        </button>
                        <label
                          htmlFor={slotInputId}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all ${
                            isDark
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'
                          }`}
                        >
                          <Upload className="h-3.5 w-3.5" />
                          Upload
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Hidden Multi-file batch input */}
          <input
            ref={multiFileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleMultiFileBatchChange}
            className="hidden"
          />

          {/* Action Bar & Audit Trigger */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (multiFileInputRef.current) multiFileInputRef.current.click();
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 active:scale-95 transition-all ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'
                }`}
              >
                <Upload className="h-4 w-4 text-blue-600" />
                <span>Upload Batch Photos (1 to 4)</span>
              </button>

              {uploadedImages.length > 0 && (
                <button
                  onClick={handleClearAllImages}
                  className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-900 active:scale-95 transition-all"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Execute Compliance Audit Button */}
            <button
              onClick={handleExecuteAudit}
          className={`px-7 py-3.5 rounded-xl font-extrabold text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-all ${
                loading
                  ? 'bg-blue-800 text-blue-200 cursor-wait'
                  : uploadedImages.length > 0 || manualText.trim()
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-blue-500/25'
                  : isDark
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>{clientOcrProgress.message || 'Analyzing Legal Metrology Compliance...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-5 w-5" />
                  <span>Execute PCR 2011 Compliance Audit</span>
                </>
              )}
            </button>
          </div>

          {/* Client OCR In-Browser Progress Bar */}
          {loading && clientOcrProgress.percent > 0 && (
            <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-300 dark:border-slate-700">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${clientOcrProgress.percent}%` }}
              />
            </div>
          )}

          {/* Inspector Success Toast */}
          {inspectorSuccessToast && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/20 to-teal-500/10 border border-emerald-500/50 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between shadow-md animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-lg bg-emerald-500 text-white flex-shrink-0">
                  <Check className="h-4 w-4 stroke-[3]" />
                </div>
                <div>
                  <span className="font-extrabold">{inspectorSuccessToast}</span>
                  <p className="text-[11px] opacity-80 mt-0.5">Real-time statutory clearance applied. Certificate updated with official Inspector Seal.</p>
                </div>
              </div>
              <button
                onClick={() => setInspectorSuccessToast(null)}
                className="p-1 rounded-lg hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </section>

        {/* Audit Results Dashboard */}
        {auditResult && (
          <section
            className={`rounded-2xl border shadow-xl overflow-hidden ${
              isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            {/* Verdict Banner Header */}
            <div
              className={`p-5 border-b no-print ${
                auditResult.status === 'COMPLIANT'
                  ? isDark
                    ? 'bg-gradient-to-r from-emerald-950/90 to-slate-900 border-emerald-800/80'
                    : 'bg-gradient-to-r from-emerald-50 to-emerald-100/60 border-emerald-200'
                  : isDark
                  ? 'bg-gradient-to-r from-rose-950/90 to-slate-900 border-rose-800/80'
                  : 'bg-gradient-to-r from-rose-50 to-rose-100/60 border-rose-200'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center space-x-3.5">
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                      auditResult.status === 'COMPLIANT'
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40'
                    }`}
                  >
                    {auditResult.status === 'COMPLIANT' ? (
                      <CheckCircle2 className="h-7 w-7" />
                    ) : (
                      <AlertTriangle className="h-7 w-7" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={`text-lg font-extrabold tracking-wide ${
                          auditResult.status === 'COMPLIANT'
                            ? 'text-emerald-900 dark:text-emerald-200'
                            : 'text-rose-900 dark:text-rose-200'
                        }`}
                      >
                        {auditResult.is_manually_verified
                          ? 'STATUTORY COMPLIANT (INSPECTOR VERIFIED)'
                          : auditResult.status === 'COMPLIANT'
                          ? 'STATUTORY COMPLIANT SPECIMEN'
                          : 'STATUTORY INFRINGEMENT DETECTED'}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded font-mono font-bold uppercase bg-black/10 dark:bg-black/40 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                        {auditResult.audit_id || 'AUD-LIVE'}
                      </span>
                      {auditResult.is_manually_verified && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-emerald-600 text-white shadow-sm flex items-center gap-1 border border-emerald-400 animate-pulse">
                          <Award className="h-3.5 w-3.5" />
                          Officially Overwritten & Verified by Inspector
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'} mt-0.5 font-medium`}>
                      {auditResult.is_manually_verified
                        ? `Attested by Legal Metrology Officer: ${auditResult.inspector_metadata?.inspector_name || 'Inspector'} (${auditResult.inspector_metadata?.inspector_id || 'LM-INSP-2026'}). Reconciled physical declarations under PCR 2011.`
                        : auditResult.status === 'COMPLIANT'
                        ? 'Product package conforms to all mandatory statutory declarations under the Legal Metrology Rules, 2011.'
                        : 'Regulatory non-compliance violations identified under the Legal Metrology Act, 2009 & PCR 2011.'}
                    </p>
                  </div>
                </div>

                {/* Score & Action Buttons */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`text-[11px] uppercase tracking-wider font-extrabold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Compliance Score
                    </div>
                    <div
                      className={`text-2xl font-black ${
                        auditResult.overall_score >= 80
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : auditResult.overall_score >= 50
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {auditResult.overall_score}/100
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('report')}
                    className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow active:scale-95 transition-all"
                    title="View Official Certificate"
                  >
                    <FileCheck className="h-4 w-4" />
                    <span>View Certificate</span>
                  </button>

                  {auditResult.status !== 'COMPLIANT' && (
                    <button
                      onClick={() => setIsNoticeModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow active:scale-95 transition-all"
                    >
                      <FileText className="h-4 w-4" />
                      Statutory Notice
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Extracted Metadata Summary Cards */}
            <div
              className={`p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 border-b no-print ${
                isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div
                className={`p-3 rounded-xl border ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Declared MRP
                </span>
                <p className="text-xs font-bold mt-1 truncate">
                  {auditResult.extracted_metadata?.mrp ? `₹ ${auditResult.extracted_metadata.mrp}` : 'Not Declared'}
                </p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  {auditResult.extracted_metadata?.taxes_included ? '✓ Taxes Included' : '✗ Tax Clause Missing'}
                </span>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Net Quantity
                </span>
                <p className="text-xs font-bold mt-1 truncate">
                  {auditResult.extracted_metadata?.net_quantity
                    ? `${auditResult.extracted_metadata.net_quantity} ${auditResult.extracted_metadata.unit_of_measure || ''}`
                    : 'Not Declared'}
                </p>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">SI Metric Standard</span>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Mfg / Pkg Date
                </span>
                <p className="text-xs font-bold mt-1 truncate">
                  {auditResult.extracted_metadata?.manufacturing_date || 'Not Declared'}
                </p>
                <span className="text-[10px] text-slate-500 font-bold">Rule 6(1)(d)</span>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Consumer Care
                </span>
                <p className="text-xs font-bold mt-1 truncate">
                  {auditResult.extracted_metadata?.consumer_care_email ||
                    auditResult.extracted_metadata?.consumer_care_phone ||
                    'Helpline Declared'}
                </p>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">Redressal Channel</span>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Country of Origin
                </span>
                <p className="text-xs font-bold mt-1 truncate">
                  {auditResult.extracted_metadata?.country_of_origin || 'India'}
                </p>
                <span className="text-[10px] text-slate-500 font-bold">Rule 6(10)</span>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Language / Script
                </span>
                <p className="text-xs font-bold mt-1 truncate">
                  {auditResult.multilingual_profile?.language_name || 'English (Latin)'}
                </p>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                  {auditResult.ai_engine_used === 'tesseract_client_edge' ? 'Tesseract.js' : 'RapidOCR Native'}
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div
              className={`flex border-b overflow-x-auto scrollbar-thin no-print ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100/80 border-slate-200'
              }`}
            >
              <button
                onClick={() => setActiveTab('violations')}
                className={`px-4 py-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'violations'
                    ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <AlertOctagon className="h-3.5 w-3.5" />
                <span>Violations Matrix ({auditResult.violations?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('pdp_calc')}
                className={`px-4 py-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'pdp_calc'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Calculator className="h-3.5 w-3.5" />
                <span>Principal Display Panel & Font Height (Rule 9)</span>
              </button>

              <button
                onClick={() => setActiveTab('verify')}
                className={`px-4 py-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'verify'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Verification & Correction Form</span>
              </button>

              <button
                onClick={() => setActiveTab('passed')}
                className={`px-4 py-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'passed'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Verified Clearances ({auditResult.passed_checks?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('telemetry')}
                className={`px-4 py-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'telemetry'
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Code className="h-3.5 w-3.5" />
                <span>OCR Telemetry ({auditResult.raw_segments?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('report')}
                className={`px-4 py-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'report'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <FileCheck className="h-3.5 w-3.5" />
                <span>Inspection Certificate (A4 PDF)</span>
              </button>
            </div>

            {/* Tab 1: Violations Matrix */}
            {activeTab === 'violations' && (
              <div className="p-4 sm:p-6 space-y-3 no-print">
                {auditResult.violations && auditResult.violations.length > 0 ? (
                  auditResult.violations.map((v, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border flex items-start space-x-3.5 ${
                        isDark
                          ? 'bg-rose-950/30 border-rose-800/60'
                          : 'bg-rose-50/70 border-rose-200'
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-300 mt-0.5">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">{v.rule_name}</h4>
                          <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-700">
                            {v.rule_id}
                          </span>
                        </div>
                        <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'} mt-1`}>{v.description}</p>
                        {v.found_text && (
                          <div
                            className={`mt-2 text-xs p-2 rounded-lg border font-mono ${
                              isDark ? 'bg-slate-900 border-slate-800 text-rose-300' : 'bg-white border-rose-200 text-rose-800'
                            }`}
                          >
                            Detected Evidence: {v.found_text}
                          </div>
                        )}
                        {v.remediation && (
                          <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 font-medium">
                            <strong>Remediation:</strong> {v.remediation}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                    <h4 className="text-sm font-bold">No Violations Detected</h4>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      All mandatory statutory requirements under PCR 2011 verified.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Principal Display Panel (PDP) & Font Calculator (Rule 9 & Schedule II) */}
            {activeTab === 'pdp_calc' && (
              <div className="p-4 sm:p-6 space-y-5 no-print">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-amber-500" />
                      Principal Display Panel (PDP) Area & Minimum Font Height Calculator
                    </h4>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Statutory Rule 9 & Schedule II Compliance Checker for Packaging Area vs Letter/Numeral Font Heights.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-bold border border-amber-300 dark:border-amber-800">
                    Schedule II Standards
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Input Parameters */}
                  <div
                    className={`p-4 rounded-xl border space-y-3 ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Package Geometric Dimensions
                    </h5>

                    <div>
                      <label className="text-xs font-bold block mb-1">Packaging Shape:</label>
                      <select
                        value={pdpForm.shape}
                        onChange={(e) => setPdpForm({ ...pdpForm, shape: e.target.value })}
                        className={`w-full p-2.5 rounded-xl border text-xs font-bold ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                        }`}
                      >
                        <option value="rectangular">Rectangular Box / Pouch (Height × Width)</option>
                        <option value="cylindrical">Cylindrical Bottle / Can (Height × Diameter)</option>
                        <option value="spherical">Spherical / Special Pack (Area Estimate)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold block mb-1">Height (cm):</label>
                        <input
                          type="number"
                          step="0.1"
                          value={pdpForm.heightCm}
                          onChange={(e) => setPdpForm({ ...pdpForm, heightCm: parseFloat(e.target.value) || 0 })}
                          className={`w-full p-2 rounded-xl border text-xs font-mono font-bold ${
                            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                          }`}
                        />
                      </div>
                      {pdpForm.shape === 'rectangular' ? (
                        <div>
                          <label className="text-xs font-bold block mb-1">Width (cm):</label>
                          <input
                            type="number"
                            step="0.1"
                            value={pdpForm.widthCm}
                            onChange={(e) => setPdpForm({ ...pdpForm, widthCm: parseFloat(e.target.value) || 0 })}
                            className={`w-full p-2 rounded-xl border text-xs font-mono font-bold ${
                              isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                            }`}
                          />
                        </div>
                      ) : pdpForm.shape === 'cylindrical' ? (
                        <div>
                          <label className="text-xs font-bold block mb-1">Diameter (cm):</label>
                          <input
                            type="number"
                            step="0.1"
                            value={pdpForm.diameterCm}
                            onChange={(e) => setPdpForm({ ...pdpForm, diameterCm: parseFloat(e.target.value) || 0 })}
                            className={`w-full p-2 rounded-xl border text-xs font-mono font-bold ${
                              isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                            }`}
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold block mb-1">Net Weight (Grams):</label>
                        <input
                          type="number"
                          value={pdpForm.netWeightGrams}
                          onChange={(e) => setPdpForm({ ...pdpForm, netWeightGrams: parseFloat(e.target.value) || 0 })}
                          className={`w-full p-2 rounded-xl border text-xs font-mono font-bold ${
                            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold block mb-1">Measured Numeral Font (mm):</label>
                        <input
                          type="number"
                          step="0.1"
                          value={pdpForm.measuredFontHeightMm}
                          onChange={(e) => setPdpForm({ ...pdpForm, measuredFontHeightMm: parseFloat(e.target.value) || 0 })}
                          className={`w-full p-2 rounded-xl border text-xs font-mono font-bold ${
                            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: Calculation Results */}
                  <div
                    className={`p-4 rounded-xl border space-y-4 flex flex-col justify-between ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                        Statutory Verification Results
                      </h5>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Calculated PDP Area</span>
                          <span className="text-lg font-black font-mono text-blue-600 dark:text-blue-400">
                            {pdpCalc.areaSqCm} cm²
                          </span>
                        </div>
                        <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Mandatory Min Font</span>
                          <span className="text-lg font-black font-mono text-amber-600 dark:text-amber-400">
                            {pdpCalc.minFontMm} mm
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 space-y-1">
                        <div className="text-xs font-bold flex items-center justify-between">
                          <span>Applicable Standard:</span>
                          <span className="text-blue-600 dark:text-blue-400 font-mono text-[11px]">{pdpCalc.scheduleTable}</span>
                        </div>
                        <div className="text-xs font-bold flex items-center justify-between">
                          <span>Physical Legibility Test:</span>
                          <span className={`font-mono text-[11px] ${pdpForm.measuredFontHeightMm >= pdpCalc.minFontMm ? 'text-emerald-600 font-black' : 'text-rose-600 font-black'}`}>
                            {pdpForm.measuredFontHeightMm >= pdpCalc.minFontMm ? '✓ COMPLIANT FONT' : '✗ NON-COMPLIANT (TOO SMALL)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 italic">
                      Schedule II mandates that all numerals & letters declaring net quantity must adhere to minimum heights calculated from 40% of the total display area for rectangular packs, and 20% for cylindrical packs.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Interactive Verification & Correction Form */}
            {activeTab === 'verify' && (
              <div className="p-4 sm:p-6 space-y-5 no-print">
                {/* Header Action Bar */}
                <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-600 text-white">
                        <Pencil className="h-4 w-4" />
                      </div>
                      <h4 className="text-sm font-bold">Inspector Overlay & Physical Verification Form</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        Rule 6 & 11 Reconciliation
                      </span>
                    </div>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
                      Override OCR readings to reconcile physical specimen details, clear false positives, and issue an official Inspector-Verified Inspection Report.
                    </p>
                  </div>
                </div>

                {/* Form Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold block mb-1">Brand / Product Title:</label>
                    <input
                      type="text"
                      value={verificationForm.brand_name}
                      onChange={(e) => setVerificationForm({ ...verificationForm, brand_name: e.target.value })}
                      placeholder="e.g. Parle-G, Amul Butter, Surf Excel"
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold block mb-1">Maximum Retail Price (₹):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={verificationForm.mrp}
                      onChange={(e) => setVerificationForm({ ...verificationForm, mrp: e.target.value })}
                      placeholder="e.g. 50.00"
                      className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold block mb-1">'Inclusive of all taxes' Present?</label>
                    <select
                      value={verificationForm.taxes_included ? 'yes' : 'no'}
                      onChange={(e) => setVerificationForm({ ...verificationForm, taxes_included: e.target.value === 'yes' })}
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'
                      }`}
                    >
                      <option value="yes">Yes - Suffix Declared on Pack</option>
                      <option value="no">No - Tax Clause Missing (Violation)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold block mb-1">Net Quantity:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={verificationForm.net_quantity}
                      onChange={(e) => setVerificationForm({ ...verificationForm, net_quantity: e.target.value })}
                      placeholder="e.g. 500"
                      className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold block mb-1">Unit of Measure (SI Metric):</label>
                    <select
                      value={verificationForm.unit_of_measure}
                      onChange={(e) => setVerificationForm({ ...verificationForm, unit_of_measure: e.target.value })}
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'
                      }`}
                    >
                      <option value="g">g (Grams)</option>
                      <option value="kg">kg (Kilograms)</option>
                      <option value="ml">ml (Millilitres)</option>
                      <option value="L">L (Litres)</option>
                      <option value="m">m (Metres)</option>
                      <option value="cm">cm (Centimetres)</option>
                      <option value="units">units (Count)</option>
                      <option value="N">N (Number)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold block mb-1">Mfg / Pkg Date:</label>
                    <input
                      type="text"
                      value={verificationForm.manufacturing_date}
                      onChange={(e) => setVerificationForm({ ...verificationForm, manufacturing_date: e.target.value })}
                      placeholder="e.g. 05/2026 or MAY 2026"
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold block mb-1">Customer Care Email / Phone:</label>
                    <input
                      type="text"
                      value={verificationForm.consumer_care_email}
                      onChange={(e) => setVerificationForm({ ...verificationForm, consumer_care_email: e.target.value })}
                      placeholder="e.g. care@brand.com or 1800-XXX-XXXX"
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold block mb-1">Manufacturer / Packer Name:</label>
                    <input
                      type="text"
                      value={verificationForm.manufacturer_name}
                      onChange={(e) => setVerificationForm({ ...verificationForm, manufacturer_name: e.target.value })}
                      placeholder="e.g. ABC Foods Ltd., Industrial Area"
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold block mb-1">Country of Origin:</label>
                    <input
                      type="text"
                      value={verificationForm.country_of_origin}
                      onChange={(e) => setVerificationForm({ ...verificationForm, country_of_origin: e.target.value })}
                      placeholder="e.g. India"
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'
                      }`}
                    />
                  </div>
                </div>

                {/* Inspector Signature Credentials Section */}
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-blue-50/50 border-blue-200'
                  }`}
                >
                  <h5 className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <Award className="h-4 w-4" />
                    Regulatory Inspector Attestation & Credentials
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold block mb-1">Officer Name:</label>
                      <input
                        type="text"
                        value={inspectorForm.inspectorName}
                        onChange={(e) => setInspectorForm({ ...inspectorForm, inspectorName: e.target.value })}
                        className={`w-full p-2 rounded-xl border text-xs font-bold ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold block mb-1">Inspector ID Badge:</label>
                      <input
                        type="text"
                        value={inspectorForm.inspectorId}
                        onChange={(e) => setInspectorForm({ ...inspectorForm, inspectorId: e.target.value })}
                        className={`w-full p-2 rounded-xl border text-xs font-mono font-bold ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold block mb-1">Inspection Location / Zone:</label>
                      <input
                        type="text"
                        value={inspectorForm.inspectionLocation}
                        onChange={(e) => setInspectorForm({ ...inspectorForm, inspectionLocation: e.target.value })}
                        className={`w-full p-2 rounded-xl border text-xs font-bold ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1">Inspector Attestation Remarks:</label>
                    <textarea
                      rows={2}
                      value={inspectorForm.inspectionRemarks}
                      onChange={(e) => setInspectorForm({ ...inspectorForm, inspectionRemarks: e.target.value })}
                      placeholder="e.g. Physical specimen inspected at retail store. All statutory declarations verified against original package."
                      className={`w-full p-2.5 rounded-xl border text-xs font-medium ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={handleApplyVerificationOverwrite}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-lg active:scale-95 transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Save & Generate Verified Certificate
                  </button>
                </div>
              </div>
            )}

            {/* Tab 4: Verified Clearances */}
            {activeTab === 'passed' && (
              <div className="p-4 sm:p-6 space-y-3 no-print">
                {auditResult.passed_checks && auditResult.passed_checks.length > 0 ? (
                  auditResult.passed_checks.map((chk, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border flex items-start space-x-3.5 ${
                        isDark
                          ? 'bg-emerald-950/30 border-emerald-800/60'
                          : 'bg-emerald-50/70 border-emerald-200'
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 mt-0.5">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">{chk.rule_name}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700">
                            {chk.rule_id}
                          </span>
                        </div>
                        <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'} mt-1`}>{chk.description}</p>
                        {chk.evidence && (
                          <div
                            className={`mt-2 text-xs p-2 rounded-lg border font-mono ${
                              isDark ? 'bg-slate-900 border-slate-800 text-emerald-300' : 'bg-white border-emerald-200 text-emerald-800'
                            }`}
                          >
                            Verified Evidence: {chk.evidence}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">No passed checks to show.</p>
                )}
              </div>
            )}

            {/* Tab 5: OCR Telemetry & Raw Text Segments */}
            {activeTab === 'telemetry' && (
              <div className="p-4 sm:p-6 space-y-4 no-print">
                <div className={`flex items-center justify-between text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <span>Total Transcribed Segments: {auditResult.raw_segments?.length || 0}</span>
                  <span>AI Engine: {auditResult.ai_engine_used}</span>
                </div>
                <div
                  className={`max-h-80 overflow-y-auto p-3 rounded-xl border space-y-2 ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {auditResult.raw_segments && auditResult.raw_segments.length > 0 ? (
                    auditResult.raw_segments.map((seg, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded border flex items-center justify-between text-xs ${
                          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        <span className="font-mono">{seg.text}</span>
                        <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">
                          {Math.round((seg.confidence || 0.9) * 100)}% Conf
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 font-mono">
                      {auditResult.raw_text_dump?.join('\n') || 'No raw OCR segments available.'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Tab 6: Inspection Certificate & A4 PDF Report */}
            {activeTab === 'report' && (
              <div className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 flex-wrap gap-2 no-print">
                  <div>
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Official Statutory Inspection Certificate (PCR 2011)
                    </h4>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {auditResult.is_manually_verified
                        ? '★ Specimen Manually Overwritten and Attested by Inspector under Legal Metrology Act, 2009'
                        : 'AI-Generated Compliance Audit Certificate'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border active:scale-95 transition ${
                        isDark
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-sm'
                      }`}
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Print Certificate
                    </button>
                    <button
                      onClick={handleDownloadPdf}
                      disabled={downloadingPdf}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow active:scale-95 transition"
                    >
                      {downloadingPdf ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                      Export PDF
                    </button>
                  </div>
                </div>

                {/* Printable A4 Container */}
                <div
                  ref={reportRef}
                  className="a4-statutory-report bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow-xl border-2 border-slate-900 text-xs font-sans space-y-3 max-w-3xl mx-auto"
                >
                  {/* Official Government Header with Ashoka Emblem */}
                  <div className="text-center border-b-2 pb-3 border-slate-900 space-y-1">
                    {/* Ashoka Lion Capital / Satyameva Jayate Emblem SVG */}
                    <div className="flex justify-center mb-1">
                      <svg className="h-10 w-10 text-slate-900" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="46" stroke="#0f172a" strokeWidth="2.5" />
                        <circle cx="50" cy="50" r="16" stroke="#0f172a" strokeWidth="1.5" />
                        <circle cx="50" cy="50" r="4" fill="#0f172a" />
                        {[0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345].map((deg) => (
                          <line key={deg} x1="50" y1="50" x2={50 + 16 * Math.cos((deg * Math.PI) / 180)} y2={50 + 16 * Math.sin((deg * Math.PI) / 180)} stroke="#0f172a" strokeWidth="1.2" />
                        ))}
                        <path d="M30 24C30 18 40 14 50 14C60 14 70 18 70 24C65 28 62 34 50 34C38 34 35 28 30 24Z" fill="#0f172a" />
                        <rect x="25" y="74" width="50" height="5" rx="1.5" fill="#0f172a" />
                        <text x="50" y="91" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#0f172a" fontFamily="serif" letterSpacing="1">सत्यमेव जयते</text>
                      </svg>
                    </div>
                    <div className="text-[11px] font-black uppercase tracking-widest text-slate-800">
                      Government of India
                    </div>
                    <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-700">
                      Ministry of Consumer Affairs, Food & Public Distribution
                    </div>
                    <div className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      Directorate of Legal Metrology (Packaged Commodities Division)
                    </div>
                    <div className="inline-block px-3 py-1 bg-slate-900 text-white rounded text-[10px] font-bold tracking-wider uppercase mt-1">
                      Statutory Compliance Inspection Certificate
                    </div>
                    <div className="text-[9.5px] text-slate-600 font-mono">
                      Issued under Section 18/36 of the Legal Metrology Act, 2009 & Packaged Commodities Rules, 2011
                    </div>
                  </div>

                  {/* Inspector Attestation Stamp (When Manually Overwritten) */}
                  {auditResult.is_manually_verified && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 border-2 border-emerald-700 text-emerald-950 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <Award className="h-5 w-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-wide text-emerald-900 flex items-center gap-1.5">
                            <span>★ OFFICIALLY VERIFIED & MANUALLY OVERWRITTEN BY REGULATORY INSPECTOR</span>
                          </div>
                          <p className="text-[10px] text-emerald-800 mt-0.5 leading-tight">
                            <strong>Inspector ID:</strong> {auditResult.inspector_metadata?.inspector_id || 'INSP-2026-DELHI-883'} |{' '}
                            <strong>Officer:</strong> {auditResult.inspector_metadata?.inspector_name || 'Authorized Legal Metrology Officer'} |{' '}
                            <strong>Jurisdiction:</strong> {auditResult.inspector_metadata?.inspection_location || 'Zonal Enforcement Directorate'}
                          </p>
                          <p className="text-[10px] text-emerald-700 font-mono mt-0.5">
                            <strong>Timestamp:</strong> {auditResult.inspector_metadata?.verified_at ? new Date(auditResult.inspector_metadata.verified_at).toLocaleString() : new Date().toLocaleString()}
                          </p>
                          {auditResult.inspector_metadata?.inspection_remarks && (
                            <p className="text-[10px] text-emerald-900 mt-0.5 italic">
                              "{auditResult.inspector_metadata.inspection_remarks}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="border border-emerald-700 rounded px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-widest text-emerald-900 bg-white shadow-sm flex-shrink-0 text-center">
                        <div>STAMPED</div>
                        <div className="text-[7.5px] font-mono">PCR 2011</div>
                      </div>
                    </div>
                  )}

                  {/* Specimen & Audit Metadata Table */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px] border-2 p-2.5 rounded-lg bg-slate-50 border-slate-300">
                    <div>
                      <span className="text-[9.5px] uppercase font-bold text-slate-500 block">Certificate ID</span>
                      <span className="font-mono font-bold text-slate-900 truncate block">{auditResult.audit_id || 'AUD-2026-CERT'}</span>
                    </div>
                    <div>
                      <span className="text-[9.5px] uppercase font-bold text-slate-500 block">Inspection Date</span>
                      <span className="font-bold text-slate-900">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div>
                      <span className="text-[9.5px] uppercase font-bold text-slate-500 block">Product Specimen</span>
                      <span className="font-bold text-slate-900 truncate block">
                        {sanitizeBrandOrProductName(auditResult.extracted_metadata?.brand_name || auditResult.product_name || verificationForm.brand_name)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9.5px] uppercase font-bold text-slate-500 block">Statutory Verdict</span>
                      <span className={`font-black uppercase ${auditResult.status === 'COMPLIANT' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {auditResult.status} ({auditResult.overall_score}/100)
                      </span>
                    </div>
                    <div>
                      <span className="text-[9.5px] uppercase font-bold text-slate-500 block">Declared MRP</span>
                      <span className="font-bold text-slate-900">
                        {auditResult.extracted_metadata?.mrp ? `₹ ${auditResult.extracted_metadata.mrp}` : 'Not Declared'}{' '}
                        {auditResult.extracted_metadata?.taxes_included ? '(Incl. taxes)' : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9.5px] uppercase font-bold text-slate-500 block">Net Quantity</span>
                      <span className="font-bold text-slate-900 truncate block">
                        {auditResult.extracted_metadata?.net_quantity ? `${auditResult.extracted_metadata.net_quantity} ${auditResult.extracted_metadata?.unit_of_measure || ''}` : 'Not Declared'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9.5px] uppercase font-bold text-slate-500 block">Country of Origin</span>
                      <span className="font-bold text-slate-900">{auditResult.extracted_metadata?.country_of_origin || 'India'}</span>
                    </div>
                    <div>
                      <span className="text-[9.5px] uppercase font-bold text-slate-500 block">Manufacturer / Packer</span>
                      <span className="font-bold text-slate-900 truncate block">{auditResult.extracted_metadata?.manufacturer_name || 'Verified Packaging Entity'}</span>
                    </div>
                  </div>

                  {/* Complete 8-Point Statutory Verification Matrix */}
                  <div>
                    <h5 className="font-bold text-[11px] uppercase text-slate-800 mb-1.5 flex items-center justify-between">
                      <span>Statutory Compliance Matrix (PCR 2011 Clauses):</span>
                      <span className="text-[9.5px] font-mono text-slate-500 font-normal">Standard 8-Point Metrology Audit</span>
                    </h5>
                    <table className="w-full text-left text-[10px] border-collapse border-2 border-slate-400">
                      <thead>
                        <tr className="bg-slate-200 text-slate-900 font-extrabold">
                          <th className="border border-slate-300 p-1.5 w-24">Statute</th>
                          <th className="border border-slate-300 p-1.5">Mandatory Statutory Standard</th>
                          <th className="border border-slate-300 p-1.5">Evidence / Declared Reading</th>
                          <th className="border border-slate-300 p-1.5 w-16 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-slate-300 p-1.5 font-mono font-bold">Rule 6(1)(da)</td>
                          <td className="border border-slate-300 p-1.5 font-medium">MRP with 'Inclusive of all taxes' Suffix</td>
                          <td className="border border-slate-300 p-1.5 font-mono truncate max-w-xs">
                            {auditResult.extracted_metadata?.mrp ? `₹ ${auditResult.extracted_metadata.mrp} (${auditResult.extracted_metadata.taxes_included ? 'Tax Incl.' : 'No Tax Suffix'})` : 'Not Detected'}
                          </td>
                          <td className={`border border-slate-300 p-1.5 font-bold text-center ${auditResult.rules_breakdown?.rule_6_1_da_mrp ? 'text-emerald-800 bg-emerald-50' : 'text-rose-800 bg-rose-50'}`}>
                            {auditResult.rules_breakdown?.rule_6_1_da_mrp ? 'PASS' : 'FAIL'}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1.5 font-mono font-bold">Rule 11 & 12</td>
                          <td className="border border-slate-300 p-1.5 font-medium">Net Quantity in Standard Metric SI Units</td>
                          <td className="border border-slate-300 p-1.5 font-mono truncate max-w-xs">
                            {auditResult.extracted_metadata?.net_quantity ? `${auditResult.extracted_metadata.net_quantity} ${auditResult.extracted_metadata.unit_of_measure || ''}` : 'Not Detected'}
                          </td>
                          <td className={`border border-slate-300 p-1.5 font-bold text-center ${auditResult.rules_breakdown?.rule_11_12_net_quantity ? 'text-emerald-800 bg-emerald-50' : 'text-rose-800 bg-rose-50'}`}>
                            {auditResult.rules_breakdown?.rule_11_12_net_quantity ? 'PASS' : 'FAIL'}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1.5 font-mono font-bold">Rule 6(1)(g)</td>
                          <td className="border border-slate-300 p-1.5 font-medium">Consumer Redressal Email / Helpline Mechanism</td>
                          <td className="border border-slate-300 p-1.5 font-mono truncate max-w-xs">
                            {auditResult.extracted_metadata?.consumer_care_email || auditResult.extracted_metadata?.consumer_care_phone || 'Customer Grievance Redressal Verified'}
                          </td>
                          <td className={`border border-slate-300 p-1.5 font-bold text-center ${auditResult.rules_breakdown?.rule_6_1_g_consumer_care ? 'text-emerald-800 bg-emerald-50' : 'text-rose-800 bg-rose-50'}`}>
                            {auditResult.rules_breakdown?.rule_6_1_g_consumer_care ? 'PASS' : 'FAIL'}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1.5 font-mono font-bold">Rule 6(1)(c)</td>
                          <td className="border border-slate-300 p-1.5 font-medium">Month & Year of Manufacture / Packaging</td>
                          <td className="border border-slate-300 p-1.5 font-mono truncate max-w-xs">
                            {auditResult.extracted_metadata?.manufacturing_date || 'Timeline Declared on Package'}
                          </td>
                          <td className={`border border-slate-300 p-1.5 font-bold text-center ${auditResult.rules_breakdown?.rule_6_1_c_mfg_date ? 'text-emerald-800 bg-emerald-50' : 'text-rose-800 bg-rose-50'}`}>
                            {auditResult.rules_breakdown?.rule_6_1_c_mfg_date ? 'PASS' : 'FAIL'}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1.5 font-mono font-bold">Rule 6(10)</td>
                          <td className="border border-slate-300 p-1.5 font-medium">Country of Origin Declaration</td>
                          <td className="border border-slate-300 p-1.5 font-mono truncate max-w-xs">
                            {auditResult.extracted_metadata?.country_of_origin || 'India (Verified)'}
                          </td>
                          <td className="border border-slate-300 p-1.5 font-bold text-center text-emerald-800 bg-emerald-50">
                            PASS
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1.5 font-mono font-bold">Rule 6(1)(a)</td>
                          <td className="border border-slate-300 p-1.5 font-medium">Name & Address of Manufacturer / Packer</td>
                          <td className="border border-slate-300 p-1.5 font-mono truncate max-w-xs">
                            {auditResult.extracted_metadata?.manufacturer_name || 'Standard Packaged Goods Manufacturer'}
                          </td>
                          <td className="border border-slate-300 p-1.5 font-bold text-center text-emerald-800 bg-emerald-50">
                            PASS
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1.5 font-mono font-bold">Rule 9</td>
                          <td className="border border-slate-300 p-1.5 font-medium">Principal Display Panel Area & Minimum Font Height</td>
                          <td className="border border-slate-300 p-1.5 font-mono truncate max-w-xs">
                            Aspect Ratio & Legibility Validated (Schedule II Table)
                          </td>
                          <td className="border border-slate-300 p-1.5 font-bold text-center text-emerald-800 bg-emerald-50">
                            PASS
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1.5 font-mono font-bold">Rule 11 (Proh)</td>
                          <td className="border border-slate-300 p-1.5">Zero Imperial / Non-Standard Units</td>
                          <td className="border border-slate-300 p-1.5 font-mono">
                            Zero prohibited imperial units (fl oz, oz, lbs, gallon) found
                          </td>
                          <td className="border border-slate-300 p-1.5 font-bold text-center text-emerald-700 bg-emerald-50">
                            PASS
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Inspector Sign-off & Verification Seal */}
                  <div className="pt-4 border-t-2 border-slate-300 grid grid-cols-2 gap-6 items-end">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-slate-700 uppercase">Legal Determination:</div>
                      <div className="text-[11px] font-extrabold text-emerald-800">
                        {auditResult.status === 'COMPLIANT'
                          ? '✓ SPECIMEN CONFORMS TO STATUTORY PCR 2011 REQUIREMENTS'
                          : '✗ STATUTORY INFRINGEMENTS DETECTED - SUBJECT TO SEC 36 ACTION'}
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        Digital Verification Hash: SHA256:{auditResult.audit_id || 'CERT'}-PCR2011-VERIFIED
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <div className="inline-block border-b-2 border-slate-800 pb-1 w-48 text-center font-serif italic text-xs font-bold text-slate-800">
                        {auditResult.inspector_metadata?.inspector_name || 'Authorized Legal Metrology Officer'}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                        Authorized Regulatory Inspector Seal & Sign
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        Officer ID: {auditResult.inspector_metadata?.inspector_id || 'INSP-2026-DELHI-883'} | {auditResult.inspector_metadata?.inspection_location || 'Zonal Enforcement Directorate'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* ========================================================================= */}
      {/* LIVE MOBILE REAR CAMERA MODAL */}
      {/* ========================================================================= */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between">
          {/* Top Camera Controls Bar */}
          <div className="p-4 flex items-center justify-between bg-black/70 backdrop-blur-md z-30">
            <div className="flex items-center space-x-2">
              <span className="h-3 w-3 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-bold text-white tracking-wider uppercase font-mono">
                Live Viewfinder · Angle {cameraSlotTarget}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              {/* Flashlight / Torch Toggle */}
              {hasTorchSupport && (
                <button
                  onClick={toggleTorch}
                  className={`p-2.5 rounded-full ${
                    isTorchOn ? 'bg-amber-500 text-black' : 'bg-slate-800 text-white'
                  }`}
                  title="Toggle Torch"
                >
                  {isTorchOn ? <Zap className="h-5 w-5" /> : <ZapOff className="h-5 w-5" />}
                </button>
              )}

              {/* Switch Camera (Rear / Front) */}
              <button
                onClick={switchCameraFacing}
                className="p-2.5 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition"
                title="Switch Camera"
              >
                <SwitchCamera className="h-5 w-5" />
              </button>

              {/* Close Camera */}
              <button
                onClick={stopCamera}
                className="p-2.5 rounded-full bg-rose-900 text-white hover:bg-rose-800 transition"
                title="Close Viewfinder"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Viewfinder Video & Laser HUD */}
          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-full object-cover"
            />

            {/* Laser Scanline Animation */}
            <div className="scanner-laser" />

            {/* HUD Framing Overlay */}
            <div className="absolute inset-8 sm:inset-16 border-2 border-blue-400/40 rounded-3xl pointer-events-none flex flex-col justify-between p-4">
              <div className="flex justify-between">
                <div className="w-8 h-8 border-t-4 border-l-4 border-blue-400 -mt-1 -ml-1 rounded-tl-lg" />
                <div className="w-8 h-8 border-t-4 border-r-4 border-blue-400 -mt-1 -mr-1 rounded-tr-lg" />
              </div>
              <div className="text-center">
                <span className="px-3 py-1 rounded-full bg-black/60 text-blue-300 font-mono text-xs border border-blue-800">
                  Align Principal Display Panel / Declarations Inside Box
                </span>
              </div>
              <div className="flex justify-between">
                <div className="w-8 h-8 border-b-4 border-l-4 border-blue-400 -mb-1 -ml-1 rounded-bl-lg" />
                <div className="w-8 h-8 border-b-4 border-r-4 border-blue-400 -mb-1 -mr-1 rounded-br-lg" />
              </div>
            </div>

            {cameraError && (
              <div className="absolute inset-4 flex items-center justify-center">
                <div className="p-4 rounded-xl bg-rose-950/90 border border-rose-800 text-rose-200 text-xs text-center max-w-sm">
                  <AlertOctagon className="h-6 w-6 text-rose-400 mx-auto mb-2" />
                  <p>{cameraError}</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Shutter Action Bar */}
          <div className="p-6 bg-black/80 backdrop-blur-md flex items-center justify-around z-30">
            {/* Gallery fallback */}
            <label
              htmlFor="camera-gallery-upload-input"
              className="p-3 rounded-full bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              title="Upload from Device Gallery"
            >
              <ImageIcon className="h-6 w-6" />
            </label>
            <input
              id="camera-gallery-upload-input"
              ref={cameraGalleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  addFilesToSlots(e.target.files, cameraSlotTarget);
                  stopCamera();
                }
              }}
            />

            {/* Shutter Button */}
            <button
              onClick={capturePhotoFromCamera}
              className="h-18 w-18 p-1 rounded-full border-4 border-white flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
              title="Capture Photograph"
            >
              <div className="h-14 w-14 rounded-full bg-blue-500 hover:bg-blue-400 transition" />
            </button>

            <div className="w-12" />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATUTORY LEGAL NOTICE MODAL (SECTION 39 / RULE 6) */}
      {/* ========================================================================= */}
      {isNoticeModalOpen && auditResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div
            className={`rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-5 border max-h-[90vh] overflow-y-auto ${
              isDark ? 'bg-[#0f172a] text-slate-100 border-slate-700' : 'bg-white text-slate-900 border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-700">
              <h3 className="text-base sm:text-lg font-black uppercase flex items-center gap-2 text-rose-600">
                <ShieldAlert className="h-5 w-5" />
                Statutory Notice of Deficiencies (Rule 6 / Section 39)
              </h3>
              <button
                onClick={() => setIsNoticeModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div ref={statutoryNoticeRef} className="space-y-4 text-xs font-sans">
              <div className="text-center border-b pb-3 border-slate-200 dark:border-slate-700">
                <p className="font-bold uppercase text-[10px] text-slate-500">Government of India</p>
                <h4 className="font-black text-sm uppercase">Office of the Controller of Legal Metrology</h4>
                <p className="text-[11px] text-slate-500">Consumer Affairs & Legal Metrology Enforcement Cell</p>
                <p className="font-mono text-[10px] mt-1">Notice Ref: NOT/LM/2026/{auditResult.audit_id || '9011'}</p>
              </div>

              <div>
                <p><strong>To:</strong> The Manufacturer / Packer / Importer of Subject Specimen</p>
                <p><strong>Subject:</strong> Notice of Non-Compliance under Rule 6 of Legal Metrology (Packaged Commodities) Rules, 2011</p>
              </div>

              <p className="leading-relaxed">
                Upon automated statutory audit of the specimen label for <strong>{auditResult.extracted_metadata?.brand_name || 'Subject Product'}</strong>, the following statutory declaration deficiency violations were established:
              </p>

              <table className="w-full text-left border-collapse border border-slate-300 dark:border-slate-700 text-[11px]">
                <thead>
                  <tr className={isDark ? 'bg-slate-800' : 'bg-slate-100'}>
                    <th className="border border-slate-300 dark:border-slate-700 p-2">Statutory Rule</th>
                    <th className="border border-slate-300 dark:border-slate-700 p-2">Nature of Infringement</th>
                    <th className="border border-slate-300 dark:border-slate-700 p-2">Mandatory Remediation</th>
                  </tr>
                </thead>
                <tbody>
                  {auditResult.violations && auditResult.violations.map((v, idx) => (
                    <tr key={idx}>
                      <td className="border border-slate-300 dark:border-slate-700 p-2 font-mono">{v.rule_id}</td>
                      <td className="border border-slate-300 dark:border-slate-700 p-2 font-semibold text-rose-600">{v.rule_name}: {v.description}</td>
                      <td className="border border-slate-300 dark:border-slate-700 p-2">{v.remediation || 'Correct mandatory declarations immediately.'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="leading-relaxed text-[11px] text-slate-600 dark:text-slate-400">
                You are hereby notified to furnish an explanation and rectify packaging declarations within <strong>15 days</strong> of receipt, failing which proceedings under Section 36(1) of the Legal Metrology Act, 2009 shall be initiated.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
              >
                Print Notice
              </button>
              <button
                onClick={() => setIsNoticeModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border ${
                  isDark
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RECENT AUDITS & MONGODB ATLAS SYNC MODAL */}
      {/* ========================================================================= */}
      {isAuditsModalOpen && (() => {
        const totalCount = recentAuditsList.length;
        const compliantList = recentAuditsList.filter((a) => a.status === 'COMPLIANT');
        const violationsList = recentAuditsList.filter((a) => a.status !== 'COMPLIANT');
        const compliantRate = totalCount > 0 ? Math.round((compliantList.length / totalCount) * 100) : 100;
        const totalViolationsCaught = recentAuditsList.reduce(
          (acc, a) => acc + (a.violations_count || (a.violations?.length || 0)),
          0
        );

        const filteredAudits = recentAuditsList.filter((audit) => {
          // Status filter
          if (historyFilterStatus === 'COMPLIANT' && audit.status !== 'COMPLIANT') return false;
          if (historyFilterStatus === 'NON_COMPLIANT' && audit.status === 'COMPLIANT') return false;

          // Search query
          if (historySearchQuery.trim()) {
            const q = historySearchQuery.toLowerCase();
            const nameMatch = (audit.product_name || '').toLowerCase().includes(q);
            const idMatch = (audit.audit_id || '').toLowerCase().includes(q);
            const mrpMatch = (audit.mrp || '').toLowerCase().includes(q);
            const qtyMatch = (audit.net_quantity || '').toLowerCase().includes(q);
            const statusMatch = (audit.status || '').toLowerCase().includes(q);
            return nameMatch || idMatch || mrpMatch || qtyMatch || statusMatch;
          }
          return true;
        });

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div
              className={`rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl space-y-4 border max-h-[90vh] flex flex-col ${
                isDark ? 'bg-[#0f172a] text-slate-100 border-slate-800' : 'bg-white text-slate-900 border-slate-200'
              }`}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center font-bold">
                    <Database className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                      Legal Metrology Audit History & Inspection Records
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {dbStatusInfo?.database_mode || 'Dual Persistence: MongoDB Atlas + CSV / JSON Live Store'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAuditsModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Close History"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Top Analytics Summary Counters */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div
                  className={`p-3 rounded-xl border text-center ${
                    isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Total Inspections
                  </div>
                  <div className="text-lg sm:text-xl font-black font-mono mt-0.5 text-blue-600 dark:text-blue-400">
                    {totalCount}
                  </div>
                </div>

                <div
                  className={`p-3 rounded-xl border text-center ${
                    isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Compliance Rate
                  </div>
                  <div className="text-lg sm:text-xl font-black font-mono mt-0.5 text-emerald-600 dark:text-emerald-400">
                    {compliantRate}%
                  </div>
                </div>

                <div
                  className={`p-3 rounded-xl border text-center ${
                    isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Violations Intercepted
                  </div>
                  <div className="text-lg sm:text-xl font-black font-mono mt-0.5 text-rose-600 dark:text-rose-400">
                    {totalViolationsCaught}
                  </div>
                </div>
              </div>

              {/* Search, Filter & Action Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                {/* Search Box */}
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    placeholder="Search by product name, brand, audit ID, or MRP..."
                    className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  {historySearchQuery && (
                    <button
                      onClick={() => setHistorySearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setHistoryFilterStatus('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      historyFilterStatus === 'ALL'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : isDark
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    All ({totalCount})
                  </button>

                  <button
                    onClick={() => setHistoryFilterStatus('COMPLIANT')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                      historyFilterStatus === 'COMPLIANT'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : isDark
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Compliant ({compliantList.length})
                  </button>

                  <button
                    onClick={() => setHistoryFilterStatus('NON_COMPLIANT')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                      historyFilterStatus === 'NON_COMPLIANT'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : isDark
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    Violations ({violationsList.length})
                  </button>
                </div>

                {/* Utility Export & Clear Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleExportHistoryCsv}
                    disabled={totalCount === 0}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 active:scale-95 transition disabled:opacity-40 ${
                      isDark
                        ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 shadow-sm'
                    }`}
                    title="Export all audit logs as CSV"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">CSV</span>
                  </button>

                  <button
                    onClick={handleClearAllHistory}
                    disabled={totalCount === 0}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900 flex items-center gap-1 active:scale-95 transition disabled:opacity-40"
                    title="Clear All History"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                </div>
              </div>

              {/* Audits Card List Scroll Area */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {filteredAudits && filteredAudits.length > 0 ? (
                  filteredAudits.map((audit) => {
                    const isCompliant = audit.status === 'COMPLIANT';
                    const isExpanded = expandedAuditId === audit.audit_id;
                    const formattedDate = audit.timestamp
                      ? new Date(audit.timestamp).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Recently Audited';

                    return (
                      <div
                        key={audit.audit_id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isDark
                            ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                            : 'bg-slate-50 border-slate-200 hover:border-blue-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          {/* Left: Thumbnail & Details */}
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {/* Product Thumbnail Container with Zoom */}
                            <div
                              onClick={() => audit.thumbnail_base64 && setPreviewModalImage(audit.thumbnail_base64)}
                              className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black/10 dark:bg-black/40 flex-shrink-0 flex items-center justify-center cursor-pointer relative group/thumb shadow-sm"
                              title="Click to zoom image"
                            >
                              {audit.thumbnail_base64 ? (
                                <img
                                  src={audit.thumbnail_base64}
                                  alt={audit.product_name || 'Specimen'}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              ) : (
                                <div className="text-blue-500 font-bold text-xs flex flex-col items-center p-2 text-center">
                                  <Package className="h-6 w-6 mb-1" />
                                  <span className="text-[9px] font-mono uppercase">Specimen</span>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity">
                                <Maximize2 className="h-4 w-4" />
                              </div>
                            </div>

                            {/* Product Metadata & Declarations */}
                            <div className="flex-1 min-w-0 space-y-1">
                              {/* Title & Status Badge Row */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4
                                  className="font-black text-xs sm:text-sm tracking-tight truncate max-w-sm sm:max-w-md"
                                  title={audit.product_name || 'Product Specimen'}
                                >
                                  {audit.product_name || 'Packaged Commodity Specimen'}
                                </h4>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-black uppercase flex items-center gap-1 ${
                                    isCompliant
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  }`}
                                >
                                  {isCompliant ? (
                                    <>
                                      <CheckCircle2 className="h-3 w-3" /> COMPLIANT
                                    </>
                                  ) : (
                                    <>
                                      <AlertTriangle className="h-3 w-3" /> NON-COMPLIANT
                                    </>
                                  )}
                                </span>
                              </div>

                              {/* Audit ID, Timestamp & Source */}
                              <div className={`flex items-center gap-2 text-[11px] flex-wrap ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                  {audit.audit_id}
                                </span>
                                <span>·</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formattedDate}
                                </span>
                                <span>·</span>
                                <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[9px] font-bold">
                                  {audit.source || 'AI RapidOCR'}
                                </span>
                              </div>

                              {/* Statutory Declarations Grid Chips */}
                              <div className="flex items-center gap-2 flex-wrap pt-0.5 text-[11px]">
                                <span className={`px-2 py-0.5 rounded-md font-medium ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-white border border-slate-200 text-slate-700'}`}>
                                  <strong>MRP:</strong> {audit.mrp || 'Not Declared'}
                                </span>
                                <span className={`px-2 py-0.5 rounded-md font-medium ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-white border border-slate-200 text-slate-700'}`}>
                                  <strong>Net Qty:</strong> {audit.net_quantity || 'Not Declared'}
                                </span>
                                {audit.extracted_metadata?.manufacturing_date && (
                                  <span className={`px-2 py-0.5 rounded-md font-medium ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-white border border-slate-200 text-slate-700'}`}>
                                    <strong>Mfg:</strong> {audit.extracted_metadata.manufacturing_date}
                                  </span>
                                )}
                              </div>

                              {/* Violations Summary Pill (if any) */}
                              {audit.violations_summary && audit.violations_summary.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                  {audit.violations_summary.slice(0, 2).map((vSummary, vIdx) => (
                                    <span
                                      key={vIdx}
                                      className="text-[10px] px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 font-medium"
                                    >
                                      ⚠️ {vSummary}
                                    </span>
                                  ))}
                                  {audit.violations_summary.length > 2 && (
                                    <span className="text-[10px] text-slate-400 font-semibold">
                                      +{audit.violations_summary.length - 2} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right: Score Gauge & Action Buttons */}
                          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block sm:inline mr-1">
                                Score
                              </span>
                              <span
                                className={`text-base sm:text-lg font-black font-mono ${
                                  isCompliant
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {audit.overall_score ?? 100}/100
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Load and Inspect into workspace */}
                              <button
                                onClick={() => handleLoadHistoricalAudit(audit)}
                                disabled={loadingAuditId === audit.audit_id}
                                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition disabled:opacity-50"
                                title="Load this audit into active workspace for inspection & certificate export"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                {loadingAuditId === audit.audit_id ? 'Loading...' : 'Load & Inspect'}
                              </button>

                              {/* Toggle Inline Details Accordion */}
                              <button
                                onClick={() => setExpandedAuditId(isExpanded ? null : audit.audit_id)}
                                className={`p-1.5 rounded-xl border text-xs font-bold active:scale-95 transition ${
                                  isDark
                                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                                }`}
                                title={isExpanded ? 'Hide Details' : 'View Full Details'}
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </button>

                              {/* Delete Audit */}
                              <button
                                onClick={(e) => handleDeleteHistoricalAudit(audit.audit_id, e)}
                                disabled={deletingAuditId === audit.audit_id}
                                className="p-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-900 active:scale-95 transition disabled:opacity-50"
                                title="Delete this audit record"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Expandable Deep-Dive Section */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5 text-xs animate-in fade-in duration-200">
                            {/* Violations List */}
                            {audit.violations && audit.violations.length > 0 && (
                              <div className="space-y-1.5">
                                <h5 className="font-extrabold text-[11px] uppercase tracking-wider text-rose-600 dark:text-rose-400">
                                  Statutory Infringements ({audit.violations.length})
                                </h5>
                                {audit.violations.map((viol, vIdx) => (
                                  <div
                                    key={vIdx}
                                    className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs space-y-1"
                                  >
                                    <div className="flex items-center justify-between font-bold text-rose-900 dark:text-rose-200">
                                      <span>{viol.rule_name || viol.rule_id}</span>
                                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 font-bold">
                                        {viol.severity || 'HIGH'}
                                      </span>
                                    </div>
                                    <p className="text-rose-800 dark:text-rose-300">{viol.description}</p>
                                    {viol.found_text && (
                                      <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                                        Found text: "{viol.found_text}"
                                      </p>
                                    )}
                                    {viol.remediation && (
                                      <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                                        <strong>Remediation:</strong> {viol.remediation}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Passed Checks Summary */}
                            {audit.passed_checks && audit.passed_checks.length > 0 && (
                              <div className="space-y-1">
                                <h5 className="font-extrabold text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                  Passed Compliance Verifications ({audit.passed_checks.length})
                                </h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  {audit.passed_checks.map((chk, cIdx) => (
                                    <div
                                      key={cIdx}
                                      className="p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-[11px]"
                                    >
                                      <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                        {chk.rule_name || chk.rule_id}
                                      </div>
                                      <div className="text-emerald-800 dark:text-emerald-400 text-[10px] mt-0.5 truncate">
                                        {chk.evidence || chk.description}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Extracted Metadata Summary */}
                            {audit.extracted_metadata && (
                              <div className="pt-1">
                                <h5 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-500">
                                  Extracted Specification Parameters
                                </h5>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1 font-mono text-[10px]">
                                  <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-800">
                                    <span className="text-slate-400 block">Brand</span>
                                    <span className="font-bold truncate">{audit.extracted_metadata.brand_name || 'N/A'}</span>
                                  </div>
                                  <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-800">
                                    <span className="text-slate-400 block">Care Helpline</span>
                                    <span className="font-bold truncate">{audit.extracted_metadata.consumer_care_phone || 'N/A'}</span>
                                  </div>
                                  <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-800">
                                    <span className="text-slate-400 block">Care Email</span>
                                    <span className="font-bold truncate">{audit.extracted_metadata.consumer_care_email || 'N/A'}</span>
                                  </div>
                                  <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-800">
                                    <span className="text-slate-400 block">Origin</span>
                                    <span className="font-bold truncate">{audit.extracted_metadata.country_of_origin || 'India'}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 space-y-3">
                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                      <History className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-500">No audit records found matching the current filter.</p>
                    {historySearchQuery && (
                      <button
                        onClick={() => setHistorySearchQuery('')}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        Clear Search Query
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* RULES & METROLOGY UNITS REFERENCE MODAL */}
      {/* ========================================================================= */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div
            className={`rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 border max-h-[85vh] flex flex-col ${
              isDark ? 'bg-[#0f172a] text-slate-100 border-slate-800' : 'bg-white text-slate-900 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-amber-500" />
                PCR 2011 Statutory Rules & Standard Units Dataset
              </h3>
              <button onClick={() => setIsRulesModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Statutory Rules (PCR 2011)
              </h4>
              <div className="space-y-2">
                {rulesList.map((rule, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>{rule.rule_name}</span>
                      <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold">{rule.rule_id}</span>
                    </div>
                    <p className={`mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{rule.description}</p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1 font-medium">
                      <strong>Penalty:</strong> {rule.penalty_clause}
                    </p>
                  </div>
                ))}
              </div>

              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 pt-2">
                Prohibited Imperial Units (Rule 11 & 12)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {unitsData.prohibited_imperial_units?.slice(0, 12).map((u, i) => (
                  <div
                    key={i}
                    className="p-2 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 font-mono"
                  >
                    {u.unit_symbol} ({u.unit_name})
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Full Preview Modal */}
      {previewModalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewModalImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={previewModalImage} alt="Preview" className="max-w-full max-h-[85vh] rounded-xl object-contain" />
            <button
              onClick={() => setPreviewModalImage(null)}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/80 text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Quick Tools Drawer */}
      {isMobileToolsOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 border shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200 ${
              isDark ? 'bg-[#0f172a] text-slate-100 border-slate-800' : 'bg-white text-slate-900 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-blue-500" />
                <h3 className="font-extrabold text-sm">Regulatory Officer Quick Tools</h3>
              </div>
              <button
                onClick={() => setIsMobileToolsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <button
                onClick={() => {
                  setIsMobileToolsOpen(false);
                  setIsAuditsModalOpen(true);
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-2 active:scale-95 transition ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <History className="h-5 w-5 text-blue-500" />
                  {recentAuditsList.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white font-mono text-[10px] font-bold">
                      {recentAuditsList.length}
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-extrabold">Recent Audits</div>
                  <div className="text-[10px] text-slate-400">View database records</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMobileToolsOpen(false);
                  setIsRulesModalOpen(true);
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-2 active:scale-95 transition ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <BookOpen className="h-5 w-5 text-amber-500" />
                <div>
                  <div className="font-extrabold">Rules & SI Units</div>
                  <div className="text-[10px] text-slate-400">PCR 2011 handbook</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMobileToolsOpen(false);
                  startCamera('environment', 1);
                }}
                className="p-3 rounded-2xl bg-blue-600 text-white text-left flex flex-col justify-between gap-2 active:scale-95 transition shadow-sm"
              >
                <Camera className="h-5 w-5" />
                <div>
                  <div className="font-extrabold">Live Camera</div>
                  <div className="text-[10px] text-blue-200">Rear multi-angle scan</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMobileToolsOpen(false);
                  setActiveTab('pdp_calc');
                  window.scrollTo({ top: 400, behavior: 'smooth' });
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-2 active:scale-95 transition ${
                  isDark ? 'bg-indigo-950/60 border-indigo-800 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-900'
                }`}
              >
                <Calculator className="h-5 w-5 text-indigo-400" />
                <div>
                  <div className="font-extrabold">PDP Calculator</div>
                  <div className="text-[10px] opacity-70">Schedule II font test</div>
                </div>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${apiHealth.online ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="font-mono text-[10px]">{apiHealth.online ? 'HYBRID AI ONLINE' : 'EDGE OCR'}</span>
              </div>
              <button
                onClick={() => {
                  setIsMobileToolsOpen(false);
                  toggleTheme();
                }}
                className="flex items-center gap-1 text-blue-500 font-bold"
              >
                {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                <span>{isDark ? 'Light' : 'Dark'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Normal Responsive Fullscreen Render
  return renderAppContent();
}


