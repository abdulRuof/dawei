from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import os
import uuid

from app.database.database import get_db
from app.core.permissions import require_pharmacy_owner, require_pharmacy_staff
from app.core.activity import log_activity
from app.core.notify import send_notification
from app.models.pharmacy import Pharmacy
from app.models.pharmacy_users import PharmacyUser
from app.models.medicine import Medicine
from app.models.category import Category
from app.models.inventory import PharmacyInventory
from app.models.medicine_alert import MedicineAlert


router = APIRouter(
    prefix="/api/pharmacies/{pharmacy_id}/inventory",
    tags=["Inventory Management"]
)


def _serialize(inv, medicine):
    return {
        "id": inv.id,
        "medicine_id": medicine.id,
        "name": medicine.name,
        "generic_name": medicine.generic_name,
"meta": medicine.generic_name or "دواء",
        "cat": medicine.category.name if medicine.category else "أخرى",
        "qty": inv.quantity,
        "min_stock": inv.min_stock,
        "price": float(inv.price),
"is_available": inv.is_available,
        "sold": 0,
        "image_url": medicine.image_url,
        "is_active": inv.is_active,
    }


def _get_inventory_row(pharmacy_id: int, item_id: int, db: Session):
    row = (
        db.query(PharmacyInventory)
        .filter(
            PharmacyInventory.id == item_id,
            PharmacyInventory.pharmacy_id == pharmacy_id,
        )
        .first()
    )
    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Inventory item not found",
        )
    return row


def _get_medicine_by_id_or_name(db: Session, data: dict):
    if data.get("medicine_id"):
        medicine = (
            db.query(Medicine)
            .filter(Medicine.id == data["medicine_id"])
            .first()
        )
        if medicine is None:
            raise HTTPException(
                status_code=404,
                detail="Medicine not found",
            )
        return medicine

    name = (data.get("name") or "").strip()
    if not name:
        raise HTTPException(
            status_code=400,
            detail="Medicine name is required",
        )

    medicine = (
        db.query(Medicine)
        .filter(Medicine.name.ilike(name))
        .first()
    )
    if medicine:
        return medicine

    cat_name = (data.get("category") or "ط£ط®ط±ظ‰").strip()
    category = (
        db.query(Category)
        .filter(Category.name == cat_name)
        .first()
    )
    if category is None:
        category = Category(name=cat_name)
        db.add(category)
        db.flush()

    medicine = Medicine(
        name=name,
        generic_name=(data.get("generic_name") or "").strip() or None,
        description=(data.get("description") or "").strip() or None,
        category_id=category.id,
    )
    db.add(medicine)
    db.flush()
    return medicine


def _notify_availability(db: Session, pharmacy: Pharmacy, medicine: Medicine, inv: PharmacyInventory):
    """يُرسل إشعار MEDICINE_AVAILABLE لأصحاب التنبيهات عند توفر الدواء ويوقف تنبيهاتهم."""
    if not inv.is_active:
        return
    if not bool(inv.is_available) or inv.quantity <= 0:
        return

    alerts = (
        db.query(MedicineAlert)
        .filter(
            MedicineAlert.medicine_id == medicine.id,
            MedicineAlert.is_active == True,  # noqa: E712
        )
        .all()
    )
    for alert in alerts:
        if alert.pharmacy_id and alert.pharmacy_id != inv.pharmacy_id:
            continue
        send_notification(
            db,
            alert.user_id,
            "MEDICINE_AVAILABLE",
            "الدواء أصبح متوفرًا",
            f"أصبح \"{medicine.name}\" متوفرًا في صيدلية \"{pharmacy.name}\"",
            link=f"/drugs/{medicine.id}",
            entity_type="medicine",
            entity_id=medicine.id,
        )
        alert.is_active = False


@router.get("")
def get_inventory(
    pharmacy_id: int,
    pharmacy_user: PharmacyUser = Depends(require_pharmacy_staff),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(PharmacyInventory, Medicine)
        .join(Medicine, Medicine.id == PharmacyInventory.medicine_id)
        .filter(PharmacyInventory.pharmacy_id == pharmacy_id)
        .order_by(Medicine.name)
        .all()
    )

    results = [
        _serialize(inv, medicine)
        for inv, medicine in rows
    ]

    return {
        "count": len(results),
        "results": results,
    }


@router.post("")
def add_medicine(
    pharmacy_id: int,
    data: dict,
    pharmacy_user: PharmacyUser = Depends(require_pharmacy_staff),
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
            detail="Pharmacy not found",
        )

    medicine = _get_medicine_by_id_or_name(db, data)

    # ظ…ظ†ط¹ ط§ظ„طھظƒط±ط§ط±: ظ†ظپط³ ط§ظ„ط¯ظˆط§ط، ظ„ظ†ظپط³ ط§ظ„طµظٹط¯ظ„ظٹط©
    existing = (
        db.query(PharmacyInventory)
        .filter(
            PharmacyInventory.pharmacy_id == pharmacy_id,
            PharmacyInventory.medicine_id == medicine.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="This medicine already exists in the pharmacy inventory",
        )

    try:
        inv = PharmacyInventory(
            pharmacy_id=pharmacy_id,
            medicine_id=medicine.id,
            price=data.get("price") or 0,
            quantity=data.get("qty") or 0,
            min_stock=int(data.get("min_stock") or 10),
            is_available=bool(data.get("is_available", True)),
        )
        db.add(inv)
        log_activity(
            db,
            pharmacy_id,
            pharmacy_user.user_id,
            "add_medicine",
            f"أضاف دواء \"{medicine.name}\" إلى المخزون",
            entity_type="medicine",
            entity_id=medicine.id,
            new_value=f"qty:{inv.quantity};price:{inv.price}",
        )
        db.commit()
        db.refresh(inv)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Could not add medicine to inventory",
        )

    # إشعار أصحاب تنبيهات التوفر إذا كان الدواء متوفرًا فور إضافته
    _notify_availability(db, pharmacy, medicine, inv)
    db.commit()
    db.refresh(inv)

    return _serialize(inv, medicine)


@router.put("/{item_id}")
def update_medicine(
    pharmacy_id: int,
    item_id: int,
    data: dict,
    pharmacy_user: PharmacyUser = Depends(require_pharmacy_staff),
    db: Session = Depends(get_db),
):
    inv = _get_inventory_row(pharmacy_id, item_id, db)

    pharmacy = (
        db.query(Pharmacy)
        .filter(Pharmacy.id == pharmacy_id)
        .first()
    )

    old_qty = inv.quantity
    old_price = float(inv.price)
    old_available = bool(inv.is_available)
    old_min_stock = inv.min_stock

    changes = []

    if "qty" in data:
        new_qty = max(0, int(data["qty"]))
        if new_qty != inv.quantity:
            changes.append(f"الكمية: {inv.quantity} → {new_qty}")
        inv.quantity = new_qty

    if "min_stock" in data:
        new_min = max(0, int(data["min_stock"]))
        if new_min != inv.min_stock:
            changes.append(f"حد التنبيه: {inv.min_stock} → {new_min}")
        inv.min_stock = new_min

    if "price" in data:
        new_price = max(0, float(data["price"]))
        if new_price != float(inv.price):
            changes.append(f"السعر: {inv.price} → {new_price}")
        inv.price = new_price

    if "is_available" in data:
        new_state = bool(data["is_available"])
        if new_state != inv.is_available:
            changes.append(
                "التوفر: متوفر" if new_state else "التوفر: غير متوفر"
            )
        inv.is_available = new_state

    if changes:
        log_activity(
            db,
            pharmacy_id,
            pharmacy_user.user_id,
            "update_medicine",
            f"عدّل بيانات \"{inv.medicine.name}\": {', '.join(changes)}",
            entity_type="medicine",
            entity_id=inv.medicine_id,
            old_value=f"qty:{old_qty};price:{old_price};available:{old_available}",
            new_value=(
                f"qty:{inv.quantity};price:{inv.price};"
                f"available:{bool(inv.is_available)}"
            ),
        )

    medicine = (
        db.query(Medicine)
        .filter(Medicine.id == inv.medicine_id)
        .first()
    )

    # إشعار انخفاض المخزون بحد التنبيه
    now_low = inv.quantity < inv.min_stock
    was_low = old_qty < old_min_stock
    if now_low and not was_low:
        owners = (
            db.query(PharmacyUser)
            .filter(
                PharmacyUser.pharmacy_id == pharmacy_id,
                PharmacyUser.role == "owner",
            )
            .all()
        )
        for owner in owners:
            send_notification(
                db,
                owner.user_id,
                "LOW_STOCK",
                "تنبيه انخفاض المخزون",
                f"انخفض مخزون \"{medicine.name}\" في صيدليتك إلى {inv.quantity} "
                f"(الحد: {inv.min_stock})",
                link=f"/dashboard/manager/{pharmacy_id}",
                entity_type="medicine",
                entity_id=medicine.id,
            )

    # إشعار توفر الدواء عند عودته للتوفر + إيقاف التنبيهات المفعلة
    now_available = bool(inv.is_available) and inv.quantity > 0
    was_available = old_available and old_qty > 0
    if inv.is_active and now_available and not was_available:
        _notify_availability(db, pharmacy, medicine, inv)

    db.commit()
    db.refresh(inv)

    return _serialize(inv, medicine)


@router.delete("/{item_id}")
def delete_medicine(
    pharmacy_id: int,
    item_id: int,
    pharmacy_user: PharmacyUser = Depends(require_pharmacy_owner),
    db: Session = Depends(get_db),
):
    inv = _get_inventory_row(pharmacy_id, item_id, db)

    log_activity(
        db,
        pharmacy_id,
        pharmacy_user.user_id,
        "delete_medicine",
        f"حذف دواء \"{inv.medicine.name}\" من المخزون نهائيًا"
    )

    db.delete(inv)
    db.commit()

    return {
        "message": "Inventory item deleted successfully"
    }


@router.patch("/{item_id}/visibility")
def set_inventory_visibility(
    pharmacy_id: int,
    item_id: int,
    data: dict,
    pharmacy_user: PharmacyUser = Depends(require_pharmacy_owner),
    db: Session = Depends(get_db),
):
    inv = _get_inventory_row(pharmacy_id, item_id, db)
    new_state = bool(data.get("is_active", not inv.is_active))

    inv.is_active = new_state
    log_activity(
        db,
        pharmacy_id,
        pharmacy_user.user_id,
        "toggle_visibility",
        f"أخفى دواء \"{inv.medicine.name}\" عن الموقع"
        if not new_state
        else f"أعاد عرض دواء \"{inv.medicine.name}\""
    )
    db.commit()
    db.refresh(inv)

    medicine = (
        db.query(Medicine)
        .filter(Medicine.id == inv.medicine_id)
        .first()
    )
    return _serialize(inv, medicine)


ALLOWED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "..", "uploads"
)


def _uploads_dir():
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    return UPLOAD_DIR


@router.post("/{item_id}/image")
def upload_medicine_image(
    pharmacy_id: int,
    item_id: int,
    file: UploadFile = File(...),
    pharmacy_user: PharmacyUser = Depends(require_pharmacy_staff),
    db: Session = Depends(get_db),
):
    inv = _get_inventory_row(pharmacy_id, item_id, db)

    medicine = (
        db.query(Medicine)
        .filter(Medicine.id == inv.medicine_id)
        .first()
    )
    if medicine is None:
        raise HTTPException(
            status_code=404,
            detail="Medicine not found",
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

    filename = f"med_{medicine.id}_{uuid.uuid4().hex[:10]}{ext}"
    upload_dir = _uploads_dir()
    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as fh:
        fh.write(contents)

    # حذف الصورة القديمة من القرص إن وُجدت
    if medicine.image_url:
        old_path = os.path.normpath(
            os.path.join(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                "..",
                medicine.image_url.lstrip("/"),
            )
        )
        if os.path.exists(old_path) and os.path.isfile(old_path):
            try:
                os.remove(old_path)
            except OSError:
                pass

    medicine.image_url = f"/uploads/{filename}"
    log_activity(
        db,
        pharmacy_id,
        pharmacy_user.user_id,
        "upload_image",
        f"رفع صورة لدواء \"{medicine.name}\""
    )
    db.commit()
    db.refresh(medicine)

    return _serialize(inv, medicine)


@router.delete("/{item_id}/image")
def remove_medicine_image(
    pharmacy_id: int,
    item_id: int,
    pharmacy_user: PharmacyUser = Depends(require_pharmacy_staff),
    db: Session = Depends(get_db),
):
    inv = _get_inventory_row(pharmacy_id, item_id, db)

    medicine = (
        db.query(Medicine)
        .filter(Medicine.id == inv.medicine_id)
        .first()
    )

    if medicine and medicine.image_url:
        log_activity(
            db,
            pharmacy_id,
            pharmacy_user.user_id,
            "remove_image",
            f"حذف صورة دواء \"{medicine.name}\""
        )
        old_path = os.path.normpath(
            os.path.join(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                "..",
                medicine.image_url.lstrip("/"),
            )
        )
        if os.path.exists(old_path) and os.path.isfile(old_path):
            try:
                os.remove(old_path)
            except OSError:
                pass
        medicine.image_url = None
        db.commit()
        db.refresh(medicine)

    return _serialize(inv, medicine)
