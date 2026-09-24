"""موقت ساعات العمل (يهتم به مدير الصيدلية).

يفتح/يغلق الصيدليات تلقائيًا وفق مواعيد العمل المُسجّلة،
فقط للصيدليات التي فعّلت work_timer.
"""
import threading
import time
from datetime import datetime

from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.pharmacy import Pharmacy

TICK_SECONDS = 30


def _minutes(value: str) -> int:
    h, m = (value or "00:00").split(":")
    return int(h) * 60 + int(m)


def is_within_working_hours(
    work_open: str,
    work_close: str,
    now: str | None = None,
) -> bool:
    current = _minutes(now or datetime.now().strftime("%H:%M"))
    open_min = _minutes(work_open)
    close_min = _minutes(work_close)

    if open_min == close_min:
        return False

    if open_min < close_min:
        return open_min <= current < close_min

    # تعبر منتصف الليل (مثال: 22:00 → 06:00)
    return current >= open_min or current < close_min


def _apply_tick(db: Session):
    pharmacies = (
        db.query(Pharmacy)
        .filter(Pharmacy.work_timer == True)  # noqa: E712
        .all()
    )

    for pharmacy in pharmacies:
        if not pharmacy.work_open or not pharmacy.work_close:
            continue
        desired = is_within_working_hours(
            pharmacy.work_open,
            pharmacy.work_close
        )
        if pharmacy.is_open != desired:
            pharmacy.is_open = desired

    if pharmacies:
        db.commit()


def _loop():
    while True:
        try:
            db = SessionLocal()
            try:
                _apply_tick(db)
            finally:
                db.close()
        except Exception:
            pass
        time.sleep(TICK_SECONDS)


_started = False


def start_scheduler():
    global _started
    if _started:
        return
    _started = True
    thread = threading.Thread(
        target=_loop,
        daemon=True,
        name="work-hours-scheduler",
    )
    thread.start()