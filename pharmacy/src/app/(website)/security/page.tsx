"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/layout/Breadcrumb";
import { changePassword, getMe, AuthUser } from "@/lib/api";
import "../profile/profile.css";

export default function SecurityPage() {
  const router = useRouter();
  const [forced, setForced] = useState(false);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    queueMicrotask(() =>
      setForced(
        typeof window !== "undefined" &&
          new URLSearchParams(window.location.search).get("forced") === "1"
      )
    );
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
    setError(null);
    setMessage(null);

    if (!currentPassword) {
      showMessage("error", "أدخل كلمة المرور الحالية");
      return;
    }
    if (newPassword.length < 8) {
      showMessage("error", "كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف");
      return;
    }
    if (newPassword !== confirmPassword) {
      showMessage("error", "تأكيد كلمة المرور غير مطابق");
      return;
    }

    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      showMessage("ok", "✓ تم تغيير كلمة المرور بنجاح");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      if (forced) {
        const target = user?.pharmacy_id
          ? `/dashboard/manager/${user.pharmacy_id}`
          : user?.role === "superadmin"
          ? "/dashboard/admin/1"
          : "/";
        setTimeout(() => router.push(target), 1200);
      }
    } catch (err) {
      showMessage("error", err instanceof Error ? err.message : "فشل تغيير كلمة المرور");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main style={{ padding: "4rem 1rem", textAlign: "center" }}>جارٍ التحميل…</main>
    );
  }

  if (!user) {
    return (
      <main style={{ padding: "4rem 1rem", textAlign: "center" }}>
        <Breadcrumb items={[{ label: "الأمان" }]} />
        <h1 style={{ marginBottom: "1rem" }}>يجب تسجيل الدخول أولًا</h1>
        <Link href="/login" className="btn btn--coral" style={{ display: "inline-block" }}>
          تسجيل الدخول
        </Link>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <Breadcrumb items={[{ label: "الأمان" }]} />
      <div className="profile-card">
        <div className="profile-head">
          <div className="profile-avatar">🔒</div>
          <div>
            <h1>كلمة المرور والأمان</h1>
            <p className="profile-role">{user.full_name}</p>
          </div>
        </div>

        {forced && (
          <p className="sec-banner">
            يجب عليك تعيين كلمة مرور جديدة قبل استخدام لوحة التحكم الخاصة بك.
          </p>
        )}

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>كلمة المرور الحالية</label>
            <div className="field__control">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field">
            <label>كلمة المرور الجديدة</label>
            <div className="field__control">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="8 أحرف على الأقل"
                required
              />
            </div>
          </div>

          <div className="field">
            <label>تأكيد كلمة المرور الجديدة</label>
            <div className="field__control">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد كتابة كلمة المرور الجديدة"
                required
              />
            </div>
          </div>

          {message && <p className="profile-message">{message}</p>}
          {error && <p className="profile-error">{error}</p>}

          <div className="profile-actions">
            <button type="submit" className="btn btn--coral" disabled={saving}>
              {saving ? "جارٍ التغيير…" : "تغيير كلمة المرور"}
            </button>
            <Link
              href="/profile"
              className="btn btn--ghost"
              style={{ display: "inline-block", textDecoration: "none", marginInlineEnd: "0.5rem" }}
            >
              عودة لحسابي
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}