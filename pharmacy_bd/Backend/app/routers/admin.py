from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.permissions import require_superadmin
from app.models.pharmacy import Pharmacy
from app.models.users import User
from app.models.medicine import Medicine
from app.models.category import Category
from app.models.inventory import PharmacyInventory
from app.models.pharmacy_request import PharmacyRequest
from app.models.pharmacy_users import PharmacyUser
from app.models.region import Region


router = APIRouter(
    prefix="/api/admin",
    tags=["Super Admin"],
)


def _get_owner_name(db: Session, pharmacy_id: int) -> str | None:
    owner = (
        db.query(User)
        .join(PharmacyUser, PharmacyUser.user_id == User.id)
        .filter(
            PharmacyUser.pharmacy_id == pharmacy_id,
            PharmacyUser.role == "owner",
        )
        .first()
    )
    return owner.full_name if owner else None


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_superadmin),
):
    return {
        "medicines": db.query(Medicine).count(),
        "pharmacies": db.query(Pharmacy).count(),
        "pending_requests": (
            db.query(PharmacyRequest)
            .filter(PharmacyRequest.status == "pending")
            .count()
        ),
        "users": db.query(User).count(),
        "categories": db.query(Category).count(),
    }


@router.get("/pharmacies")
def get_pharmacies(
    db: Session = Depends(get_db),
    admin: User = Depends(require_superadmin),
):
    pharmacies = (
        db.query(Pharmacy)
        .order_by(Pharmacy.created_at.desc())
        .all()
    )

    results = []
    for pharmacy in pharmacies:
        medicines_count = (
            db.query(PharmacyInventory)
            .filter(PharmacyInventory.pharmacy_id == pharmacy.id)
            .count()
        )
        results.append({
            "id": pharmacy.id,
            "name": pharmacy.name,
            "city": pharmacy.city,
            "address": pharmacy.address,
            "phone": pharmacy.phone,
            "is_open": pharmacy.is_open,
            "created_at": pharmacy.created_at,
            "medicines_count": medicines_count,
            "owner_name": _get_owner_name(db, pharmacy.id),
        })

    return {
        "count": len(results),
        "results": results,
    }


@router.patch("/pharmacies/{pharmacy_id}")
def update_pharmacy(
    pharmacy_id: int,
    data: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(require_superadmin),
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

    if "is_open" in data:
        pharmacy.is_open = bool(data["is_open"])

    db.commit()
    db.refresh(pharmacy)

    return {
        "id": pharmacy.id,
        "name": pharmacy.name,
        "is_open": pharmacy.is_open,
    }


@router.delete("/pharmacies/{pharmacy_id}")
def delete_pharmacy(
    pharmacy_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_superadmin),
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

    db.delete(pharmacy)
    db.commit()

    return {
        "message": "Pharmacy deleted successfully"
    }


@router.get("/accounts")
def get_accounts(
    db: Session = Depends(get_db),
    admin: User = Depends(require_superadmin),
):
    users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .all()
    )

    results = []
    for user in users:
        pharmacy_user = (
            db.query(PharmacyUser)
            .filter(PharmacyUser.user_id == user.id, PharmacyUser.role == "owner")
            .first()
        )

        pharmacy_name = None
        if pharmacy_user:
            pharmacy = (
                db.query(Pharmacy)
                .filter(Pharmacy.id == pharmacy_user.pharmacy_id)
                .first()
            )
            pharmacy_name = pharmacy.name if pharmacy else None

        results.append({
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "type": "صيدلية" if pharmacy_name else "مستخدم",
            "pharmacy_name": pharmacy_name,
            "is_active": user.is_active,
            "is_superadmin": user.is_superadmin,
            "created_at": user.created_at,
        })

    return {
        "count": len(results),
        "results": results,
    }


@router.patch("/accounts/{user_id}")
def update_account(
    user_id: int,
    data: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(require_superadmin),
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )
    if user is None:
        raise HTTPException(
            status_code=404,
            detail="Account not found",
        )

    if user.is_superadmin:
        raise HTTPException(
            status_code=400,
            detail="Cannot modify the platform owner account",
        )

    if "is_active" in data:
        user.is_active = bool(data["is_active"])

    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "is_active": user.is_active,
    }


@router.delete("/accounts/{user_id}")
def delete_account(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_superadmin),
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )
    if user is None:
        raise HTTPException(
            status_code=404,
            detail="Account not found",
        )

    if user.is_superadmin:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete the platform owner account",
        )

    db.delete(user)
    db.commit()

    return {
        "message": "Account deleted successfully"
    }


@router.get("/categories")
def get_categories(
    db: Session = Depends(get_db),
    admin: User = Depends(require_superadmin),
):
    categories = (
        db.query(Category)
        .order_by(Category.name)
        .all()
    )

    results = []
    for category in categories:
        results.append({
            "id": category.id,
            "name": category.name,
            "desc": "",
            "count": len(category.medicines),
        })

    return {
        "count": len(results),
        "results": results,
    }


@router.post("/categories")
def create_category(
    data: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(require_superadmin),
):
    name = (data.get("name") or "").strip()
    if not name:
        raise HTTPException(
            status_code=400,
            detail="Category name is required",
        )

    try:
        category = Category(name=name)
        db.add(category)
        db.commit()
        db.refresh(category)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Category already exists",
        )

    return {
        "id": category.id,
        "name": category.name,
        "desc": "",
        "count": 0,
    }


@router.put("/categories/{category_id}")
def update_category(
    category_id: int,
    data: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(require_superadmin),
):
    category = (
        db.query(Category)
        .filter(Category.id == category_id)
        .first()
    )
    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found",
        )

    name = (data.get("name") or "").strip()
    if not name:
        raise HTTPException(
            status_code=400,
            detail="Category name is required",
        )

    try:
        category.name = name
        db.commit()
        db.refresh(category)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Category already exists",
        )

    return {
        "id": category.id,
        "name": category.name,
        "desc": "",
        "count": len(category.medicines),
    }


@router.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_superadmin),
):
    category = (
        db.query(Category)
        .filter(Category.id == category_id)
        .first()
    )
    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found",
        )

    try:
        db.delete(category)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a category that has medicines",
        )

    return {
        "message": "Category deleted successfully"
    }


# =========================
# المناطق (المدن)
# =========================

def _serialize_region(db: Session, region: Region) -> dict:
    return {
        "id": region.id,
        "name": region.name,
        "is_active": region.is_active,
        "created_at": region.created_at,
        "pharmacies_count": (
            db.query(Pharmacy)
            .filter(Pharmacy.region_id == region.id)
            .count()
        ),
    }


@router.get("/regions")
def get_regions(
    db: Session = Depends(get_db),
    admin: User = Depends(require_superadmin),
):
    regions = (
        db.query(Region)
        .order_by(Region.name)
        .all()
    )

    return {
        "count": len(regions),
        "results": [_serialize_region(db, r) for r in regions],
    }


@router.post("/regions")
def create_region(
    data: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(require_superadmin),
):
    name = (data.get("name") or "").strip()
    if not name:
        raise HTTPException(
            status_code=400,
            detail="Region name is required",
        )

    try:
        region = Region(name=name)
        db.add(region)
        db.commit()
        db.refresh(region)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Region already exists",
        )

    return _serialize_region(db, region)


@router.patch("/regions/{region_id}")
def update_region(
    region_id: int,
    data: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(require_superadmin),
):
    region = (
        db.query(Region)
        .filter(Region.id == region_id)
        .first()
    )
    if region is None:
        raise HTTPException(
            status_code=404,
            detail="Region not found",
        )

    if "name" in data and (data.get("name") or "").strip():
        try:
            region.name = data["name"].strip()
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail="Region already exists",
            )

    if "is_active" in data:
        region.is_active = bool(data["is_active"])
        db.commit()

    db.refresh(region)
    return _serialize_region(db, region)


@router.delete("/regions/{region_id}")
def delete_region(
    region_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_superadmin),
):
    region = (
        db.query(Region)
        .filter(Region.id == region_id)
        .first()
    )
    if region is None:
        raise HTTPException(
            status_code=404,
            detail="Region not found",
        )

    if (
        db.query(Pharmacy)
        .filter(Pharmacy.region_id == region.id)
        .first()
    ):
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a region that has pharmacies; disable it instead",
        )

    db.delete(region)
    db.commit()

    return {
        "message": "Region deleted successfully"
    }