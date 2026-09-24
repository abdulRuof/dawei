"use client";

import { useState } from "react";
import type { Pharmacy } from "./types";
import './style.css';

interface Props {
  pharmacies?: Pharmacy[];
  onToggleStatus: (id: number) => void;
  onDelete: (id: number) => void;
  onView?: (id: number) => void;
}
/*

const Overview: React.FC<OverviewProps> = ({
  medicines,
  onNavigate,
  lowStockThreshold = 10,
}) => {
*/

export const PharmaciesManagement: React.FC<Props> = ({
  pharmacies = [],
  onToggleStatus,
  onDelete,
  onView,
}) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("الكل");

  const filtered = (pharmacies || []).filter((pharmacy) => {
    if (!pharmacy) return false;

    const matchSearch =
      !search.trim() ||
      (pharmacy.name && pharmacy.name.toLowerCase().includes(search.trim().toLowerCase()));

    const matchStatus =
      status === "الكل" || pharmacy.status === status;

    return matchSearch && matchStatus;
  });

  return (
    <section>
      <div className="table-toolbar">
        <div className="dash-search dash-search--wide">
          <input
            type="text"
            placeholder="ابحث عن صيدلية…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="select-input"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="الكل">كل الحالات</option>
          <option value="نشطة">نشطة</option>
          <option value="موقوفة">موقوفة</option>
        </select>
      </div>

      <div className="table-wrap">
        <table className="med-table">
          <thead>
            <tr>
              <th>الصيدلية</th>
              <th>المدينة</th>
              <th>تاريخ الانضمام</th>
              <th>التقييم</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((pharmacy) => (
              <tr key={pharmacy.id}>
                <td>
                  <div className="med-name-cell">
                    <span
                      className="med-name-cell__icon"
                      style={{
                        background: pharmacy.color || "#0070f3",
                        color: "#fff",
                      }}
                    >
                      {pharmacy.initials || pharmacy.name?.charAt(0) || "ص"}
                    </span>
                    <div>
                      <strong
                        className="clickable-name"
                        onClick={() => onView?.(pharmacy.id)}
                      >
                        {pharmacy.name || "بدون اسم"}
                      </strong>
                    </div>
                  </div>
                </td>

                <td>{pharmacy.city || "—"}</td>
                <td>{pharmacy.joined || "—"}</td>
                <td>★ {pharmacy.rating ?? 0}</td>

                <td>
                  <span
                    className={`status-badge ${
                      pharmacy.status === "نشطة" ? "ok" : "out"
                    }`}
                  >
                    {pharmacy.status || "غير محدد"}
                  </span>
                </td>

                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      title="عرض البيانات"
                      aria-label="عرض البيانات"
                      onClick={() => onView?.(pharmacy.id)}
                    >
                      <svg viewBox="0 0 24 24" width="15" height="15">
                        <path
                          fill="currentColor"
                          d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7Zm0 11.5A4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 0 1 0 9Zm0-7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"
                        />
                      </svg>
                    </button>

                    <button
                      type="button"
                      className="icon-btn"
                      title={
                        pharmacy.status === "نشطة"
                          ? "إيقاف الصيدلية"
                          : "تفعيل الصيدلية"
                      }
                      aria-label={
                        pharmacy.status === "نشطة"
                          ? "إيقاف الصيدلية"
                          : "تفعيل الصيدلية"
                      }
                      onClick={() => onToggleStatus(pharmacy.id)}
                    >
                      <svg viewBox="0 0 24 24" width="15" height="15">
                        <path
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          d="M12 2v8m6.36-2.64a8 8 0 1 1-12.72 0"
                        />
                      </svg>
                    </button>

                    <button
                      type="button"
                      className="icon-btn icon-btn--danger"
                      title="حذف الصيدلية"
                      aria-label="حذف الصيدلية"
                      onClick={() => onDelete(pharmacy.id)}
                    >
                      <svg viewBox="0 0 24 24" width="15" height="15">
                        <path
                          fill="currentColor"
                          d="M6 7h12l-1 14H7L6 7Zm3-4h6l1 2h4v2H4V5h4l1-2Z"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="empty-state">لا توجد صيدليات مطابقة للبحث.</p>
      )}
    </section>
  );
}

