"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword, resetPassword } from "@/lib/api";
import "./style.css";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "code" | "done">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await forgotPassword(email.trim());
      setHint(`تم إرسال الكود إلى: ${email.trim()}. كود التجربة (بدون خدمة بريد): ${res.code}`);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل الطلب");
    } finally {
      setBusy(false);
    }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    if (newPassword.length < 8) {
      setError("كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل");
      setBusy(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      setBusy(false);
      return;
    }
    try {
      await resetPassword({
        email: email.trim(),
        code: code.trim(),
        new_password: newPassword,
      });
      setHint(null);
      setError(null);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل إعادة التعيين");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="fp-page">
      <div className="fp-card">
        <h1>استعادة كلمة المرور</h1>

        {step === "email" && (
          <form onSubmit={sendCode}>
            <p className="fp-desc">
              أدخل بريدك الإلكتروني أو رقم هاتفك وسنرسل لك كودًا لإعادة تعيين كلمة المرور.
            </p>
            <div className="field">
              <label>البريد الإلكتروني أو رقم الهاتف</label>
              <div className="field__control">
                <input
                  type="text"
                  dir="auto"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="example@email.com"
                />
              </div>
            </div>
            {error && <p className="fp-error">{error}</p>}
            <button type="submit" className="btn btn--coral btn--block" disabled={busy}>
              {busy ? "جارٍ الإرسال…" : "إرسال الكود"}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={submitReset}>
            {hint && <p className="fp-hint">{hint}</p>}
            <div className="field">
              <label>كود إعادة التعيين</label>
              <div className="field__control">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  placeholder="000000"
                  dir="ltr"
                  style={{ textAlign: "center", letterSpacing: "0.4em" }}
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
                  required
                  placeholder="8 أحرف على الأقل"
                />
              </div>
            </div>
            <div className="field">
              <label>تأكيد كلمة المرور</label>
              <div className="field__control">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            {error && <p className="fp-error">{error}</p>}
            <button type="submit" className="btn btn--coral btn--block" disabled={busy}>
              {busy ? "جارٍ الحفظ…" : "تغيير كلمة المرور"}
            </button>
          </form>
        )}

        {step === "done" && (
          <div className="fp-done">
            <div className="fp-done-icon">✓</div>
            <p>تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول بكلمتك الجديدة.</p>
            <Link href="/login" className="btn btn--coral btn--block">
              تسجيل الدخول
            </Link>
          </div>
        )}

        <p className="fp-back">
          <Link href="/login">← العودة لتسجيل الدخول</Link>
        </p>
      </div>
    </main>
  );
}