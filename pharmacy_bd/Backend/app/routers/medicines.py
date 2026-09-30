from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from time import perf_counter

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


def _active_inventory_rows(db: Session, medicine_ids: list[int]) -> dict[int, list[dict]]:
    """سطر واحد لكل عنصر مخزون نشط في منطقة نشطة — لا N+1."""
    if not medicine_ids:
        return {}

    rows = (
        db.query(PharmacyInventory, Pharmacy)
        .join(Pharmacy, Pharmacy.id == PharmacyInventory.pharmacy_id)
        .outerjoin(Region, Region.id == Pharmacy.region_id)
        .filter(
            PharmacyInventory.medicine_id.in_(medicine_ids),
            PharmacyInventory.is_active == True,
            or_(Region.id.is_(None), Region.is_active == True),
        )
        .all()
    )

    by_medicine: dict[int, list[dict]] = {}
    for inventory, pharmacy in rows:
        by_medicine.setdefault(inventory.medicine_id, []).append({
            "pharmacy_id": pharmacy.id,
            "pharmacy_name": pharmacy.name,
            "city": pharmacy.city,
            "address": pharmacy.address,
            "latitude": pharmacy.latitude,
            "longitude": pharmacy.longitude,
            "price": inventory.price,
            "quantity": inventory.quantity,
            "is_available": inventory.is_available,
        })
    return by_medicine


def _categories_map(db: Session, category_ids: set[int]) -> dict[int, Category]:
    if not category_ids:
        return {}
    cats = db.query(Category).filter(Category.id.in_(category_ids)).all()
    return {c.id: c for c in cats}


def _ratings_map(db: Session, medicine_ids: list[int]) -> dict[int, tuple[float, int]]:
    """تجميع واحد لكل التقييمات عبر GROUP BY — لا N+1."""
    if not medicine_ids:
        return {}
    rows = (
        db.query(
            Review.medicine_id,
            func.avg(Review.rating),
            func.count(Review.id),
        )
        .filter(Review.medicine_id.in_(medicine_ids))
        .group_by(Review.medicine_id)
        .all()
    )
    return {
        m_id: (round(float(avg), 1), cnt)
        for m_id, avg, cnt in rows
    }


# def _catalog_rows(db: Session, medicines: list[Medicine]) -> list[dict]:
#     """يبني نتائج الأدوية في 4 استعلامات ثابتة بغض النظر عن العدد."""
#     if not medicines:
#         return []

#     ids = [m.id for m in medicines]
#     inv_by_medicine = _active_inventory_rows(db, ids)
#     cats = _categories_map(db, {m.category_id for m in medicines if m.category_id is not None})
#     ratings = _ratings_map(db, ids)

#     results = []
#     for medicine in medicines:
#         avg, count = ratings.get(medicine.id, (0, 0))
#         category = cats.get(medicine.category_id) if medicine.category_id is not None else None
#         results.append({
#             "id": medicine.id,
#             "name": medicine.name,
#             "generic_name": medicine.generic_name,
#             "description": medicine.description,
#             "category_id": medicine.category_id,
#             "category_name": category.name if category else None,
#             "image_url": medicine.image_url,
#             "average_rating": avg,
#             "reviews_count": count,
#             "pharmacies": inv_by_medicine.get(medicine.id, []),
#         })
#     return results

def _catalog_rows(db: Session, medicines: list[Medicine]) -> list[dict]:
    if not medicines:
        return []

    ids = [m.id for m in medicines]

    t0 = perf_counter()
    inv_by_medicine = _active_inventory_rows(db, ids)
    t1 = perf_counter()

    cats = _categories_map(
        db,
        {m.category_id for m in medicines if m.category_id is not None}
    )
    t2 = perf_counter()

    ratings = _ratings_map(db, ids)
    t3 = perf_counter()

    results = []

    for medicine in medicines:
        avg, count = ratings.get(medicine.id, (0, 0))
        category = (
            cats.get(medicine.category_id)
            if medicine.category_id is not None
            else None
        )

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
            "pharmacies": inv_by_medicine.get(medicine.id, []),
        })

    t4 = perf_counter()

    print(
        f"[MEDICINES] "
        f"inventory={t1-t0:.3f}s | "
        f"categories={t2-t1:.3f}s | "
        f"ratings={t3-t2:.3f}s | "
        f"serialization={t4-t3:.3f}s | "
        f"total={t4-t0:.3f}s | "
        f"medicines={len(medicines)}"
    )

    return results

# @router.get("")
# def get_medicines(
#     db: Session = Depends(get_db)
# ):
#     medicines = (
#         db.query(Medicine)
#         .order_by(Medicine.name)
#         .all()
#     )
#     results = _catalog_rows(db, medicines)
#     return {
#         "count": len(results),
#         "results": results,
#     }

@router.get("")
def get_medicines(db: Session = Depends(get_db)):
    t0 = perf_counter()

    medicines = (
        db.query(Medicine)
        .order_by(Medicine.name)
        .all()
    )

    t1 = perf_counter()

    results = _catalog_rows(db, medicines)

    t2 = perf_counter()

    response = {
        "count": len(results),
        "results": results
    }

    t3 = perf_counter()

    print(
        f"[MEDICINES ENDPOINT] "
        f"medicine_query={t1-t0:.3f}s | "
        f"catalog={t2-t1:.3f}s | "
        f"response_build={t3-t2:.3f}s | "
        f"total={t3-t0:.3f}s"
    )

    return response


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
                Medicine.generic_name.ilike(f"%{q}%"),
            )
        )
        .order_by(Medicine.name)
        .all()
    )
    results = _catalog_rows(db, medicines)
    return {
        "query": q,
        "results": results,
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
            "message": "الدواء غير موجود",
        }

    results = _catalog_rows(db, [medicine])
    return results[0]