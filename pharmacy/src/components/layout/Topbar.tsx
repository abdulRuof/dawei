import React from 'react'
import './style1.css'
import NotificationBell from './NotificationBell'

interface TopbarProps {
  onLogout?: () => void;
  pharmacyName?: string;
  onMenuToggle?: () => void;
}

const Topbar = ({ onLogout, pharmacyName, onMenuToggle }: TopbarProps) => {
  return (
    <>
    {/* <!-- Topbar --> */}
   
     <header className="dash-topbar">
      <button className="dash-menu-btn" id="menuBtn" aria-label="فتح القائمة" onClick={onMenuToggle}>
        <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M3 6h18v2H3V6Zm0 5h18v2H3v-2Zm0 5h18v2H3v-2Z"/></svg>
      </button>

      <h1 className="dash-topbar__title" id="pageTitle">نظرة عامة</h1>

      <div className="dash-topbar__actions">
        <div className="dash-search">
          <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="m21 21-4.35-4.35M18.5 11a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          <input type="text" placeholder="بحث سريع…" />
        </div>
        <NotificationBell />
        {onLogout && (
          <button
            type="button"
            className="icon-btn"
            aria-label="تسجيل الخروج"
            title="تسجيل الخروج"
            onClick={onLogout}
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M10 17v-3H4v-4h6V7l6 5-6 5Zm8-14H8v4h2V5h8v14h-8v-2H8v4h10V3Z"/>
            </svg>
          </button>
        )}
        <div className="dash-user">
          <span className="dash-user__avatar">ال</span>
          <div className="dash-user__meta">
            <strong>{pharmacyName || 'صيدلية النهضة'}</strong>
            <span>مدير الصيدلية</span>
          </div>
        </div>
      </div>
    </header>
    </>
  )
}

export default Topbar