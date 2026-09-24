# باكند منصة دوائي (FastAPI)

باكند منصة "دوائي" — البحث عن الأدوية ومقارنة الصيدليات وقراءة الوصفات الطبية.

## المتطلبات
- Python 3.14
- PostgreSQL (أو SQLite للاختبار عبر تغيير `DATABASE_URL`)

## التثبيت والتشغيل
```bat
cd pharmacy_bd\Backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

copy .env.example .env      :: ثم عدّل القيم (DB + JWT)

:: إنشاء الجداول
alembic upgrade head

:: التشغيل
venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

## تعبئة البيانات التجريبية (seed.py)
يعبّئ قاعدة البيانات ببيانات حقيقية تشغيلية:
- **9 فئات** (مسكنات، مضادات حيوية، فيتامينات، ...)
- **45 دواءً** شائعًا في السوق الليبي/العربي بأسماء عربية ومواد فعالة
- **7 صيدليات** (مدينة سبها) بأسعار وكميات تقريبية بالمخزون

```bat
cd pharmacy_bd
venv\Scripts\python.exe Backend\seed.py
```

> آمن إعادةً للتكرار: يتخطّى الفئات/الأدوية/الصيدليات الموجودة مسبقًا ويُضيف المفقود فقط.

لتسجيل حساب مدير، أنشئ مستخدمًا عبر واجهة التسجيل ثم اجعله `is_superadmin` في جدول
`users` يدويًا (أو عبر واجهة الأدمن).

## نظام OCR (اختياري — ضمن مجلد OCR المنفصل)
تشغيل العامل الدائم لقراءة الوصفات (بيئة Python 3.11 مستقلة):

```bat
cd pharmacy_bd\OCR
ocr-venv\Scripts\python.exe ocr_worker.py --port 8001
```

الباكند يتصل بالعامل تلقائيًا عبر `POST /api/prescriptions/ocr`,
وإن لم يكن العامل يعمل يستدعي الـ pipeline كعملية منفصلة. راجع `OCR\README.md`.

## نقاط API رئيسية
| المسار | الوصف |
|---|---|
| `GET /api/medicines` | قائمة الأدوية مع توفرها وأسعارها |
| `GET /api/pharmacies/` | قائمة الصيدليات |
| `POST /api/auth/login` | تسجيل الدخول (JWT) |
| `POST /api/prescriptions/ocr` | رفع روشة طبية واستخراج الأدوية |
| `GET/POST /api/pharmacies/{id}/inventory` | مخزون الصيدلية (مدير) |
| `GET /api/admin/stats` | إحصائيات سوبر الأدمن |