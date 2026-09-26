import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL غير موجود في ملف .env")


_is_postgres = DATABASE_URL.startswith("postgresql")


engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    **({
        "pool_size": 20,
        "max_overflow": 20,
        "pool_timeout": 30,
    } if _is_postgres else {})
)


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()