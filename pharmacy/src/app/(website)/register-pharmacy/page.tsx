"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/layout/Breadcrumb";
import { getToken, createPharmacyRequestFromAccount, type AuthUser, getMe } from "@/lib/api";
import "../profile/profile.css";
import "./register-pharmacy.css";

export default function RegisterPharmacyPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [pharmacyName, setPharmacyName] = useState("");
  const [pharmacyPhone, setPharmacyPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
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
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createPharmacyRequestFromAccount({
        pharmacy_name: pharmacyName,
        pharmacy_phone: pharmacyPhone,
        city,
        address,
        description,
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
                  value={pharmacyPhone}
                  onChange={(e) => setPharmacyPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label>المدينة</label>
              <div className="field__control">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>
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

            {message && <p className="profile-message">{message}</p>}
            {error && <p className="profile-error">{error}</p>}

            <div className="profile-actions">
              <button type="submit" className="btn btn--coral" disabled={saving}>
                {saving ? "جارٍ الإرسال…" : "إرسال طلب التسجيل"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}