"""تهيئة بيئة الاختبارات (pytest) للباكند.

- تفرض قاعدة بيانات SQLite منفصلة في مجلد النظام المؤقت قبل استيراد التطبيق،
  فلا تلمس قاعدة PostgreSQL الحقيقية (يُقرأ DATABASE_URL وقت الاستيراد).
- تُسقط وتُعيد بناء كل الجداول قبل كل اختبار لعزل تام بين الاختبارات.
- تحلّ محل اعتماد get_db لتوجيه طلبات HTTP إلى قاعدة الاختبار.

التشغيل (من مجلد Backend):
    venv\\Scripts\\python.exe -m pytest -v
"""
import os
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

_TEST_DB_FILE = Path(tempfile.gettempdir()) / f"dawei_test_{os.getpid()}.db"
_TEST_DB_URL = f"sqlite:///{_TEST_DB_FILE.as_posix()}"

# لا تجعل load_dotenv تفرض .env فوق قيمة الاختبار (override=False افتراضيًا
# في python-dotenv عند وجود المتغير مسبقًا)
os.environ["DATABASE_URL"] = _TEST_DB_URL

# استيراد التطبيق بعد فرض قاعدة الاختبار
from app.database.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.core.jwt import create_access_token  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.models.users import User  # noqa: E402
from app.models.pharmacy import Pharmacy  # noqa: E402
from app.models.pharmacy_users import PharmacyUser  # noqa: E402
from app.models.category import Category  # noqa: E402
from app.models.medicine import Medicine  # noqa: E402
from app.models.inventory import PharmacyInventory  # noqa: E402

engine = create_engine(
    _TEST_DB_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


@pytest.fixture(autouse=True)
def _reseed():
    """إعادة بناء الجداول من الصفر قبل كل اختبار."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture()
def db(_reseed):
    """جلسة مباشرة لإعداد البيانات (seed)."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(_reseed):
    """TestClient مع توجيه get_db إلى قاعدة الاختبار."""
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# =========================================================
# أدوات إنشاء بيانات (Factories)
# =========================================================

@pytest.fixture()
def make_user(db):
    def _make(
        *,
        email: str = "user@example.com",
        phone: str = "0910000000",
        password: str = "Password123!",
        active: bool = True,
        superadmin: bool = False,
        must_change_password: bool = False,
        full_name: str = "مستخدم تجريبي",
    ) -> User:
        user = User(
            full_name=full_name,
            email=email,
            phone=phone,
            password_hash=hash_password(password),
            is_active=active,
            is_superadmin=superadmin,
            must_change_password=must_change_password,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    return _make


@pytest.fixture()
def make_token():
    def _make(user: User, role: str = "user", pharmacy_id: int | None = None) -> str:
        return create_access_token({
            "sub": str(user.id),
            "role": role,
            "pharmacy_id": pharmacy_id,
        })
    return _make


@pytest.fixture()
def make_category(db):
    def _make(name: str = "مسكنات") -> Category:
        category = db.query(Category).filter(Category.name == name).first()
        if category is None:
            category = Category(name=name)
            db.add(category)
            db.commit()
            db.refresh(category)
        return category
    return _make


@pytest.fixture()
def make_pharmacy(db):
    def _make(
        *,
        name: str = "صيدلية النور",
        city: str = "سبها",
        latitude: float = 27.04,
        longitude: float = 14.43,
        owner: User | None = None,
        staff: list[User] | None = None,
    ) -> Pharmacy:
        pharmacy = Pharmacy(
            name=name,
            address="الطريق الرئيسي",
            phone="0920000000",
            city=city,
            latitude=latitude,
            longitude=longitude,
            is_open=True,
        )
        db.add(pharmacy)
        db.flush()
        if owner is not None:
            db.add(PharmacyUser(user_id=owner.id, pharmacy_id=pharmacy.id, role="owner"))
        for member in (staff or []):
            db.add(PharmacyUser(user_id=member.id, pharmacy_id=pharmacy.id, role="staff"))
        db.commit()
        db.refresh(pharmacy)
        return pharmacy
    return _make


@pytest.fixture()
def seed_medicine(db):
    def _make(
        *,
        name: str = "بانادول",
        generic_name: str = "Paracetamol",
        category_name: str = "مسكنات",
        pharmacy: Pharmacy | None = None,
        price: float = 5.0,
        qty: int = 20,
        is_active: bool = True,
    ):
        category = db.query(Category).filter(Category.name == category_name).first()
        if category is None:
            category = Category(name=category_name)
            db.add(category)
            db.flush()

        # إعادة استخدام نفس الدواء ليظل كل استدعاء يضيف مخزونًا لنفس السجل
        medicine = db.query(Medicine).filter(
            Medicine.name == name,
            Medicine.generic_name == generic_name,
        ).first()
        if medicine is None:
            medicine = Medicine(name=name, generic_name=generic_name, category_id=category.id)
            db.add(medicine)
            db.flush()

        inv = None
        if pharmacy is not None:
            inv = PharmacyInventory(
                pharmacy_id=pharmacy.id,
                medicine_id=medicine.id,
                price=price,
                quantity=qty,
                is_available=True,
                is_active=is_active,
                min_stock=10,
            )
            db.add(inv)
            db.flush()

        db.commit()
        if inv is not None:
            db.refresh(inv)
        return medicine, inv
    return _make