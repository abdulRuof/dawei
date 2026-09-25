# دليل ربط الواجهة الأمامية (Frontend Integration)

دليل لربط واجهة Next.js بباكند "دوائي". يغطي التغييرات الخمس الجديدة من
طلب التطوير، مع نقاط النهاية وبنيتها وتدفقات الشاشات.

المصادقة: ترويسة `Authorization: Bearer <access_token>` لكل طلب يحتاج تسجيل دخول.

---

## 1) صفحة "حسابي" وصفحة "الأمان" وصورة المستخدم

### التغييرات
- `PUT /api/auth/me` **لم تعد تقبل حقول كلمة المرور** — تعديل الاسم والهاتف فقط.
- **نقطة نهاية جديدة** `POST /api/auth/change-password` لصفحة الأمان المنفصلة.
- **نقطة نهاية جديدة** `POST /api/auth/avatar` لرفع صورة المستخدم.
- كل استجابات المستخدم (`/register`, `/login`, `/auth/me`) تتضمن `avatar_url`.

### صفحة "حسابي" (ملف شخصي)
`PUT /api/auth/me` — الجسد:

```json
{ "full_name": "أحمد التائب", "phone": "0912345678" }
```

- `full_name` و`phone` اختياريان (أرسل ما تغيّر فقط).
- رقم هاتف مكرر آخر → `400` برسالة عربية.
- الاستجابة = كائن المستخدم الكامل (يتضمن `avatar_url` و`must_change_password`).

### رفع صورة المستخدم (اختياري)
`POST /api/auth/avatar` — `multipart/form-data`، حقل `file`:

```
Allowed: jpg, jpeg, png, webp, gif | Max: 5MB
```

الاستجابة: `{ "message", "user": { ..., "avatar_url": "/uploads/avatar_<id>_...png" } }`
تُعرض الصورة مباشرة من `https://<host>/uploads/...`.

### صفحة "الأمان" (تغيير كلمة المرور)
`POST /api/auth/change-password` — الجسد:

```json
{ "current_password": "كلمة المرور الحالية", "new_password": "12345678" }
```

- `new_password` ≥ 8 أحرف. كلمة حاليّة خاطئة → `400`.
- نجاح → `200` مع `{ "message", "user" }` حيث `user.must_change_password = false`.

---

## 2) تسجيل صيدلية من الحساب — بخطوتين + إضافة موقع غير موجود

المسار: `POST /api/pharmacy-requests/from-account` (يتطلب تسجيل دخول).

### الخطوة الأولى — بيانات المالك
تُرسل مع نفس الطلب (أو قبلها): `phone` اختياري لإضافة/تحديث هاتف المستخدم
(اختياري، يتحقق من التفرد).

### الخطوة الثانية — بيانات الصيدلية
الحقول المطلوبة: `pharmacy_name`, `pharmacy_phone`, `city`, `address`.

الحقول الاختيارية: `region_id`, **`region_name`**، `latitude`, `longitude`, `description`,
`phone` (للمالك).

### إضافة موقع غير موجود
إذا أرسل المستخدم `region_name` غير موجود سابقًا:
- تُنشأ المنطقة الجديدة تلقائيًا وتُربط بالطلب ثم بالصيدلية بعد الموافقة.
- الأولوية لـ `region_id` عند إرسالها مع `region_name`.

مثال كامل:

```json
{
  "phone": "0912345678",
  "pharmacy_name": "صيدلية السلام",
  "pharmacy_phone": "0922222222",
  "city": "سبها",
  "address": "شارع النيل",
  "region_name": "حي الجديد",
  "latitude": 27.03,
  "longitude": 14.4,
  "description": "صيدلية جديدة"
}
```

الاستجابة: `{ "message", "request": { "id", "user_id", "pharmacy_name", "status" } }`
(الطلب يبقى `pending` حتى موافقة الأدمن).

---

## 3) فصل الإشعارات في صفحات منفصلة (مستخدم / صيدلية / منصة)

إرشادات عامة: عنوان `/api/notifications` + معامل `scope`.

| `scope` | الشاشة | الأنواع المعروضة |
|---|---|---|
| `user` | إشعارات المستخدم العادي | `PHARMACY_APPROVED`, `PHARMACY_REJECTED`, `MEDICINE_AVAILABLE` |
| `pharmacy` | إشعارات أدمن الصيدلية | `PHARMACY_APPROVED`, `PHARMACY_REJECTED`, `LOW_STOCK`, `NEW_EMPLOYEE` |
| `admin` | إشعارات أدمن المنصة | `PHARMACY_REGISTRATION_REQUEST` |

### النطاقات المتاحة لكل حساب
- `user` — دائمًا متاح.
- `pharmacy` — فقط لمن يملك/يعمل في صيدلية.
- `admin` — فقط للسوبر أدمن.

طلب `scope` خارج نطاق الحساب → `403`. `scope` غير معروف → `400`.

### عرض الإشعارات
`GET /api/notifications?scope=user` (عملية بدون `scope` تعرض الكل):

```json
{
  "scope": "user",
  "count": 3,
  "unread_count": 2,
  "results": [
    {
      "id": 12,
      "type": "PHARMACY_APPROVED",
      "title": "تم قبول صيدليتك",
      "body": "...",
      "link": "/dashboard/manager/5",
      "entity_type": "pharmacy",
      "entity_id": 5,
      "is_read": false,
      "created_at": "2026-09-25T...Z"
    }
  ],
  "scopes": { "available": ["user", "pharmacy"], "unread": { "user": 2, "pharmacy": 1 } }
}
```

### شارات غير المقروء (لكل صفحة)
`GET /api/notifications/summary`:

```json
{ "scopes": ["user", "pharmacy", "admin"], "unread": { "user": 2, "pharmacy": 1, "admin": 0 }, "total_unread": 3 }
```

### تحديد كمقروء
- واحد: `PATCH /api/notifications/{id}/read`
- الكل (ضمن النطاق الحالي): `PATCH /api/notifications/read-all?scope=pharmacy`

---

## 4) قبول طلب "من حساب": حساب مدير منفصل — إشعار للمستخدم الأصلي

عند موافقة الأدمن على طلب `source=account`:

### ما يحدث
1. يُنشأ **حساب مدير منفصل** ببريد جديد: `user@example.com` → `user+pharmacy@example.com`.
2. كلمة مروره **الحالية** هي نفس كلمة مرور حساب مقدم الطلب (المنصة لا تخترع كلمة سر).
3. `must_change_password = true` للحساب الجديد — **لوحة التحكم محجوبة** حتى يغيّرها.
4. إشعاران بالقبول (`PHARMACY_APPROVED`):
   - للمستخدم الأصلي (يذكره بالبريد الجديد وكيفية أول دخول) — **هذا الإصلاح الجديد**.
   - لحساب المدير الجديد.

### تدفّق أول دخول لمقدم الطلب (المستخدم الجديد)
1. يعرض الواجهة رسالة الإشعار على حساب المستخدم الأصلي: "أُنشئ حساب مدير جديد ببريد
   `user+pharmacy@example.com` — سجّل الدخول بكلمة مرور حسابك الحالية".
2. يسجّل الدخول بالبريد الجديد + كلمة المرور القديمة → `login` يرجّع `must_change_password: true`.
3. توجّهُ الواجهة إلى صفحة **الأمان** لإجبار تغيير كلمة المرور.
4. أي استدعاء للوحة التحكم (مخزون، موظفين، ...) قبل تغييرها يرجع:

```json
HTTP 428 Precondition Required
{ "detail": "MUST_CHANGE_PASSWORD" }
```

5. بعد `POST /api/auth/change-password` بنجاح → تُفتح لوحة التحكم.

> ملاحظة: عند أي كشف لـ`MUST_CHANGE_PASSWORD` من استجابة لوحة التحكم، أعد توجيه
> المستخدم لصفحة الأمان فورًا (وليس لصفحة داخل لوحة التحكم).

---

## 5) تسجيل المستخدم العادي بدون هاتف

`POST /api/auth/register` — `phone` **ليس مطلوبًا ويُتجاهل نهائيًا**:

```json
{ "full_name": "أحمد التائب", "email": "ahmed@example.com", "password": "Secret123!" }
```

- التحقق: `full_name`, `email`, `password` (≥ 8 أحرف) فقط.
- رقم الهاتف يُضاف لاحقًا (إن احتاجه المستخدم) عبر `PUT /api/auth/me` أو من
  الخطوة الأولى لتسجيل الصيدلية.
- الدخول بالهاتف ما زال مدعومًا: `POST /api/auth/login` بقيمة `email` = رقم الهاتف
  للطرف الذي أضافه سابقًا.

---

## ملاحظات عامة للواجهة
- **مجال الصور**: ملفات `/uploads/...` تُخدم تلقائيًا بلا مصادقة (صور عامة).
- **بطاقة المستخدم**: استخدم دائمًا `avatar_url` (قد يكون `null` → اعرض حرف الاسم).
- **الإشعارات**: صفحات منفصلة، كل صفحة تستدعي `scope` المناسب + `summary` للشارات.
- **قاعدة بيانات الإنتاج** (PostgreSQL) تحتاج ترحيلًا واحدًا قبل هذه الميزات:
  ```bat
  venv\Scripts\python.exe -m migrations.migrate_user_account_features
  ```