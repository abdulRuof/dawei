from datetime import datetime, timedelta, timezone
import random
import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.users import User
from app.models.pharmacy_users import PharmacyUser
from app.core.security import verify_password, hash_password
from app.core.jwt import create_access_token
from app.core.dependencies import get_current_user
from app.core.activity import log_activity


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


ALLOWED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def _uploads_dir():
    path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "..", "..", "uploads"
    )
    os.makedirs(path, exist_ok=True)
    return path


def _remove_uploaded_file(path: str):
    try:
        if path and os.path.exists(path) and os.path.isfile(path):
            os.remove(path)
    except OSError:
        pass


def _role_context(db: Session, user: User):
    """يرجع (role, pharmacy_id) حسب حساب المستخدم."""
    pharmacy_user = (
        db.query(PharmacyUser)
        .filter(PharmacyUser.user_id == user.id)
        .first()
    )
    if user.is_superadmin:
        return "superadmin", None
    if pharmacy_user:
        return pharmacy_user.role, pharmacy_user.pharmacy_id
    return "user", None


def _user_payload(db: Session, user: User):
    role, pharmacy_id = _role_context(db, user)
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "avatar_url": user.avatar_url,
        "role": role,
        "pharmacy_id": pharmacy_id,
        "is_superadmin": user.is_superadmin,
        "must_change_password": user.must_change_password,
    }


@router.post("/register")
def register(
    data: dict,
    db: Session = Depends(get_db)
):
    full_name = (data.get("full_name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not full_name or not email or not password:
        raise HTTPException(
            status_code=400,
            detail="All fields are required"
        )

    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters"
        )

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # رقم الهاتف لا يُجمع عند تسجيل المستخدم العادي (يُضاف لاحقًا إن لزم)
    user = User(
        full_name=full_name,
        email=email,
        password_hash=hash_password(password),
        is_active=True,
        is_superadmin=False,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token({
        "sub": str(user.id),
        "role": "user",
        "pharmacy_id": None
    })

    return {
        "message": "Account created successfully",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "avatar_url": user.avatar_url,
            "role": "user",
            "pharmacy_id": None,
            "is_superadmin": False
        }
    }


@router.post("/login")
def login(
    data: dict,
    db: Session = Depends(get_db)
):
    # البحث عن المستخدم بواسطة البريد أو رقم الهاتف
    user = (
        db.query(User)
        .filter(User.email == data["email"])
        .first()
    )
    if user is None:
        user = (
            db.query(User)
            .filter(User.phone == data["email"])
            .first()
        )

    # إذا لم يوجد المستخدم
    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # التحقق من حالة الحساب
    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive"
        )

    # الحماية من التخمين: فحص الحساب المقفل مؤقتًا
    if user.locked_until is not None:
        if datetime.now(timezone.utc) < user.locked_until:
            remaining = int((user.locked_until - datetime.now(timezone.utc)).total_seconds() // 60) + 1
            raise HTTPException(
                status_code=429,
                detail=f"محاولات كثيرة فاشلة، الحساب مقفل مؤقتًا. حاول بعد {remaining} دقيقة"
            )
        # انتهت مدة القفل
        user.locked_until = None
        user.failed_login_count = 0
        db.commit()

    # التحقق من كلمة المرور
    if not verify_password(
        data["password"],
        user.password_hash
    ):
        user.failed_login_count = (user.failed_login_count or 0) + 1
        if user.failed_login_count >= 5:
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
            user.failed_login_count = 0
        db.commit()
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # نجاح الدخول: تصفير العدادات
    if user.failed_login_count or user.locked_until:
        user.failed_login_count = 0
        user.locked_until = None
        db.commit()

    # البحث عن الصيدلية المرتبطة بالمستخدم
    pharmacy_user = (
        db.query(PharmacyUser)
        .filter(PharmacyUser.user_id == user.id)
        .first()
    )

    pharmacy_id = None
    role = "user"

    if user.is_superadmin:
        role = "superadmin"
    elif pharmacy_user:
        pharmacy_id = pharmacy_user.pharmacy_id
        role = pharmacy_user.role

    # تسجيل دخول مدير/موظف الصيدلية في سجل العمليات
    if pharmacy_id and role in ("owner", "staff"):
        log_activity(
            db,
            pharmacy_id,
            user.id,
            "login",
            f"سجّل {('الموظف ' if role == 'staff' else 'مدير الصيدلية ')} {user.full_name} الدخول إلى لوحة التحكم"
        )
        db.commit()

    access_token = create_access_token({
        "sub": str(user.id),
        "role": role,
        "pharmacy_id": pharmacy_id
    })

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "avatar_url": user.avatar_url,
            "role": role,
            "pharmacy_id": pharmacy_id,
            "is_superadmin": user.is_superadmin,
            "must_change_password": user.must_change_password
        }
    }


@router.post("/forgot-password")
def forgot_password(
    data: dict,
    db: Session = Depends(get_db)
):
    email = (data.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="يرجى إدخال البريد الإلكتروني")

    user = None
    if "@" in email:
        user = db.query(User).filter(User.email == email).first()
    if user is None:
        user = db.query(User).filter(User.phone == email).first()

    if user is None:
        raise HTTPException(status_code=404, detail="لا يوجد حساب بهذه البيانات")

    code = str(random.randint(100000, 999999))
    user.password_reset_code = code
    user.password_reset_expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.commit()

    # ملاحظة: لا يوجد خدمة بريد/رسائل بعد، لذلك يُرجع الكود مباشرة للتجربة
    return {
        "message": "تم إنشاء كود إعادة التعيين",
        "code": code,
        "expires_in_minutes": 10
    }


@router.post("/reset-password")
def reset_password(
    data: dict,
    db: Session = Depends(get_db)
):
    email = (data.get("email") or "").strip().lower()
    code = (data.get("code") or "").strip()
    new_password = data.get("new_password") or ""

    user = None
    if "@" in email:
        user = db.query(User).filter(User.email == email).first()
    if user is None:
        user = db.query(User).filter(User.phone == email).first()

    if user is None:
        raise HTTPException(status_code=404, detail="لا يوجد حساب بهذه البيانات")

    if user.password_reset_code is None or user.password_reset_expires is None:
        raise HTTPException(status_code=400, detail="لم يتم طلب إعادة تعيين، اطلب كودًا أولًا")

    # التوافق مع SQLite (يعيد وقتًا بلا منطقة زمنية) وPostgreSQL (مزوّد بها)
    expires = user.password_reset_expires
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=400, detail="انتهت صلاحية الكود، اطلب كودًا جديدًا")

    if user.password_reset_code != code:
        raise HTTPException(status_code=400, detail="الكود غير صحيح")

    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="كلمة المرور يجب أن تكون 8 أحرف على الأقل")

    user.password_hash = hash_password(new_password)
    user.password_reset_code = None
    user.password_reset_expires = None
    user.failed_login_count = 0
    user.locked_until = None
    db.commit()

    return {"message": "تم تغيير كلمة المرور بنجاح"}


@router.put("/me")
def update_me(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if "full_name" in data and (data.get("full_name") or "").strip():
        current_user.full_name = data["full_name"].strip()

    if "phone" in data and (data.get("phone") or "").strip():
        new_phone = data["phone"].strip()
        if new_phone != current_user.phone:
            if db.query(User).filter(User.phone == new_phone, User.id != current_user.id).first():
                raise HTTPException(status_code=400, detail="رقم الهاتف مستخدم من حساب آخر")
            current_user.phone = new_phone

    db.commit()

    return _user_payload(db, current_user)


@router.post("/change-password")
def change_password(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_password = data.get("current_password") or ""
    new_password = data.get("new_password") or ""

    if not verify_password(current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="كلمة المرور الحالية غير صحيحة")

    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل")

    current_user.password_hash = hash_password(new_password)
    current_user.must_change_password = False
    db.commit()

    return {
        "message": "تم تغيير كلمة المرور بنجاح",
        "user": _user_payload(db, current_user)
    }


@router.post("/avatar")
def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_IMAGE_EXTS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Allowed: jpg, jpeg, png, webp, gif",
        )

    contents = file.file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image is too large. Maximum allowed size is 5MB",
        )

    filename = f"avatar_{current_user.id}_{uuid.uuid4().hex[:10]}{ext}"
    file_path = os.path.join(_uploads_dir(), filename)

    with open(file_path, "wb") as fh:
        fh.write(contents)

    if current_user.avatar_url:
        _remove_uploaded_file(
            os.path.normpath(
                os.path.join(
                    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                    "..",
                    current_user.avatar_url.lstrip("/"),
                )
            )
        )

    current_user.avatar_url = f"/uploads/{filename}"
    db.commit()

    return {
        "message": "تم تحديث صورة المستخدم",
        "user": _user_payload(db, current_user)
    }


@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return _user_payload(db, current_user)