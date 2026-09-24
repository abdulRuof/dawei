"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/layout/Breadcrumb";
import { getMe, updateMe, AuthUser } from "@/lib/api";
import "./profile.css";

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getMe()
      .then((u) => {
        setUser(u);
        setFullName(u.full_name);
        setPhone(u.phone);
      })
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
    }, 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateMe({
        full_name: fullName,
        phone,
        current_password: currentPassword || undefined,
        new_password: newPassword || undefined,
      });
      setUser(updated);
      setCurrentPassword("");
      setNewPassword("");
      showMessage("ok", "✓ تم حفظ التغييرات بنجاح");
    } catch (err) {
      showMessage("error", err instanceof Error ? err.message : "فشل الحفظ");
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
        <Breadcrumb items={[{ label: "حسابي" }]} />
        <h1 style={{ marginBottom: "1rem" }}>يجب تسجيل الدخول أولًا</h1>
        <Link href="/login" className="btn btn--coral" style={{ display: "inline-block" }}>
          تسجيل الدخول
        </Link>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <Breadcrumb items={[{ label: "حسابي" }]} />
      <div className="profile-card">
        <div className="profile-head">
          <div className="profile-avatar">{user.full_name.charAt(0)}</div>
          <div>
            <h1>{user.full_name}</h1>
            <p className="profile-role">
              {user.role === "superadmin"
                ? "مدير المنصة"
                : user.role === "owner"
                ? "مدير صيدلية"
                : user.role === "staff"
                ? "موظف صيدلية"
                : "مستخدم"}
            </p>
          </div>
        </div>

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>الاسم الكامل</label>
            <div className="field__control">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field">
            <label>البريد الإلكتروني</label>
            <div className="field__control">
              <input type="email" value={user.email} disabled />
            </div>
            <small className="field__hint">البريد الإلكتروني لا يمكن تغييره</small>
          </div>

          <div className="field">
            <label>رقم الهاتف</label>
            <div className="field__control">
              <input
                type="text"
                dir="rtl"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <hr className="profile-divider" />

          <h2 className="profile-subtitle">تغيير كلمة المرور</h2>

          <div className="field">
            <label>كلمة المرور الحالية</label>
            <div className="field__control">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="اتركها فارغة إن لم ترد تغييرها"
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
              />
            </div>
          </div>

          {message && <p className="profile-message">{message}</p>}
          {error && <p className="profile-error">{error}</p>}

          <div className="profile-actions">
            <button type="submit" className="btn btn--coral" disabled={saving}>
              {saving ? "جارٍ الحفظ…" : "حفظ التغييرات"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}