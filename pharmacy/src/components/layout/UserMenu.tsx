"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearToken, getMe, getToken, type AuthUser } from "@/lib/api";
import "./style.css";

export default function UserMenu() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [open, setOpen] = useState(false);

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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (loading) {
    return (
      <button className="icon-btn account-btn" type="button" aria-label="الحساب">
        <span className="user-avatar user-avatar--ghost" />
      </button>
    );
  }

  if (!user) {
    return (
      <Link href="/login" className="icon-btn account-btn" aria-label="تسجيل الدخول">
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
          <path fill="currentColor" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.4 0-8 2.6-8 6v1h16v-1c0-3.4-3.6-6-8-6Z" />
        </svg>
      </Link>
    );
  }

  const initial = (user.full_name || "؟").trim().charAt(0);

  const handleLogout = () => {
    clearToken();
    setUser(null);
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <div className="user-menu">
      <button
        className="icon-btn account-btn"
        type="button"
        aria-label="قائمة الحساب"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="user-avatar">{initial}</span>
      </button>

      {open && (
        <>
          <button
            className="user-menu__backdrop"
            type="button"
            aria-label="إغلاق"
            onClick={() => setOpen(false)}
          />
          <div className="user-menu__dropdown">
            <div className="user-menu__head">
              <span className="user-avatar user-avatar--lg">{initial}</span>
              <div>
                <div className="user-menu__name">{user.full_name}</div>
                <div className="user-menu__email">{user.email}</div>
              </div>
            </div>
            <div className="user-menu__sep" />
            <Link href="/profile" onClick={() => setOpen(false)}>
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="8" r="4" /><path d="M4.5 20.5c.8-3.4 3.9-5.5 7.5-5.5s6.7 2.1 7.5 5.5" />
              </svg>
              حسابي
            </Link>
            <Link href="/notifications" onClick={() => setOpen(false)}>
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              الإشعارات
            </Link>
            <Link href="/register-pharmacy" onClick={() => setOpen(false)}>
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M12 11v5M9.5 13.5h5" />
              </svg>
              سجّل صيدليتك
            </Link>
            <div className="user-menu__sep" />
            <button className="user-menu__logout" type="button" onClick={handleLogout}>
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" />
              </svg>
              تسجيل الخروج
            </button>
          </div>
        </>
      )}
    </div>
  );
}