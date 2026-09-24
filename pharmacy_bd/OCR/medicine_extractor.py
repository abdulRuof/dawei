
import re
from difflib import SequenceMatcher


# =========================================================
# قاعدة بيانات أسماء الأدوية
# =========================================================

MEDICINE_ALIASES = {

    # -------------------------
    # Ringer Lactate
    # -------------------------
    "ringer lactate": {
        "name_en": "Ringer Lactate",
        "name_ar": "رينجر لاكتات",
    },

    "ringerlactate": {
        "name_en": "Ringer Lactate",
        "name_ar": "رينجر لاكتات",
    },

    "رينجر لاكتات": {
        "name_en": "Ringer Lactate",
        "name_ar": "رينجر لاكتات",
    },

    "رينجر لاكتيت": {
        "name_en": "Ringer Lactate",
        "name_ar": "رينجر لاكتات",
    },

    # -------------------------
    # Omeprazole
    # -------------------------
    "omeprazole": {
        "name_en": "Omeprazole",
        "name_ar": "أوميبرازول",
    },

    "omeprn": {
        "name_en": "Omeprazole",
        "name_ar": "أوميبرازول",
    },

    "omeprazo1e": {
        "name_en": "Omeprazole",
        "name_ar": "أوميبرازول",
    },

    "omepraz0le": {
        "name_en": "Omeprazole",
        "name_ar": "أوميبرازول",
    },

    "omeprazole": {
        "name_en": "Omeprazole",
        "name_ar": "أوميبرازول",
    },

    "أوميبرازول": {
        "name_en": "Omeprazole",
        "name_ar": "أوميبرازول",
    },

    "اوميبرازول": {
        "name_en": "Omeprazole",
        "name_ar": "أوميبرازول",
    },

    # -------------------------
    # Buscopan
    # -------------------------
    "buscopan": {
        "name_en": "Buscopan",
        "name_ar": "بسكوبان",
    },

    "buscepan": {
        "name_en": "Buscopan",
        "name_ar": "بسكوبان",
    },

    "busc0pan": {
        "name_en": "Buscopan",
        "name_ar": "بسكوبان",
    },

    "buscopam": {
        "name_en": "Buscopan",
        "name_ar": "بسكوبان",
    },

    "بسكوبان": {
        "name_en": "Buscopan",
        "name_ar": "بسكوبان",
    },

    # -------------------------
    # Paracetamol
    # -------------------------
    "paracetamol": {
        "name_en": "Paracetamol",
        "name_ar": "باراسيتامول",
    },

    "paratame fusi": {
        "name_en": "Paracetamol",
        "name_ar": "باراسيتامول",
    },

    "paracetamol": {
        "name_en": "Paracetamol",
        "name_ar": "باراسيتامول",
    },

    "باراسيتامول": {
        "name_en": "Paracetamol",
        "name_ar": "باراسيتامول",
    },

    "باراسيتامول": {
        "name_en": "Paracetamol",
        "name_ar": "باراسيتامول",
    },
}


# =========================================================
# الأشكال الدوائية
# =========================================================

DOSAGE_FORMS = {

    # English
    "tablet": ("Tablet", "قرص"),
    "tablets": ("Tablet", "أقراص"),
    "tab": ("Tablet", "قرص"),
    "tabs": ("Tablet", "أقراص"),

    "capsule": ("Capsule", "كبسولة"),
    "capsules": ("Capsule", "كبسولات"),
    "cap": ("Capsule", "كبسولة"),
    "caps": ("Capsule", "كبسولات"),

    "syrup": ("Syrup", "شراب"),
    "syr": ("Syrup", "شراب"),

    "injection": ("Injection", "حقن"),
    "injectable": ("Injection", "حقن"),
    "inj": ("Injection", "حقن"),

    "ampoule": ("Ampoule", "أمبول"),
    "amp": ("Ampoule", "أمبول"),

    "vial": ("Vial", "قارورة"),
    "vials": ("Vial", "قوارير"),

    "solution": ("Solution", "محلول"),
    "sol": ("Solution", "محلول"),

    "suspension": ("Suspension", "معلق"),
    "susp": ("Suspension", "معلق"),

    "cream": ("Cream", "كريم"),
    "ointment": ("Ointment", "مرهم"),
    "gel": ("Gel", "جل"),

    "drops": ("Drops", "قطرات"),
    "drop": ("Drops", "قطرات"),

    "spray": ("Spray", "بخاخ"),
    "inhaler": ("Inhaler", "بخاخ استنشاقي"),

    "suppository": ("Suppository", "تحاميل"),

    # Arabic
    "قرص": ("Tablet", "قرص"),
    "أقراص": ("Tablet", "أقراص"),
    "حبوب": ("Tablet", "حبوب"),

    "كبسولة": ("Capsule", "كبسولة"),
    "كبسولات": ("Capsule", "كبسولات"),

    "شراب": ("Syrup", "شراب"),

    "حقنة": ("Injection", "حقن"),
    "حقن": ("Injection", "حقن"),
    "حقن": ("Injection", "حقن"),

    "أمبول": ("Ampoule", "أمبول"),
    "أمبولات": ("Ampoule", "أمبولات"),

    "قارورة": ("Vial", "قارورة"),
    "قوارير": ("Vial", "قوارير"),

    "محلول": ("Solution", "محلول"),
    "معلق": ("Suspension", "معلق"),

    "كريم": ("Cream", "كريم"),
    "مرهم": ("Ointment", "مرهم"),
    "جل": ("Gel", "جل"),

    "قطرة": ("Drops", "قطرات"),
    "قطرات": ("Drops", "قطرات"),

    "بخاخ": ("Spray", "بخاخ"),
    "تحاميل": ("Suppository", "تحاميل"),
}


# =========================================================
# تطبيع النص
# =========================================================

def normalize_text(text: str) -> str:
    """
    تنظيف وتوحيد النص الناتج من OCR.
    """

    if not text:
        return ""

    text = str(text).lower().strip()

    # الأرقام العربية -> الإنجليزية
    arabic_numbers = str.maketrans(
        "٠١٢٣٤٥٦٧٨٩",
        "0123456789"
    )

    text = text.translate(arabic_numbers)

    # أخطاء OCR الشائعة
    replacements = {

        # أرقام
        "soo": "500",
        "s00": "500",
        "5oo": "500",

        # 40mg
        "4omg": "40mg",
        "4 omg": "40mg",

        # رموز OCR شائعة
        "ij": " ",
        "i j": " ",

        # أخطاء أسماء
        "buscepan": "buscopan",
        "busc0pan": "buscopan",
        "omeprn": "omeprazole",
        "omeprazo1e": "omeprazole",
        "omepraz0le": "omeprazole",

        # Ringer
        "ringerlactate": "ringer lactate",

        # Paracetamol
        "paratame fusi": "paracetamol",
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    # إزالة الرموز الغريبة مع الحفاظ على العربي
    text = re.sub(
        r"[^a-z0-9\u0600-\u06ff\s]",
        " ",
        text
    )

    # توحيد المسافات
    text = re.sub(r"\s+", " ", text).strip()

    return text


# =========================================================
# استخراج الجرعة / التركيز
# =========================================================

def extract_dose(text: str):
    """
    استخراج الجرعات مثل:

    40mg
    40 mg
    500mg
    500 mg
    500 cc
    5 ml
    1 g
    100 mcg
    100 IU
    """

    normalized = normalize_text(text)

    if not normalized:
        return None

    # رقم + وحدة
    pattern = re.compile(
        r"\b(\d+(?:\.\d+)?)\s*"
        r"(mg|g|mcg|ml|cc|iu|kg|%)\b",
        re.IGNORECASE
    )

    match = pattern.search(normalized)

    if not match:
        return None

    value = match.group(1)
    unit = match.group(2).lower()

    return f"{value} {unit}"


# =========================================================
# استخراج الشكل الدوائي
# =========================================================

def extract_dosage_form(text: str):
    """
    استخراج الشكل الدوائي من النص.

    مثال:
        Omeprazole 40mg capsule

    النتيجة:
        ("Capsule", "كبسولة")
    """

    normalized = normalize_text(text)

    if not normalized:
        return None, None

    words = normalized.split()

    # البحث عن الكلمات الطويلة أولاً
    sorted_forms = sorted(
        DOSAGE_FORMS.items(),
        key=lambda item: len(item[0]),
        reverse=True
    )

    for form, result in sorted_forms:

        form_normalized = normalize_text(form)

        if not form_normalized:
            continue

        # البحث ككلمة كاملة
        pattern = rf"\b{re.escape(form_normalized)}\b"

        if re.search(pattern, normalized, re.IGNORECASE):

            dosage_form_en, dosage_form_ar = result

            return dosage_form_en, dosage_form_ar

    return None, None


# =========================================================
# مقارنة تقريبية للنصوص
# =========================================================

def similarity(a: str, b: str) -> float:
    """
    حساب التشابه بين كلمتين.
    """

    a = normalize_text(a)
    b = normalize_text(b)

    if not a or not b:
        return 0.0

    return SequenceMatcher(None, a, b).ratio()


# =========================================================
# البحث عن اسم الدواء
# =========================================================

def find_medicine_match(text: str):
    """
    البحث عن دواء داخل نص OCR.

    يدعم:
    - الاسم الإنجليزي
    - الاسم العربي
    - أخطاء OCR
    """

    normalized = normalize_text(text)

    if not normalized:
        return None

    # -----------------------------------------
    # بحث مباشر
    # -----------------------------------------

    for alias, medicine in MEDICINE_ALIASES.items():

        alias_normalized = normalize_text(alias)

        if not alias_normalized:
            continue

        pattern = rf"\b{re.escape(alias_normalized)}\b"

        if re.search(pattern, normalized, re.IGNORECASE):

            return {
                "name_en": medicine["name_en"],
                "name_ar": medicine["name_ar"],
                "alias": alias,
                "match_type": "exact",
            }

    # -----------------------------------------
    # بحث تقريبي
    # -----------------------------------------

    words = normalized.split()

    best_match = None
    best_score = 0.0

    for alias, medicine in MEDICINE_ALIASES.items():

        alias_normalized = normalize_text(alias)

        # الاسم عبارة عن أكثر من كلمة
        alias_words = alias_normalized.split()

        if len(alias_words) > 1:

            for i in range(len(words) - len(alias_words) + 1):

                candidate = " ".join(
                    words[i:i + len(alias_words)]
                )

                score = similarity(
                    candidate,
                    alias_normalized
                )

                if score > best_score:
                    best_score = score

                    best_match = {
                        "name_en": medicine["name_en"],
                        "name_ar": medicine["name_ar"],
                        "alias": alias,
                        "match_type": "fuzzy",
                        "similarity": score,
                    }

        else:

            for word in words:

                score = similarity(
                    word,
                    alias_normalized
                )

                if score > best_score:

                    best_score = score

                    best_match = {
                        "name_en": medicine["name_en"],
                        "name_ar": medicine["name_ar"],
                        "alias": alias,
                        "match_type": "fuzzy",
                        "similarity": score,
                    }

    # لا نقبل التطابق الضعيف
    if best_match and best_score >= 0.82:

        return best_match

    return None


# =========================================================
# استخراج دواء من سطر واحد
# =========================================================

def extract_medicine_from_line(text: str, score: float):
    """
    استخراج بيانات دواء من سطر OCR واحد.
    """

    match = find_medicine_match(text)

    if not match:
        return None

    dose = extract_dose(text)

    dosage_form, dosage_form_ar = extract_dosage_form(text)

    return {
        "name_en": match["name_en"],
        "name_ar": match["name_ar"],

        "ocr_text": text,

        "dose": dose,

        "dosage_form": dosage_form,
        "dosage_form_ar": dosage_form_ar,

        "score": float(score),
    }


# =========================================================
# استخراج الأدوية من OCR
# =========================================================

def find_medicines(texts):
    """
    texts:

    [
        {
            "text": "...",
            "score": 0.95
        }
    ]

    النتيجة:

    [
        {
            "name_en": "...",
            "name_ar": "...",
            "ocr_text": "...",
            "dose": "...",
            "dosage_form": "...",
            "dosage_form_ar": "...",
            "score": 0.90
        }
    ]
    """

    medicines = []

    for index, item in enumerate(texts):

        original_text = item.get("text", "")
        score = float(item.get("score", 0))

        if not original_text:
            continue

        # -----------------------------------------
        # البحث عن الدواء في السطر الحالي
        # -----------------------------------------

        match = find_medicine_match(original_text)

        if not match:
            continue

        # -----------------------------------------
        # نستخدم السطر الحالي كأساس
        # -----------------------------------------

        medicine_text = original_text

        dose = extract_dose(medicine_text)

        dosage_form, dosage_form_ar = extract_dosage_form(
            medicine_text
        )

        # -----------------------------------------
        # إذا الجرعة أو الشكل غير موجود
        # نفحص السطر التالي فقط
        #
        # ولكن لا نغير ocr_text
        # -----------------------------------------

        if index + 1 < len(texts):

            next_text = texts[index + 1].get(
                "text",
                ""
            )

            # الجرعة
            if dose is None:

                next_dose = extract_dose(next_text)

                if next_dose:
                    dose = next_dose

            # الشكل الدوائي
            if dosage_form is None:

                next_form, next_form_ar = extract_dosage_form(
                    next_text
                )

                if next_form:

                    dosage_form = next_form
                    dosage_form_ar = next_form_ar

        # -----------------------------------------
        # منع تكرار الدواء
        # -----------------------------------------

        existing = None

        for medicine in medicines:

            if medicine["name_en"] == match["name_en"]:

                existing = medicine
                break

        # -----------------------------------------
        # إذا الدواء موجود مسبقاً
        # نحتفظ بالمعلومات الأفضل
        # -----------------------------------------

        if existing:

            # جرعة أفضل
            if existing["dose"] is None and dose:
                existing["dose"] = dose

            # شكل دوائي أفضل
            if (
                existing["dosage_form"] is None
                and dosage_form
            ):
                existing["dosage_form"] = dosage_form
                existing["dosage_form_ar"] = dosage_form_ar

            # ثقة أعلى
            if score > existing["score"]:

                existing["score"] = score

                # لا نستبدل النص إلا إذا كان النص
                # الحالي يحتوي اسم الدواء فعلاً
                existing["ocr_text"] = medicine_text

            continue

        # -----------------------------------------
        # إضافة دواء جديد
        # -----------------------------------------

        medicines.append({

            "name_en": match["name_en"],

            "name_ar": match["name_ar"],

            "ocr_text": medicine_text,

            "dose": dose,

            "dosage_form": dosage_form,

            "dosage_form_ar": dosage_form_ar,

            "score": score,
        })

    return medicines

