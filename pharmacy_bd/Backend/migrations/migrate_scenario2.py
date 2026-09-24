"""ترحيل مخطط السيناريو: صورة الصيدلية + مواعيد العمل + موقت العمل.

يُستخدم psycopg v3 (متوفر في venv لهذا المشروع، وليس psycopg2).
- pharmacies: image_url, work_open, work_close, work_timer
"""
import psycopg
from psycopg.rows import dict_row

DSN = "host=localhost dbname=dawei user=postgres password=dodo"

STATEMENTS = [
    "ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)",
    "ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS work_open VARCHAR(5)",
    "ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS work_close VARCHAR(5)",
    "ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS work_timer BOOLEAN NOT NULL DEFAULT FALSE",
]


def main():
    with psycopg.connect(DSN, row_factory=dict_row) as conn:
        for stmt in STATEMENTS:
            conn.execute(stmt)
        tmp = conn.execute(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'pharmacies' ORDER BY ordinal_position"
        ).fetchall()
        print("pharmacies columns:", ", ".join(row["column_name"] for row in tmp))
    print("OK: تم ترحيل أعمدة الصيدلية")


if __name__ == "__main__":
    main()