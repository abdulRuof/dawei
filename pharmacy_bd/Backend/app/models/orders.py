# from datetime import datetime
# from decimal import Decimal
# from typing import List, Optional
# from typing import TYPE_CHECKING

# from sqlalchemy import ForeignKey, Numeric, String, Text
# from sqlalchemy.orm import Mapped, mapped_column, relationship

# from app.database.database import Base


# if TYPE_CHECKING:
#     from app.models.order_items import OrderItem
#     # from app.models.pharmacy import Pharmacy
#     from app.models.users import User



# class Order(Base):
#     __tablename__ = "orders"

#     id: Mapped[int] = mapped_column(
#         primary_key=True,
#         index=True
#     )

#     user_id: Mapped[int] = mapped_column(
#         ForeignKey("users.id", ondelete="RESTRICT"),
#         nullable=False
#     )

#     pharmacy_id: Mapped[int] = mapped_column(
#         ForeignKey("pharmacies.id", ondelete="RESTRICT"),
#         nullable=False
#     )

#     status: Mapped[str] = mapped_column(
#         String(50),
#         default="pending",
#         nullable=False
#     )

#     total_price: Mapped[Decimal] = mapped_column(
#         Numeric(10, 2),
#         default=0.00,
#         nullable=False
#     )

#     delivery_address: Mapped[Optional[str]] = mapped_column(
#         String(300),
#         nullable=True
#     )

#     phone: Mapped[str] = mapped_column(
#         String(20),
#         nullable=False
#     )

#     notes: Mapped[Optional[str]] = mapped_column(
#         Text,
#         nullable=True
#     )

#     created_at: Mapped[datetime] = mapped_column(
#         default=datetime.utcnow,
#         nullable=False
#     )

#     updated_at: Mapped[datetime] = mapped_column(
#         default=datetime.utcnow,
#         onupdate=datetime.utcnow,
#         nullable=False
#     )

#     # العلاقات
#     user: Mapped["User"] = relationship(
#         "User",
#         back_populates="orders"
#     )

#     # يفترض وجود موديل Pharmacy
#     # pharmacy: Mapped["Pharmacy"] = relationship(
#     #     "Pharmacy",
#     #     back_populates="orders"
#     # )

#     items: Mapped[List["OrderItem"]] = relationship(
#         "OrderItem",
#         back_populates="order",
#         cascade="all, delete-orphan"
#     )