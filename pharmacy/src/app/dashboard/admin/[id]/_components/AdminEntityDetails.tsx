"use client";

import type { Account, Pharmacy } from "./types";
import "./style.css";

interface Props {
  kind: "pharmacy" | "account";
  pharmacy?: Pharmacy;
  account?: Account;
  ownerAccount?: Account | null;
  onToggleStatus?: () => void;
  onDelete?: () => void;
  onClose: () => void;
}

const AdminEntityDetails: React.FC<Props> = ({
  kind,
  pharmacy,
  account,
  ownerAccount,
  onToggleStatus,
  onDelete,
  onClose,
}) => {
  if (kind === "pharmacy" && !pharmacy) return null;
  if (kind === "account" && !account) return null;

  const isOpen = kind === "pharmacy" ? pharmacy!.status === "نشطة" : account!.status === "نشط";
  const statusLabel = kind === "pharmacy" ? pharmacy!.status : account!.status;
  const title = kind === "pharmacy" ? pharmacy!.name : account!.name;
  const iconBg = kind === "pharmacy" ? pharmacy!.color || "#0070f3" : "#0070f3";
  const initials =
    kind === "pharmacy"
      ? pharmacy!.initials
      : (account!.name || "م").slice(0, 2).toUpperCase();
  const entityId = kind === "pharmacy" ? pharmacy!.id : account!.id;

  return (
    <div className="info-overlay" onClick={onClose}>
      <div
        className="info-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* الترويسة */}
        <div className="info-header" style={{ background: iconBg }}>
          <button
            type="button"
            className="info-close"
            onClick={onClose}
            aria-label="إغلاق"
          >
            ✕
          </button>
          <span className="info-header__icon">{initials}</span>
          <h2>{title}</h2>
          <span className={`status-badge ${isOpen ? "ok" : "out"}`}>
            {statusLabel}
          </span>
        </div>

        {/* بيانات الحساب */}
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">رقم المعرّف (ID)</span>
            <span className="info-value" dir="ltr">
              #{entityId}
            </span>
          </div>

          {kind === "pharmacy" ? (
            <>
              <div className="info-item">
                <span className="info-label">المدينة</span>
                <span className="info-value">{pharmacy!.city || "—"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">العنوان</span>
                <span className="info-value">{pharmacy!.address || "—"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">هاتف الصيدلية</span>
                <span className="info-value" dir="ltr">
                  {pharmacy!.phone || "—"}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">تاريخ الانضمام</span>
                <span className="info-value">{pharmacy!.joined || "—"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">اسم المالك</span>
                <span className="info-value">
                  {pharmacy!.ownerName || "—"}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">بريد المالك</span>
                <span className="info-value" dir="ltr">
                  {ownerAccount?.email ?? "—"}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">هاتف المالك</span>
                <span className="info-value" dir="ltr">
                  {ownerAccount?.phone ?? "—"}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">حالة حساب المالك</span>
                <span className="info-value">
                  {ownerAccount ? ownerAccount.status : "—"}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="info-item">
                <span className="info-label">الاسم</span>
                <span className="info-value">{account!.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">البريد الإلكتروني</span>
                <span className="info-value" dir="ltr">
                  {account!.email}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">الهاتف</span>
                <span className="info-value" dir="ltr">
                  {account!.phone || "—"}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">النوع</span>
                <span className="info-value">{account!.type}</span>
              </div>
              <div className="info-item">
                <span className="info-label">تاريخ التسجيل</span>
                <span className="info-value">{account!.joined}</span>
              </div>
            </>
          )}

          <div className="info-item info-item--wide">
            <span className="info-label">كلمة المرور</span>
            <span className="info-value info-value--muted">
              ●●●●●● (مشفّرة — لا يمكن عرضها، تُحفظ كـ hash في القاعدة)
            </span>
          </div>
        </div>

        {/* إجراءات */}
        <div className="info-actions">
          {onToggleStatus && (
            <button
              type="button"
              className="btn btn--outline"
              onClick={onToggleStatus}
            >
              {isOpen ? "إيقاف" : "تفعيل"}
            </button>
          )}
          {onDelete && (
            <button type="button" className="btn btn--danger" onClick={onDelete}>
              حذف
            </button>
          )}
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminEntityDetails;