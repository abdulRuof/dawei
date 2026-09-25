"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/layout/Breadcrumb";
import {
  getToken,
  createPharmacyRequestFromAccount,
  getPublicRegions,
  type AuthUser,
  type PublicRegion,
  getMe,
} from "@/lib/api";
import "../profile/profile.css";
import "./register-pharmacy.css";

type Step = 1 | 2;

const digitsOnly = (v: string) => v.replace(/\D/g, "").slice(0, 10);

export default function RegisterPharmacyPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentStep, setCurrentStep] = useState<Step>(1);

  // الخطوة الأولى — بيانات المالك
  const [ownerPhone, setOwnerPhone] = useState("");

  // الخطوة الثانية — بيانات الصيدلية
  const [regions, setRegions] = useState<PublicRegion[]>([]);
  const [regionId, setRegionId] = useState("");
  const [pharmacyName, setPharmacyName] = useState("");
  const [pharmacyPhone, setPharmacyPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const hasToken = !!getToken();
    if (!hasToken) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    getMe()
      .then((u) => {
        setUser(u);
        setOwnerPhone(u.phone ?? "");
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    getPublicRegions()
      .then((res) => setRegions(res.results))
      .catch(() => /* ignore */ undefined);
  }, []);

  const showMessage = (type: "ok" | "error", text: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (type === "ok") {
      setMessage(text);
      setError(null);
    } else {
      setError(text);
      setMessage(null);
    }
    timer.current = setTimeout(() => {
      setMessage(null);
      setError(null);
    }, 6000);
  };

  const goNext = () => {
    if (ownerPhone.length !== 10) {
      showMessage("error", "رقم الهاتف يجب أن يكون 10 أرقام فقط");
      return;
    }
    setCurrentStep(2);
  };

  const onRegionChange = (value: string) => {
    setRegionId(value);
    const region = regions.find((r) => String(r.id) === value);
    setCity(region ? region.name : "");
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showMessage("error", "المتصفح لا يدعم تحديد الموقع");
      return;
    }
    showMessage("ok", "جارٍ تحديد موقعك…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        showMessage("ok", "✓ تم تحديد موقع الصيدلية");
      },
      () => showMessage("error", "تعذّر الوصول لموقعك — تحقق من إذن الموقع")
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pharmacyName.trim() || !pharmacyPhone.trim() || !city.trim() || !address.trim()) {
      showMessage("error", "يرجى تعبئة جميع بيانات الصيدلية المطلوبة");
      return;
    }
    if (pharmacyPhone.length !== 10) {
      showMessage("error", "هاتف الصيدلية يجب أن يكون 10 أرقام فقط");
      return;
    }
    if (!regionId) {
      showMessage("error", "يرجى اختيار المدينة من القائمة");
      return;
    }
    setSaving(true);
    try {
      await createPharmacyRequestFromAccount({
        pharmacy_name: pharmacyName,
        pharmacy_phone: pharmacyPhone,
        city,
        address,
        description: description || undefined,
        phone: ownerPhone,
        region_id: Number(regionId),
        latitude: coords?.lat,
        longitude: coords?.lng,
      });
      setDone(true);
      showMessage("ok", "✓ تم إرسال طلب التسجيل — سيتم مراجعة الطلب من قبل الإدارة وإشعارك بالقرار");
    } catch (err) {
      showMessage("error", err instanceof Error ? err.message : "فشل إرسال الطلب");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="profile-page">
        <div className="profile-card" style={{ textAlign: "center" }}>
          جارٍ التحميل…
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="profile-page">
        <div className="profile-card" style={{ textAlign: "center" }}>
          <h1 style={{ marginBottom: "1rem" }}>يجب تسجيل الدخول أولًا</h1>
          <p style={{ marginBottom: "1.25rem" }}>
            لطلب تسجيل صيدلية من حسابك الحالي، سجّل الدخول أولًا.
          </p>
          <Link href="/login" className="btn btn--coral" style={{ display: "inline-block" }}>
            تسجيل الدخول
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <Breadcrumb items={[{ label: "سجّل صيدليتك" }]} />
      <div className="profile-card">
        <div className="profile-head">
          <div className="profile-avatar">ص</div>
          <div>
            <h1>سجّل صيدليتك</h1>
            <p className="profile-role">{user.full_name}</p>
          </div>
        </div>

        <p className="reg-hint">
          سيتّم إنشاء طلب بانتظار مراجعة الإدارة. لن يُنشأ حساب جديد —
          سيكون حسابك الحالي هو مدير الصيدلية عند القبول.
        </p>

        {done ? (
          <div className="reg-success">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="m8.5 12.5 2.5 2.5 4.5-5" />
            </svg>
            <p>تم استلام طلبك بنجاح وسيتم التواصل معك فور المراجعة.</p>
            <Link href="/" className="btn btn--coral" style={{ display: "inline-block", textDecoration: "none" }}>
              العودة للرئيسية
            </Link>
          </div>
        ) : (
          <>
            <div className="reg-steps">
              <div className={`reg-step ${currentStep === 1 ? "is-active" : ""} ${currentStep > 1 ? "is-done" : ""}`}>
                <span className="reg-step__circle">١</span>
                <span className="reg-step__label">بيانات المالك</span>
              </div>
              <div className="reg-step-line"></div>
              <div className={`reg-step ${currentStep === 2 ? "is-active" : ""}`}>
                <span className="reg-step__circle">٢</span>
                <span className="reg-step__label">بيانات الصيدلية</span>
              </div>
            </div>

            {currentStep === 1 ? (
              <form className="profile-form" onSubmit={(e) => { e.preventDefault(); goNext(); }}>
                <div className="field">
                  <label>الاسم الكامل</label>
                  <div className="field__control">
                    <input type="text" value={user.full_name} disabled />
                  </div>
                </div>

                <div className="field">
                  <label>البريد الإلكتروني</label>
                  <div className="field__control">
                    <input type="email" value={user.email} disabled />
                  </div>
                </div>

                <div className="field">
                  <label>رقم الهاتف</label>
                  <div className="field__control">
                    <input
                      type="text"
                      dir="rtl"
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(digitsOnly(e.target.value))}
                      placeholder="091 234 5678"
                    />
                  </div>
                  <small className="field__hint">10 أرقام فقط — رقم التواصل معك بخصوص الطلب</small>
                </div>

                {message && <p className="profile-message">{message}</p>}
                {error && <p className="profile-error">{error}</p>}

                <div className="profile-actions">
                  <button type="submit" className="btn btn--coral">
                    التالي
                  </button>
                </div>
              </form>
            ) : (
              <form className="profile-form" onSubmit={handleSubmit}>
                <div className="field">
                  <label>اسم الصيدلية</label>
                  <div className="field__control">
                    <input
                      type="text"
                      value={pharmacyName}
                      onChange={(e) => setPharmacyName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="field">
                  <label>هاتف الصيدلية</label>
                  <div className="field__control">
                    <input
                      type="text"
                      dir="rtl"
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      value={pharmacyPhone}
                      onChange={(e) => setPharmacyPhone(digitsOnly(e.target.value))}
                      required
                    />
                  </div>
                  <small className="field__hint">10 أرقام فقط</small>
                </div>

                <div className="field">
                  <label>المدينة</label>
                  <div className="field__control">
                    <select
                      value={regionId}
                      onChange={(e) => onRegionChange(e.target.value)}
                      required
                    >
                      <option value="">اختر المدينة…</option>
                      {regions.map((region) => (
                        <option key={region.id} value={region.id}>
                          {region.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {regions.length === 0 && (
                    <small className="field__hint">
                      لا توجد مدن متاحة حاليًا — تواصل مع الإدارة
                    </small>
                  )}
                </div>

                <div className="field">
                  <label>العنوان</label>
                  <div className="field__control">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="field">
                  <label>وصف مختصر</label>
                  <div className="field__control">
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={handleGetLocation}
                >
                  {coords ? "✓ تم تحديد الموقع" : "تحديد الموقع تلقائيًا"}
                </button>

                {message && <p className="profile-message">{message}</p>}
                {error && <p className="profile-error">{error}</p>}

                <div className="profile-actions">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => setCurrentStep(1)}
                  >
                    السابق
                  </button>
                  <button type="submit" className="btn btn--coral" disabled={saving} style={{ marginInlineStart: "0.5rem" }}>
                    {saving ? "جارٍ الإرسال…" : "إرسال طلب التسجيل"}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </main>
  );
}