"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import "./style.css";

// =========================================================
// أنواع البيانات المطابقة لناتج OCR pipeline
// =========================================================

interface OcrLine {
  text: string;
  score?: number;
}

interface MatchedMedicine {
  medicine_name: string;
  generic_name?: string;
  match_score: number;
  match_type?: string;
  dose?: string;
  dosage_form?: string;
  active_ingredients?: string[];
  ocr_lines?: OcrLine[];
}

interface ApiResult {
  image?: string;
  ocr_engine?: string;
  language?: string;
  created_at?: string;
  matched_medicines?: MatchedMedicine[];
  unmatched_medicine_lines?: OcrLine[];
  metadata?: string[];
}

interface ApiResponse {
  status: string;
  message: string;
  data: ApiResult;
}

// ---- بيانات الصيدليات القادمة من API ----

interface PharmacyListing {
  pharmacy_id: number;
  pharmacy_name: string;
  city?: string | null;
  address?: string | null;
  price?: number | null;
  quantity?: number | null;
  is_available?: boolean | null;
}

interface SearchMedicine {
  id: number;
  name: string;
  generic_name?: string | null;
  pharmacies?: PharmacyListing[];
}

interface SearchResponse {
  query: string;
  results: SearchMedicine[];
}

interface AvailabilityState {
  loading: boolean;
  error?: string;
  matchedName?: string;
  pharmacies: PharmacyListing[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/bmp",
  "image/webp",
  "image/tiff",
  "image/gif",
];

// =========================================================
// أدوات مساعدة
// =========================================================

const formatScore = (score: number) => Math.round(score * 100);

const scoreClass = (score: number) => {
  if (score >= 0.95) return "badge--high";
  if (score >= 0.8) return "badge--mid";
  return "badge--low";
};

const matchTypeLabel = (type?: string) =>
  type === "exact" ? "مطابقة تامة" : type === "fuzzy" ? "مطابقة تقريبية" : "";

// =========================================================
// المكوّن الرئيسي
// =========================================================

const PrescriptionReader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [availability, setAvailability] = useState<Record<string, AvailabilityState>>({});
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [prefillName, setPrefillName] = useState("");
  const [addForm, setAddForm] = useState({
    brand_name: "",
    generic_name: "",
    aliases: "",
    dosage_form: "",
  });
  const [addState, setAddState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [addMsg, setAddMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // ---- اختيار الصورة ----

  const selectFile = useCallback((selected: File | null) => {
    if (!selected) return;

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError("صيغة الصورة غير مدعومة. اختر JPG أو PNG أو WEBP.");
      return;
    }

    setError(null);
    setResult(null);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }, []);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    selectFile(event.dataTransfer.files?.[0] ?? null);
  };

  // ---- الرفع والقراءة ----

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(`${API_URL}/api/prescriptions/ocr`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let detail = "تعذر قراءة الروشتة. حاول مرة أخرى.";

        try {
          const body = await response.json();
          if (typeof body.detail === "string") detail = body.detail;
        } catch {
          /* تجاهل - استخدم الرسالة الافتراضية */
        }

        throw new Error(detail);
      }

      const json = (await response.json()) as ApiResponse;

      setResult(json.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "تعذر الاتصال بالخادم. تأكد من تشغيل الـ Backend."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ---- نسخ أسماء الأدوية ----

  const copyMedicines = async () => {
    if (!result?.matched_medicines?.length) return;

    const list = result.matched_medicines
      .map(
        (med, index) =>
          `${index + 1}. ${med.medicine_name}${med.dose ? ` - ${med.dose}` : ""}`
      )
      .join("\n");

    try {
      await navigator.clipboard.writeText(list);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* الحافظة غير متاحة */
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setExpanded({});
    setAvailability({});
    if (inputRef.current) inputRef.current.value = "";
  };

  // ---- جلب الصيدليات المتوفرة لدواء ----

  const availabilityKey = (medicineName: string, index: number) =>
    `${index}-${medicineName}`;

  const toggleAvailability = async (
    med: MatchedMedicine,
    index: number
  ) => {
    const key = availabilityKey(med.medicine_name, index);
    const willExpand = !expanded[key];

    setExpanded((prev) => ({ ...prev, [key]: willExpand }));

    // جلب البيانات مرة واحدة فقط عند أول فتح
    if (willExpand && !availability[key]) {
      setAvailability((prev) => ({
        ...prev,
        [key]: { loading: true, pharmacies: [] },
      }));

      try {
        const response = await fetch(
          `${API_URL}/api/medicines/search?q=${encodeURIComponent(
            med.medicine_name
          )}`,
          { method: "GET" }
        );

        if (!response.ok) {
          throw new Error("تعذر جلب بيانات الصيدليات.");
        }

        const data = (await response.json()) as SearchResponse;
        const top = data.results[0];

        setAvailability((prev) => ({
          ...prev,
          [key]: {
            loading: false,
            matchedName: top?.name,
            pharmacies: top?.pharmacies ?? [],
          },
        }));
      } catch (err) {
        setAvailability((prev) => ({
          ...prev,
          [key]: {
            loading: false,
            error:
              err instanceof Error
                ? err.message
                : "تعذر الاتصال بالخادم.",
            pharmacies: [],
          },
        }));
      }
    }
  };

  // ---- إضافة دواء للقاموس (طبقة C) ----

  const openAddFormFor = (text?: string) => {
    const name = text ?? "";
    setPrefillName(name);
    setAddForm((prev) => ({
      ...prev,
      brand_name: name,
      generic_name: "",
      aliases: name ? name : prev.aliases,
      dosage_form: "",
    }));
    setAddState("idle");
    setAddMsg("");
    setAddFormOpen(true);
  };

  const submitAddDrug = async () => {
    const brand_name = addForm.brand_name.trim();
    const generic_name = addForm.generic_name.trim();

    if (!brand_name || !generic_name) {
      setAddState("error");
      setAddMsg("أدخل اسم الدواء والمادة الفعالة على الأقل.");
      return;
    }

    setAddState("loading");
    setAddMsg("");

    try {
      const response = await fetch(`${API_URL}/api/ocr/dictionary/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_name,
          generic_name,
          aliases: addForm.aliases
            .split(/[,،]/)
            .map((a) => a.trim())
            .filter(Boolean),
          dosage_form: addForm.dosage_form.trim(),
        }),
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.detail ?? "تعذرت إضافة الدواء.");
      }

      setAddState("done");
      setAddMsg(
        `تمت إضافة "${brand_name}" إلى القاموس — سيُقرأ في الروشتة القادمة.`
      );
    } catch (err) {
      setAddState("error");
      setAddMsg(
        err instanceof Error ? err.message : "تعذر الاتصال بالخادم لإضافة الدواء."
      );
    }
  };

  // =========================================================
  // العرض
  // =========================================================

  const medicines = result?.matched_medicines ?? [];
  const unmatched = result?.unmatched_medicine_lines ?? [];

  return (
    <section className="reader-section">
      <div className="container reader-container">
        {/* ---- الترويسة ---- */}
        <header className="reader-hero">
          <p className="reader-hero__eyebrow">اقرأ الروشتة تلقائياً</p>
          <h1 className="reader-hero__title">صوّر الروشتة وسنقرؤها لك</h1>
          <p className="reader-hero__subtitle">
            ارفع صورة وصفتك الطبية، وسيستخرج النظام أسماء الأدوية منها بدقة،
            مع الجرعة ودرجة الثقة لكل دواء.
          </p>
        </header>

        {/* ---- منطقة الرفع ---- */}
        <div className="reader-card">
          {!result && (
            <>
              <div
                className={`dropzone ${preview ? "dropzone--has-preview" : ""}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
                }}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPTED_TYPES.join(",")}
                  className="dropzone__input"
                  onChange={(e) => selectFile(e.target.files?.[0] ?? null)}
                />

                {preview ? (
                  <img
                    src={preview}
                    alt="معاينة الروشتة"
                    className="dropzone__preview"
                  />
                ) : (
                  <div className="dropzone__empty">
                    <span className="dropzone__icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="34" height="34">
                        <path
                          fill="currentColor"
                          d="M12 3a6 6 0 0 0-5.9 5A4.5 4.5 0 0 0 5 17h14a4.5 4.5 0 0 0 .9-8.9A6 6 0 0 0 12 3Zm-1 8.5V15h2v-3.5H16l-4-4-4 4h3Z"
                        />
                      </svg>
                    </span>
                    <p className="dropzone__title">
                      اسحب صورة الروشتة هنا أو اضغط للاختيار
                    </p>
                    <p className="dropzone__hint">
                      JPG · PNG · WEBP — بحد أقصى 10 ميجابايت
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ---- شريط الحالة ----
               يظهر أثناء قراءة الصورة
          ---- */}
          {!result && !isLoading && file && (
            <div className="reader-actions">
              <button
                className="btn btn--primary"
                onClick={handleUpload}
                disabled={isLoading}
              >
                قراءة الروشتة
              </button>
              <button className="btn btn--ghost" onClick={reset}>
                إلغاء
              </button>
            </div>
          )}

          {!result && isLoading && (
            <div className="reader-loading">
              <span className="spinner" aria-hidden="true" />
              <p className="reader-loading__title">جارٍ قراءة الروشتة...</p>
              <p className="reader-loading__hint">
                قد تستغرق المعالجة حتى 30 ثانية. لا تغلق الصفحة.
              </p>
            </div>
          )}

          {!result && error && (
            <div className="reader-error" role="alert">
              <strong>حدث خطأ:</strong> {error}
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => setError(null)}
              >
                إغلاق
              </button>
            </div>
          )}

          {/* ---- النتائج ---- */}
          {result && (
            <div className="results">
              <div className="results__head">
                <div>
                  <h2 className="results__title">النتيجة</h2>
                  <p className="results__subtitle">{`تم العثور على ${medicines.length} دواء${unmatched.length ? ` و${unmatched.length} سطر غير مطابق` : ""}`}</p>
                </div>
                <div className="results__actions">
                  <button
                    className="btn btn--outline btn--sm"
                    onClick={copyMedicines}
                    disabled={!medicines.length}
                  >
                    {copied ? "تم النسخ ✓" : "نسخ القائمة"}
                  </button>
                  <button className="btn btn--ghost btn--sm" onClick={reset}>
                    روشة أخرى
                  </button>
                </div>
              </div>

              {!medicines.length && (
                <p className="results__empty">
                  لم يتم التعرف على أي أدوية في هذه الصورة.
                </p>
              )}

              <div className="results__grid">
                {medicines.map((med, index) => (
                  <article className="med-card" key={`${med.medicine_name}-${index}`}>
                    <div className="med-card__top">
                      <span className="med-card__index">{index + 1}</span>
                      <span className={`badge ${scoreClass(med.match_score)}`}>
                        {formatScore(med.match_score)}%
                      </span>
                      {med.match_type && (
                        <span className="med-card__type">
                          {matchTypeLabel(med.match_type)}
                        </span>
                      )}
                    </div>

                    <h3 className="med-card__name">{med.medicine_name}</h3>

                    <div className="med-card__meta">
                      {med.dose && <span>الجرعة: <b>{med.dose}</b></span>}
                      {med.dosage_form && (
                        <span>الشكل: <b>{med.dosage_form}</b></span>
                      )}
                    </div>

                    {med.generic_name && (
                      <p className="med-card__generic">
                        المادة الفعالة: {med.generic_name}
                      </p>
                    )}

                    {med.active_ingredients?.length ? (
                      <div className="med-card__ingredients">
                        {med.active_ingredients.map((ing, i) => (
                          <span className="ingredient-chip" key={`${ing}-${i}`}>
                            {ing}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {med.ocr_lines?.[0] && (
                      <p className="med-card__source">
                        قرأ النظام: “{med.ocr_lines[0].text}”
                      </p>
                    )}

                    <button
                      type="button"
                      className={`btn btn--outline btn--sm med-card__pharm-btn ${
                        expanded[availabilityKey(med.medicine_name, index)]
                          ? "is-active"
                          : ""
                      }`}
                      onClick={() => toggleAvailability(med, index)}
                      aria-expanded={
                        !!expanded[availabilityKey(med.medicine_name, index)]
                      }
                    >
                      {expanded[availabilityKey(med.medicine_name, index)]
                        ? "إخفاء الصيدليات"
                        : "الصيدليات المتوفرة"}
                    </button>

                    {expanded[availabilityKey(med.medicine_name, index)] &&
                      availability[availabilityKey(med.medicine_name, index)] && (
                        <AvailabilityList
                          state={
                            availability[availabilityKey(med.medicine_name, index)]
                          }
                        />
                      )}
                  </article>
                ))}
              </div>

              {unmatched.length > 0 && (
                <div className="unmatched">
                  <div className="unmatched__head">
                    <div>
                      <h3 className="unmatched__title">
                        أدوية لم تستطع القاعدة التعرف عليها ({unmatched.length})
                      </h3>
                      <p className="unmatched__hint">
                        هذه السطور أقرأها النموذج لكنها غير موجودة في القاموس.
                        أضِفها ليتعرّف عليها النظام من الآن فصاعداً.
                      </p>
                    </div>
                    <button
                      className="btn btn--outline btn--sm"
                      onClick={() => openAddFormFor("")}
                    >
                      + إضافة دواء
                    </button>
                  </div>

                  <ul className="unmatched__list">
                    {unmatched.map((line, i) => (
                      <li key={i} className="unmatched__item">
                        <span className="unmatched__text">
                          {typeof line === "string" ? line : line.text}
                        </span>
                        <button
                          className="btn btn--ghost btn--sm"
                          onClick={() =>
                            openAddFormFor(
                              typeof line === "string" ? line : line.text
                            )
                          }
                        >
                          أضِفه للقاموس
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {addFormOpen && (
                <AddMedicineForm
                  form={addForm}
                  setForm={setAddForm}
                  state={addState}
                  message={addMsg}
                  onSubmit={submitAddDrug}
                  onClose={() => setAddFormOpen(false)}
                  onDone={() => {
                    setAddState("idle");
                    setAddForm({
                      brand_name: "",
                      generic_name: "",
                      aliases: prefillName ? "" : "",
                      dosage_form: "",
                    });
                  }}
                />
              )}

              <p className="results__disclaimer">
                النتائج استرشادية بالذكاء الاصطناعي. راجع الصيدلي أو الطبيب
                للتأكد من الدواء والجرعة قبل الاستخدام.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// =========================================================
// نموذج إضافة دواء للقاموس
// =========================================================

interface AddMedicineFormProps {
  form: {
    brand_name: string;
    generic_name: string;
    aliases: string;
    dosage_form: string;
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      brand_name: string;
      generic_name: string;
      aliases: string;
      dosage_form: string;
    }>
  >;
  state: "idle" | "loading" | "done" | "error";
  message: string;
  onSubmit: () => void;
  onClose: () => void;
  onDone: () => void;
}

const AddMedicineForm = ({
  form,
  setForm,
  state,
  message,
  onSubmit,
  onClose,
  onDone,
}: AddMedicineFormProps) => {
  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="addmed">
      <div className="addmed__head">
        <h4 className="addmed__title">إضافة دواء للقاموس</h4>
        <button className="addmed__close" onClick={onClose} aria-label="إغلاق">
          ×
        </button>
      </div>

      {state === "done" ? (
        <div className="addmed__done">
          <p>{message}</p>
          <div className="addmed__actions">
            <button className="btn btn--primary btn--sm" onClick={onDone}>
              إضافة دواء آخر
            </button>
            <button className="btn btn--ghost btn--sm" onClick={onClose}>
              إغلاق
            </button>
          </div>
        </div>
      ) : (
        <div className="addmed__form">
          <label className="addmed__field">
            <span>اسم الدواء (كما يُكتب في الروشتة)</span>
            <input
              type="text"
              value={form.brand_name}
              placeholder="مثال: Anselacox"
              onChange={(e) => update("brand_name", e.target.value)}
            />
          </label>

          <label className="addmed__field">
            <span>المادة الفعالة</span>
            <input
              type="text"
              value={form.generic_name}
              placeholder="مثال: Etoricoxib"
              onChange={(e) => update("generic_name", e.target.value)}
            />
          </label>

          <label className="addmed__field">
            <span>أسماء بديلة / أخطاء إملائية شائعة (مفصولة بفواصل)</span>
            <input
              type="text"
              value={form.aliases}
              placeholder="مثال: anselacox, anselacox 90"
              onChange={(e) => update("aliases", e.target.value)}
            />
          </label>

          <label className="addmed__field">
            <span>الشكل الدوائي (اختياري)</span>
            <input
              type="text"
              value={form.dosage_form}
              placeholder="مثال: Tablet, Cream"
              onChange={(e) => update("dosage_form", e.target.value)}
            />
          </label>

          {state === "error" && (
            <p className="addmed__error" role="alert">
              {message}
            </p>
          )}

          <div className="addmed__actions">
            <button
              className="btn btn--primary"
              onClick={onSubmit}
              disabled={state === "loading"}
            >
              {state === "loading" ? "جارٍ الحفظ..." : "إضافة الدواء"}
            </button>
            <button className="btn btn--ghost" onClick={onClose}>
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================
// قائمة الصيدليات المتوفرة لدواء
// =========================================================

const AvailabilityList = ({ state }: { state: AvailabilityState }) => {
  const { loading, error, matchedName, pharmacies } = state;

  if (loading) {
    return (
      <div className="pharm-mini pharm-mini--note">
        <span className="spinner spinner--sm" /> <span>جارٍ البحث في الصيدليات...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pharm-mini pharm-mini--note pharm-mini--error">
        {error}
      </div>
    );
  }

  if (!pharmacies.length) {
    return (
      <div className="pharm-mini pharm-mini--note">
        {matchedName
          ? `لا توجد صيدليات مسجلة لـ "${matchedName}" حالياً.`
          : "لم يُعثر على هذا الدواء في سجل المنصة حالياً."}
      </div>
    );
  }

  return (
    <div className="pharm-mini">
      {matchedName && (
        <p className="pharm-mini__matched">
          تطابق مع: {matchedName} — {pharmacies.length} صيدلية
        </p>
      )}

      <ul className="pharm-mini__list">
        {pharmacies.map((p) => (
          <li
            className="pharm-mini__row"
            key={p.pharmacy_id}
          >
            <span className="pharm-mini__logo">
              {p.pharmacy_name.trim().charAt(0)}
            </span>

            <div className="pharm-mini__body">
              <Link href={`/pharmacies/${p.pharmacy_id}`} className="pharm-mini__name">
                {p.pharmacy_name}
              </Link>
              <span className="pharm-mini__meta">
                {p.city ?? ""}
                {p.city && p.address ? " — " : ""}
                {p.address ?? ""}
              </span>
            </div>

            <span className={`pharm-mini__stock ${p.is_available === false ? "out" : ""}`}>
              {p.is_available === false ? "غير متوفر" : "متوفر"}
            </span>

            {typeof p.price === "number" && (
              <strong className="pharm-mini__price">
                {p.price.toFixed(2)} د.ل
              </strong>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PrescriptionReader;