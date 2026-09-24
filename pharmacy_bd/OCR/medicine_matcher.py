# -*- coding: utf-8 -*-
"""
medicine_matcher.py
-------------------
Medicine Matching Engine - محرك مطابقة أسماء الأدوية

يستقبل نص OCR (سطر واحد غالباً من روشة طبية) ويبحث في قاموس
الأدوية (clean_pharmacy_dict.json) لأفضل اسم دواء محتمل.

المسار (من الملخص):
    OCR Text
       ↓
    Text Normalization
       ↓
    Medicine Dictionary
       ↓
    Fuzzy Matching
       ↓
    Match Score
       ↓
    أفضل اسم دواء محتمل

الاستخدام كسكربت:
    python OCR/medicine_matcher.py "r omeprazole ij 40mg"
    python OCR/medicine_matcher.py --dataset OCR/dataset
    python OCR/medicine_matcher.py --test

الاستخدام كموديول:
    from medicine_matcher import MedicineMatcher

    matcher = MedicineMatcher()
    result = matcher.match("r omeprazole ij 40mg")
    for m in result["matches"]:
        print(m["brand_name"], m["match_score"])
"""

import json
import re
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except (AttributeError, ValueError):
    pass

try:
    from rapidfuzz import fuzz
    HAS_RAPIDFUZZ = True
except ImportError:
    HAS_RAPIDFUZZ = False
    from difflib import SequenceMatcher


# =========================================================
# مسار القاموس الافتراضي
# =========================================================

DEFAULT_DICT_PATH = Path(__file__).resolve().parent / "clean_pharmacy_dict.json"

# قاموس محلي إضافي: أسماء أدوية شائعة في ليبيا/المنطقة
# غير موجودة في قاموس openFDA (السوق الأمريكي)
LOCAL_DICT_PATH = Path(__file__).resolve().parent / "local_drug_aliases.json"

MIN_MATCH_SCORE = 0.60
WEAK_MATCH_SCORE = 0.80
EXACT_MATCH_SCORE = 0.99


# =========================================================
# تطبيع النص
# =========================================================

ARABIC_TO_ENGLISH_DIGITS = str.maketrans(
    "٠١٢٣٤٥٦٧٨٩",
    "0123456789"
)


def normalize_text(text: str) -> str:
    """
    تنظيف وتوحيد النص الناتج من OCR للمقارنة:
    - تحويل الأحرف لصغيرة
    - تحويل الأرقام العربية لإنجليزية
    - استبدال أخطاء OCR الشائعة
    - إزالة الرموز مع الحفاظ على الحروف والمسافات
    """
    if not text:
        return ""

    text = str(text).strip().lower()
    text = text.translate(ARABIC_TO_ENGLISH_DIGITS)

    # أخطاء OCR شائعة
    replacements = {
        "soo": "500",
        "s00": "500",
        "5oo": "500",
        "4omg": "40mg",
        "4 omg": "40mg",
        "buscepan": "buscopan",
        "busc0pan": "buscopan",
        "omeprn": "omeprazole",
        "omeprazo1e": "omeprazole",
        "omepraz0le": "omeprazole",
        "ringerlactate": "ringer lactate",
        "paratame fusi": "paracetamol",
    }

    for wrong, correct in replacements.items():
        text = text.replace(wrong, correct)

    # إزالة الرموز الغريبة مع الحفاظ على العربي والإنجليزي
    text = re.sub(r"[^a-z0-9\u0600-\u06ff\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()

    return text


# =========================================================
# كلمات ضجيج تُحذف قبل المطابقة
# =========================================================

NOISE_TOKENS = {
    # علامات بداية سطر الروشة
    "r", "rx", "rp", "r/", "ry", "rpx",
    # الشكل الدوائي
    "tab", "tabs", "tablet", "tablets", "cap", "caps", "capsule",
    "capsules", "syrup", "syr", "inj", "injectable", "injection",
    "amp", "ampoule", "vial", "vials", "sol", "solution", "susp",
    "suspension", "cream", "ointment", "gel", "drops", "drop",
    "spray", "inhaler", "suppository", "supp", "emulsion", "paste",
    "granules", "grs", "eo", "ext", "forte", "fort",
    # جرعة / تركيز / تعليمات
    "mg", "ml", "cc", "g", "mcg", "microgram", "gram", "iu",
    "kg", "tablet", "qd", "qid", "po", "iv", "im", "sc", "od",
    "bid", "tid", "bd", "tds", "h", "hr", "hrs", "x", "one",
    "two", "three", "mr", "sr", "xr", "ir", "cr", "er",
}


def extract_candidate_words(text: str):
    """
    استخراج كلمات الدواء المحتملة من نص OCR:
    - إزالة الضوضاء (أرقام، وحدات، أشكال دوائية، علامات بداية)
    - إرجاع الكلمات الصالحة فقط
    """
    normalized = normalize_text(text)

    if not normalized:
        return []

    words = normalized.split()
    candidates = []

    for word in words:
        word = word.strip()

        if not word:
            continue

        if len(word) <= 2:
            continue

        if word in NOISE_TOKENS:
            continue

        if word.isdigit():
            continue

        # تحويلي بوحدات مثل "40mg" اتحولت لـ "40" بعد التنظيف
        if re.fullmatch(r"\d+", word):
            continue

        candidates.append(word)

    return candidates


def build_phrases(words: list) -> list:
    """
    بناء عبارات المرشحة للمطابقة:
    كلمة واحدة + كل زوج متجاور (لأسماء الأدوية المكونة من كلمتين).
    """
    phrases = list(words)

    for i in range(len(words) - 1):
        phrases.append(f"{words[i]} {words[i + 1]}")

    # إزالة التكرار مع الحفاظ على الترتيب
    seen = set()
    unique = []
    for p in phrases:
        if p not in seen:
            seen.add(p)
            unique.append(p)

    return unique


# =========================================================
# حساب التشابه
# =========================================================

def similarity(a: str, b: str) -> float:
    """نسبة التشابه بين نصين (0.0 إلى 1.0)."""
    if not a or not b:
        return 0.0

    if HAS_RAPIDFUZZ:
        return fuzz.ratio(a, b) / 100.0

    return SequenceMatcher(None, a, b).ratio()


# =========================================================
# محرك المطابقة
# =========================================================

class MedicineMatcher:

    def __init__(self, dict_path: str = None, local_dict_path: str = None):
        self.dict_path = Path(dict_path) if dict_path else DEFAULT_DICT_PATH
        self.local_dict_path = (
            Path(local_dict_path) if local_dict_path else LOCAL_DICT_PATH
        )
        self.entries = []
        self.keys = []          # قوائم مفاتيح البحث لكل سجل
        self.fast_lookup = {}   # name_normalized -> list of entry indices
        self._load()

    # -----------------------------------------------------
    # تحميل القاموس وبناء الفهرس
    # -----------------------------------------------------

    def _load(self):
        with open(self.dict_path, "r", encoding="utf-8") as f:
            self.entries = json.load(f)

        # إضافة سجلات القاموس المحلي (أسماء المنطقة) إن وُجد.
        # الملفات: local_drug_aliases.json (يدوي + إضافات الواجهة)
        #          wikidata_drug_aliases.json (تلقائي من ويكيبيديا)
        local_drugs = []

        local_dict_paths = [self.local_dict_path]
        auto_dict_path = Path(__file__).resolve().parent / "wikidata_drug_aliases.json"
        if auto_dict_path != self.local_dict_path and auto_dict_path.exists():
            local_dict_paths.append(auto_dict_path)

        for path in local_dict_paths:
            if not path.exists():
                continue
            try:
                with open(path, "r", encoding="utf-8") as f:
                    local_data = json.load(f)
                local_drugs.extend(local_data.get("drugs", []))
            except (json.JSONDecodeError, OSError) as e:
                print(f"[تحذير] لا يمكن قراءة القاموس المحلي ({path.name}): {e}")

        self.keys = []
        self.fast_lookup = {}

        for index, entry in enumerate(self.entries):

            brand = entry.get("brand_name", "")
            generic = entry.get("generic_name", "")
            ingredients = entry.get("active_ingredients", [])

            keys = []

            for name in (brand, generic):
                normalized = normalize_text(name)
                if normalized:
                    keys.append(normalized)

            # المواد الفعالة: نأخذ الاسم بدون التركيز
            for ing in ingredients:
                if not isinstance(ing, str):
                    continue

                # إزالة التركيز مثل "(40 mg/1)"
                name_part = re.split(r"\s*\(", ing)[0]
                normalized = normalize_text(name_part)

                if normalized and normalized not in keys:
                    keys.append(normalized)

            self.keys.append(keys)

            # فهرس سريع للبحث المباشر
            for key in keys:
                self.fast_lookup.setdefault(key, []).append(index)

        # -------------------------------------------------
        # دمج القاموس المحلي (الأسماء البديلة = مفاتيح بحث)
        # -------------------------------------------------

        for drug in local_drugs:

            aliases = drug.get("aliases", [])
            brand = drug.get("brand_name", "")
            generic = drug.get("generic_name", "")
            dosage_form = drug.get("dosage_form", "")
            ingredients = drug.get("active_ingredients", [])

            # ضمان وجود اسم مقروء على الأقل
            display_name = brand or generic or ""

            entry = {
                "brand_name": brand,
                "generic_name": generic,
                "dosage_form": dosage_form,
                "active_ingredients": ingredients,
                "from_local_dict": True,
            }

            keys = []

            for key in (brand, generic):
                normalized = normalize_text(key)
                if normalized and normalized not in keys:
                    keys.append(normalized)

            for alias in aliases:
                normalized = normalize_text(alias)
                if normalized and normalized not in keys:
                    keys.append(normalized)

            for ing in ingredients:
                if not isinstance(ing, str):
                    continue
                name_part = re.split(r"\s*\(", ing)[0]
                normalized = normalize_text(name_part)
                if normalized and normalized not in keys:
                    keys.append(normalized)

            index = len(self.entries)
            self.entries.append(entry)
            self.keys.append(keys)

            for key in keys:
                self.fast_lookup.setdefault(key, []).append(index)

        self._entry_count = len(self.entries)

    @property
    def entry_count(self) -> int:
        return self._entry_count

    # -----------------------------------------------------
    # البحث المباشر (Exact Match)
    # -----------------------------------------------------

    def _exact_search(self, phrases: list) -> dict:
        """
        بحث مباشر: لو العبارة تساوي اسم دواء تماماً في القاموس.
        """
        matches = {}

        for phrase in phrases:
            phrase_key = normalize_text(phrase)

            if not phrase_key:
                continue

            for index in self.fast_lookup.get(phrase_key, []):

                if index in matches:
                    continue

                matches[index] = {
                    "entry": self.entries[index],
                    "score": 1.0,
                    "match_type": "exact",
                }

        return matches

    # -----------------------------------------------------
    # البحث التقريبي (Fuzzy Match)
    # -----------------------------------------------------

    def _fuzzy_search(self, phrases: list, top_n: int = 5) -> list:
        results = []

        for index, keys in enumerate(self.keys):

            best_score = 0.0
            best_key = ""
            best_phrase = ""

            for phrase in phrases:

                for key in keys:

                    # فلترة سريعة: فرق الطول الكبير لا يصل للحد الأدنى
                    if abs(len(phrase) - len(key)) > max(5, len(phrase)):
                        continue

                    score = similarity(phrase, key)

                    # الكلمات القصيرة جداً تحتاج نسبة أعلى
                    # حتى لا تنتج تطابقات وهمية (مثل "plus" -> "PLUM")
                    if len(phrase) <= 4 and score < WEAK_MATCH_SCORE:
                        score *= 0.5

                    if score > best_score:
                        best_score = score
                        best_key = key
                        best_phrase = phrase

            if best_score >= MIN_MATCH_SCORE:
                results.append({
                    "entry_index": index,
                    "score": best_score,
                    "match_type": "fuzzy",
                    "matched_key": best_key,
                    "matched_phrase": best_phrase,
                })

        results.sort(key=lambda item: item["score"], reverse=True)

        return results[:top_n]

    # -----------------------------------------------------
    # الواجهة الرئيسية
    # -----------------------------------------------------

    def match(self, text: str, top_n: int = 5) -> dict:
        """
        البحث عن أفضل دواء محتمل في نص OCR.

        ترجع:
        {
            "query": "...",
            "normalized": "...",
            "candidate_words": [...],
            "phrases": [...],
            "matches": [
                {
                    "rank": 1,
                    "match_score": 94.4,
                    "match_type": "exact|fuzzy",
                    "brand_name": "...",
                    "generic_name": "...",
                    "dosage_form": "...",
                    "active_ingredients": [...]
                }
            ]
        }
        """
        normalized = normalize_text(text)
        words = extract_candidate_words(text)
        phrases = build_phrases(words)

        candidates = {}

        # 1) بحث مباشر أولاً
        for index, data in self._exact_search(phrases).items():
            candidates[index] = data

        # 2) بحث تقريبي للمراكز المتبقية
        fuzzy_results = self._fuzzy_search(phrases, top_n=top_n * 4)

        for item in fuzzy_results:
            index = item["entry_index"]

            if index in candidates:
                continue

            candidates[index] = {
                "entry": self.entries[index],
                "score": item["score"],
                "match_type": item["match_type"],
            }

        # 3) ترتيب وتصفية النتائج
        ranked = sorted(
            candidates.values(),
            key=lambda item: item["score"],
            reverse=True,
        )

        matches = []

        seen_names = set()

        for item in ranked:

            entry = item["entry"]

            display_name = (
                entry.get("brand_name")
                or entry.get("generic_name")
                or ""
            ).strip().lower()

            if not display_name:
                continue

            # منع تكرار نفس الدواء (قد يظهر بعدة تركيزات)
            if display_name in seen_names:
                continue

            seen_names.add(display_name)

            if len(matches) >= top_n:
                break

            matches.append({
                "rank": len(matches) + 1,
                "match_score": round(item["score"] * 100, 1),
                "match_type": item["match_type"],
                "brand_name": entry.get("brand_name", ""),
                "generic_name": entry.get("generic_name", ""),
                "dosage_form": entry.get("dosage_form", ""),
                "active_ingredients": entry.get("active_ingredients", []),
            })

        return {
            "query": text,
            "normalized": normalized,
            "candidate_words": words,
            "phrases": phrases,
            "matches": matches,
        }


# =========================================================
# عرض النتائج
# =========================================================

def pretty_print(result: dict):
    print("\n" + "=" * 60)
    print(f"النص          : {result['query']}")
    print(f"بعد التنظيف  : {result['normalized'] or '(فارغ)'}")
    print(f"الكلمات       : {', '.join(result['candidate_words']) or '(لا يوجد)'}")
    print("=" * 60)

    if not result["matches"]:
        print("لا يوجد تطابق فوق الحد الأدنى.")
        print("=" * 60)
        return

    for m in result["matches"]:

        name = m["brand_name"] or m["generic_name"]
        match_label = "مطابقة مباشرة" if m["match_type"] == "exact" else "مطابقة تقريبية"

        print()
        print(f"[{m['rank']}] {name}")
        print(f"    Match Score : {m['match_score']}%")
        print(f"    النوع       : {match_label}")

        if m["generic_name"] and m["generic_name"].strip().lower() != name.strip().lower():
            print(f"    الاسم العلمي: {m['generic_name']}")

        if m["dosage_form"]:
            print(f"    الشكل       : {m['dosage_form']}")

        if m["active_ingredients"]:
            print(f"    المواد      : {', '.join(m['active_ingredients'])}")

    print("=" * 60)


# =========================================================
# أوضاع التشغيل
# =========================================================

def run_test_mode(matcher: MedicineMatcher):
    """اختبار النظام على أمثلة من الملخص ووصفات حقيقية."""

    examples = [
        # مثال من الملخص
        "r omeprazole ij 40mg",

        # سطور من dataset/1.json
        "Ry Coversyl- plus 10/2-5 mg tab.",
        "R/ Noruasc 5 mg tab.",
        "R iamicron - 60 MR tab",
        "Ry Crestor 10 mg tab.",
        "Plavixtab.",
        "R Colchicinc 05 mg tab.",
    ]

    print("=" * 60)
    print("وضع الاختبار - أمثلة من الملخص ووصفات حقيقية")
    print("=" * 60)

    for example in examples:
        pretty_print(matcher.match(example))


def run_dataset_mode(matcher: MedicineMatcher, dataset_dir: str):
    """
    اختبار كل نصوص الأدوية داخل ملفات JSON الخاصة بالـ dataset
    (النتائج الفعلية لنظام OCR).
    """
    dataset_path = Path(dataset_dir)

    if not dataset_path.is_dir():
        print(f"المجلد غير موجود: {dataset_path}")
        return

    json_files = sorted(dataset_path.glob("*.json"))

    if not json_files:
        print("لا توجد ملفات JSON في المجلد.")
        return

    for json_file in json_files:

        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            print(f"\n[!] لا يمكن قراءة {json_file.name}: {e}")
            continue

        medicines = data.get("medicines") or data.get("items") or []

        if not medicines:
            print(f"\n[ {json_file.name} ] لا توجد نصوص أدوية.")
            continue

        print("\n" + "#" * 70)
        print(f"# الملف: {json_file.name}  ({len(medicines)} سطر دواء)")
        print("#" * 70)

        for item in medicines:
            text = item.get("text", "")
            confidence = item.get("score", 0)

            result = matcher.match(text)

            print(f"\nOCR: [{confidence:.2f}] {text}")

            if not result["matches"]:
                print("    -> لا يوجد تطابق.")
                continue

            top = result["matches"][0]
            name = top["brand_name"] or top["generic_name"]

            confidence = (
                "قوي" if top["match_score"] >= 80.0 else "ضعيف (قد لا يكون دواء)"
            )

            print(
                f"    -> {name} "
                f"(Score: {top['match_score']}%, {top['match_type']}) "
                f"[{confidence}]"
            )


# =========================================================
# نقطة الدخول
# =========================================================

if __name__ == "__main__":

    matcher = MedicineMatcher()

    print("=" * 60)
    print("Medicine Matching Engine")
    print(f"القاموس : {matcher.dict_path}")
    print(f"عدد السجلات: {matcher.entry_count}")
    print("=" * 60)

    args = sys.argv[1:]

    if "--test" in args:
        run_test_mode(matcher)

    elif "--dataset" in args:

        index = args.index("--dataset")

        if index + 1 < len(args):
            run_dataset_mode(matcher, args[index + 1])
        else:
            run_dataset_mode(matcher, "OCR/dataset")

    elif args:

        for query in args:
            result = matcher.match(query)
            pretty_print(result)

    else:

        print("اكتب نص الروشة (أو R/ لدخول متعدد، q للخروج):")

        while True:

            query = input("\n> ").strip()

            if not query:
                continue

            if query.lower() in ("q", "exit", "خروج"):
                break

            result = matcher.match(query)
            pretty_print(result)