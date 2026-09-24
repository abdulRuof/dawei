from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import os
import re
import uuid

from app.database.database import get_db
from app.core.permissions import require_pharmacy_owner
from app.core.activity import log_activity
from app.models.pharmacy import Pharmacy
from app.models.inventory import PharmacyInventory
from app.models.medicine import Medicine
from app.models.pharmacy_users import PharmacyUser
from app.models.review import Review
from app.models.region import Region
from app.models.users import User


TIME_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


ALLOWED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "..", "uploads"
)


def _uploads_dir():
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    return UPLOAD_DIR


def _remove_uploaded_file(path: str):
    try:
        if path and os.path.exists(path) and os.path.isfile(path):
            os.remove(path)
    except OSError:
        pass


def _serialize_pharmacy(pharmacy: Pharmacy, extra: dict | None = None):
    data = {
        "id": pharmacy.id,
        "name": pharmacy.name,
        "address": pharmacy.address,
        "phone": pharmacy.phone,
        "city": pharmacy.city,
        "latitude": pharmacy.latitude,
        "longitude": pharmacy.longitude,
        "is_open": pharmacy.is_open,
        "description": pharmacy.description,
        "image_url": pharmacy.image_url,
        "work_open": pharmacy.work_open,
        "work_close": pharmacy.work_close,
        "work_timer": pharmacy.work_timer,
    }
    if extra:
        data.update(extra)
    return data



router = APIRouter(
    prefix="/api/pharmacies",
    tags=["Pharmacies"]
)


# @router.get("/{pharmacy_id}/owner-test")
# def owner_test(
#     pharmacy_id: int,
#     pharmacy_user: PharmacyUser = Depends(require_pharmacy_owner)
# ):
#     return {
#         "message": "Owner access granted",
#         "user_id": pharmacy_user.user_id,
#         "pharmacy_id": pharmacy_user.pharmacy_id,
#         "role": pharmacy_user.role
#     }


@router.get("/")
def get_pharmacies(
    db: Session = Depends(get_db)
):
    pharmacies = (
        db.query(Pharmacy)
        .outerjoin(Region, Region.id == Pharmacy.region_id)
        .filter(
            or_(
                Region.id.is_(None),
                Region.is_active == True,  # noqa: E712
            )
        )
        .order_by(Pharmacy.name)
        .all()
    )

    results = []

    for pharmacy in pharmacies:
        avg = (
            db.query(Review.rating)
            .filter(Review.pharmacy_id == pharmacy.id)
            .all()
        )
        ratings = [r[0] for r in avg]
        results.append({
            ** _serialize_pharmacy(pharmacy),
            "average_rating": round(sum(ratings) / len(ratings), 1) if ratings else 0,
            "reviews_count": len(ratings),
        })

    return {
         "count": len(results),
        "results": results
    }

@router.get("/{pharmacy_id}")
def get_pharmacy(
    pharmacy_id: int,
    db: Session = Depends(get_db)
):
    pharmacy = (
        db.query(Pharmacy)
        .filter(Pharmacy.id == pharmacy_id)
        .first()
    )

    if pharmacy is None:
        raise HTTPException(
            status_code=404,
            detail="Pharmacy not found"
        )

    inventory_items = (
        db.query(PharmacyInventory, Medicine)
        .join(
            Medicine,
            Medicine.id == PharmacyInventory.medicine_id
        )
        .filter(
            PharmacyInventory.pharmacy_id == pharmacy.id,
            PharmacyInventory.is_active == True,
        )
        .all()
    )

    medicines = []

    for inventory, medicine in inventory_items:
        medicines.append({
            "id": medicine.id,
            "name": medicine.name,
            "generic_name": medicine.generic_name,
            "price": inventory.price,
            "quantity": inventory.quantity,
            "is_available": inventory.is_available,
            "image_url": medicine.image_url
        })

    reviews = (
        db.query(Review)
        .filter(Review.pharmacy_id == pharmacy.id)
        .all()
    )

    return {
        **_serialize_pharmacy(pharmacy),
        "medicines_count": len(medicines),
        "medicines": medicines,
        "average_rating": round(sum(r.rating for r in reviews) / len(reviews), 1) if reviews else 0,
        "reviews_count": len(reviews),
    }

    # return {
            # "count": len(results),
            # "results": results
        # }


@router.patch("/{pharmacy_id}/status")
def toggle_pharmacy_status(
    pharmacy_id: int,
    pharmacy_user: PharmacyUser = Depends(require_pharmacy_owner),
    db: Session = Depends(get_db)
):
    pharmacy = (
        db.query(Pharmacy)
        .filter(Pharmacy.id == pharmacy_id)
        .first()
    )

    if pharmacy is None:
        raise HTTPException(
            status_code=404,
            detail="Pharmacy not found"
        )

    pharmacy.is_open = not pharmacy.is_open
    pharmacy.work_timer = False
    log_activity(
        db,
        pharmacy.id,
        pharmacy_user.user_id,
        "pharmacy_status",
        f"تم {'فتح' if pharmacy.is_open else 'إغلاق'} الصيدلية {pharmacy.name}",
    )
    db.commit()
    db.refresh(pharmacy)

    return {
        "message": "تم تحديث حالة الصيدلية بنجاح",
        "is_open": pharmacy.is_open,
        "work_timer": False
    }


@router.post("/{pharmacy_id}/image")
def upload_pharmacy_image(
    pharmacy_id: int,
    file: UploadFile = File(...),
    pharmacy_user: PharmacyUser = Depends(require_pharmacy_owner),
    db: Session = Depends(get_db),
):
    pharmacy = (
        db.query(Pharmacy)
        .filter(Pharmacy.id == pharmacy_id)
        .first()
    )
    if pharmacy is None:
        raise HTTPException(
            status_code=404,
            detail="Pharmacy not found"
        )

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_IMAGE_EXTS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Allowed: jpg, jpeg, png, webp, gif",
        )

    contents = file.file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image is too large. Maximum allowed size is 5MB",
        )

    filename = f"pharmacy_{pharmacy.id}_{uuid.uuid4().hex[:10]}{ext}"
    file_path = os.path.join(_uploads_dir(), filename)

    with open(file_path, "wb") as fh:
        fh.write(contents)

    if pharmacy.image_url:
        _remove_uploaded_file(
            os.path.normpath(
                os.path.join(
                    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                    "..",
                    pharmacy.image_url.lstrip("/"),
                )
            )
        )

    pharmacy.image_url = f"/uploads/{filename}"
    log_activity(
        db,
        pharmacy.id,
        pharmacy_user.user_id,
        "upload_pharmacy_image",
        f"رفع صورة لصيدلية \"{pharmacy.name}\"",
        entity_type="pharmacy",
        entity_id=pharmacy.id,
    )
    db.commit()
    db.refresh(pharmacy)

    return _serialize_pharmacy(pharmacy)


@router.delete("/{pharmacy_id}/image")
def remove_pharmacy_image(
    pharmacy_id: int,
    pharmacy_user: PharmacyUser = Depends(require_pharmacy_owner),
    db: Session = Depends(get_db),
):
    pharmacy = (
        db.query(Pharmacy)
        .filter(Pharmacy.id == pharmacy_id)
        .first()
    )
    if pharmacy is None:
        raise HTTPException(
            status_code=404,
            detail="Pharmacy not found"
        )

    if pharmacy.image_url:
        _remove_uploaded_file(
            os.path.normpath(
                os.path.join(
                    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                    "..",
                    pharmacy.image_url.lstrip("/"),
                )
            )
        )
        pharmacy.image_url = None
        log_activity(
            db,
            pharmacy.id,
            pharmacy_user.user_id,
            "remove_pharmacy_image",
            f"حذف صورة صيدلية \"{pharmacy.name}\"",
            entity_type="pharmacy",
            entity_id=pharmacy.id,
        )
        db.commit()
        db.refresh(pharmacy)

    return _serialize_pharmacy(pharmacy)


@router.patch("/{pharmacy_id}/working-hours")
def update_working_hours(
    pharmacy_id: int,
    data: dict,
    pharmacy_user: PharmacyUser = Depends(require_pharmacy_owner),
    db: Session = Depends(get_db),
):
    pharmacy = (
        db.query(Pharmacy)
        .filter(Pharmacy.id == pharmacy_id)
        .first()
    )
    if pharmacy is None:
        raise HTTPException(
            status_code=404,
            detail="Pharmacy not found"
        )

    changes = []

    if "work_open" in data:
        work_open = (data.get("work_open") or "").strip()
        if work_open and not TIME_RE.match(work_open):
            raise HTTPException(
                status_code=400,
                detail="work_open must be HH:MM",
            )
        if pharmacy.work_open != (work_open or None):
            changes.append("موعد الفتح")
        pharmacy.work_open = work_open or None

    if "work_close" in data:
        work_close = (data.get("work_close") or "").strip()
        if work_close and not TIME_RE.match(work_close):
            raise HTTPException(
                status_code=400,
                detail="work_close must be HH:MM",
            )
        if pharmacy.work_close != (work_close or None):
            changes.append("موعد الإغلاق")
        pharmacy.work_close = work_close or None

    if "work_timer" in data:
        new_timer = bool(data["work_timer"])
        if pharmacy.work_timer != new_timer:
            changes.append("الموقت التلقائي")
        pharmacy.work_timer = new_timer

    # عند تشغيل الموقت نطبّق الحالة فورًا حسب الوقت الحالي
    if pharmacy.work_timer and pharmacy.work_open and pharmacy.work_close:
        from app.core.work_hours import is_within_working_hours
        pharmacy.is_open = is_within_working_hours(
            pharmacy.work_open, pharmacy.work_close
        )

    if changes:
        log_activity(
            db,
            pharmacy.id,
            pharmacy_user.user_id,
            "working_hours",
            f"حدّث ساعات العمل: {', '.join(changes)}",
            entity_type="pharmacy",
            entity_id=pharmacy.id,
        )

    db.commit()
    db.refresh(pharmacy)

    return _serialize_pharmacy(pharmacy)