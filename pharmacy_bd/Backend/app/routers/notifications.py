from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models.users import User
from app.models.pharmacy_users import PharmacyUser
from app.models.notification import Notification


router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"]
)


# أنواع الإشعارات حسب الشاشة (الفصل بين المستخدم / الصيدلية / المنصة)
SCOPE_TYPES = {
    "admin": {
        "PHARMACY_REGISTRATION_REQUEST",
    },
    "pharmacy": {
        "PHARMACY_APPROVED",
        "PHARMACY_REJECTED",
        "LOW_STOCK",
        "NEW_EMPLOYEE",
    },
    "user": {
        "PHARMACY_APPROVED",
        "PHARMACY_REJECTED",
        "MEDICINE_AVAILABLE",
    },
}

SCOPE_ORDER = ["user", "pharmacy", "admin"]


def _available_scopes(db: Session, user: User) -> list[str]:
    scopes = ["user"]
    has_pharmacy = (
        db.query(PharmacyUser)
        .filter(PharmacyUser.user_id == user.id)
        .first()
    )
    if has_pharmacy is not None:
        scopes.append("pharmacy")
    if user.is_superadmin:
        scopes.append("admin")
    return scopes


def _resolve_scope(db: Session, user: User, scope: str | None) -> str | None:
    available = _available_scopes(db, user)
    if scope is None:
        return None
    if scope not in SCOPE_TYPES:
        raise HTTPException(status_code=400, detail="scope غير معروف (user / pharmacy / admin)")
    if scope not in available:
        raise HTTPException(status_code=403, detail="لا تملك صلاحية هذا النطاق")
    return scope


def _unread_count(db: Session, user_id: int, scope: str | None) -> int:
    q = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False,  # noqa: E712
    )
    if scope is not None:
        q = q.filter(Notification.type.in_(SCOPE_TYPES[scope]))
    return q.count()


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


@router.get("/summary")
def notifications_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    available = _available_scopes(db, current_user)
    return {
        "scopes": available,
        "unread": {
            s: _unread_count(db, current_user.id, s)
            for s in available
        },
        "total_unread": _unread_count(db, current_user.id, None),
    }


@router.get("")
def list_notifications(
    scope: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resolved = _resolve_scope(db, current_user, scope)

    q = db.query(Notification).filter(Notification.user_id == current_user.id)
    if resolved is not None:
        q = q.filter(Notification.type.in_(SCOPE_TYPES[resolved]))

    rows = (
        q.order_by(Notification.created_at.desc(), Notification.id.desc())
        .limit(100)
        .all()
    )

    available = _available_scopes(db, current_user)
    return {
        "scope": resolved,
        "count": len(rows),
        "unread_count": len([n for n in rows if not n.is_read]),
        "results": [_serialize(n) for n in rows],
        "scopes": {
            "available": available,
            "unread": {
                s: _unread_count(db, current_user.id, s)
                for s in available
            },
        },
    }


@router.patch("/read-all")
def mark_all_read(
    scope: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resolved = _resolve_scope(db, current_user, scope)

    q = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,  # noqa: E712
    )
    if resolved is not None:
        q = q.filter(Notification.type.in_(SCOPE_TYPES[resolved]))

    rows = q.all()
    for r in rows:
        r.is_read = True
    db.commit()
    return {"message": "تم تحديد جميع الإشعارات كمقروءة", "updated": len(rows)}


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