"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './style.css'
import { login, setToken } from '@/lib/api';


interface LoginFormProps {
  isActive: boolean;
  onSwitchToSignup: () => void;
  showToast: (msg: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ isActive, onSwitchToSignup, showToast }) => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hasError, setHasError] = useState(false);

  const redirectByRole = (role: string, pharmacyId: number | null) => {
    if (role === "superadmin") {
      router.push("/dashboard/admin/1");
    } else if ((role === "owner" || role === "staff") && pharmacyId) {
      router.push(`/dashboard/manager/${pharmacyId}`);
    } else {
      router.push("/");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setHasError(true);
      showToast("يرجى تعبئة البريد الإلكتروني وكلمة المرور");
      return;
    }
    setHasError(false);
    try {
      const res = await login(email.trim(), password);
      setToken(res.access_token);
      showToast("✓ تم تسجيل الدخول بنجاح");
      setTimeout(() => redirectByRole(res.user.role, res.user.pharmacy_id), 500);
    } catch (err) {
      setHasError(true);
      showToast(err instanceof Error ? err.message : "فشل تسجيل الدخول — تحقق من البيانات");
    }
  };

  return (
    <form className={`auth-form ${isActive ? 'is-active' : ''}`} onSubmit={handleSubmit}>
      <h2 className="auth-form__title">أهلًا بعودتك 👋</h2>
      <p className="auth-form__subtitle">سجّل الدخول لمتابعة طلباتك والوصول إلى أدويتك بسرعة.</p>

      <div className={`field ${hasError && !email ? 'has-error' : ''}`}>
        <label htmlFor="loginEmail">البريد الإلكتروني أو رقم الهاتف</label>
        <div className="field__control">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm16 4-8 5-8-5V6l8 5 8-5v2Z"/></svg>
          <input 
            type="text" 
            id="loginEmail" 
            value={email} 
            onChange={(e) => { setEmail(e.target.value); setHasError(false); }} 
            placeholder="example@mail.com" 
          />
        </div>
      </div>

      <div className={`field ${hasError && !password ? 'has-error' : ''}`}>
        <label htmlFor="loginPassword">كلمة المرور</label>
        <div className="field__control">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm0 2a3 3 0 0 1 3 3v3H9V7a3 3 0 0 1 3-3Z"/></svg>
          <input 
            type={showPassword ? "text" : "password"} 
            id="loginPassword" 
            value={password} 
            onChange={(e) => { setPassword(e.target.value); setHasError(false); }} 
            placeholder="••••••••" 
          />
          <button 
            type="button" 
            className={`field__toggle toggle-password ${showPassword ? 'is-active' : ''}`} 
            onClick={() => setShowPassword(!showPassword)}
            aria-label="إظهار كلمة المرور"
          >
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 5c-5 0-9.3 3.1-11 7 1.7 3.9 6 7 11 7s9.3-3.1 11-7c-1.7-3.9-6-7-11-7Zm0 11.5A4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 0 1 0 9Zm0-7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"/></svg>
          </button>
        </div>
      </div>

      <div className="field-row">
        <label className="checkbox">
          <input type="checkbox" name="remember" />
          <span>تذكرني</span>
        </label>
        <Link href="/forgot-password" className="link-inline">نسيت كلمة المرور؟</Link>
      </div>

      <button type="submit" className="btn btn--coral btn--block">تسجيل الدخول</button>

      <p className="auth-form__switch">ليس لديك حساب؟ <button type="button" className="link-inline" onClick={onSwitchToSignup}>أنشئ حسابًا جديدًا</button></p>
    </form>
  );
};