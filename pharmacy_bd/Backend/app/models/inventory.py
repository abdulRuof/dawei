from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Index, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base

if TYPE_CHECKING:
    from app.models.pharmacy import Pharmacy
    from app.models.medicine import Medicine


class PharmacyInventory(Base):
    __tablename__ = "pharmacy_inventory"

    __table_args__ = (
        UniqueConstraint(
            "pharmacy_id",
            "medicine_id",
            name="uq_pharmacy_medicine"
        ),
        Index(
            "ix_pharmacy_inventory_medicine_active",
            "medicine_id",
            "is_active",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    pharmacy_id: Mapped[int] = mapped_column(
        ForeignKey(
            "pharmacies.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    medicine_id: Mapped[int] = mapped_column(
        ForeignKey(
            "medicines.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )

    quantity: Mapped[int] = mapped_column(
        default=0,
        nullable=False
    )

    min_stock: Mapped[int] = mapped_column(
        default=10,
        nullable=False
    )

    is_available: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # العلاقات

    pharmacy: Mapped["Pharmacy"] = relationship(
        "Pharmacy",
        back_populates="inventory_items"
    )

    medicine: Mapped["Medicine"] = relationship(
        "Medicine",
        back_populates="inventory_items"
    )