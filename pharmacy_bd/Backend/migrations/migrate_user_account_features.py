"""ترحيل ميزات الحساب: جدول الإشعارات + صورة المستخدم.

يُشغَّل يدويًا لقاعدة الإنتاج (PostgreSQL) بأمان ومرونة:
- notifications: يُنشأ الجدول فقط إن لم يوجد.
- users.avatar_url: يُضاف العمود فقط إن لم يوجد.

الطريقة (من مجلد Backend):
    venv\\Scripts\\python.exe -m migrations.migrate_user_account_features
"""
import os
from pathlib import Path

import psycopg
from dotenv import load_dotenv
from psycopg.rows import dict_row

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ENV_PATH)
# psycopg لا يقبل المخطط "postgresql+psycopg://" — يُحوَّل إلى "postgresql://"
DSN = (os.getenv("DATABASE_URL") or "postgresql://postgres:@localhost:5432/dawei").replace(
    "postgresql+psycopg://", "postgresql://", 1
)

STATEMENTS = [
    """CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50),
        title VARCHAR(200) NOT NULL,
        body TEXT,
        entity_type VARCHAR(50),
        entity_id INTEGER,
        link VARCHAR(300),
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )""",
    "CREATE INDEX IF NOT EXISTS ix_notifications_id ON notifications (id)",
    "CREATE INDEX IF NOT EXISTS ix_notifications_user_id ON notifications (user_id)",
    "CREATE INDEX IF NOT EXISTS ix_notifications_type ON notifications (type)",
    "CREATE INDEX IF NOT EXISTS ix_notifications_is_read ON notifications (is_read)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500)",
]


def main():
    with psycopg.connect(DSN, row_factory=dict_row) as conn:
        for stmt in STATEMENTS:
            conn.execute(stmt)
        cols = conn.execute(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position"
        ).fetchall()
        print("users columns:", ", ".join(row["column_name"] for row in cols))
    print("OK: تم ترحيل ميزات الحساب (الإشعارات + صورة المستخدم)")


if __name__ == "__main__":
    main()