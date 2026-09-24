# -*- coding: utf-8 -*-
"""
ocr_pipeline.py
---------------
خط أنابيب قراءة الوصفات الطبية كاملاً (Pipeline):

    صورة الوصفة
        ↓
    PaddleOCR
        ↓
    تنظيف النصوص والتصفية
        ↓
    تصنيف النصوص (أدوية / بيانات غير مهمة)
        ↓
    محرك مطابقة الأدوية (Medicine Matcher)
        ↓
    نتيجة نهائية جاهزة للمنصة:
        matched_medicines  = أدوية مطابقة مع نسبة الثقة
        unmatched          = أسطر ظنّها النظام دواء لكن ما وجد لها تطابق قوي

هذا الموديول هو ما سيُربط مباشرة مع المنصة (منصة دوائي)
عبر API أو عبر استدعاء مباشر.

الاستخدام:
    from ocr_pipeline import OcrPipeline

    pipeline = OcrPipeline()
    result = pipeline.process_image("OCR/images/phramcy/11.jpg")

    for medicine in result["matched_medicines"]:
        print(medicine["medicine_name"], medicine["match_score"])

كلمة CLI:
    python OCR/ocr_pipeline.py "OCR/images/phramcy/11.jpg"
    python OCR/ocr_pipeline.py --all              # كل الصور في images/phramcy
"""

import json
import re
import sys
from datetime import datetime
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except (AttributeError, ValueError):
    pass

from ocr_utils import clean_text, is_valid_text
from ocr_classifier import split_texts
from medicine_extractor import extract_dose
from medicine_matcher import MedicineMatcher


# =========================================================
# إعدادات
# =========================================================

DEFAULT_IMAGES_DIR = Path(__file__).resolve().parent / "images" / "phramcy"
DEFAULT_OUTPUT_DIR = Path(__file__).resolve().parent / "dataset"

# أقل نسبة نعتبرها تطابقاً مقبولاً للدواء
MIN_MATCH_CONFIDENCE = 0.75

# أقل نسبة نعتبرها تطابقاً "قوياً"
STRONG_MATCH_CONFIDENCE = 0.80

_ocr_engine = None


def get_ocr_engine():
    """
    تهيئة محرك PaddleOCR مرة واحدة وإعادة استخدامه.
    """
    global _ocr_engine

    if _ocr_engine is None:

        from paddleocr import PaddleOCR

        _ocr_engine = PaddleOCR(
            lang="ar",
            device="cpu",
            engine="onnxruntime",
        )

    return _ocr_engine


# =========================================================
# خط الأنابيب
# =========================================================

class OcrPipeline:

    def __init__(self, use_matcher: bool = True):
        """
        use_matcher=False  ->  بدون مرحلة المطابقة (تقرير OCR فقط)
        """
        self.matcher = MedicineMatcher() if use_matcher else None

        self.matched_count = 0
        self.unmatched_count = 0

    # -------------------------------------------------
    # المعالجة الأساسية لصورة واحدة
    # -------------------------------------------------

    def process_image(self, image_path) -> dict:
        """
        يقرأ صورة روشة ويعيد النتيجة النهائية.

        النتيجة:
        {
            "image": "11.jpg",
            "ocr_engine": "PaddleOCR",
            "language": "ar",
            "created_at": "...",
            "matched_medicines": [ ... ],
            "unmatched_medicine_lines": [ ... ],
            "metadata": [ ... ],
            "items": [ ... ]
        }
        """
        image_path = Path(image_path)

        if not image_path.exists():
            return {
                "error": f"الصورة غير موجودة: {image_path}",
                "image": str(image_path),
            }

        ocr = get_ocr_engine()

        result = ocr.predict(str(image_path))

        # ---------------------------------------------
        # 1) استخراج النصوص وتنظيفها
        # ---------------------------------------------

        texts = []

        for res in result:

            rec_texts = res.get("rec_texts", [])
            rec_scores = res.get("rec_scores", [])

            for text, score in zip(rec_texts, rec_scores):

                if not is_valid_text(text, score):
                    continue

                cleaned = clean_text(text)

                if not cleaned:
                    continue

                texts.append({
                    "text": cleaned,
                    "score": round(float(score), 4),
                })

        # ---------------------------------------------
        # 2) تصنيف النصوص: أدوية / بيانات غير مهمة
        # ---------------------------------------------

        classified = split_texts(texts)

        medicine_lines = classified["medicines"]
        metadata = classified["metadata"]

        # ---------------------------------------------
        # 3) مطابقة الأدوية
        # ---------------------------------------------

        matched_medicines = []
        unmatched_medicine_lines = []

        for line in medicine_lines:

            line_text = line.get("text", "")
            line_score = line.get("score", 0)

            if not line_text:
                continue

            if self.matcher is None:

                unmatched_medicine_lines.append(line)
                continue

            match_result = self.matcher.match(line_text)

            if not match_result["matches"]:

                unmatched_medicine_lines.append({
                    "text": line_text,
                    "score": line_score,
                })
                continue

            top = match_result["matches"][0]

            if top["match_score"] / 100.0 < MIN_MATCH_CONFIDENCE:

                unmatched_medicine_lines.append({
                    "text": line_text,
                    "score": line_score,
                })
                continue

            # الجرعة إن وجدت (40mg, 500 mg, 5 ml ...)
            dose = extract_dose(line_text)

            self._merge_or_add(
                matched_medicines,
                {
                    "medicine_name": top["brand_name"] or top["generic_name"],
                    "generic_name": top["generic_name"],
                    "match_score": top["match_score"] / 100.0,
                    "match_type": top["match_type"],
                    "dose": dose,
                    "dosage_form": top["dosage_form"],
                    "active_ingredients": top["active_ingredients"],
                    "ocr_lines": [{
                        "text": line_text,
                        "score": line_score,
                    }],
                },
            )

        self.matched_count = len(matched_medicines)
        self.unmatched_count = len(unmatched_medicine_lines)

        return {
            "image": image_path.name,
            "ocr_engine": "PaddleOCR",
            "language": "ar",
            "created_at": datetime.now().isoformat(),
            "matched_medicines": matched_medicines,
            "unmatched_medicine_lines": unmatched_medicine_lines,
            "metadata": metadata,
            "items": texts,
        }

    # -------------------------------------------------
    # دمج سطور متعددة لنفس الدواء
    # -------------------------------------------------

    def _merge_or_add(self, medicines: list, new_item: dict):
        """
        إذا الدواء ظهر في أكثر من سطر (جرعات مختلفة)
        ندمج السطور بدل تكرار الدواء.
        """
        normal = self._display_key(new_item["medicine_name"])

        for existing in medicines:

            if self._display_key(existing["medicine_name"]) != normal:
                continue

            # إضافة سطر OCR
            existing["ocr_lines"].extend(new_item["ocr_lines"])

            # جرعة أوضح
            if existing.get("dose") is None and new_item.get("dose"):
                existing["dose"] = new_item["dose"]

            # ثقة أعلى
            if new_item["match_score"] > existing["match_score"]:
                existing["match_score"] = new_item["match_score"]
                existing["match_type"] = new_item["match_type"]

            return

        medicines.append(new_item)

    @staticmethod
    def _display_key(name: str) -> str:
        return re.sub(r"[^a-z0-9]+", "", (name or "").lower())

    # -------------------------------------------------
    # معالجة كل الصور في مجلد
    # -------------------------------------------------

    def process_all(
        self,
        images_dir: str = None,
        output_dir: str = None,
        image_extensions=(".jpg", ".jpeg", ".png", ".bmp", ".webp"),
    ) -> list:
        """
        يقرأ كل صور الروشات في المجلد ويحفظ نتيجة كل صورة
        كملف JSON في مجلد الـ dataset.

        يرجع قائمة بالنتائج.
        """
        images_dir = Path(images_dir) if images_dir else DEFAULT_IMAGES_DIR
        output_dir = Path(output_dir) if output_dir else DEFAULT_OUTPUT_DIR

        output_dir.mkdir(parents=True, exist_ok=True)

        if not images_dir.is_dir():
            print(f"مجلد الصور غير موجود: {images_dir}")
            return []

        images = [
            path
            for path in sorted(images_dir.iterdir())
            if path.is_file()
            and path.suffix.lower() in image_extensions
        ]

        if not images:
            print(f"لا توجد صور في المجلد: {images_dir}")
            return []

        print(f"\nعدد الصور المكتشفة: {len(images)}")
        print("=" * 60)

        results = []

        for index, image in enumerate(images, start=1):

            print(f"\n[{index}/{len(images)}] {image.name}")

            result = self.process_image(image)

            output_file = output_dir / f"{image.stem}.json"

            with open(
                output_file,
                "w",
                encoding="utf-8",
            ) as file:

                json.dump(
                    result,
                    file,
                    ensure_ascii=False,
                    indent=2,
                )

            print(self._summarize(result))
            print(f"    -> تم الحفظ: {output_file.name}")

            results.append(result)

        return results

    # -------------------------------------------------
    # ملخص قصير للنتيجة
    # -------------------------------------------------

    @staticmethod
    def _summarize(result: dict) -> str:
        lines = ["    ---------------------------------"]

        medicines = result.get("matched_medicines", [])
        unmatched = result.get("unmatched_medicine_lines", [])

        if not medicines and not unmatched:
            lines.append("    لا توجد أدوية مكتشفة.")
            return "\n".join(lines)

        for med in medicines:

            strength = f" | {med['dose']}" if med.get("dose") else ""
            score = round(med.get("match_score", 0) * 100, 1)
            label = "exact" if med.get("match_type") == "exact" else "fuzzy"

            lines.append(
                f"    [+] {med['medicine_name']} "
                f"(Score: {score}%, {label}){strength}"
            )

        if unmatched:
            lines.append(
                f"    [?] {len(unmatched)} سطراً لم يجد تطابقاً قويًا"
            )

        return "\n".join(lines)


# =========================================================
# العرض التفصيلي
# =========================================================

def pretty_print(result: dict):
    print("\n" + "=" * 60)
    print(f"الصورة     : {result.get('image', '?')}")
    print("=" * 60)

    medicines = result.get("matched_medicines", [])
    unmatched = result.get("unmatched_medicine_lines", [])

    print(f"\nالأدوية المطابقة ({len(medicines)}):")

    if not medicines:
        print("    - لا يوجد")

    for med in medicines:

        score = round(med.get("match_score", 0) * 100, 1)
        label = (
            "مطابقة مباشرة"
            if med.get("match_type") == "exact"
            else "مطابقة تقريبية"
        )

        print(f"\n    [+] {med['medicine_name']}")
        print(f"        Match Score : {score}%  ({label})")

        if med.get("dose"):
            print(f"        الجرعة      : {med['dose']}")

        if med.get("dosage_form"):
            print(f"        الشكل       : {med['dosage_form']}")

        if med.get("active_ingredients"):
            print(
                "        المواد      : "
                + ", ".join(med["active_ingredients"])
            )

        print("        سطور OCR   :")

        for line in med.get("ocr_lines", []):
            print(f"            [{line['score']:.2f}] {line['text']}")

    print(f"\nأسطر غير مطابقة ({len(unmatched)}):")

    for line in unmatched:
        print(f"    [?] [{line['score']:.2f}] {line['text']}")

    print("=" * 60)


# =========================================================
# نقطة الدخول
# =========================================================

if __name__ == "__main__":

    pipeline = OcrPipeline()

    args = sys.argv[1:]

    if "--json" in args:
        # وضع الآلة: يرجع النتيجة JSON فقط على stdout (للاستخدام من API)
        json_args = [a for a in args if a != "--json"]

        all_results = []

        for image in json_args:

            result = pipeline.process_image(image)

            if "error" in result:
                result["image"] = image

            all_results.append(result)

        print(json.dumps(
            all_results[0] if len(all_results) == 1 else all_results,
            ensure_ascii=False,
            indent=2,
        ))

    elif "--all" in args:

        pipeline.process_all()

    elif args:

        for image in args:

            result = pipeline.process_image(image)

            if "error" in result:
                print(result["error"])
                continue

            pretty_print(result)

    else:

        print("الاستخدام:")
        print('  python OCR/ocr_pipeline.py "path/to/prescription.jpg"')
        print("  python OCR/ocr_pipeline.py --all")
        print('  python OCR/ocr_pipeline.py --json "path/to/prescription.jpg"')