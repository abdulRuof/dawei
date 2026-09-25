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

## تشغيل الاختبارات (pytest)
الاختبارات تستخدم **SQLite مؤقتًا** (`%TEMP%`) معزلًا عن قاعدة بيانات التطوير — لا حاجة
إلى PostgreSQL. تُعزل الصفوف تلقائيًا بين الاختبارات ويُستبدل اعتماد `get_db`:

```bat
cd pharmacy_bd\Backend
venv\Scripts\python.exe -m pytest -v
```

> السرعة: تجزئة Argon2 بطيئة (~200ms)؛ كل الجلسة تُكمل في أقل من دقيقة.
> إن غيّرت `DATABASE_URL` في البيئة أثناء تشغيل الاختبارات فستُجبر على الملف المؤقت.

مواقع الاختبارات:
- `tests/test_auth.py` — التسجيل والدخول و`/me` وتغيير كلمة المرور وصورة المستخدم وحساب الحساب
- `tests/test_permissions.py` — أدوار المالك/الموظف/المستخدم/السوبر أدمن وعزل الصيدليات والبوابة `MUST_CHANGE_PASSWORD`
- `tests/test_public.py` — قوائم الأدوية والبحث والمقارنة بين الأسعار وقوائم الصيدليات والتقييمات
- `tests/test_workflows.py` — طلب تسجيل صيدلية بالموافقة/الرفض والإشعارات (مع `scope`) والتنبيهات

## ترحيلات خاصة (تُشغَّل يدويًا لقاعدة الإنتاج)
بالإضافة إلى `alembic upgrade head`، بعض الجداول الجديدة تُنشأ عبر سكربت مرن يحفظ البيانات:

```bat
cd pharmacy_bd\Backend
venv\Scripts\python.exe -m migrations.migrate_user_account_features
```

ينشئ جدول `notifications` وعمود `users.avatar_url` فقط إن لم يكونا موجودين (آمن الإعادة).

## نقاط API رئيسية
| المسار | الوصف |
|---|---|
| `GET /api/medicines` | قائمة الأدوية مع توفرها وأسعارها |
| `GET /api/pharmacies/` | قائمة الصيدليات (مع معلومات المنطقة) |
| `POST /api/auth/login` | تسجيل الدخول (JWT) |
| `POST /api/auth/change-password` | تغيير كلمة المرور (صفحة الأمان) |
| `POST /api/auth/avatar` | رفع صورة المستخدم |
| `POST /api/pharmacy-requests/from-account` | تسجيل صيدلية من الحساب (خطوتان + إضافة موقع جديد) |
| `GET /api/notifications?scope=user\|pharmacy\|admin` | الإشعارات مفصولة حسب الشاشة |
| `GET /api/notifications/summary` | عدد غير المقروء لكل نطاق |
| `POST /api/prescriptions/ocr` | رفع روشة طبية واستخراج الأدوية |
| `GET/POST /api/pharmacies/{id}/inventory` | مخزون الصيدلية (مدير) |
| `GET /api/admin/stats` | إحصائيات سوبر الأدمن |

> دليل ربط الواجهة الأمامية (صفحة الحساب/الأمان، تسجيل الصيدلية بخطوتين، صفحات الإشعارات الثلاث،
> تدفّق تغيير كلمة المرور الإجباري) موجود في `Backend/FRONTEND_INTEGRATION.md`.