"""index pharmacy_inventory (medicine_id, is_active) and drop redundant id index

Revision ID: b2c3d4e5f6a7
Revises: a7b8c9d0e1f2
Create Date: 2026-10-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a7b8c9d0e1f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # فهرس مركّب يخدم فلترة الكتالوج العام: medicine_id + is_active
    op.create_index(
        "ix_pharmacy_inventory_medicine_active",
        "pharmacy_inventory",
        ["medicine_id", "is_active"],
    )
    # مكرر لغير فائدة — المفتاح الرقمي (pharmacy_inventory_pkey) مفهرس على id
    op.drop_index("ix_pharmacy_inventory_id", table_name="pharmacy_inventory")


def downgrade() -> None:
    op.create_index("ix_pharmacy_inventory_id", "pharmacy_inventory", ["id"], unique=False)
    op.drop_index(
        "ix_pharmacy_inventory_medicine_active",
        table_name="pharmacy_inventory",
    )