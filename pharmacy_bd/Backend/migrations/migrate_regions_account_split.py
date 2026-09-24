"""ترحيل مخطط: المناطق (Regions) + فصل حساب المالك عن حساب المستخدم.

يُستخدم psycopg v3 (متوفر في venv لهذا المشروع، وليس psycopg2).
- regions: جدول المناطق
- pharmacies.region_id: ربط الصيدلية بالمنطقة
- pharmacy_requests.source: مصدر الطلب (standalone / account)
- pharmacy_requests.region_id: المنطقة المختارة في الطلب
- users.phone: جعل الهاتف اختياريًا + إزالة القيد الفريد
"""
import psycopg
from psycopg.rows import dict_row

DSN = "host=localhost dbname=dawei user=postgres password=dodo"

STATEMENTS = [
    """CREATE TABLE IF NOT EXISTS regions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
    )""",
    "CREATE INDEX IF NOT EXISTS ix_regions_name ON regions (name)",
    "ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS region_id INTEGER",
    "ALTER TABLE pharmacy_requests ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'standalone'",
    "ALTER TABLE pharmacy_requests ADD COLUMN IF NOT EXISTS region_id INTEGER",
    "ALTER TABLE users ALTER COLUMN phone DROP NOT NULL",
]


def main():
    with psycopg.connect(DSN, row_factory=dict_row) as conn:
        for stmt in STATEMENTS:
            conn.execute(stmt)

        # حذف أي قيد فريد على عمود الهاتف (عادة اسمه users_phone_key)
        rows = conn.execute(
            """
            SELECT conname
            FROM pg_constraint
            WHERE conrelid = 'users'::regclass
              AND contype = 'u'
              AND conkey = ARRAY[(SELECT attnum FROM pg_attribute
                                  WHERE attrelid = 'users'::regclass
                                    AND attname = 'phone')]
            """
        ).fetchall()
        for row in rows:
            conn.execute(f'ALTER TABLE users DROP CONSTRAINT IF EXISTS "{row["conname"]}"')
            print(f"dropped unique constraint: {row['conname']}")

        # إضافة قيود المفاتيح الأجنبية إن لم تكن موجودة
        fk_exists = conn.execute(
            """
            SELECT 1 FROM pg_constraint
            WHERE conrelid = 'pharmacies'::regclass AND conname = 'fk_pharmacies_region'
            """
        ).fetchone()
        if not fk_exists:
            conn.execute(
                "ALTER TABLE pharmacies ADD CONSTRAINT fk_pharmacies_region "
                "FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL"
            )
            conn.execute("CREATE INDEX IF NOT EXISTS ix_pharmacies_region_id ON pharmacies (region_id)")
            print("added fk_pharmacies_region")

        fk_req = conn.execute(
            """
            SELECT 1 FROM pg_constraint
            WHERE conrelid = 'pharmacy_requests'::regclass AND conname = 'fk_requests_region'
            """
        ).fetchone()
        if not fk_req:
            conn.execute(
                "ALTER TABLE pharmacy_requests ADD CONSTRAINT fk_requests_region "
                "FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL"
            )
            conn.execute("CREATE INDEX IF NOT EXISTS ix_pharmacy_requests_region_id ON pharmacy_requests (region_id)")
            print("added fk_requests_region")

        uniq = conn.execute(
            """
            SELECT 1 FROM pg_constraint
            WHERE conrelid = 'regions'::regclass AND conname = 'regions_name_key'
            """
        ).fetchone()
        if not uniq:
            conn.execute("ALTER TABLE regions ADD CONSTRAINT regions_name_key UNIQUE (name)")
            print("added unique regions_name_key")

        # زرع المناطق من مدن الصيدليات الحالية وربط الصيدليات بها
        cities = conn.execute("SELECT DISTINCT city FROM pharmacies WHERE city IS NOT NULL").fetchall()
        for row in cities:
            city = row["city"]
            conn.execute(
                "INSERT INTO regions (name) VALUES (%s) ON CONFLICT (name) DO NOTHING",
                (city,),
            )
            conn.execute(
                """UPDATE pharmacies p SET region_id = r.id
                   FROM regions r
                   WHERE r.name = p.city AND p.region_id IS NULL""",
            )
        if cities:
            print(f"seeded {len(cities)} region(s) from pharmacy cities")

        # طباعة ملخص
        for table in ("regions",):
            cols = conn.execute(
                "SELECT column_name FROM information_schema.columns WHERE table_name = %s ORDER BY ordinal_position",
                (table,),
            ).fetchall()
            print(f"{table} columns: ", ", ".join(c["column_name"] for c in cols))

    print("OK: تم ترحيل المناطق وفصل حساب المدير")


if __name__ == "__main__":
    main()