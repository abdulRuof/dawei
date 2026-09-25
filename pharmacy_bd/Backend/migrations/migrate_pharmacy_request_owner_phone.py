"""ترحيل رقم تواصل صاحب الطلب (pharmacy_requests.owner_phone).

يُشغَّل يدويًا لقاعدة الإنتاج (PostgreSQL) بأمان:
يضيف العمود فقط إن لم يوجد.

الطريقة (من مجلد Backend):
    venv\\Scripts\\python.exe -m migrations.migrate_pharmacy_request_owner_phone
"""
import os
from pathlib import Path

import psycopg
from dotenv import load_dotenv
from psycopg.rows import dict_row

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ENV_PATH)
DSN = (os.getenv("DATABASE_URL") or "postgresql://postgres:@localhost:5432/dawei").replace(
    "postgresql+psycopg://", "postgresql://", 1
)


def main():
    with psycopg.connect(DSN, row_factory=dict_row) as conn:
        has = conn.execute(
            "SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_requests' AND column_name = 'owner_phone'"
        ).fetchone()
        if has is None:
            conn.execute("ALTER TABLE pharmacy_requests ADD COLUMN owner_phone VARCHAR(20)")
            print("أضيف العمود pharmacy_requests.owner_phone")
        else:
            print("العمود pharmacy_requests.owner_phone موجود مسبقًا")
        cols = conn.execute(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'pharmacy_requests' ORDER BY ordinal_position"
        ).fetchall()
        print("pharmacy_requests columns:", ", ".join(row["column_name"] for row in cols))
    print("OK: تم ترحيل owner_phone")


if __name__ == "__main__":
    main()