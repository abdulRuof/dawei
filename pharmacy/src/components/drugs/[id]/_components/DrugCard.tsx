"use client";

import React from "react";
import Link from "next/link";
import { isAvailable, Medicine, minPrice, imageUrl } from "@/lib/api";
import "./style.css";

type DrugCardProps = {
  medicines: Medicine[];
  hasSearched: boolean;
  loading?: boolean;
};

const pillIcon = (
  <svg viewBox="0 0 24 24" width="44" height="44">
    <path
      fill="currentColor"
      d="M4.9 19.1a5.2 5.2 0 0 1 0-7.35l6.85-6.85a5.2 5.2 0 1 1 7.35 7.35l-6.85 6.85a5.2 5.2 0 0 1-7.35 0Zm3.68-9.6-3.03 3.03a3.2 3.2 0 0 0 4.52 4.52l3.03-3.03-4.52-4.52Z"
    />
  </svg>
);

const DrugCard = ({ medicines, hasSearched, loading }: DrugCardProps) => {
  // لا تظهر أي نتيجة قبل البحث
  if (!hasSearched) {
    return null;
  }

  return (
    <section className="section" id="search-results">
      <div className="container">
        <div className="section__head">
          <div>
            <p className="section__eyebrow">نتائج البحث</p>
            <h2 className="section__title">الأدوية المتوفرة</h2>
          </div>
          {!loading && medicines.length > 0 && (
            <span className="results-count">
              عدد النتائج: {medicines.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="empty-state">جارٍ البحث…</div>
        ) : medicines.length > 0 ? (
          <div className="med-grid">
            {medicines.map((medicine) => {
              const price = minPrice(medicine);
              const available = isAvailable(medicine);
              const pharmacyNames = medicine.pharmacies
                .map((p) => p.pharmacy_name)
                .join("، ");

              return (
                <Link
                  href={`/drugs/${medicine.id}`}
                  className="med-card"
                  key={medicine.id}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <span className="med-card__icon">
                    {medicine.image_url ? (
                      <img
                        src={imageUrl(medicine.image_url) ?? ""}
                        alt={medicine.name}
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "inherit",
                        }}
                      />
                    ) : (
                      pillIcon
                    )}
                  </span>

                  <div className="med-card__body">
                    <div className="med-card__name">{medicine.name}</div>
                    <div className="med-card__meta">
                      {medicine.generic_name ?? "دواء متوفر"}
                    </div>
                    <div className="med-card__pharmacy">
                      {pharmacyNames}
                    </div>
                  </div>

                  <div className="med-card__foot">
                    <span className="med-card__price">
                      {available ? `يبدأ من ${formatPrice(price)} د.ل` : "غير متوفر"}
                    </span>

                    <span className="med-card__add" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path
                          fill="currentColor"
                          d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z"
                        />
                      </svg>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">لا توجد أدوية مطابقة لبحثك.</div>
        )}
      </div>
    </section>
  );
};

function formatPrice(n: number | null): string {
  return n == null ? "—" : n.toFixed(2).replace(/\.00$/, "");
}

export default DrugCard;