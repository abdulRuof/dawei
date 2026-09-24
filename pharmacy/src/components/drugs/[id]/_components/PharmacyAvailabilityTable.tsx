"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PharmacyOffer } from "@/lib/api";
import "./style.css";

interface PharmacyAvailabilityTableProps {
  pharmacies: PharmacyOffer[];
}

const PharmacyAvailabilityTable: React.FC<PharmacyAvailabilityTableProps> = ({
  pharmacies,
}) => {
  const [sortBy, setSortBy] = useState<string>("price");

  useEffect(() => {
    const revealEls = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      revealEls.forEach((el) => io.observe(el));
      return () => io.disconnect();
    } else {
      revealEls.forEach((el) => el.classList.add("is-visible"));
    }
  }, []);

  const sortedListings = [...pharmacies].sort((a, b) => {
    if (sortBy === "price") return a.price - b.price;
    if (sortBy === "name") return a.pharmacy_name.localeCompare(b.pharmacy_name, "ar");
    return 0;
  });

  return (
    <section className="section section--tint" id="pharmacy-list">
      <div className="container">

        <div className="section__head reveal">
          <div>
            <p className="section__eyebrow">متوفر الآن في</p>
            <h2 className="section__title">جميع الصيدليات التي تبيع هذا الدواء</h2>
          </div>
          {sortedListings.length > 0 && (
            <div className="sort-row">
              <label htmlFor="sortSelect">ترتيب حسب</label>
              <select
                id="sortSelect"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="price">الأقل سعرًا</option>
                <option value="name">اسم الصيدلية</option>
              </select>
            </div>
          )}
        </div>

        {sortedListings.length > 0 ? (
          <div className="pharm-list">
            {sortedListings.map((pharmacy) => (
              <article key={pharmacy.pharmacy_id} className="pharm-row">
                <span
                  className="pharm-row__logo"
                  style={{
                    background: "linear-gradient(135deg,#0F6E5C,#1FB496)",
                  }}
                >
                  {(pharmacy.pharmacy_name || "صيدلية").replace("صيدلية", "").trim().slice(0, 2) || "ص"}
                </span>

                <div className="pharm-row__body">
                  <div className="pharm-row__name">{pharmacy.pharmacy_name}</div>
                  <div className="pharm-row__meta">
                    <span>{pharmacy.city ?? "—"}</span>
                    {pharmacy.address && (
                      <>
                        <span>·</span>
                        <span>{pharmacy.address}</span>
                      </>
                    )}
                  </div>
                </div>

                <span className={`pharm-row__stock ${pharmacy.is_available ? "" : "out"}`}>
                  {pharmacy.is_available ? "متوفر" : "غير متوفر حاليًا"}
                </span>

                <div className="pharm-row__price">
                  <strong>{formatPrice(pharmacy.price)} د.ل</strong>
                  <span>شامل الضريبة</span>
                </div>

                <Link
                  href={`/pharmacies/${pharmacy.pharmacy_id}`}
                  className="pharm-row__cta pharm-row__loc"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path fill="currentColor" d="M12 2c-4.1 0-7.5 3.4-7.5 7.5C4.5 15.5 12 22 12 22s7.5-6.5 7.5-12.5C19.5 5.4 16.1 2 12 2Zm0 10.2a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4Z"/>
                  </svg>
                  موقع الصيدلية
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">
            هذا الدواء غير متوفر حالياً في أي صيدلية شريكة.
          </p>
        )}

      </div>
    </section>
  );
};

function formatPrice(n: number): string {
  return n.toFixed(2).replace(/\.00$/, "");
}

export default PharmacyAvailabilityTable;