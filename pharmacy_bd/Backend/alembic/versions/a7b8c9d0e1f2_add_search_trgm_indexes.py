"""add pg_trgm search indexes on medicines

Revision ID: a7b8c9d0e1f2
Revises: f1a2b3c4d5e6
Create Date: 2026-09-26 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'a7b8c9d0e1f2'
down_revision: Union[str, Sequence[str], None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_medicines_name_trgm "
        "ON medicines USING gin (name gin_trgm_ops)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_medicines_generic_trgm "
        "ON medicines USING gin (generic_name gin_trgm_ops)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_medicines_generic_trgm")
    op.execute("DROP INDEX IF EXISTS ix_medicines_name_trgm")