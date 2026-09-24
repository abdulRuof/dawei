from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


if TYPE_CHECKING:
    from app.models.pharmacy import Pharmacy
    from app.models.users import User


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    pharmacy_id: Mapped[int] = mapped_column(
        ForeignKey("pharmacies.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    action: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    entity_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )

    entity_id: Mapped[int | None] = mapped_column(
        nullable=True
    )

    old_value: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True
    )

    new_value: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow,
        nullable=False
    )

    # العلاقات
    user: Mapped["User"] = relationship(
        "User",
        back_populates="activity_logs"
    )

    pharmacy: Mapped["Pharmacy"] = relationship(
        "Pharmacy",
        back_populates="activity_logs"
    )