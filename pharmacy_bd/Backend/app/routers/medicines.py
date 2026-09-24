from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.medicine import Medicine
from app.models.inventory import PharmacyInventory
from app.models.pharmacy import Pharmacy
from app.models.category import Category
from app.models.review import Review
from app.models.region import Region


router = APIRouter(
    prefix="/api/medicines",
    tags=["Medicines"]
)

def _active_inventory(db: Session, medicine_id: int):
    return (
        db.query(PharmacyInventory, Pharmacy)
        .join(
            Pharmacy,
            Pharmacy.id == PharmacyInventory.pharmacy_id
        )
        .outerjoin(
            Region,
            Region.id == Pharmacy.region_id
        )
        .filter(
            PharmacyInventory.medicine_id == medicine_id,
            PharmacyInventory.is_active == True,
            or_(
                Region.id.is_(None),
                Region.is_active == True
            )
        )
        .all()
    )

def _rating_summary(db: Session, medicine_id: int):
    rows = db.query(Review.rating).filter(Review.medicine_id == medicine_id).all()
    ratings = [r[0] for r in rows]
    if not ratings:
        return 0, 0
    return round(sum(ratings) / len(ratings), 1), len(ratings)

@router.get("")
def get_medicines(
    db: Session = Depends(get_db)
):
    medicines = (
        db.query(Medicine)
        .order_by(Medicine.name)
        .all()
    )

    results = []

    for medicine in medicines:

        inventory_items = _active_inventory(db, medicine.id)

        pharmacies = []

        for inventory, pharmacy in inventory_items:
            pharmacies.append({
                "pharmacy_id": pharmacy.id,
                "pharmacy_name": pharmacy.name,
                "city": pharmacy.city,
                "address": pharmacy.address,
                "latitude": pharmacy.latitude,
                "longitude": pharmacy.longitude,
                "price": inventory.price,
                "quantity": inventory.quantity,
                "is_available": inventory.is_available
            })

        category = None
        if medicine.category_id is not None:
            category = db.query(Category).filter(Category.id == medicine.category_id).first()

        avg, count = _rating_summary(db, medicine.id)

        results.append({
            "id": medicine.id,
            "name": medicine.name,
            "generic_name": medicine.generic_name,
            "description": medicine.description,
            "category_id": medicine.category_id,
            "category_name": category.name if category else None,
            "image_url": medicine.image_url,
            "average_rating": avg,
            "reviews_count": count,
            "pharmacies": pharmacies
        })

    return {
        "count": len(results),
        "results": results
    }

@router.get("/search")
def search_medicines(
    q: str = Query(..., min_length=2),
    db: Session = Depends(get_db)
):
    medicines = (
        db.query(Medicine)
        .filter(
            or_(
                Medicine.name.ilike(f"%{q}%"),
                Medicine.generic_name.ilike(f"%{q}%")
            )
        )
        .all()
    )

    results = []

    for medicine in medicines:

        inventory_items = _active_inventory(db, medicine.id)

        pharmacies = []

        for inventory, pharmacy in inventory_items:
            pharmacies.append({
                "pharmacy_id": pharmacy.id,
                "pharmacy_name": pharmacy.name,
                "city": pharmacy.city,
                "address": pharmacy.address,
                "latitude": pharmacy.latitude,
                "longitude": pharmacy.longitude,
                "price": inventory.price,
                "quantity": inventory.quantity,
                "is_available": inventory.is_available
            })

        category = None
        if medicine.category_id is not None:
            category = db.query(Category).filter(Category.id == medicine.category_id).first()

        avg, count = _rating_summary(db, medicine.id)

        results.append({
            "id": medicine.id,
            "name": medicine.name,
            "generic_name": medicine.generic_name,
            "category_name": category.name if category else None,
            "image_url": medicine.image_url,
            "average_rating": avg,
            "reviews_count": count,
            "pharmacies": pharmacies
        })

    return {
        "query": q,
        "results": results
    }


@router.get("/{medicine_id}")
def get_medicine(
    medicine_id: int,
    db: Session = Depends(get_db)
):
    medicine = (
        db.query(Medicine)
        .filter(Medicine.id == medicine_id)
        .first()
    )

    if not medicine:
        return {
            "message": "الدواء غير موجود"
        }

    inventory_items = (
        db.query(PharmacyInventory, Pharmacy)
        .join(
            Pharmacy,
            Pharmacy.id == PharmacyInventory.pharmacy_id
        )
        .outerjoin(
            Region,
            Region.id == Pharmacy.region_id
        )
        .filter(
            PharmacyInventory.medicine_id == medicine.id,
            PharmacyInventory.is_active == True,
            or_(
                Region.id.is_(None),
                Region.is_active == True
            )
        )
        .all()
    )

    pharmacies = []

    for inventory, pharmacy in inventory_items:
        pharmacies.append({
            "pharmacy_id": pharmacy.id,
            "pharmacy_name": pharmacy.name,
            "city": pharmacy.city,
            "address": pharmacy.address,
            "latitude": pharmacy.latitude,
            "longitude": pharmacy.longitude,
            "price": inventory.price,
            "quantity": inventory.quantity,
            "is_available": inventory.is_available
        })

    category = None
    if medicine.category_id is not None:
        category = db.query(Category).filter(Category.id == medicine.category_id).first()

    avg, count = _rating_summary(db, medicine.id)

    return {
        "id": medicine.id,
        "name": medicine.name,
        "generic_name": medicine.generic_name,
        "description": medicine.description,
        "category_id": medicine.category_id,
        "category_name": category.name if category else None,
        "image_url": medicine.image_url,
        "average_rating": avg,
        "reviews_count": count,
        "pharmacies": pharmacies
    }