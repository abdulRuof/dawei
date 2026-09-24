# نظام OCR — قراءة الوصفات الطبية

نظام مستقل داخل بيئة `ocr-venv` (Python 3.11) لقراءة الوصفات الطبية العربية
واستخراج الأدوية منها.

## سير العمل
```
صورة الوصفة
   ↓  PaddleOCR (عربي)
   ↓  تنظيف النصوص وتصفيتها  (ocr_utils.py)
   ↓  تصنيف: أدوية / بيانات  (ocr_classifier.py)
   ↓  مطابقة الأدوية          (medicine_matcher.py + قواميس)
   ↓  استخراج الجرعة          (medicine_extractor.py)
نتيجة: matched_medicines + unmatched
```

## القواميس
- `clean_pharmacy_dict.json` — قاموس أساسي مبني من openFDA
- `local_drug_aliases.json` — أسماء أدوية ليبية/إقليمية
- `wikidata_drug_aliases.json` — أسماء بديلة من ويكيبيديا (تلقائي)

## التشغيل
### 1) اختبار مباشر على صورة
```bat
ocr-venv\Scripts\python.exe ocr_pipeline.py "images\phramcy\11.jpg"
```
### 2) العامل الدائم (يوصى به — النموذج يبقى محمّلاً)
```bat
ocr-venv\Scripts\python.exe ocr_worker.py --port 8001
```
ثم الباكند يرسل له الصور عبر `POST http://127.0.0.1:8001/ocr`
(وإن لم يكن عاملًا يعمل، الباكند يستدعي الـ pipeline كعملية منفصلة تلقائيًا).

### 3) معالجة كل الصور
```bat
ocr-venv\Scripts\python.exe ocr_pipeline.py --all
```

## المطابقة
محرك `medicine_matcher.py`:
- بحث مباشر (exact) عبر فهرس سريع + بحث تقريبي (fuzzy عبر RapidFuzz)
- تصحيح أخطاء OCR الشائعة (`soo`→`500`, `omeprn`→`omeprazole`, ...)
- نقاط ثقة: قبول ≥ 0.75، تطابق قوي ≥ 0.80

## التثبيت من الصفر
```bat
cd pharmacy_bd\OCR
python -m venv ocr-venv
ocr-venv\Scripts\python.exe -m pip install -r requirements.txt
```