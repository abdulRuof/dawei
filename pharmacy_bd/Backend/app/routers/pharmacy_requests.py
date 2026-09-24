from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models.pharmacy import Pharmacy
from app.models.users import User
from app.models.pharmacy_request import PharmacyRequest
from app.models.pharmacy_users import PharmacyUser
from app.core.security import hash_password
from app.core.permissions import require_superadmin
from app.models.notification import Notification



router = APIRouter(
    prefix="/api/pharmacy-requests",
    tags=["Pharmacy Requests"]
)


def _derive_pharmacy_admin_email(db: Session, base_email: str) -> str:
    """بريد حساب مدير الصيدلية المنفصل عن حساب المستخدم:
    user@example.com -> user+pharmacy@example.com (مع ضمان التفرد)."""
    local, _, domain = (base_email or "").partition("@")
    if not domain:
        local = base_email
        domain = "pharmacy.local"
    candidate = f"{local}+pharmacy@{domain}"
    counter = 1
    while db.query(User).filter(User.email == candidate).first():
        candidate = f"{local}+pharmacy{counter}@{domain}"
        counter += 1
    return candidate


@router.post("/")
def create_pharmacy_request(
    data: dict,
    db: Session = Depends(get_db)
):
    # التحقق من البريد
    existing_email = (
        db.query(User)
        .filter(User.email == data["email"])
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # التحقق من رقم الهاتف
    existing_phone = (
        db.query(User)
        .filter(User.phone == data["phone"])
        .first()
    )

    if existing_phone:
        raise HTTPException(
            status_code=400,
            detail="Phone already registered"
        )

    # التحقق من الحقول المطلوبة
    for field in ["full_name", "email", "phone", "password", "pharmacy_name", "address", "pharmacy_phone", "city"]:
        if not (data.get(field) or "").strip():
            raise HTTPException(
                status_code=400,
                detail=f"Field '{field}' is required"
            )

    # إنشاء المستخدم
    user = User(
        full_name=data["full_name"],
        email=data["email"],
        phone=data["phone"],
        password_hash=hash_password(data["password"])
    )

    db.add(user)
    db.flush()

    # إنشاء طلب الصيدلية
    pharmacy_request = PharmacyRequest(
        user_id=user.id,
        pharmacy_name=data["pharmacy_name"],
        address=data["address"],
        phone=data["pharmacy_phone"],
        city=data["city"],
        source="standalone",
        region_id=data.get("region_id"),
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
        description=data.get("description"),
        status="pending"
    )

    db.add(pharmacy_request)

    # إشعار المشرفين بطلب تسجيل جديد
    admins = db.query(User).filter(User.is_superadmin == True).all()  # noqa: E712
    for admin in admins:
        notification = Notification(
            user_id=admin.id,
            type="PHARMACY_REGISTRATION_REQUEST",
            title="طلب تسجيل صيدلية جديد",
            body=(
                f"{user.full_name} طلب تسجيل صيدلية "
                f"\"{pharmacy_request.pharmacy_name}\""
            ),
            link="/dashboard/admin/1",
            entity_type="pharmacy_request",
            entity_id=pharmacy_request.id,
        )
        db.add(notification)

    db.commit()
    db.refresh(pharmacy_request)

    return {
        "message": "Pharmacy registration request submitted successfully",
        "request": {
            "id": pharmacy_request.id,
            "user_id": pharmacy_request.user_id,
            "pharmacy_name": pharmacy_request.pharmacy_name,
            "status": pharmacy_request.status
        }
    }

@router.post("/from-account")
def create_pharmacy_request_from_account(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # مستخدم مسجل يطلب تسجيل صيدلية لنفس الحساب (لا إنشاء حساب جديد)
    for field in ["pharmacy_name", "address", "pharmacy_phone", "city"]:
        if not (data.get(field) or "").strip():
            raise HTTPException(
                status_code=400,
                detail=f"Field '{field}' is required"
            )

    pharmacy_request = PharmacyRequest(
        user_id=current_user.id,
        pharmacy_name=data["pharmacy_name"],
        address=data["address"],
        phone=data["pharmacy_phone"],
        city=data["city"],
        source="account",
        region_id=data.get("region_id"),
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
        description=data.get("description"),
        status="pending"
    )
    db.add(pharmacy_request)

    # إشعار المشرفين بطلب تسجيل جديد
    admins = db.query(User).filter(User.is_superadmin == True).all()  # noqa: E712
    for admin in admins:
        notification = Notification(
            user_id=admin.id,
            type="PHARMACY_REGISTRATION_REQUEST",
            title="طلب تسجيل صيدلية جديد",
            body=(
                f"{current_user.full_name} طلب تسجيل صيدلية "
                f"\"{pharmacy_request.pharmacy_name}\""
            ),
            link="/dashboard/admin/1",
            entity_type="pharmacy_request",
            entity_id=pharmacy_request.id,
        )
        db.add(notification)

    db.commit()
    db.refresh(pharmacy_request)

    return {
        "message": "Pharmacy registration request submitted successfully",
        "request": {
            "id": pharmacy_request.id,
            "user_id": pharmacy_request.user_id,
            "pharmacy_name": pharmacy_request.pharmacy_name,
            "status": pharmacy_request.status
        }
    }


@router.get("/")
def get_pharmacy_requests(
    status: str | None = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_superadmin),
):
    query = db.query(PharmacyRequest)

    if status:
        query = query.filter(PharmacyRequest.status == status)

    requests = (
        query
        .order_by(PharmacyRequest.created_at.desc())
        .all()
    )

    results = []

    for request in requests:

        user = (
            db.query(User)
            .filter(User.id == request.user_id)
            .first()
        )

        results.append({
            "id": request.id,
            "user_id": request.user_id,

            "full_name": user.full_name if user else None,
            "email": user.email if user else None,
            "phone": user.phone if user else None,

            "pharmacy_name": request.pharmacy_name,
            "address": request.address,
            "pharmacy_phone": request.phone,
            "city": request.city,

            "latitude": request.latitude,
            "longitude": request.longitude,
            "description": request.description,

            "status": request.status,
            "created_at": request.created_at
        })

    return {
        "count": len(results),
        "results": results
    }

@router.post("/{request_id}/approve")
def approve_pharmacy_request(
    request_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_superadmin),
):
    # البحث عن الطلب
    pharmacy_request = (
        db.query(PharmacyRequest)
        .filter(PharmacyRequest.id == request_id)
        .first()
    )

    if pharmacy_request is None:
        raise HTTPException(
            status_code=404,
            detail="Pharmacy request not found"
        )

    # منع الموافقة على طلب تمت معالجته سابقًا
    if pharmacy_request.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Request is already {pharmacy_request.status}"
        )

    # التأكد من وجود المستخدم
    user = (
        db.query(User)
        .filter(User.id == pharmacy_request.user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User associated with this request not found"
        )

    # إنشاء الصيدلية
    try:
        pharmacy = Pharmacy(
            name=pharmacy_request.pharmacy_name,
            address=pharmacy_request.address,
            phone=pharmacy_request.phone,
            city=pharmacy_request.city,
            region_id=pharmacy_request.region_id,
            latitude=pharmacy_request.latitude,
            longitude=pharmacy_request.longitude,
            description=pharmacy_request.description,
            is_open=True
        )

        db.add(pharmacy)
        db.flush()

        # المالك: للموافقة على طلب "من حساب" ننشئ حساب مدير منفصل،
        # وإلا يكون مقدم الطلب نفسه هو المالك
        owner_user = user

        if pharmacy_request.source == "account":
            owner_user = User(
                full_name=user.full_name,
            email=_derive_pharmacy_admin_email(db, user.email),
            phone=None,
            password_hash=user.password_hash,
            must_change_password=True,
            is_active=True,
            )
            db.add(owner_user)
            db.flush()

        # ربط المالك بالصيدلية
        pharmacy_user = PharmacyUser(
            user_id=owner_user.id,
            pharmacy_id=pharmacy.id,
            role="owner"
        )

        db.add(pharmacy_user)

        # تحديث حالة الطلب
        pharmacy_request.status = "approved"
        pharmacy_request.reviewed_at = datetime.utcnow()

        # إشعار المالك بأن الصيدلية أصبحت نشطة
        notification = Notification(
            user_id=owner_user.id,
            type="PHARMACY_APPROVED",
            title="تم قبول تسجيل صيدليتك",
            body=f"أهلاً {owner_user.full_name}، تم قبول تسجيل صيدلية {pharmacy.name} ويمكنك الآن إدارة الأدوية والموظفين.",
            link=f"/dashboard/manager/{pharmacy.id}",
            entity_type="pharmacy",
            entity_id=pharmacy.id,
        )
        db.add(notification)

        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="فشل إنشاء الصيدلية — تم التراجع عن العملية بالكامل"
        )


    db.refresh(pharmacy)
    db.refresh(pharmacy_request)

    return {
        "message": "Pharmacy registration request approved successfully",
        "request": {
            "id": pharmacy_request.id,
            "status": pharmacy_request.status,
            "reviewed_at": pharmacy_request.reviewed_at
        },
        "pharmacy": {
            "id": pharmacy.id,
            "name": pharmacy.name,
            "city": pharmacy.city
        },
        "owner": {
            "user_id": owner_user.id,
            "full_name": owner_user.full_name,
            "email": owner_user.email,
            "role": pharmacy_user.role,
            "created_separate_account": owner_user.id != user.id
        }
    }

@router.post("/{request_id}/reject")
def reject_pharmacy_request(
    request_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_superadmin),
):
    pharmacy_request = (
        db.query(PharmacyRequest)
        .filter(PharmacyRequest.id == request_id)
        .first()
    )

    if pharmacy_request is None:
        raise HTTPException(
            status_code=404,
            detail="Pharmacy request not found"
        )

    if pharmacy_request.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Request is already {pharmacy_request.status}"
        )

    pharmacy_request.status = "rejected"
    pharmacy_request.reviewed_at = datetime.utcnow()

    # إشعار صاحب الطلب بالرفض
    user = (
        db.query(User)
        .filter(User.id == pharmacy_request.user_id)
        .first()
    )
    if user:
        notification = Notification(
            user_id=user.id,
            type="PHARMACY_REJECTED",
            title="تم رفض تسجيل صيدليتك",
            body=(
                f"عذراً {user.full_name}، لم يتم اعتماد طلب صيدلية "
                f"{pharmacy_request.pharmacy_name}. يمكنك التواصل مع الإدارة."
            ),
            entity_type="pharmacy_request",
            entity_id=pharmacy_request.id,
        )
        db.add(notification)

    db.commit()
    db.refresh(pharmacy_request)

    return {
        "message": "Pharmacy registration request rejected",
        "request": {
            "id": pharmacy_request.id,
            "status": pharmacy_request.status,
            "reviewed_at": pharmacy_request.reviewed_at
        }
    }