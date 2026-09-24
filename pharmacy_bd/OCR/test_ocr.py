from paddleocr import PaddleOCR

from ocr_utils import clean_text, is_valid_text
from ocr_classifier import split_texts

import json
from pathlib import Path
from datetime import datetime


# =========================================================
# إعداد OCR
# =========================================================

ocr = PaddleOCR(
    lang="ar",
    device="cpu",
    engine="onnxruntime",
)


# =========================================================
# مسار الصورة
# =========================================================

image_path = Path("OCR/images/phramcy/11.jpg")


# =========================================================
# مجلد Dataset
# =========================================================

dataset_dir = Path("OCR/dataset")
dataset_dir.mkdir(parents=True, exist_ok=True)


# =========================================================
# تشغيل OCR
# =========================================================

result = ocr.predict(str(image_path))

texts = []


# =========================================================
# استخراج النصوص
# =========================================================

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
            "score": round(float(score), 4)
        })


# =========================================================
# تصنيف النصوص: أدوية مقابل بيانات غير مهمة
# =========================================================

classified = split_texts(texts)

medicines = classified["medicines"]
metadata = classified["metadata"]


# =========================================================
# عرض النتائج على شكلين منفصلين
# =========================================================

print("\n" + "=" * 60)
print("أسماء الأدوية / الجرعات (Medicines)")
print("=" * 60)

if not medicines:
    print("لا توجد نصوص مصنّفة كأدوية.")

for item in medicines:
    print(f"{item['score']:.2f}  |  {item['text']}")


print("\n" + "=" * 60)
print("بيانات غير مهمة (Metadata: طبيب / عيادة / مريض ... إلخ)")
print("=" * 60)

if not metadata:
    print("لا توجد بيانات غير مهمة مكتشفة.")

for item in metadata:
    print(f"{item['score']:.2f}  |  {item['text']}")


# =========================================================
# تجهيز بيانات Dataset
# =========================================================

dataset_item = {

    "image": image_path.name,

    "ocr_engine": "PaddleOCR",

    "language": "ar",

    "created_at": datetime.now().isoformat(),

    # النصوص كاملة زي ما هي (بدون فصل) - لو محتاجها لاحقاً
    "items": texts,

    # النصوص بعد الفصل
    "medicines": medicines,

    "metadata": metadata,

}


# =========================================================
# اسم ملف JSON
# =========================================================

output_file = dataset_dir / f"{image_path.stem}.json"


# =========================================================
# حفظ النتيجة
# =========================================================

with open(
    output_file,
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        dataset_item,
        file,
        ensure_ascii=False,
        indent=2
    )


# =========================================================
# النتيجة
# =========================================================

print("\n" + "=" * 60)
print("تم حفظ قراءة OCR")
print("=" * 60)

print(f"الصورة : {image_path}")
print(f"الملف  : {output_file}")
print(f"إجمالي النصوص : {len(texts)}")
print(f"عدد الأدوية المكتشفة : {len(medicines)}")
print(f"عدد بيانات (metadata) المكتشفة : {len(metadata)}")
