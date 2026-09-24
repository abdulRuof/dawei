'use client';

import React from 'react';
import './style.css'

// 1. تعريف واجهة الخصائص (Props Interface)
export type SectionId = 'overview' | 'medicines' | 'employees' | 'activity' | 'stats';
export type FocusType = 'none' | 'qty' | 'price';

interface SidebarProps {
  activeSection: SectionId;
  activeFocus: FocusType;
  onNavigate: (section: SectionId, focus: FocusType) => void;
  isOpen: boolean;
  onClose: () => void;
  showEmployees?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  activeFocus,
  onNavigate,
  isOpen,
  onClose,
  showEmployees = false,
}) => {
  // دالة مساعدة للتحقق مما إذا كان العنصر نشطًا
  const isActive = (section: SectionId, focus: FocusType = 'none') => {
    return activeSection === section && activeFocus === focus;
  };

  const handleNavClick = (section: SectionId, focus: FocusType = 'none') => {
    onNavigate(section, focus);
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
            onClick={() => handleNavClick('overview', 'none')}
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
            className={`dash-nav__item ${isActive('medicines', 'none') ? 'is-active' : ''}`}
            onClick={() => handleNavClick('medicines', 'none')}
          >
            <svg viewBox="0 0 24 24" width="19" height="19">
              <path
                fill="currentColor"
                d="M4.9 19.1a5.2 5.2 0 0 1 0-7.35l6.85-6.85a5.2 5.2 0 1 1 7.35 7.35l-6.85 6.85a5.2 5.2 0 0 1-7.35 0Zm3.68-9.6-3.03 3.03a3.2 3.2 0 0 0 4.52 4.52l3.03-3.03-4.52-4.52Z"
              />
            </svg>
            إدارة الأدوية
          </button>

          {showEmployees && (
          <button
            type="button"
            className={`dash-nav__item ${isActive('employees') ? 'is-active' : ''}`}
            onClick={() => handleNavClick('employees', 'none')}
          >
            <svg viewBox="0 0 24 24" width="19" height="19">
              <path
                fill="currentColor"
                d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3Zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z"
              />
            </svg>
            الموظفون
          </button>
          )}

          {showEmployees && (
          <button
            type="button"
            className={`dash-nav__item ${isActive('activity') ? 'is-active' : ''}`}
            onClick={() => handleNavClick('activity', 'none')}
          >
            <svg viewBox="0 0 24 24" width="19" height="19">
              <path
                fill="currentColor"
                d="M5 3h14a1 1 0 0 1 1 1v13a2 2 0 0 1-2 2H8l-4 4V4a1 1 0 0 1 1-1Zm1 4v2h12V7H6Zm0 4v2h8v-2H6Zm0 4v2h6v-2H6Z"
              />
            </svg>
            سجل العمليات
          </button>
          )}

          {/* <button
            type="button"
            className={`dash-nav__item ${isActive('medicines', 'qty') ? 'is-active' : ''}`}
            onClick={() => handleNavClick('medicines', 'qty')}
          >
            <svg viewBox="0 0 24 24" width="19" height="19">
              <path
                fill="currentColor"
                d="M4 13h16v-2H4v2Zm0 5h10v-2H4v2Zm0-10h16V6H4v2Z"
              />
            </svg>
            تعديل الكميات
          </button> */}

          {/* <button
            type="button"
            className={`dash-nav__item ${isActive('medicines', 'price') ? 'is-active' : ''}`}
            onClick={() => handleNavClick('medicines', 'price')}
          >
            <svg viewBox="0 0 24 24" width="19" height="19">
              <path
                fill="currentColor"
                d="M12 2a1 1 0 0 1 1 1v1.07c2.28.38 4 2.1 4 4.18h-2c0-1.1-1.34-2-3-2s-3 .9-3 2c0 1.1 1.2 1.6 3.2 2.16C14.6 10.9 17 11.7 17 14.25c0 2.08-1.72 3.8-4 4.18V19.5a1 1 0 1 1-2 0v-1.07c-2.28-.38-4-2.1-4-4.18h2c0 1.1 1.34 2 3 2s3-.9 3-2c0-1.1-1.2-1.6-3.2-2.16C9.4 11.6 7 10.8 7 8.25c0-2.08 1.72-3.8 4-4.18V3a1 1 0 0 1 1-1Z"
              />
            </svg>
            تعديل الأسعار
          </button> */}

          {/* <button
            type="button"
            className={`dash-nav__item ${isActive('stats') ? 'is-active' : ''}`}
            onClick={() => handleNavClick('stats', 'none')}
          >
            <svg viewBox="0 0 24 24" width="19" height="19">
              <path
                fill="currentColor"
                d="M4 21V9h4v12H4Zm6 0V3h4v18h-4Zm6 0v-8h4v8h-4Z"
              />
            </svg>
            الإحصائيات
          </button> */}
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