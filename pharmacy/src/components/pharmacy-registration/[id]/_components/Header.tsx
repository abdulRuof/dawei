import React from "react";
import Link from 'next/link';
import './style.css';

export const Header: React.FC = () => {
  return (
    <header className="site-header" id="siteHeader">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <span className="brand__mark" aria-hidden="true">
            <svg viewBox="0 0 40 40" width="34" height="34">
              <rect x="3" y="3" width="34" height="34" rx="11" fill="var(--teal-700, #0d9488)" />
              <path d="M13 20c0-3.9 3.1-7 7-7s7 3.1 7 7-3.1 7-7 7-7-3.1-7-7Z" stroke="var(--mint-50, #f0fdf4)" strokeWidth="2.4" />
              <path d="M20 13v14M13 20h14" stroke="var(--coral-500, #f87171)" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
          </span>
          <span className="brand__text">روشتة</span>
        </Link>
        <Link href="/login" className="btn btn--outline">لديك حساب؟ سجّل الدخول</Link>
      </div>
    </header>
  );
};