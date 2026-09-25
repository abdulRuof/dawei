"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/layout/Breadcrumb";
import { getMe, imageUrl, updateMe, uploadAvatar, AuthUser } from "@/lib/api";
import "./profile.css";

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    getMe()
      .then((u) => {
        setUser(u);
        setFullName(u.full_name);
        setPhone(u.phone ?? "");
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const res = await uploadAvatar(file);
      setUser(res.user);
      showMessage("ok", "✓ تم تحديث الصورة الشخصية");
    } catch (err) {
      showMessage("error", err instanceof Error ? err.message : "فشل رفع الصورة");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateMe({
        full_name: fullName,
        phone: phone || undefined,
      });
      setUser(updated);
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

  const avatarSrc = imageUrl(user.avatar_url);

  return (
    <main className="profile-page">
      <Breadcrumb items={[{ label: "حسابي" }]} />
      <div className="profile-card">
        <div className="profile-head">
          <div className="profile-avatar-wrap">
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="profile-avatar profile-avatar--img" src={avatarSrc} alt={user.full_name} />
            ) : (
              <div className="profile-avatar">{user.full_name.charAt(0)}</div>
            )}
            <button
              type="button"
              className="avatar-upload-btn"
              aria-label="تغيير الصورة الشخصية"
              disabled={uploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={handleAvatarChange}
            />
          </div>
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

          {message && <p className="profile-message">{message}</p>}
          {error && <p className="profile-error">{error}</p>}

          <div className="profile-actions">
            <button type="submit" className="btn btn--coral" disabled={saving || uploadingAvatar}>
              {saving ? "جارٍ الحفظ…" : "حفظ التغييرات"}
            </button>
          </div>
        </form>

        <hr className="profile-divider" />

        <h2 className="profile-subtitle">كلمة المرور والأمان</h2>
        <p className="field__hint" style={{ marginBottom: "0.75rem" }}>
          يمكنك تغيير كلمة المرور الخاصة بك من صفحة الأمان.
        </p>

        <div className="profile-actions">
          <Link
            href={`/security${user.must_change_password ? "?forced=1" : ""}`}
            className="btn btn--coral"
            style={{ display: "inline-block", textDecoration: "none" }}
          >
            {user.must_change_password ? "اضبط كلمة مرور جديدة الآن" : "إدارة كلمة المرور والأمان"}
          </Link>
        </div>
      </div>
    </main>
  );
}