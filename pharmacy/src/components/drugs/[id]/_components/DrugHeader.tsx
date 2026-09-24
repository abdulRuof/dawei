"use client";

import React, { useState, useEffect } from "react";
import { Medicine, minPrice, imageUrl } from "@/lib/api";
import "./style.css";
import "./style2.css";

interface DrugHeaderProps {
  medicine: Medicine;
}

const DrugHeader: React.FC<DrugHeaderProps> = ({ medicine }) => {
  const [activeThumb, setActiveThumb] = useState<number>(0);

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

  const price = minPrice(medicine);
  const availableCount = medicine.pharmacies.filter(
    (p) => p.is_available
  ).length;

  return (
    <section className="med-hero">
      <div className="container med-hero__inner">

        <div className="med-hero__media reveal">
          <div className="med-hero__image">
            {medicine.image_url ? (
              <img
                src={imageUrl(medicine.image_url) ?? ""}
                alt={medicine.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "inherit",
                }}
              />
            ) : (
              <svg viewBox="0 0 200 200" width="100%" height="100%" aria-hidden="true">
                <circle cx="100" cy="100" r="92" fill="var(--mint-100)" />
                <g transform="translate(100 100) rotate(-25)">
                  <rect x="-58" y="-24" width="116" height="48" rx="24" fill="#fff" stroke="var(--teal-700)" strokeWidth="3" />
                  <path d="M0 -24 0 24" stroke="var(--line)" strokeWidth="3" />
                  <rect x="-58" y="-24" width="58" height="48" rx="24" fill="var(--coral-500)" />
                </g>
              </svg>
            )}
          </div>

          <div className="med-hero__thumbs">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                className={`thumb ${activeThumb === idx ? "is-active" : ""}`}
                aria-label={`صورة ${idx + 1}`}
                onClick={() => setActiveThumb(idx)}
              >
                <span></span>
              </button>
            ))}
          </div>
        </div>

        <div className="med-hero__info reveal">
          <span className="med-hero__tag">
            {medicine.category_name ?? "أدوية"}
          </span>
          <h1 className="med-hero__title">{medicine.name}</h1>
          {medicine.generic_name && (
            <p className="med-hero__sub">{medicine.generic_name}</p>
          )}

          <div className="med-hero__rating">
            <span className="stars">★★★★★</span>
            <span className="rating-num">
              {medicine.pharmacies.length} صيدلية
            </span>
          </div>

          <div className="med-hero__price">
            <div>
              <span className="price-label">يبدأ من</span>
              <span className="price-value">
                {price != null ? `${formatPrice(price)} د.ل` : "غير متوفر"}
              </span>
            </div>
            <span className="price-note">السعر يختلف حسب الصيدلية — يظهر أدناه</span>
          </div>

          <dl className="med-hero__facts">
            <div>
              <dt>المادة الفعالة</dt>
              <dd>{medicine.generic_name ?? "—"}</dd>
            </div>
            <div>
              <dt>التصنيف</dt>
              <dd>{medicine.category_name ?? "—"}</dd>
            </div>
            <div>
              <dt>الصيدليات المتوفرة</dt>
              <dd>
                {availableCount} من {medicine.pharmacies.length} موجودة
              </dd>
            </div>
            {medicine.description && (
              <div>
                <dt>الوصف</dt>
                <dd>{medicine.description}</dd>
              </div>
            )}
          </dl>

          <div className="med-hero__actions">
            <a href="#pharmacy-list" className="btn btn--coral">عرض الصيدليات المتوفرة</a>
            <button className="btn btn--outline" type="button">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="m12 21-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21Z" />
              </svg>
              حفظ
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};

function formatPrice(n: number): string {
  return n.toFixed(2).replace(/\.00$/, "");
}

export default DrugHeader;