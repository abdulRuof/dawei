"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getNotifications,
  getNotificationsSummary,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationItem,
  NotificationScope,
  NotificationsSummary,
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

const SCOPE_TABS: { scope: NotificationScope; label: string }[] = [
  { scope: "user", label: "إشعاراتي" },
  { scope: "pharmacy", label: "صيدليتي" },
  { scope: "admin", label: "المنصة" },
];

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(true);
  const [summary, setSummary] = useState<NotificationsSummary | null>(null);
  const [activeScope, setActiveScope] = useState<NotificationScope | null>(null);

  const loadList = useCallback(async (scope: NotificationScope | null) => {
    try {
      const res = await getNotifications(scope ?? undefined);
      setItems(res.results);
    } catch {
      /* keep current list */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getNotificationsSummary();
        if (cancelled) return;
        const available = s.scopes as NotificationScope[];
        const scopes = SCOPE_TABS.filter((t) => available.includes(t.scope));
        setSummary(s);
        const target = scopes.length > 0 ? scopes[0].scope : "user";
        setActiveScope(target);
        const res = await getNotifications(target);
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

  const switchTab = (scope: NotificationScope | null) => {
    setActiveScope(scope);
    setLoading(true);
    loadList(scope).finally(() => setLoading(false));
  };

  const readOne = (id: number) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    markNotificationRead(id).catch(() => {
      loadList(activeScope).catch(() => undefined);
    });
  };

  const readAll = async () => {
    try {
      await markAllNotificationsRead(activeScope ?? undefined);
    } catch {
      /* ignore */
    }
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setSummary((prev) =>
      prev
        ? {
            ...prev,
            unread: activeScope
              ? { ...prev.unread, [activeScope]: 0 }
              : { ...prev.unread },
            total_unread: Math.max(0, prev.total_unread - items.filter((n) => !n.is_read).length),
          }
        : prev
    );
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString("ar-LY", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const availableScopes: NotificationScope[] = summary
    ? (summary.scopes.filter((s) => SCOPE_TABS.some((t) => t.scope === s)) as NotificationScope[])
    : [];

  const unreadOf = (scope: NotificationScope | null) =>
    summary
      ? scope
        ? summary.unread[scope] ?? 0
        : summary.total_unread ?? 0
      : 0;

  if (loading && !authed) {
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

      {availableScopes.length > 1 && (
        <div className="notif-tabs" role="tablist">
          {SCOPE_TABS.filter((t) => availableScopes.includes(t.scope)).map((tab) => (
            <button
              key={tab.scope}
              type="button"
              role="tab"
              aria-selected={activeScope === tab.scope}
              className={`notif-tab ${activeScope === tab.scope ? "is-active" : ""}`}
              onClick={() => switchTab(tab.scope)}
            >
              {tab.label}
              {unreadOf(tab.scope) > 0 && (
                <span className="notif-tab__badge">{unreadOf(tab.scope)}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="notif-empty">
          <p>جارٍ التحميل…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="notif-empty">
          <p>
            {activeScope === "user" && "لا توجد إشعارات خاصة بك بعد"}
            {activeScope === "pharmacy" && "لا توجد إشعارات خاصة بصيدليتك بعد"}
            {activeScope === "admin" && "لا توجد طلبات تسجيل جديدة بعد"}
          </p>
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