from logging.config import fileConfig
import os

from sqlalchemy import create_engine
from sqlalchemy import pool

from alembic import context
from dotenv import load_dotenv

from app.database.database import Base
from app import models


# تحميل متغيرات .env
load_dotenv()


# Alembic Config
config = context.config


# إعداد Logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# Metadata الخاصة بجداول SQLAlchemy
target_metadata = Base.metadata


# رابط قاعدة البيانات من .env
database_url = os.getenv("DATABASE_URL")

if not database_url:
    raise RuntimeError(
        "DATABASE_URL غير موجود في ملف .env"
    )


def run_migrations_offline() -> None:
    """
    تشغيل Alembic في وضع Offline.
    """

    context.configure(
        url=database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={
            "paramstyle": "named"
        },
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """
    تشغيل Alembic في وضع Online.
    """

    connectable = create_engine(
        database_url,
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()