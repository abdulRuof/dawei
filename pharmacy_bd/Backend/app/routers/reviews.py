from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models.users import User
from app.models.review import Review
from app.models.pharmacy import Pharmacy
from app.models.medicine import Medicine


router = APIRouter(
    prefix="/api",
    tags=["Reviews"]
)


def _serialize_review(review: Review, user: User | None = None):
    return {
        "id": review.id,
        "user_name": user.full_name if user else "مستخدم",
        "rating": review.rating,
        "comment": review.comment,
        "created_at": review.created_at.isoformat(),
    }


@router.post("/reviews")
def create_review(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pharmacy_id = data.get("pharmacy_id")
    medicine_id = data.get("medicine_id")
    rating = data.get("rating")
    comment = (data.get("comment") or "").strip() or None

    if not pharmacy_id and not medicine_id:
        raise HTTPException(status_code=400, detail="حدد الصيدلية أو الدواء الذي تقيّمه")
    if pharmacy_id and medicine_id:
        raise HTTPException(status_code=400, detail="قيّم صيدلية أو دواء واحد فقط")
    if not isinstance(rating, int) or rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="التقييم يجب أن يكون بين 1 و5")

    if pharmacy_id:
        target = db.query(Pharmacy).filter(Pharmacy.id == pharmacy_id).first()
        if target is None:
            raise HTTPException(status_code=404, detail="الصيدلية غير موجودة")
    if medicine_id:
        target = db.query(Medicine).filter(Medicine.id == medicine_id).first()
        if target is None:
            raise HTTPException(status_code=404, detail="الدواء غير موجود")

    # مستخدم واحد = تقييم واحد على نفس الهدف (استبدال التقييم القديم)
    existing = (
        db.query(Review)
        .filter(
            Review.user_id == current_user.id,
            Review.pharmacy_id == pharmacy_id,
            Review.medicine_id == medicine_id,
        )
        .first()
    )

    if existing:
        existing.rating = rating
        existing.comment = comment
        db.commit()
        db.refresh(existing)
        user = db.query(User).filter(User.id == existing.user_id).first()
        return {"message": "تم تحديث تقييمك", "review": _serialize_review(existing, user)}

    review = Review(
        user_id=current_user.id,
        pharmacy_id=pharmacy_id,
        medicine_id=medicine_id,
        rating=rating,
        comment=comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return {"message": "تم إضافة تقييمك بنجاح", "review": _serialize_review(review, current_user)}


def _get_reviews(db: Session, key="pharmacy", value=None):
    q = db.query(Review, User).join(User, User.id == Review.user_id)
    if key == "pharmacy":
        q = q.filter(Review.pharmacy_id == value)
    else:
        q = q.filter(Review.medicine_id == value)
    rows = q.order_by(Review.created_at.desc()).limit(100).all()
    results = [_serialize_review(r, u) for r, u in rows]
    avg = round(sum(r[0].rating for r in rows) / len(rows), 1) if rows else None
    return results, avg


@router.get("/pharmacies/{pharmacy_id}/reviews")
def list_pharmacy_reviews(
    pharmacy_id: int,
    db: Session = Depends(get_db)
):
    if db.query(Pharmacy).filter(Pharmacy.id == pharmacy_id).first() is None:
        raise HTTPException(status_code=404, detail="الصيدلية غير موجودة")
    results, avg = _get_reviews(db, "pharmacy", pharmacy_id)
    return {"count": len(results), "average_rating": avg, "results": results}


@router.get("/medicines/{medicine_id}/reviews")
def list_medicine_reviews(
    medicine_id: int,
    db: Session = Depends(get_db)
):
    if db.query(Medicine).filter(Medicine.id == medicine_id).first() is None:
        raise HTTPException(status_code=404, detail="الدواء غير موجود")
    results, avg = _get_reviews(db, "medicine", medicine_id)
    return {"count": len(results), "average_rating": avg, "results": results}