import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    idx = conn.execute(text(
        """SELECT indexname, indexdef FROM pg_indexes
           WHERE tablename = 'pharmacy_inventory' ORDER BY indexname"""
    ))
    print("=== فهارس pharmacy_inventory ===")
    for name, d in idx:
        print(f"\n[{name}]\n{d}")

    cols = conn.execute(text(
        """SELECT column_name FROM information_schema.columns
           WHERE table_name = 'pharmacy_inventory' ORDER BY ordinal_position"""
    ))
    print("\n=== الأعمدة ===")
    print([c[0] for c in cols])