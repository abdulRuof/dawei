"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createReview,
  getMedicineReviews,
  getPharmacyReviews,
  getToken,
  ReviewItem,
} from "@/lib/api";
import "./style.css";

interface ReviewsSectionProps {
  targetId: number;
  targetType: "pharmacy" | "medicine";
}

function StarsRow({
  value,
  active = 0,
  size = 22,
  interactive = false,
  onSelect,
  onHover,
}: {
  value: number;
  active?: number;
  size?: number;
  interactive?: boolean;
  onSelect?: (v: number) => void;
  onHover?: (v: number) => void;
}) {
  const shown = interactive ? active || 0 : value;
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className="star-btn"
          aria-label={`${n} نجوم`}
          style={{ fontSize: size }}
          disabled={!interactive}
          onClick={interactive && onSelect ? () => onSelect(n) : undefined}
          onMouseEnter={interactive && onHover ? () => onHover(n) : undefined}
          onMouseLeave={interactive && onHover ? () => onHover(0) : undefined}
        >
          {n <= shown ? "★" : "☆"}
        </button>
      ))}
    </span>
  );
}

export default function ReviewsSection({ targetId, targetType }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [average, setAverage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const authed = !!getToken();

  const load = useCallback(async () => {
    try {
      const res =
        targetType === "pharmacy"
          ? await getPharmacyReviews(targetId)
          : await getMedicineReviews(targetId);
      setReviews(res.results);
      setAverage(res.average_rating);
    } catch {
      /* keep empty */
    } finally {
      setLoading(false);
    }
  }, [targetId, targetType]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res =
          targetType === "pharmacy"
            ? await getPharmacyReviews(targetId)
            : await getMedicineReviews(targetId);
        if (!cancelled) {
          setReviews(res.results);
          setAverage(res.average_rating);
        }
      } catch {
        /* keep empty */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [targetId, targetType]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      setError("اختر عدد النجوم أولًا (1 إلى 5)");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await createReview({
        [`${targetType}_id`]: targetId,
        rating,
        comment: comment.trim() || undefined,
      } as { rating: number });
      setComment("");
      setRating(0);
      setMessage("✓ شكرًا لك! تم إضافة تقييمك");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل إرسال التقييم");
    } finally {
      setBusy(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ar-LY", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <section className="reviews" id="reviews">
      <div className="reviews-head">
        <h2>التقييمات</h2>
        {!loading && average !== null && reviews.length > 0 && (
          <span className="reviews-avg">
            <StarsRow value={Math.round(average)} />
            <b>{average.toFixed(1)}</b>
            <i>({reviews.length})</i>
          </span>
        )}
      </div>

      {loading ? (
        <p className="reviews-loading">جارٍ تحميل التقييمات…</p>
      ) : reviews.length === 0 ? (
        <p className="reviews-empty">لا توجد تقييمات بعد — كن أول من يقيّم!</p>
      ) : (
        <ul className="reviews-list">
          {reviews.map((r) => (
            <li key={r.id} className="review-item">
              <div className="review-top">
                <span className="review-avatar">{r.user_name.charAt(0)}</span>
                <div className="review-meta">
                  <b>{r.user_name}</b>
                  <StarsRow value={r.rating} size={15} />
                </div>
                <span className="review-date">{formatDate(r.created_at)}</span>
              </div>
              {r.comment && <p className="review-comment">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}

      <div className="review-form-wrap">
        <h3>{authed ? "أضف تقييمك" : "سجّل الدخول لتقييم"}</h3>
        {message && <p className="review-ok">{message}</p>}
        {error && <p className="review-err">{error}</p>}
        {authed ? (
          <form className="review-form" onSubmit={submit}>
            <div className="review-rate">
              <span>تقييمك:</span>
              <StarsRow
                value={0}
                active={hoverRating || rating}
                size={28}
                interactive
                onSelect={setRating}
                onHover={setHoverRating}
              />
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="شارك تجربتك (اختياري)"
              rows={3}
              maxLength={500}
            />
            <button type="submit" className="btn btn--coral" disabled={busy}>
              {busy ? "جارٍ الإرسال…" : "إرسال التقييم"}
            </button>
          </form>
        ) : (
          <a href="/login" className="btn btn--coral review-login">
            تسجيل الدخول
          </a>
        )}
      </div>
    </section>
  );
}