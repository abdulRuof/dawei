from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.permissions import require_pharmacy_owner
from app.core.security import hash_password
from app.core.activity import log_activity
from app.core.notify import send_notification
from app.models.users import User
from app.models.pharmacy_users import PharmacyUser
from app.models.pharmacy import Pharmacy


router = APIRouter(
    prefix="/api/pharmacies/{pharmacy_id}/employees",
    tags=["Pharmacy Employees"]
)


def _serialize(pharmacy_user: PharmacyUser):
    return {
        "id": pharmacy_user.user_id,
        "full_name": pharmacy_user.user.full_name,
        "email": pharmacy_user.user.email,
        "phone": pharmacy_user.user.phone,
        "role": pharmacy_user.role,
        "is_active": pharmacy_user.user.is_active,
    }


@router.get("")
def list_employees(
    pharmacy_id: int,
    pharmacy_user: PharmacyUser = Depends(require_pharmacy_owner),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(PharmacyUser)
        .filter(
            PharmacyUser.pharmacy_id == pharmacy_id,
            PharmacyUser.role == "staff",
        )
        .order_by(PharmacyUser.id)
        .all()
    )
    return {
        "count": len(rows),
        "results": [_serialize(row) for row in rows],
    }


@router.post("")
def add_employee(
    pharmacy_id: int,
    data: dict,
    pharmacy_user: PharmacyUser = Depends(require_pharmacy_owner),
    db: Session = Depends(get_db),
):
    full_name = (data.get("full_name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    phone = (data.get("phone") or "").strip()
    password = data.get("password") or ""

    if not full_name or not email or not phone or not password:
        raise HTTPException(status_code=400, detail="All fields are required")

    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters"
        )

    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        # ربط حساب قائم بالصيدلية إن لم يكن موظفاً فيها
        already_linked = (
            db.query(PharmacyUser)
            .filter(
                PharmacyUser.user_id == existing_user.id,
                PharmacyUser.pharmacy_id == pharmacy_id,
            )
            .first()
        )
        if already_linked:
            raise HTTPException(
                status_code=400,
                detail="This account is already linked to the pharmacy"
            )
        user = existing_user
    else:
        user = User(
            full_name=full_name,
            email=email,
            phone=phone,
            password_hash=hash_password(password),
            is_active=True,
            is_superadmin=False,
        )
        db.add(user)
        db.flush()

    link = PharmacyUser(
        user_id=user.id,
        pharmacy_id=pharmacy_id,
        role="staff",
    )
    db.add(link)
    log_activity(
        db,
        pharmacy_id,
        pharmacy_user.user_id,
        "add_employee",
        f"أضاف موظفًا: {user.full_name} ({user.email})",
        entity_type="user",
        entity_id=user.id,
        new_value=f"role:staff",
    )

    # كلمة مرور مؤقتة — يُطلب تغييرها عند أول دخول
    if user.must_change_password is False:
        user.must_change_password = True

    # إشعار ترحيبي للموظف الجديد
    pharmacy = (
        db.query(Pharmacy)
        .filter(Pharmacy.id == pharmacy_id)
        .first()
    )
    send_notification(
        db,
        user.id,
        "NEW_EMPLOYEE",
        "تمت إضافتك كموظف",
        (
            f"أهلاً {user.full_name}، تمت إضافتك كموظف في صيدلية "
            f"\"{pharmacy.name if pharmacy else ''}\". يرجى تغيير كلمة المرور عند أول دخول."
        ),
        link=f"/login",
        entity_type="pharmacy",
        entity_id=pharmacy_id,
    )
    db.commit()
    db.refresh(link)

    return _serialize(link)


@router.patch("/{employee_id}")
def toggle_employee(
    pharmacy_id: int,
    employee_id: int,
    data: dict,
    pharmacy_user: PharmacyUser = Depends(require_pharmacy_owner),
    db: Session = Depends(get_db),
):
    link = (
        db.query(PharmacyUser)
        .filter(
            PharmacyUser.user_id == employee_id,
            PharmacyUser.pharmacy_id == pharmacy_id,
            PharmacyUser.role == "staff",
        )
        .first()
    )
    if link is None:
        raise HTTPException(status_code=404, detail="Employee not found")

    if "is_active" in data:
        link.user.is_active = bool(data["is_active"])
        log_activity(
            db,
            pharmacy_id,
            pharmacy_user.user_id,
            "toggle_employee",
            f"{'فعّل' if link.user.is_active else 'عطّل'} حساب الموظف {link.user.full_name}",
        )
        db.commit()

    db.refresh(link)
    return _serialize(link)


@router.delete("/{employee_id}")
def delete_employee(
    pharmacy_id: int,
    employee_id: int,
    pharmacy_user: PharmacyUser = Depends(require_pharmacy_owner),
    db: Session = Depends(get_db),
):
    link = (
        db.query(PharmacyUser)
        .filter(
            PharmacyUser.user_id == employee_id,
            PharmacyUser.pharmacy_id == pharmacy_id,
            PharmacyUser.role == "staff",
        )
        .first()
    )
    if link is None:
        raise HTTPException(status_code=404, detail="Employee not found")

    log_activity(
        db,
        pharmacy_id,
        pharmacy_user.user_id,
        "delete_employee",
        f"حذف حساب الموظف {link.user.full_name} من الصيدلية"
    )

    db.delete(link)
    db.commit()

    return {"message": "Employee removed from pharmacy"}