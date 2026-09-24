"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Medicine, minPrice } from "@/lib/api";
import "./style.css";

interface AlternativesListProps {
  medicines: Medicine[];
}

const AlternativesList: React.FC<AlternativesListProps> = ({ medicines }) => {
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

  if (medicines.length === 0) {
    return null;
  }

  return (
    <section className="section">
      <div className="container">

        <div className="section__head reveal">
          <div>
            <p className="section__eyebrow">قد يهمك أيضًا</p>
            <h2 className="section__title">أدوية بديلة أو مشابهة</h2>
          </div>
        </div>

        <div className="med-track" id="relatedTrack">
          {medicines.map((med) => {
            const price = minPrice(med);

            return (
              <Link
                key={med.id}
                href={`/drugs/${med.id}`}
                className="med-card"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <span className="med-card__icon">
                  <svg viewBox="0 0 24 24" width="26" height="26">
                    <path
                      fill="currentColor"
                      d="M4.9 19.1a5.2 5.2 0 0 1 0-7.35l6.85-6.85a5.2 5.2 0 1 1 7.35 7.35l-6.85 6.85a5.2 5.2 0 0 1-7.35 0Zm3.68-9.6-3.03 3.03a3.2 3.2 0 0 0 4.52 4.52l3.03-3.03-4.52-4.52Z"
                    />
                  </svg>
                </span>

                <div>
                  <div className="med-card__name">{med.name}</div>
                  <div className="med-card__meta">{med.generic_name ?? med.category_name}</div>
                </div>

                <div className="med-card__foot">
                  <span className="med-card__price">
                    {price != null ? `يبدأ من ${formatPrice(price)} د.ل` : "غير متوفر"}
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

      </div>
    </section>
  );
};

function formatPrice(n: number): string {
  return n.toFixed(2).replace(/\.00$/, "");
}

export default AlternativesList;