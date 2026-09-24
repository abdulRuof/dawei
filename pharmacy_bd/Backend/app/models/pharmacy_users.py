from datetime import datetime
from typing import Optional

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING


from app.database.database import Base


if TYPE_CHECKING:
    from app.models.pharmacy import Pharmacy
    from app.models.users import User




class PharmacyUser(Base):
    __tablename__ = "pharmacy_users"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    pharmacy_id: Mapped[int] = mapped_column(
        ForeignKey("pharmacies.id", ondelete="CASCADE"),
        nullable=False
    )

    role: Mapped[str] = mapped_column(
        String(50),
        default="staff",
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow,
        nullable=False
    )

    # العلاقات
    user: Mapped["User"] = relationship(
        "User",
        back_populates="pharmacy_users"
    )

    # يفترض وجود موديل Pharmacy
    pharmacy: Mapped["Pharmacy"] = relationship(
        "Pharmacy",
        back_populates="pharmacy_users"
    )