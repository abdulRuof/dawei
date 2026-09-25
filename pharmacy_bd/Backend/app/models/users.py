from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship


from app.database.database import Base

if TYPE_CHECKING:
    from app.models.pharmacy_users import PharmacyUser
    from app.models.pharmacy_request import PharmacyRequest
    from app.models.activity_log import ActivityLog
    from app.models.review import Review
    from app.models.notification import Notification
    from app.models.medicine_alert import MedicineAlert


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    full_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        nullable=False,
        index=True
    )

    phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
        index=True
    )

    avatar_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        default=True,
        nullable=False
    )

    is_superadmin: Mapped[bool] = mapped_column(
        default=False,
        nullable=False
    )

    must_change_password: Mapped[bool] = mapped_column(
        default=False,
        nullable=False
    )

    password_reset_code: Mapped[str | None] = mapped_column(
        String(6),
        nullable=True
    )

    password_reset_expires: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    failed_login_count: Mapped[int] = mapped_column(
        default=0,
        nullable=False
    )

    locked_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow,
        nullable=False
    )

    # العلاقات
    pharmacy_users: Mapped[List["PharmacyUser"]] = relationship(
        "PharmacyUser",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    pharmacy_requests: Mapped[List["PharmacyRequest"]] = relationship(
    "PharmacyRequest",
    back_populates="user",
    cascade="all, delete-orphan"
    )
    activity_logs: Mapped[List["ActivityLog"]] = relationship(
        "ActivityLog",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    reviews: Mapped[List["Review"]] = relationship(
        "Review",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    notifications: Mapped[List["Notification"]] = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    medicine_alerts: Mapped[List["MedicineAlert"]] = relationship(
        "MedicineAlert",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # orders: Mapped[List["Order"]] = relationship(
    #     "Order",
    #     back_populates="user"
    # )