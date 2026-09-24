"use client";
import React, { useEffect } from "react";
import { PharmacyDetail, imageUrl } from "@/lib/api";
import "./style.css";

interface PharmacyHeaderProps {
  pharmacy: PharmacyDetail;
}

const PharmacyHeader: React.FC<PharmacyHeaderProps> = ({ pharmacy }) => {
  useEffect(() => {
    const revealEls = document.querySelectorAll(".reveal");
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "ص";
    const parts = name.replace("صيدلية", "").trim().split(" ");
    return (parts[0] || name).slice(0, 2);
  };

  const googleMapsUrl =
    pharmacy.latitude != null && pharmacy.longitude != null
      ? `https://maps.google.com/?q=${pharmacy.latitude},${pharmacy.longitude}`
      : "https://maps.google.com";

  return (
    <section className="pharm-hero">
      <div className="container pharm-hero__inner">
        <div className="pharm-hero__identity reveal">
          {pharmacy.image_url ? (
            <img
              src={imageUrl(pharmacy.image_url) ?? ""}
              alt={pharmacy.name}
              className="pharm-hero__logo pharm-hero__logo--img"
            />
          ) : (
            <span className="pharm-hero__logo">{getInitials(pharmacy.name)}</span>
          )}
          <div>
            <div className="pharm-hero__titlerow">
              <h1 className="pharm-hero__title">{pharmacy.name}</h1>
              <span className="status-pill" id="statusPill">
                {pharmacy.is_open ? "مفتوحة الآن" : "مغلقة حاليًا"}
              </span>
            </div>
            <div className="pharm-hero__rating">
              <span className="stars">★★★★★</span>
              <span className="rating-num">{pharmacy.medicines_count}</span>
              <span className="rating-count">دواء متوفر</span>
            </div>
            <p className="pharm-hero__tagline">
              {pharmacy.description || "صيدلية شريكة في منصة دوائي"}
            </p>
          </div>
        </div>

        <div className="pharm-hero__grid reveal">
          <div className="info-card">
            <span className="info-card__icon">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M12 2c-4.1 0-7.5 3.4-7.5 7.5C4.5 15.5 12 22 12 22s7.5-6.5 7.5-12.5C19.5 5.4 16.1 2 12 2Zm0 10.2a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4Z"/>
              </svg>
            </span>
            <div>
              <span className="info-card__label">الموقع</span>
              <p className="info-card__value">
                {pharmacy.city && `${pharmacy.city}، `}
                {pharmacy.address || "—"}
              </p>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="info-card__link"
              >
                فتح في خرائط جوجل ←
              </a>
            </div>
          </div>

          <div className="info-card">
            <span className="info-card__icon">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.9 21 3 13.1 3 3.6c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8Z"/>
              </svg>
            </span>
            <div>
              <span className="info-card__label">الهاتف</span>
              <p className="info-card__value" dir="ltr">{pharmacy.phone || "—"}</p>
              {pharmacy.phone && (
                <a href={`tel:${pharmacy.phone}`} className="info-card__link">اتصل الآن ←</a>
              )}
            </div>
          </div>

          <div className="info-card">
            <span className="info-card__icon">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm.75 5v5.4l4.2 2.5-.75 1.3-5-3V7h1.55Z"/>
              </svg>
            </span>
            <div>
              <span className="info-card__label">ساعات العمل</span>
              <table className="hours-table">
                <tbody>
                  <tr>
                    <td>يومياً</td>
                    <td>
                      {pharmacy.work_open && pharmacy.work_close
                        ? `${pharmacy.work_open} – ${pharmacy.work_close}`
                        : "لم تُحدّد بعد"}
                    </td>
                  </tr>
                  <tr className="is-today">
                    <td>الحالة الآن</td>
                    <td>{pharmacy.is_open ? "مفتوحة" : "مغلقة"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="pharm-hero__actions reveal">
          {pharmacy.phone && (
            <a href={`tel:${pharmacy.phone}`} className="btn btn--coral">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.9 21 3 13.1 3 3.6c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8Z"/>
              </svg>
              اتصل بالصيدلية
            </a>
          )}
          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn--outline">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M12 2c-4.1 0-7.5 3.4-7.5 7.5C4.5 15.5 12 22 12 22s7.5-6.5 7.5-12.5C19.5 5.4 16.1 2 12 2Zm0 10.2a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4Z"/>
            </svg>
            احصل على الاتجاهات
          </a>
        </div>
      </div>
    </section>
  );
};

export default PharmacyHeader;