"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  createAlert,
  deactivateAlert,
  getMyAlerts,
  getToken,
  type AlertItem,
} from "@/lib/api";
import "./alert-button.css";

interface MedicineAlertButtonProps {
  medicineId: number;
  available: boolean;
}

export default function MedicineAlertButton({
  medicineId,
  available,
}: MedicineAlertButtonProps) {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hasToken = !!getToken();
    if (!hasToken) {
      queueMicrotask(() => {
        setLoggedIn(false);
        setLoading(false);
      });
      return;
    }
    queueMicrotask(() => setLoggedIn(true));
    getMyAlerts()
      .then((res) => {
        setEnabled(
          res.results.some((a: AlertItem) => a.medicine_id === medicineId)
        );
      })
      .catch(() => setEnabled(false))
      .finally(() => setLoading(false));
  }, [medicineId]);

  // الدواء متوفر الآن — لا حاجة لزر التنبيه
  if (available) return null;

  if (loading) return null;

  const handleEnable = async () => {
    setBusy(true);
    setError(null);
    try {
      await createAlert(medicineId);
      setEnabled(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تفعيل التنبيه");
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    setError(null);
    try {
      const alerts = await getMyAlerts();
      const match = alerts.results.find(
        (a) => a.medicine_id === medicineId && a.is_active
      );
      if (match) await deactivateAlert(match.id);
      setEnabled(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر إيقاف التنبيه");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="alert-box">
      {!loggedIn ? (
        <>
          <p className="alert-box__text">
            الدواء غير متوفر حاليًا — فعّل تنبيهًا وسنخطرك فور توفّره.
          </p>
          <Link href="/login" className="btn btn--coral alert-box__btn">
            تسجيل الدخول للتنبيه
          </Link>
        </>
      ) : enabled ? (
        <>
          <p className="alert-box__text alert-box__text--ok">
            ✓ تم تفعيل التنبيه لهذا الدواء
          </p>
          <button
            type="button"
            className="alert-box__btn alert-box__btn--ghost"
            disabled={busy}
            onClick={handleDisable}
          >
            {busy ? "جارٍ الإيقاف…" : "إيقاف التنبيه"}
          </button>
        </>
      ) : (
        <>
          <p className="alert-box__text">
            الدواء غير متوفر حاليًا — فعّل تنبيهًا وسنخطرك فور توفّره.
          </p>
          <button
            type="button"
            className="btn btn--coral alert-box__btn"
            disabled={busy}
            onClick={handleEnable}
          >
            {busy ? "جارٍ التفعيل…" : "🔔 نبهني عند توّفر الدواء"}
          </button>
        </>
      )}
      {error && <p className="alert-box__error">{error}</p>}
    </div>
  );
}