from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, SmallInteger, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base

if TYPE_CHECKING:
    from app.models.pharmacy import Pharmacy
    from app.models.medicine import Medicine
    from app.models.users import User


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    pharmacy_id: Mapped[int | None] = mapped_column(
        ForeignKey("pharmacies.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    medicine_id: Mapped[int | None] = mapped_column(
        ForeignKey("medicines.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    rating: Mapped[int] = mapped_column(
        SmallInteger,
        nullable=False
    )

    comment: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow,
        nullable=False
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="reviews"
    )

    pharmacy: Mapped["Pharmacy | None"] = relationship(
        "Pharmacy",
        back_populates="reviews"
    )

    medicine: Mapped["Medicine | None"] = relationship(
        "Medicine",
        back_populates="reviews"
    )