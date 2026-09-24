from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models.users import User
from app.models.notification import Notification


router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"]
)


def _serialize(n: Notification):
    return {
        "id": n.id,
        "type": n.type,
        "title": n.title,
        "body": n.body,
        "link": n.link,
        "entity_type": n.entity_type,
        "entity_id": n.entity_id,
        "is_read": n.is_read,
        "created_at": n.created_at.isoformat(),
    }


@router.get("")
def list_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rows = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .limit(100)
        .all()
    )
    return {
        "count": len(rows),
        "unread_count": len([n for n in rows if not n.is_read]),
        "results": [_serialize(n) for n in rows],
    }


@router.patch("/{notification_id}/read")
def mark_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    n = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )
    if n is None:
        return {"message": "الإشعار غير موجود"}
    n.is_read = True
    db.commit()
    return {"message": "تم التحديد كمقروء"}


@router.post("/read-all")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rows = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False,  # noqa: E712
        )
        .all()
    )
    for r in rows:
        r.is_read = True
    db.commit()
    return {"message": "تم تحديد جميع الإشعارات كمقروءة"}