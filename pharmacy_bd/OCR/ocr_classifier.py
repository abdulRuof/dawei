# -*- coding: utf-8 -*-
"""
ocr_classifier.py
------------------
تصنيف النصوص المستخرجة من روشة طبية إلى فئتين:

    1) "metadata"  -> بيانات غير مهمة لاستخراج الدواء
       (اسم الطبيب، اسم العيادة/المستشفى، العنوان، الهاتف،
        اسم المريض، التاريخ، التوقيع... إلخ)

    2) "medicine"   -> أسماء أدوية / جرعات / تعليمات استخدام

الفكرة: نعتمد على كلمات مفتاحية شائعة + أنماط Regex
(أرقام هواتف، تواريخ) لتحديد "metadata" أولاً،
وأي نص لا يقع ضمن هذه القوائم يُعتبر افتراضياً "medicine"
لأن أغلب سطور الروشة هي أدوية.

يمكنك تطوير الدقة لاحقاً بإضافة قاموس أسماء أدوية حقيقي
(انظر دالة load_drug_dictionary أسفل الملف).
"""

import re


# =========================================================
# كلمات مفتاحية تدل على "بيانات غير مهمة"
# =========================================================

DOCTOR_KEYWORDS = [
    "د/", "د.", "دكتور", "دكتورة", "الدكتور", "الدكتورة",
    "استشاري", "إستشاري", "أخصائي", "اخصائى", "أخصائى",
    "بروفيسور", "أ.د", "ا.د", "أستاذ", "استاذ",

    # إنجليزية: ألقاب ودرجات علمية تظهر في ترويسة الروشة
    "dr.", "dr ", "md", "prof", "professor", "consultant",
    "surgeon", "surgeons", "surgical", "orthopedic", "orthopaedic",
    "physician", "physicians", "mbbs", "bds", "frcs", "mrcp",
    "phd", "fellow", "fellowship", "specialist", "registrar",
    "researcher", "assistant professor", "associate professor",
    "medical director", "head of", "member of", "society",
    "association", "diploma", "board certified", "board of",
    "alumni", "syndicate", "undersecretary", "minister",
]

CLINIC_KEYWORDS = [
    "عيادة", "عيادات", "مستشفى", "مستشفيات",
    "مركز طبي", "المركز الطبي", "مجمع طبي", "مجمع عيادات",
    "صيدلية", "معمل", "مختبر", "معمل تحاليل", "مركز أشعة",
    "المجمع الطبي", "العيادة الخارجية",

    # إنجليزية
    "hospital", "clinic", "clinics", "sanatorium", "academy",
    "university", "school", "college", "faculty", "institute",
    "center for", "centre for", "medical center", "health center",
]

CONTACT_KEYWORDS = [
    "تليفون", "تلفون", "هاتف", "موبايل", "فاكس",
    "العنوان", "شارع", "ميدان", "بريد الكتروني",
    "البريد الالكتروني", "email", "e-mail", "واتساب",
    "فيسبوك", "facebook", "instagram", "website", "web",
]

PATIENT_INFO_KEYWORDS = [
    "اسم المريض", "المريض", "السن", "العمر",
    "الجنس", "ذكر", "أنثى", "انثى", "الوزن",
    "رقم الملف", "رقم الكشف",
]

SIGNATURE_KEYWORDS = [
    "التوقيع", "توقيع", "ختم", "الختم", "شكرا", "شكراً",
    "مع تحيات", "تحياتي", "دام فضلكم",
]

# أنماط أرقام هواتف وتواريخ
DATE_PATTERN = re.compile(r"\d{1,2}\s*[/\-.]\s*\d{1,2}\s*[/\-.]\s*\d{2,4}")
PHONE_PATTERN = re.compile(r"(\+?\d[\d\s\-]{6,}\d)")

# أنماط العلامات الحيوية والتشخيص (تظهر في ترويسة الروشة وليست أدوية)
VITALS_PATTERN = re.compile(
    r"^\s*(bw|bt|hr|rr|bp|rbgs|ll\s*dl|wbc|rbc|hb|hgb|spo2|temp)"
    r"\s*[:=]?\s*[\d.]+",
    re.IGNORECASE,
)

# اختصارات تشخيص شائعة
DIAGNOSIS_WORDS = {
    "htn", "dm", "dh", "chf", "copd", "ibs", "pid", "ut", "oe",
    "pain", "pleural", "eff", "hyperlipidem", "hyperurcem", "gout",
    "cva", "mi", "tb", "hepatitis", "cirrhosis", "anemia", "anemy",
    "mild", "right", "left", "normal", "tender", "tense", "niil",
}

# كلمات تعني ترويسة أو قسم من الروشة
HEADER_WORDS = {
    "diagnosis", "treatment", "medication", "medications",
    "medical", "medicine", "prescription", "patient", "date",
    "sex", "age", "name", "history", "maladie", "template",
}

# كلمات تدل بقوة على أنه سطر دواء/جرعة (تساعد في الحالات الغامضة)
DOSAGE_HINT_KEYWORDS = [
    "قرص", "أقراص", "اقراص", "كبسولة", "كبسولات",
    "شراب", "حقنة", "حقن", "أمبول", "امبول",
    "مرهم", "كريم", "قطرة", "قطرات", "لبوس",
    "مل", "مجم", "ملجم", "جرام", "جم",
    "جرعة", "يوميا", "يومياً", "مرتين", "ثلاث مرات",
    "مرة واحدة", "صباحا", "صباحاً", "مساءا", "مساءً",
    "بعد الأكل", "قبل الأكل", "على الريق", "كل",
    "لمدة", "أيام", "ايام", "أسبوع", "اسبوع",
]


def _contains_any(text: str, keywords) -> bool:
    return any(kw in text for kw in keywords)


def classify_text(text: str) -> str:
    """
    تصنّف نص واحد وتُرجع:
        "metadata" -> بيانات غير مهمة (طبيب/عيادة/اتصال/مريض/توقيع/تاريخ)
        "medicine" -> اسم دواء أو جرعة أو تعليمات استخدام (افتراضي)
    """

    t = text.strip()

    if not t:
        return "metadata"

    # حرفان موحدان حتى تتطابق الكلمات الإنجليزية بأي حالة
    t = t.lower()

    # 1) فحص الكلمات المفتاحية الخاصة بالبيانات غير المهمة
    if _contains_any(t, DOCTOR_KEYWORDS):
        return "metadata"

    if _contains_any(t, CLINIC_KEYWORDS):
        return "metadata"

    if _contains_any(t, CONTACT_KEYWORDS):
        return "metadata"

    if _contains_any(t, PATIENT_INFO_KEYWORDS):
        return "metadata"

    if _contains_any(t, SIGNATURE_KEYWORDS):
        return "metadata"

    # 2) فحص الأنماط (تاريخ / رقم هاتف)
    if DATE_PATTERN.search(t):
        return "metadata"

    digits_only = re.sub(r"\D", "", t)
    if PHONE_PATTERN.search(t) and len(digits_only) >= 7:
        return "metadata"

    # 3) علامات حيوية (BP:120/80, HR:98 ...) -> ليست أدوية
    if VITALS_PATTERN.search(t):
        return "metadata"

    # 4) كلمات تشخيص/ترويسة بكلمة كاملة -> ليست أدوية
    words_t = set(re.findall(r"[a-z0-9]+", t))

    if words_t & DIAGNOSIS_WORDS:
        return "metadata"

    if words_t & HEADER_WORDS:
        return "metadata"

    # 5) لو فيه كلمة تدل بقوة إنه جرعة/دواء، أكّد إنه medicine
    if _contains_any(t, DOSAGE_HINT_KEYWORDS):
        return "medicine"

    # 6) الافتراضي: نعتبره medicine لأن أغلب سطور الروشة أدوية
    return "medicine"


def split_texts(items: list) -> dict:
    """
    تاخد list of dict بالشكل: {"text": ..., "score": ...}
    وترجعها مقسّمة لقسمين: medicines / metadata
    """

    medicines = []
    metadata = []

    for item in items:
        category = classify_text(item["text"])
        item_with_category = {**item, "category": category}

        if category == "medicine":
            medicines.append(item_with_category)
        else:
            metadata.append(item_with_category)

    return {
        "medicines": medicines,
        "metadata": metadata,
    }


# =========================================================
# (اختياري) قاموس أسماء أدوية حقيقي لتحسين الدقة
# =========================================================
# لو عندك قائمة بأسماء أدوية معروفة (CSV/TXT) تقدر تحملها هنا
# وتستخدمها للتأكد من تصنيف "medicine" بدقة أعلى بدل الاعتماد
# فقط على الكلمات المفتاحية.
#
# مثال استخدام:
#   drug_names = load_drug_dictionary("drugs.txt")
#   if any(name in text for name in drug_names):
#       return "medicine"

def load_drug_dictionary(path: str) -> set:
    """تحميل قائمة أسماء أدوية من ملف نصي (سطر لكل اسم)."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return {line.strip() for line in f if line.strip()}
    except FileNotFoundError:
        return set()
