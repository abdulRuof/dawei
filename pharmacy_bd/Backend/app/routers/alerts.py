from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models.users import User
from app.models.medicine import Medicine
from app.models.pharmacy import Pharmacy
from app.models.medicine_alert import MedicineAlert


router = APIRouter(
    prefix="/api/alerts",
    tags=["Medicine Alerts"]
)


def _serialize(alert: MedicineAlert, medicine_name: str, pharmacy_name: str | None):
    return {
        "id": alert.id,
        "medicine_id": alert.medicine_id,
        "medicine_name": medicine_name,
        "pharmacy_id": alert.pharmacy_id,
        "pharmacy_name": pharmacy_name,
        "is_active": alert.is_active,
        "created_at": alert.created_at.isoformat(),
    }


@router.post("")
def create_alert(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    medicine_id = data.get("medicine_id")
    pharmacy_id = data.get("pharmacy_id")

    if not medicine_id:
        raise HTTPException(status_code=400, detail="حدد الدواء")

    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if medicine is None:
        raise HTTPException(status_code=404, detail="الدواء غير موجود")

    if pharmacy_id:
        pharmacy = db.query(Pharmacy).filter(Pharmacy.id == pharmacy_id).first()
        if pharmacy is None:
            raise HTTPException(status_code=404, detail="الصيدلية غير موجودة")

    # التنبيه الموجود: إعادة تفعيله بدل إنشاء نسخة مكررة
    existing = (
        db.query(MedicineAlert)
        .filter(
            MedicineAlert.user_id == current_user.id,
            MedicineAlert.medicine_id == medicine_id,
            MedicineAlert.pharmacy_id == pharmacy_id,
        )
        .first()
    )
    if existing:
        existing.is_active = True
        db.commit()
        db.refresh(existing)
        return {
            "message": "تم تفعيل تنبيه توفر الدواء",
            "alert": _serialize(existing, medicine.name, pharmacy.name if pharmacy_id else None),
        }

    alert = MedicineAlert(
        user_id=current_user.id,
        medicine_id=medicine_id,
        pharmacy_id=pharmacy_id,
        is_active=True,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return {
        "message": "تم تفعيل تنبيه توفر الدواء",
        "alert": _serialize(alert, medicine.name, pharmacy.name if pharmacy_id else None),
    }


@router.get("")
def list_my_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rows = (
        db.query(MedicineAlert, Medicine)
        .join(Medicine, Medicine.id == MedicineAlert.medicine_id)
        .filter(
            MedicineAlert.user_id == current_user.id,
            MedicineAlert.is_active == True,  # noqa: E712
        )
        .order_by(MedicineAlert.created_at.desc())
        .all()
    )
    results = []
    for alert, medicine in rows:
        pharmacy_name = None
        if alert.pharmacy_id:
            pharmacy = db.query(Pharmacy).filter(Pharmacy.id == alert.pharmacy_id).first()
            pharmacy_name = pharmacy.name if pharmacy else None
        results.append(_serialize(alert, medicine.name, pharmacy_name))
    return {"count": len(results), "results": results}


@router.delete("/{alert_id}")
def deactivate_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alert = (
        db.query(MedicineAlert)
        .filter(
            MedicineAlert.id == alert_id,
            MedicineAlert.user_id == current_user.id,
        )
        .first()
    )
    if alert is None:
        raise HTTPException(status_code=404, detail="التنبيه غير موجود")
    alert.is_active = False
    db.commit()
    return {"message": "تم إيقاف التنبيه"}