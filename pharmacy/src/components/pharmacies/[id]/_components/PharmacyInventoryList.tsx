"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PharmacyDetail, imageUrl } from "@/lib/api";

interface PharmacyInventoryListProps {
  pharmacy: PharmacyDetail;
}

const PharmacyInventoryList: React.FC<PharmacyInventoryListProps> = ({
  pharmacy,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

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

  const filteredMedicines = pharmacy.medicines.filter((med) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      med.name.toLowerCase().includes(q) ||
      (med.generic_name ?? "").toLowerCase().includes(q);
    const matchesStock = !onlyAvailable || med.is_available;
    return matchesQuery && matchesStock;
  });

  const stockLabel = (m: { is_available: boolean; quantity: number }) => {
    if (!m.is_available) return "غير متوفر";
    if (m.quantity < 30) return "كمية محدودة";
    return "متوفر";
  };

  return (
    <section className="section section--tint" id="pharmacy-medicines">
      <div className="container">

        <div className="section__head reveal">
          <div>
            <p className="section__eyebrow">المخزون المتوفر</p>
            <h2 className="section__title">جميع الأدوية في {pharmacy.name}</h2>
            <span className="results-count">
              عدد الأدوية: {pharmacy.medicines.length}
            </span>
          </div>
          <div className="pharm-search">
            <svg viewBox="0 0 24 24" width="17" height="17">
              <path
                fill="currentColor"
                d="m21 21-4.35-4.35M18.5 11a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="text"
              placeholder="ابحث داخل أدوية هذه الصيدلية…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="chip-row chip-row--filter reveal">
          <button
            className={`chip ${!onlyAvailable ? "is-active" : ""}`}
            onClick={() => setOnlyAvailable(false)}
          >
            الكل
          </button>
          <button
            className={`chip ${onlyAvailable ? "is-active" : ""}`}
            onClick={() => setOnlyAvailable(true)}
          >
            المتوفر فقط
          </button>
        </div>

        {filteredMedicines.length === 0 ? (
          <p className="empty-state">
            لا توجد أدوية مطابقة لبحثك داخل هذه الصيدلية.
          </p>
        ) : (
          <div className="pharm-med-grid">
            {filteredMedicines.map((m) => {
              const label = stockLabel(m);

              return (
                <Link
                  key={m.id}
                  href={`/drugs/${m.id}`}
                  className="med-card"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <span className="med-card__icon">
                    {m.image_url ? (
                      <img
                        src={imageUrl(m.image_url) ?? ""}
                        alt={m.name}
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "inherit",
                        }}
                      />
                    ) : (
                      <svg viewBox="0 0 24 24" width="40" height="40">
                        <path
                          fill="currentColor"
                          d="M4.9 19.1a5.2 5.2 0 0 1 0-7.35l6.85-6.85a5.2 5.2 0 1 1 7.35 7.35l-6.85 6.85a5.2 5.2 0 0 1-7.35 0Zm3.68-9.6-3.03 3.03a3.2 3.2 0 0 0 4.52 4.52l3.03-3.03-4.52-4.52Z"
                        />
                      </svg>
                    )}
                  </span>
                  <div>
                    <div className="med-card__name">{m.name}</div>
                    <div className="med-card__meta">{m.generic_name}</div>
                  </div>
                  <div className="med-card__foot">
                    <span className="med-card__price">
                      {formatPrice(m.price)} د.ل
                    </span>
                    <span
                      className={`med-card__stock ${
                        label === "كمية محدودة" ? "low" : ""
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};

function formatPrice(n: number): string {
  return n.toFixed(2).replace(/\.00$/, "");
}

export default PharmacyInventoryList;