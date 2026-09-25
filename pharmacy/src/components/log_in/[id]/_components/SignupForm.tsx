"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import './style.css'
import { register, setToken } from '@/lib/api';



interface SignupFormProps {
  isActive: boolean;
  onSwitchToLogin: () => void;
  showToast: (msg: string) => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ isActive, onSwitchToLogin, showToast }) => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // قياس قوة كلمة المرور
  const getPasswordStrength = () => {
    if (!password) return '';
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return 'weak';
    if (score === 2) return 'medium';
    return 'strong';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = {
      name: !name.trim(),
      email: !email.trim(),
      password: !password || password.length < 8,
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      showToast("يرجى تعبئة جميع الحقول المطلوبة بالشكل الصحيح");
      return;
    }
    if (!agree) {
      showToast("يجب الموافقة على الشروط والأحكام أولًا");
      return;
    }

    try {
      const res = await register(name.trim(), email.trim(), password);
      setToken(res.access_token);
      showToast("✓ تم إنشاء الحساب بنجاح");
      setTimeout(() => {
        router.push("/");
      }, 700);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "تعذّر إنشاء الحساب — تحقق من البيانات");
    }
  };

  return (
    <form className={`auth-form ${isActive ? 'is-active' : ''}`} onSubmit={handleSubmit}>
      <h2 className="auth-form__title">أنشئ حسابك في روشتة ✨</h2>
      <p className="auth-form__subtitle">دقيقة واحدة تكفي للبدء في طلب أدويتك بسهولة.</p>

      <div className={`field ${errors.name ? 'has-error' : ''}`}>
        <label htmlFor="signupName">الاسم الكامل</label>
        <div className="field__control">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.4 0-9 2.2-9 5v3h18v-3c0-2.8-4.6-5-9-5Z"/></svg>
          <input type="text" id="signupName" value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك الثلاثي" />
        </div>
      </div>

      <div className={`field ${errors.email ? 'has-error' : ''}`}>
        <label htmlFor="signupEmail">البريد الإلكتروني</label>
        <div className="field__control">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm16 4-8 5-8-5V6l8 5 8-5v2Z"/></svg>
          <input type="email" id="signupEmail" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@mail.com" />
        </div>
      </div>

      <div className={`field ${errors.password ? 'has-error' : ''}`}>
        <label htmlFor="signupPassword">كلمة المرور</label>
        <div className="field__control">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm0 2a3 3 0 0 1 3 3v3H9V7a3 3 0 0 1 3-3Z"/></svg>
          <input type={showPassword ? "text" : "password"} id="signupPassword" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8 أحرف على الأقل" />
          <button type="button" className={`field__toggle toggle-password ${showPassword ? 'is-active' : ''}`} onClick={() => setShowPassword(!showPassword)}>
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 5c-5 0-9.3 3.1-11 7 1.7 3.9 6 7 11 7s9.3-3.1 11-7c-1.7-3.9-6-7-11-7Zm0 11.5A4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 0 1 0 9Zm0-7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"/></svg>
          </button>
        </div>
        <div className={`password-strength ${getPasswordStrength()}`}>
          <span></span><span></span><span></span>
        </div>
      </div>

      <label className="checkbox checkbox--terms">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>أوافق على <a href="/medications" className="link-inline">الشروط والأحكام</a> و<a href="/medications" className="link-inline">سياسة الخصوصية</a></span>
      </label>

      <button type="submit" className="btn btn--coral btn--block">إنشاء الحساب</button>

      <p className="auth-form__switch">لديك حساب بالفعل؟ <button type="button" className="link-inline" onClick={onSwitchToLogin}>سجّل الدخول</button></p>
    </form>
  );
};