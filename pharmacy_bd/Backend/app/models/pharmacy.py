from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, DateTime, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base

if TYPE_CHECKING:
    from app.models.inventory import PharmacyInventory
    from app.models.pharmacy_users import PharmacyUser
    from app.models.activity_log import ActivityLog
    from app.models.review import Review
    from app.models.region import Region
    # from app.models.pharmacy_medicines import PharmacyMedicine


class Pharmacy(Base):
    __tablename__ = "pharmacies"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        index=True
    )

    address: Mapped[str] = mapped_column(
        String(300),
        nullable=False
    )

    phone: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True
    )

    city: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )

    region_id: Mapped[int | None] = mapped_column(
        ForeignKey("regions.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    latitude: Mapped[float] = mapped_column(
        nullable=False
    )

    longitude: Mapped[float] = mapped_column(
        nullable=False
    )

    is_open: Mapped[bool] = mapped_column(
        default=False,
        nullable=False
    )

    image_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    work_open: Mapped[str | None] = mapped_column(
        String(5),
        nullable=True
    )

    work_close: Mapped[str | None] = mapped_column(
        String(5),
        nullable=True
    )

    work_timer: Mapped[bool] = mapped_column(
        default=False,
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    inventory_items: Mapped[list["PharmacyInventory"]] = relationship(
        "PharmacyInventory",
        back_populates="pharmacy",
        cascade="all, delete-orphan"
    )
    pharmacy_users: Mapped[list["PharmacyUser"]] = relationship(
        "PharmacyUser",
        back_populates="pharmacy",
        cascade="all, delete-orphan"
    )
    activity_logs: Mapped[list["ActivityLog"]] = relationship(
        "ActivityLog",
        back_populates="pharmacy",
        cascade="all, delete-orphan"
    )
    reviews: Mapped[list["Review"]] = relationship(
        "Review",
        back_populates="pharmacy",
        cascade="all, delete-orphan"
    )
    region: Mapped["Region | None"] = relationship(
        "Region",
        back_populates="pharmacies"
    )
    # pharmacy_medicines: Mapped[list["PharmacyMedicine"]] = relationship(
    #     "PharmacyMedicine",
    #     back_populates="pharmacy"
    # )
