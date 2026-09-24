from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.region import Region


router = APIRouter(
    prefix="/api/regions",
    tags=["Regions"]
)


@router.get("/")
def get_active_regions(
    db: Session = Depends(get_db)
):
    regions = (
        db.query(Region)
        .filter(Region.is_active == True)  # noqa: E712
        .order_by(Region.name)
        .all()
    )

    return {
        "count": len(regions),
        "results": [
            {
                "id": region.id,
                "name": region.name,
            }
            for region in regions
        ],
    }
