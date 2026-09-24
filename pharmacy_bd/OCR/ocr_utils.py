import re


def clean_text(text: str) -> str:
    """
    تنظيف النص الناتج من OCR وتصحيح بعض أخطاء OCR الشائعة.
    """

    if not text:
        return ""

    # إزالة المسافات الزائدة
    text = re.sub(r"\s+", " ", text).strip()

    # أخطاء OCR شائعة
    replacements = {
        "Buscepan": "Buscopan",
        "Buscepan": "Buscopan",

        "omeprn zale": "omeprazole",
        "omeprn": "omeprazole",

        "s oo cc": "500 cc",
        "soo cc": "500 cc",
        "s00 cc": "500 cc",
        "5oo cc": "500 cc",

        "4omg": "40mg",
        "4 omg": "40 mg",
    }

    for wrong, correct in replacements.items():
        pattern = re.compile(re.escape(wrong), re.IGNORECASE)
        text = pattern.sub(correct, text)

    return text


def is_valid_text(
    text: str,
    score: float,
    min_score: float = 0.50
) -> bool:
    """
    تحديد النصوص التي تستحق المعالجة.
    """

    if not text:
        return False

    if score < min_score:
        return False

    # تجاهل النصوص القصيرة جدًا
    if len(text.strip()) <= 1:
        return False

    return True

