from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base

if TYPE_CHECKING:
    from app.models.inventory import PharmacyInventory
    from app.models.category import Category
    from app.models.review import Review
    from app.models.medicine_alert import MedicineAlert
    # from app.models.pharmacy_medicines import PharmacyMedicine
    



class Medicine(Base):
    __tablename__ = "medicines"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        index=True
    )

    generic_name: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    image_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    category_id: Mapped[int] = mapped_column(
        ForeignKey(
            "categories.id",
            ondelete="RESTRICT"
        ),
        nullable=False,
        index=True
    )

    category: Mapped["Category"] = relationship(
        "Category",
        back_populates="medicines"
    )

    inventory_items: Mapped[list["PharmacyInventory"]] = relationship(
        "PharmacyInventory",
        back_populates="medicine",
        cascade="all, delete-orphan"

    )
    reviews: Mapped[list["Review"]] = relationship(
        "Review",
        back_populates="medicine",
        cascade="all, delete-orphan"
    )

    medicine_alerts: Mapped[list["MedicineAlert"]] = relationship(
        "MedicineAlert",
        back_populates="medicine",
        cascade="all, delete-orphan"
    )
    # pharmacy_medicines: Mapped[list["PharmacyMedicine"]] = relationship(
    #     "PharmacyMedicine",
    #     back_populates="medicine"
    # )