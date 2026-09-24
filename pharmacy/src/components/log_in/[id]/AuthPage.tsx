"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { BrandPanel } from '../[id]/_components/BrandPanel';
import { LoginForm } from '../[id]/_components/LoginForm';
import { SignupForm } from '../[id]/_components/SignupForm';

export const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  };

  return (
    <div className="auth-shell">
      <BrandPanel />

      <main className="auth-panel">
        <div className="auth-panel__inner">
          <Link href="/" className="auth-back">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M20 11H7.8l4.6-4.6L11 5l-7 7 7 7 1.4-1.4L7.8 13H20v-2Z"/>
            </svg>
            العودة للرئيسية
          </Link>

          <div className="auth-tabs" role="tablist" aria-label="الدخول أو إنشاء حساب">
            <button 
              className={`auth-tab ${activeTab === 'login' ? 'is-active' : ''}`} 
              role="tab" 
              aria-selected={activeTab === 'login'}
              onClick={() => setActiveTab('login')}
            >
              تسجيل الدخول
            </button>
            <button 
              className={`auth-tab ${activeTab === 'signup' ? 'is-active' : ''}`} 
              role="tab" 
              aria-selected={activeTab === 'signup'}
              onClick={() => setActiveTab('signup')}
            >
              إنشاء حساب
            </button>
          </div>

          <LoginForm 
            isActive={activeTab === 'login'} 
            onSwitchToSignup={() => setActiveTab('signup')}
            showToast={showToast}
          />

          <SignupForm 
            isActive={activeTab === 'signup'} 
            onSwitchToLogin={() => setActiveTab('login')}
            showToast={showToast}
          />

          <div className="auth-divider"><span>أو</span></div>

          <p className="auth-pharmacy-note">
            هل أنت صاحب صيدلية؟
            <Link href="/Login-pharmacy" className="link-inline">سجّل صيدليتك معنا ←</Link>
          </p>
        </div>
      </main>

      {/* Toast Notification */}
      <div className={`toast ${toastMessage ? 'is-visible' : ''}`}>
        {toastMessage}
      </div>
    </div>
  );
};

export default AuthPage;