"""add owner_phone to pharmacy_requests

Revision ID: f1a2b3c4d5e6
Revises: d4a5b6c7e8f9
Create Date: 2026-09-25 14:00:00.000000

يضيف عمود owner_phone إلى جدول pharmacy_requests فقط إن لم يوجد —
رقم تواصل صاحب الطلب يُحفظ في الطلب نفسه حتى لا يُرفض الطلب عندما
يكون الرقم مستخدمًا على حساب قديم آخر.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'd4a5b6c7e8f9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("pharmacy_requests"):
        cols = {c["name"] for c in inspector.get_columns("pharmacy_requests")}
        if "owner_phone" not in cols:
            op.add_column(
                "pharmacy_requests",
                sa.Column("owner_phone", sa.String(length=20), nullable=True),
            )


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("pharmacy_requests"):
        cols = {c["name"] for c in inspector.get_columns("pharmacy_requests")}
        if "owner_phone" in cols:
            op.drop_column("pharmacy_requests", "owner_phone")