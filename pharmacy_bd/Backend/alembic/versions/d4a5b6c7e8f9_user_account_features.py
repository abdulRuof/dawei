"""user account features: notifications table + avatar_url

Revision ID: d4a5b6c7e8f9
Revises: 0b1d2823540a
Create Date: 2026-09-25 12:00:00.000000

حذرة وآمنة للإعادة: تُنشئ جدول notifications فقط إن لم يوجد،
وتُضيف عمود avatar_url فقط إن لم يوجد.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4a5b6c7e8f9'
down_revision: Union[str, Sequence[str], None] = '0b1d2823540a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("notifications"):
        op.create_table(
            "notifications",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("type", sa.String(length=50), nullable=True),
            sa.Column("title", sa.String(length=200), nullable=False),
            sa.Column("body", sa.Text(), nullable=True),
            sa.Column("entity_type", sa.String(length=50), nullable=True),
            sa.Column("entity_id", sa.Integer(), nullable=True),
            sa.Column("link", sa.String(length=300), nullable=True),
            sa.Column("is_read", sa.Boolean(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_notifications_id"), "notifications", ["id"], unique=False)
        op.create_index(op.f("ix_notifications_is_read"), "notifications", ["is_read"], unique=False)
        op.create_index(op.f("ix_notifications_type"), "notifications", ["type"], unique=False)
        op.create_index(op.f("ix_notifications_user_id"), "notifications", ["user_id"], unique=False)

    user_columns = {c["name"] for c in inspector.get_columns("users")}
    if "avatar_url" not in user_columns:
        op.add_column("users", sa.Column("avatar_url", sa.String(length=500), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    user_columns = {c["name"] for c in inspector.get_columns("users")}
    if "avatar_url" in user_columns:
        op.drop_column("users", "avatar_url")

    if inspector.has_table("notifications"):
        op.drop_index(op.f("ix_notifications_user_id"), table_name="notifications")
        op.drop_index(op.f("ix_notifications_type"), table_name="notifications")
        op.drop_index(op.f("ix_notifications_is_read"), table_name="notifications")
        op.drop_index(op.f("ix_notifications_id"), table_name="notifications")
        op.drop_table("notifications")