# from decimal import Decimal
# from typing import TYPE_CHECKING


# from sqlalchemy import ForeignKey, Numeric
# from sqlalchemy.orm import Mapped, mapped_column, relationship

# from app.database.database import Base

# if TYPE_CHECKING:
#     from app.models.orders import Order
#     # from app.models.medicine import Medicine


# class OrderItem(Base):
#     __tablename__ = "order_items"

#     id: Mapped[int] = mapped_column(
#         primary_key=True,
#         index=True
#     )

#     order_id: Mapped[int] = mapped_column(
#         ForeignKey("orders.id", ondelete="CASCADE"),
#         nullable=False
#     )

#     medicine_id: Mapped[int] = mapped_column(
#         ForeignKey("medicines.id", ondelete="RESTRICT"),
#         nullable=False
#     )

#     quantity: Mapped[int] = mapped_column(
#         nullable=False,
#         default=1
#     )

#     price: Mapped[Decimal] = mapped_column(
#         Numeric(10, 2),
#         nullable=False
#     )

#     subtotal: Mapped[Decimal] = mapped_column(
#         Numeric(10, 2),
#         nullable=False
#     )

#     # العلاقات
#     order: Mapped["Order"] = relationship(
#         back_populates="items"
#     )

#     # medicine: Mapped["Medicine"] = relationship(
#     #     back_populates="order_items"
#     # )