import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    rows = conn.execute(text("SELECT indexname FROM pg_indexes WHERE indexname LIKE 'ix_medicines%trgm'"))
    indexes = sorted(r[0] for r in rows)
    print("فهارس pg_trgm:", indexes)

    rows2 = conn.execute(text("SELECT version_num FROM alembic_version"))
    print("alembic version:", [r[0] for r in rows2])