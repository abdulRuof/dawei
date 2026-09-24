import React from 'react'
import Link from "next/link";
import './style.css'

function Navbar() {
  return (
    <>
    
{/* <!-- ===== Footer ===== --> */}
<footer className="site-footer">
  <div className="container footer-grid">
    <div className="footer-brand">
      <Link href="/" className="brand">
        <span className="brand__mark" aria-hidden="true">
          <svg viewBox="0 0 40 40" width="30" height="30">
            <rect x="3" y="3" width="34" height="34" rx="11" fill="var(--mint-50)"/>
            <path d="M13 20c0-3.9 3.1-7 7-7s7 3.1 7 7-3.1 7-7 7-7-3.1-7-7Z" fill="none" stroke="var(--teal-700)" strokeWidth="2.4"/>
            <path d="M20 13v14M13 20h14" stroke="var(--coral-500)" strokeWidth="2.6" strokeLinecap="round"/>
          </svg>
        </span>
        <span className="brand__text">روشتة</span>
      </Link>
      <p>منصتك للوصول إلى الدواء المناسب من أقرب صيدلية موثوقة، بسرعة وسهولة.</p>
      <div className="social-row">
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="فيسبوك" className="icon-btn">f</a>
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="إنستغرام" className="icon-btn">ig</a>
        <a href="https://wa.me" target="_blank" rel="noopener noreferrer" aria-label="واتساب" className="icon-btn">w</a>
      </div>
    </div>

    <div className="footer-col">
      <h4>روابط سريعة</h4>
      <Link href="/">الرئيسية</Link>
      <Link href="/medications">الأدوية</Link>
      <Link href="/Allpharmacies/1">الصيدليات</Link>
      <Link href="/medications">التصنيفات</Link>
    </div>

    <div className="footer-col">
      <h4>الدعم</h4>
      <Link href="/prescription">الأسئلة الشائعة</Link>
      <a href="mailto:support@roshetta.ly">تواصل معنا</a>
      <Link href="/">سياسة الخصوصية</Link>
      <Link href="/">الشروط والأحكام</Link>
    </div>

    <div className="footer-col">
      <h4>تواصل معنا</h4>
      <p className="footer-contact">سبها، ليبيا</p>
      <p className="footer-contact" dir="ltr">+218 91 000 0000</p>
      <p className="footer-contact" dir="ltr">support@roshetta.ly</p>
    </div>
  </div>

  <div className="footer-bottom">
    <div className="container footer-bottom__inner">
      <span>© 2026 روشتة. جميع الحقوق محفوظة.</span>
      <span className="footer-note">هذه المنصة لا تُغني عن استشارة الطبيب أو الصيدلي المختص.</span>
    </div>
  </div>
</footer>
    </>
  )
}

export default Navbar