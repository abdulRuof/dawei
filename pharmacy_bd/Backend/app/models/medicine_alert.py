from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base

if TYPE_CHECKING:
    from app.models.users import User
    from app.models.medicine import Medicine
    from app.models.pharmacy import Pharmacy


class MedicineAlert(Base):
    __tablename__ = "medicine_alerts"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    medicine_id: Mapped[int] = mapped_column(
        ForeignKey("medicines.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    pharmacy_id: Mapped[int | None] = mapped_column(
        ForeignKey("pharmacies.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow,
        nullable=False
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="medicine_alerts"
    )

    medicine: Mapped["Medicine"] = relationship(
        "Medicine",
        back_populates="medicine_alerts"
    )

    pharmacy: Mapped["Pharmacy | None"] = relationship(
        "Pharmacy"
    )