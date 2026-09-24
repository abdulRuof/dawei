from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.permissions import require_pharmacy_owner
from app.models.pharmacy_users import PharmacyUser
from app.models.activity_log import ActivityLog
from app.models.users import User


router = APIRouter(
    prefix="/api/pharmacies/{pharmacy_id}/activity",
    tags=["Activity Log"]
)


@router.get("")
def list_activity(
    pharmacy_id: int,
    pharmacy_user: PharmacyUser = Depends(require_pharmacy_owner),
    db: Session = Depends(get_db),
    limit: int = 100,
):
    rows = (
        db.query(ActivityLog, User)
        .join(User, User.id == ActivityLog.user_id)
        .filter(ActivityLog.pharmacy_id == pharmacy_id)
        .order_by(ActivityLog.created_at.desc(), ActivityLog.id.desc())
        .limit(max(1, min(limit, 500)))
        .all()
    )

    results = []
    for log, user in rows:
        role_row = (
            db.query(PharmacyUser)
            .filter(
                PharmacyUser.user_id == user.id,
                PharmacyUser.pharmacy_id == pharmacy_id,
            )
            .first()
        )
        role = role_row.role if role_row else None
        results.append({
            "id": log.id,
            "user_name": user.full_name,
            "role": role,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "old_value": log.old_value,
            "new_value": log.new_value,
            "description": log.description,
            "created_at": log.created_at.isoformat(),
        })

    return {
        "count": len(results),
        "results": results,
    }