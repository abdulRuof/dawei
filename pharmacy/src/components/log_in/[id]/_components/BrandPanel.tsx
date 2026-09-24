import React from 'react';
import Link from "next/link";
import './style.css'

export const BrandPanel: React.FC = () => {
  return (
    <aside className="auth-brand">
      <div className="auth-brand__deco" aria-hidden="true">
        <span className="plus plus--1"></span>
        <span className="plus plus--2"></span>
        <span className="plus plus--3"></span>
        <span className="dot dot--1"></span>
        <span className="dot dot--2"></span>
      </div>

      <Link href="/" className="brand">
        <span className="brand__mark" aria-hidden="true">
          <svg viewBox="0 0 40 40" width="34" height="34">
            <rect x="3" y="3" width="34" height="34" rx="11" fill="#fff" />
            <path d="M13 20c0-3.9 3.1-7 7-7s7 3.1 7 7-3.1 7-7 7-7-3.1-7-7Z" fill="none" stroke="var(--teal-700)" strokeWidth="2.4" />
            <path d="M20 13v14M13 20h14" stroke="var(--coral-500)" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
        </span>
        <span className="brand__text">روشتة</span>
      </Link>

      <div className="auth-brand__content">
        <h1>دواؤك على بُعد نقرة</h1>
        <p>سجّل دخولك للوصول إلى أقرب الصيدليات، تتبع طلباتك، واحصل على أدويتك أسرع.</p>

        <ul className="auth-brand__points">
          <li>
            <span className="point-icon">
              <svg viewBox="0 0 24 24" width="17" height="17"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z" /></svg>
            </span>
            مقارنة أسعار الأدوية بين أكثر من 180 صيدلية
          </li>
          <li>
            <span className="point-icon">
              <svg viewBox="0 0 24 24" width="17" height="17"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z" /></svg>
            </span>
            توصيل سريع خلال 30 دقيقة في أغلب المدن
          </li>
          <li>
            <span className="point-icon">
              <svg viewBox="0 0 24 24" width="17" height="17"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z" /></svg>
            </span>
            تتبع طلباتك وتذكيرات مواعيد الدواء
          </li>
        </ul>
      </div>

      <p className="auth-brand__footnote">© 2026 روشتة. جميع الحقوق محفوظة.</p>
    </aside>
  );
};