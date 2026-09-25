from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.users import User
from app.models.pharmacy_users import PharmacyUser
from app.core.dependencies import get_current_user


def _gate_must_change_password(current_user: User):
    """يحجب لوحة التحكم حتى يغيّر المستخدم كلمة المرور أولًا."""
    if current_user.must_change_password:
        raise HTTPException(
            status_code=status.HTTP_428_PRECONDITION_REQUIRED,
            detail="MUST_CHANGE_PASSWORD",
        )


def require_pharmacy_owner(
    pharmacy_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pharmacy_user = (
        db.query(PharmacyUser)
        .filter(
            PharmacyUser.user_id == current_user.id,
            PharmacyUser.pharmacy_id == pharmacy_id,
            PharmacyUser.role == "owner"
        )
        .first()
    )

    if pharmacy_user is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to manage this pharmacy"
        )

    _gate_must_change_password(current_user)

    return pharmacy_user


def require_pharmacy_staff(
    pharmacy_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pharmacy_user = (
        db.query(PharmacyUser)
        .filter(
            PharmacyUser.user_id == current_user.id,
            PharmacyUser.pharmacy_id == pharmacy_id,
            PharmacyUser.role.in_(["owner", "staff"])
        )
        .first()
    )

    if pharmacy_user is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to manage this pharmacy inventory"
        )

    _gate_must_change_password(current_user)

    return pharmacy_user


def require_superadmin(
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to manage the platform"
        )

    return current_user