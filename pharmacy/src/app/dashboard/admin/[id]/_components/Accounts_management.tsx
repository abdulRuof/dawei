"use client";

import { useState } from "react";
import './style.css'

import type { Account } from "./types";

interface Props {
  accounts: Account[];
  setAccounts: React.Dispatch<
    React.SetStateAction<Account[]>
  >;
  showToast: (message: string) => void;
  onDelete?: (id: number) => Promise<void> | void;
  onToggleStatus?: (id: number) => Promise<void> | void;
  onView?: (id: number) => void;
}

export default function AccountsManagement({
  accounts,
  setAccounts,
  showToast,
  onDelete,
  onToggleStatus,
  onView,
}: Props) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("الكل");

  const filtered = accounts.filter((account) => {
    const q = search.trim().toLowerCase();

    const matchSearch =
      !q ||
      account.name
        .toLowerCase()
        .includes(q) ||
      account.email
        .toLowerCase()
        .includes(q);

    const matchType =
      type === "الكل" ||
      account.type === type;

    return matchSearch && matchType;
  });

  const deleteAccount = async (id: number) => {
    if (onDelete) {
      await onDelete(id);
      return;
    }

    const account = accounts.find(
      (a) => a.id === id
    );

    if (!account) return;

    setAccounts((prev) =>
      prev.filter((a) => a.id !== id)
    );

    showToast(
      `🗑 تم حذف حساب "${account.name}"`
    );
  };

  return (
    <section>

      <div className="table-toolbar">

        <div className="dash-search dash-search--wide">
          <input
            type="text"
            placeholder="ابحث بالاسم أو البريد الإلكتروني…"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <select
          className="select-input"
          value={type}
          onChange={(e) =>
            setType(e.target.value)
          }
        >
          <option value="الكل">
            كل الأنواع
          </option>

          <option value="مستخدم">
            مستخدم
          </option>

          <option value="صيدلية">
            صيدلية
          </option>
        </select>

      </div>

      <div className="table-wrap">

        <table className="med-table">

          <thead>
            <tr>
              <th>الاسم</th>
              <th>النوع</th>
              <th>البريد الإلكتروني</th>
              <th>تاريخ التسجيل</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>

          <tbody>

            {filtered.map((account) => (
              <tr key={account.id}>

                <td>
                  <strong
                    className="clickable-name"
                    onClick={() => onView?.(account.id)}
                  >
                    {account.name}
                  </strong>
                </td>

                <td>
                  <span className="cat-tag">
                    {account.type}
                  </span>
                </td>

                <td
                  dir="ltr"
                  style={{
                    textAlign: "end",
                  }}
                >
                  {account.email}
                </td>

                <td>
                  {account.joined}
                </td>

                <td>
                  <span
                    className={`status-badge ${
                      account.status === "نشط"
                        ? "ok"
                        : "out"
                    }`}
                  >
                    {account.status}
                  </span>
                </td>

                <td>
                  <div className="row-actions">
                    {onView && (
                      <button
                        type="button"
                        className="icon-btn"
                        title="عرض البيانات"
                        aria-label="عرض البيانات"
                        onClick={() => onView(account.id)}
                      >
                        <svg viewBox="0 0 24 24" width="15" height="15">
                          <path
                            fill="currentColor"
                            d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7Zm0 11.5A4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 0 1 0 9Zm0-7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"
                          />
                        </svg>
                      </button>
                    )}
                    {onToggleStatus && (
                      <button
                        type="button"
                        className="icon-btn"
                        title={
                          account.status === "نشط"
                            ? "إيقاف الحساب"
                            : "تفعيل الحساب"
                        }
                        aria-label={
                          account.status === "نشط"
                            ? "إيقاف الحساب"
                            : "تفعيل الحساب"
                        }
                        onClick={() =>
                          onToggleStatus(account.id)
                        }
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
                    )}
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger"
                      title="حذف الحساب"
                      aria-label="حذف الحساب"
                      onClick={() =>
                        deleteAccount(
                          account.id
                        )
                      }
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
        <p className="empty-state">
          لا توجد حسابات مطابقة.
        </p>
      )}

    </section>
  );
}