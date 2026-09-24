"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationItem,
} from "@/lib/api";
import Breadcrumb from "@/components/layout/Breadcrumb";
import "./style.css";

const TYPE_LABELS: Record<string, string> = {
  LOW_STOCK: "تنبيه مخزون",
  PHARMACY_REGISTRATION_REQUEST: "طلب تسجيل",
  PHARMACY_APPROVED: "قبول تسجيل",
  PHARMACY_REJECTED: "رفض تسجيل",
  NEW_EMPLOYEE: "موظف جديد",
  MEDICINE_AVAILABLE: "توفر دواء",
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getNotifications();
        if (!cancelled) setItems(res.results);
      } catch {
        if (!cancelled) setAuthed(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const readOne = async (id: number) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    try {
      await markNotificationRead(id);
    } catch {
      getNotifications()
        .then((res) => setItems(res.results))
        .catch(() => undefined);
    }
  };

  const readAll = async () => {
    try {
      await markAllNotificationsRead();
    } catch {
      /* ignore */
    }
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString("ar-LY", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  if (loading) {
    return (
      <main style={{ padding: "4rem 1rem", textAlign: "center" }}>جارٍ التحميل…</main>
    );
  }

  if (!authed) {
    return (
      <main className="notif-page">
        <Breadcrumb items={[{ label: "الإشعارات" }]} />
        <div className="notif-empty">
          <p>يجب تسجيل الدخول لرؤية إشعاراتك</p>
          <Link href="/login" className="btn btn--coral">
            تسجيل الدخول
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="notif-page">
      <Breadcrumb items={[{ label: "الإشعارات" }]} />
      <div className="notif-head">
        <h1>الإشعارات</h1>
        {items.length > 0 && (
          <button type="button" className="notif-readall" onClick={readAll}>
            تحديد الكل كمقروء
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="notif-empty">
          <p>لا توجد إشعارات بعد</p>
        </div>
      ) : (
        <ul className="notif-list">
          {items.map((n) => (
            <li key={n.id} className={`notif-item ${n.is_read ? "is-read" : ""}`}>
              {!n.is_read && <span className="notif-dot" aria-label="غير مقروء" />}
              <div className="notif-body">
                {n.type && TYPE_LABELS[n.type] && (
                  <span className="notif-type">{TYPE_LABELS[n.type]}</span>
                )}
                <h3>{n.title}</h3>
                {n.body && <p>{n.body}</p>}
                <span className="notif-time">{formatTime(n.created_at)}</span>
              </div>
              <div className="notif-actions">
                {n.link && (
                  <Link href={n.link} className="notif-open" onClick={() => readOne(n.id)}>
                    فتح
                  </Link>
                )}
                {!n.is_read && (
                  <button
                    type="button"
                    className="notif-mark"
                    onClick={() => readOne(n.id)}
                  >
                    مقروء
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}