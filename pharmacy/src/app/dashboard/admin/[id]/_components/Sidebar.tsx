'use client';

import React from 'react';
import './style.css'
import type { SectionId } from './types';

// 1. تعريف واجهة الخصائص (Props Interface)
// export type SectionId = 'overview' | 'medicines' | 'stats';
// export type SectionId =
//   | 'overview'
//   | 'pharmacies'
//   | 'requests'
//   | 'accounts'
//   | 'categories'
//   | 'system-monitoring'
//   | 'medicines'
//   | 'stats'

// export type FocusType = 'none' | 'qty' | 'price';

interface SidebarProps {
  activeSection: SectionId;
  // activeFocus: FocusType;
  onNavigate: (section: SectionId) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  // activeFocus,
  onNavigate,
  isOpen,
  onClose,
}) => {
  // دالة مساعدة للتحقق مما إذا كان العنصر نشطًا
  const isActive = (section: SectionId) => {
    return activeSection === section ;
  };

  const handleNavClick = (section: SectionId) => {
    onNavigate(section);
    onClose(); // إغلاق القائمة في الشاشات الصغيرة عند الاختيار
  };

  return (
    <>
      {/* طبقة التعتيم الخلفية للهواتف (Overlay) */}
      <div
        className={`dash-overlay ${isOpen ? 'is-visible' : ''}`}
        id="dashOverlay"
        onClick={onClose}
      />

      {/* القائمة الجانبية */}
      <aside
        className={`dash-sidebar ${isOpen ? 'is-open' : ''}`}
        id="dashSidebar"
      >
        {/* الشعار (Brand) */}
        <div className="dash-brand">
          <span className="brand__mark" aria-hidden="true">
            <svg viewBox="0 0 40 40" width="32" height="32">
              <rect
                x="3"
                y="3"
                width="34"
                height="34"
                rx="11"
                fill="var(--teal-700)"
              />
              <path
                d="M13 20c0-3.9 3.1-7 7-7s7 3.1 7 7-3.1 7-7 7-7-3.1-7-7Z"
                fill="none"
                stroke="var(--mint-50)"
                strokeWidth="2.4"
              />
              <path
                d="M20 13v14M13 20h14"
                stroke="var(--coral-500)"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="brand__text">
            روشتة <small>للصيدليات</small>
          </span>
        </div>

        {/* عناصر التنقل (Nav Items) */}
        <nav className="dash-nav" aria-label="التنقل في لوحة التحكم">
          <button
            type="button"
            className={`dash-nav__item ${isActive('overview') ? 'is-active' : ''}`}
            onClick={() => handleNavClick('overview')}
          >
            <svg viewBox="0 0 24 24" width="19" height="19">
              <path
                fill="currentColor"
                d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z"
              />
            </svg>
            نظرة عامة
          </button>

          <button
            type="button"
            className={`dash-nav__item ${isActive('pharmacies') ? 'is-active' : ''}`}
            onClick={() => handleNavClick('pharmacies')}
          >
            <svg viewBox="0 0 24 24" width="19" height="19">
          <path fill="currentColor" d="M12 2 2 7v2h20V7L12 2Zm-8 8v9h4v-7h8v7h4v-9H4Z"/>
        </svg>
            إدارة الصيدليات
          </button>

          <button
            type="button"
            className={`dash-nav__item ${isActive('requests') ? 'is-active' : ''}`}
            onClick={() => handleNavClick('requests')}
          >
            <svg viewBox="0 0 24 24" width="19" height="19">
          <path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z"/></svg>
            طلبات التسجيل
          </button>

          <button
            type="button"
            className={`dash-nav__item ${isActive('accounts') ? 'is-active' : ''}`}
            onClick={() => handleNavClick('accounts')}
          >
             <svg viewBox="0 0 24 24" width="19" height="19">
          <path fill="currentColor" d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.4 0-9 2.2-9 5v3h18v-3c0-2.8-4.6-5-9-5Z"/>
        </svg>
            الحسابات
          </button>

          <button
            type="button"
            className={`dash-nav__item ${isActive('categories') ? 'is-active' : ''}`}
            onClick={() => handleNavClick('categories')}
          >
             <svg viewBox="0 0 24 24" width="19" height="19">
          <path fill="currentColor" d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z"/></svg>
            ادارة التصنيفات
          </button>

           <button
            type="button"
            className={`dash-nav__item ${isActive('system-monitoring') ? 'is-active' : ''}`}
            onClick={() => handleNavClick('system-monitoring')}
          >
             <svg viewBox="0 0 24 24" width="19" height="19">
          <path fill="currentColor" d="M4 21V9h4v12H4Zm6 0V3h4v18h-4Zm6 0v-8h4v8h-4Z"/></svg>
            مراقبة النظام
          </button>
        </nav>

        {/* رابط الصفحة العامة */}
        <a
          href="/pharmacy-details"
          className="dash-nav__item dash-nav__item--ghost"
        >
          <svg viewBox="0 0 24 24" width="19" height="19">
            <path
              fill="currentColor"
              d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7Zm0 11.5A4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 0 1 0 9Zm0-7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"
            />
          </svg>
          عرض الصفحة العامة
        </a>
      </aside>
    </>
  );
};

export default Sidebar;