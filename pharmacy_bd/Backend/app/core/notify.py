from sqlalchemy.orm import Session

from app.models.notification import Notification


NOTIFICATION_TYPES = [
    "LOW_STOCK",
    "PHARMACY_REGISTRATION_REQUEST",
    "PHARMACY_APPROVED",
    "PHARMACY_REJECTED",
    "NEW_EMPLOYEE",
    "MEDICINE_AVAILABLE",
]


def send_notification(
    db: Session,
    user_id: int,
    ntype: str,
    title: str,
    body: str | None = None,
    link: str | None = None,
    entity_type: str | None = None,
    entity_id: int | None = None,
):
    notification = Notification(
        user_id=user_id,
        type=ntype,
        title=title,
        body=body,
        link=link,
        entity_type=entity_type,
        entity_id=entity_id,
    )
    db.add(notification)
    db.flush()
    return notification