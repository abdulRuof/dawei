"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getNotificationsSummary, getToken } from "@/lib/api";
import "./style.css";

export default function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!getToken()) return;
    let alive = true;

    const load = async () => {
      try {
        const s = await getNotificationsSummary();
        if (alive) setCount(s.total_unread);
      } catch {
        /* ignore */
      }
    };

    load();
    const interval = setInterval(load, 45000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <Link href="/notifications" className="icon-btn bell-btn" aria-label="الإشعارات">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {count > 0 && <span className="bell-badge">{count > 9 ? "9+" : count}</span>}
    </Link>
  );
}