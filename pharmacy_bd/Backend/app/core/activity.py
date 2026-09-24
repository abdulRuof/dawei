from sqlalchemy.orm import Session

from app.models.activity_log import ActivityLog


def log_activity(
    db: Session,
    pharmacy_id: int,
    user_id: int,
    action: str,
    description: str | None = None,
    entity_type: str | None = None,
    entity_id: int | None = None,
    old_value: str | None = None,
    new_value: str | None = None,
):
    entry = ActivityLog(
        pharmacy_id=pharmacy_id,
        user_id=user_id,
        action=action,
        description=description,
        entity_type=entity_type,
        entity_id=entity_id,
        old_value=old_value,
        new_value=new_value,
    )
    db.add(entry)
    db.flush()
    return entry