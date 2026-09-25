from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


if TYPE_CHECKING:
    from app.models.users import User


class PharmacyRequest(Base):
    __tablename__ = "pharmacy_requests"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    # صاحب طلب تسجيل الصيدلية
    user_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    # بيانات الصيدلية المطلوبة
    pharmacy_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )

    address: Mapped[str] = mapped_column(
        String(300),
        nullable=False
    )

    phone: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    # رقم تواصل صاحب الطلب (قد يختلف عن رقم الصيدلية، ويُحفظ حتى لو
    # كان الرقم مستخدمًا بحساب آخر حتى لا يُرفض الطلب)
    owner_phone: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True
    )

    city: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    # مصدر الطلب: "standalone" (تسجيل مباشر) / "account" (من حساب مستخدم مسجّل)
    source: Mapped[str] = mapped_column(
        String(20),
        default="standalone",
        nullable=False
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

    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )

    # pending / approved / rejected
    status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
        nullable=False,
        index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow,
        nullable=False
    )

    reviewed_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True
    )

    # العلاقة مع المستخدم
    user: Mapped["User"] = relationship(
        "User",
        back_populates="pharmacy_requests"
    )