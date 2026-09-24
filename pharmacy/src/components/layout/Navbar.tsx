"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./style.css";
import "./NotificationBell.css";
import NotificationBell from "./NotificationBell";
import UserMenu from "./UserMenu";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    queueMicrotask(() => setMenuOpen(false));
  }, [pathname]);

  const navItems = [
    { label: "الرئيسية", href: "/" },
    { label: "الأدوية", href: "/medications" },
    { label: "الصيدليات", href: "/Allpharmacies/1" },
    { label: "اقرأ الروشتة", href: "/prescription" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/Allpharmacies/1")
      return (
        pathname.startsWith("/Allpharmacies") ||
        pathname.startsWith("/pharmacies")
      );
    return pathname === href || pathname.startsWith(href);
  };

  return (
    <header className="site-header" id="siteHeader">
      <div className="container header-inner">

        <Link href="/" className="brand">
          <span className="brand__mark" aria-hidden="true">
            <svg viewBox="0 0 40 40" width="34" height="34">
              <rect x="3" y="3" width="34" height="34" rx="11" fill="var(--teal-700)"/>
              <path d="M13 20c0-3.9 3.1-7 7-7s7 3.1 7 7-3.1 7-7 7-7-3.1-7-7Z" fill="none" stroke="var(--mint-50)" strokeWidth="2.4"/>
              <path d="M20 13v14M13 20h14" stroke="var(--coral-500)" strokeWidth="2.6" strokeLinecap="round"/>
            </svg>
          </span>
          <span className="brand__text">روشتة</span>
        </Link>

        <nav
          className={`main-nav ${menuOpen ? "is-open" : ""}`}
          id="mainNav"
          aria-label="التنقل الرئيسي"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(item.href) ? "active" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <Link
            href="/Allpharmacies/1"
            className="icon-btn location-btn"
            aria-label="تحديد الموقع — سبها"
            title="تصفح صيدليات سبها"
          >
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 2c-4.1 0-7.5 3.4-7.5 7.5C4.5 15.5 12 22 12 22s7.5-6.5 7.5-12.5C19.5 5.4 16.1 2 12 2Zm0 10.2a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4Z"/></svg>
            <span className="location-btn__text">سبها</span>
          </Link>
          <NotificationBell />
          <UserMenu />
          <button
            className="hamburger"
            id="hamburgerBtn"
            aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>

      </div>
    </header>
  );
};

export default Navbar