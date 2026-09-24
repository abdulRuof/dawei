# from decimal import Decimal
# from datetime import datetime
# from typing import TYPE_CHECKING

# from sqlalchemy import ForeignKey, Numeric, DateTime
# from sqlalchemy.orm import Mapped, mapped_column, relationship

# from app.database.database import Base

# if TYPE_CHECKING:
#     from app.models.pharmacy import Pharmacy
#     from app.models.medicine import Medicine


# class PharmacyMedicine(Base):
#     __tablename__ = "pharmacy_medicines"

#     id: Mapped[int] = mapped_column(
#         primary_key=True,
#         index=True
#     )

#     pharmacy_id: Mapped[int] = mapped_column(
#         ForeignKey("pharmacies.id", ondelete="CASCADE"),
#         nullable=False,
#         index=True
#     )

#     medicine_id: Mapped[int] = mapped_column(
#         ForeignKey("medicines.id", ondelete="CASCADE"),
#         nullable=False,
#         index=True
#     )

#     price: Mapped[Decimal] = mapped_column(
#         Numeric(10, 2),
#         nullable=False
#     )

#     quantity: Mapped[int] = mapped_column(
#         default=0,
#         nullable=False
#     )

#     is_available: Mapped[bool] = mapped_column(
#         default=True,
#         nullable=False
#     )

#     updated_at: Mapped[datetime] = mapped_column(
#         DateTime,
#         default=datetime.utcnow,
#         onupdate=datetime.utcnow,
#         nullable=False
#     )

#     pharmacy: Mapped["Pharmacy"] = relationship(
#         "Pharmacy",
#         back_populates="pharmacy_medicines"
#     )

#     medicine: Mapped["Medicine"] = relationship(
#         "Medicine",
#         back_populates="pharmacy_medicines"
#     )