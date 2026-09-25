"""اختبارات المصادقة: التسجيل، الدخول، جلب الحساب، استعادة كلمة المرور، تحديث الحساب."""
import pytest

REGISTER_PAYLOAD = {
    "full_name": "أحمد التائب",
    "email": "ahmed@example.com",
    "password": "Secret123!",
}


def bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# =========================================================
# التسجيل (بدون رقم هاتف)
# =========================================================

def test_register_success(client):
    res = client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    assert res.status_code == 200
    data = res.json()
    assert data["token_type"] == "bearer"
    assert data["access_token"]
    assert data["user"]["email"] == "ahmed@example.com"
    assert data["user"]["role"] == "user"
    assert data["user"]["phone"] is None
    assert "avatar_url" in data["user"]


def test_register_without_phone(client):
    res = client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    assert res.status_code == 200


def test_register_phone_ignored(client):
    """رقم الهاتف يُتجاهل كليًا عند التسجيل (لا حقل إلزامي ولا فحص تفرد)."""
    payload = dict(REGISTER_PAYLOAD, phone="0911000000")
    assert client.post("/api/auth/register", json=payload).status_code == 200
    payload = dict(REGISTER_PAYLOAD, email="other@example.com", phone="0911000000")
    assert client.post("/api/auth/register", json=payload).status_code == 200


def test_register_duplicate_email(client):
    assert client.post("/api/auth/register", json=REGISTER_PAYLOAD).status_code == 200
    res = client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    assert res.status_code == 400
    assert "registered" in res.json()["detail"]


def test_register_short_password(client):
    payload = dict(REGISTER_PAYLOAD, password="short")
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 400
    assert "8" in res.json()["detail"]


def test_register_missing_fields(client):
    payload = dict(REGISTER_PAYLOAD)
    del payload["password"]
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 400


# =========================================================
# الدخول
# =========================================================

def test_login_success(client):
    client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    res = client.post(
        "/api/auth/login",
        json={"email": "ahmed@example.com", "password": "Secret123!"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["access_token"]
    assert data["user"]["email"] == "ahmed@example.com"


def test_login_with_phone(client):
    res = client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    token = res.json()["access_token"]
    assert client.put(
        "/api/auth/me",
        headers=bearer(token),
        json={"phone": "0911000000"},
    ).status_code == 200
    res = client.post(
        "/api/auth/login",
        json={"email": "0911000000", "password": "Secret123!"},
    )
    assert res.status_code == 200


def test_login_wrong_password(client):
    client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    res = client.post(
        "/api/auth/login",
        json={"email": "ahmed@example.com", "password": "WrongPass123"},
    )
    assert res.status_code == 401


def test_login_unknown_user(client):
    res = client.post(
        "/api/auth/login",
        json={"email": "nobody@example.com", "password": "Secret123!"},
    )
    assert res.status_code == 401


def test_login_inactive_user(client, make_user):
    make_user(email="locked@example.com", phone="0922222222", active=False)
    res = client.post(
        "/api/auth/login",
        json={"email": "locked@example.com", "password": "Password123!"},
    )
    assert res.status_code == 403


# =========================================================
# جلب الحساب الحالي (/me)
# =========================================================

def test_me_without_token(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_me_invalid_token(client):
    res = client.get("/api/auth/me", headers=bearer("not-a-valid-token"))
    assert res.status_code == 401


def test_me_valid_token(client, make_user, make_token):
    user = make_user(email="me@example.com", phone="0933333333")
    token = make_token(user)
    res = client.get("/api/auth/me", headers=bearer(token))
    assert res.status_code == 200
    assert res.json()["id"] == user.id
    assert res.json()["email"] == "me@example.com"


def test_me_inactive_account_rejected(client, make_user, make_token):
    user = make_user(email="dead@example.com", phone="0944444444", active=False)
    token = make_token(user)
    res = client.get("/api/auth/me", headers=bearer(token))
    assert res.status_code == 403


# =========================================================
# استعادة كلمة المرور
# =========================================================

def test_forgot_and_reset_password(client, make_user):
    user = make_user(email="reset@example.com", phone="0955555555")

    res = client.post("/api/auth/forgot-password", json={"email": "reset@example.com"})
    assert res.status_code == 200
    code = res.json()["code"]
    assert len(code) == 6

    res = client.post("/api/auth/reset-password", json={
        "email": "reset@example.com",
        "code": "000000",
        "new_password": "NewPassword123!",
    })
    assert res.status_code == 400

    res = client.post("/api/auth/reset-password", json={
        "email": "reset@example.com",
        "code": code,
        "new_password": "NewPassword123!",
    })
    assert res.status_code == 200

    res = client.post(
        "/api/auth/login",
        json={"email": "reset@example.com", "password": "NewPassword123!"},
    )
    assert res.status_code == 200
    assert user.password_reset_code is None


def test_forgot_password_unknown_email(client):
    res = client.post("/api/auth/forgot-password", json={"email": "ghost@example.com"})
    assert res.status_code == 404


# =========================================================
# تحديث الحساب (الملف الشخصي فقط — كلمة المرور في صفحة الأمان)
# =========================================================

def test_update_me_profile_fields(client, make_user, make_token):
    user = make_user(email="upd@example.com", phone=None)
    token = make_token(user)

    res = client.put(
        "/api/auth/me",
        headers=bearer(token),
        json={"full_name": "اسم جديد", "phone": "0966666666"},
    )
    assert res.status_code == 200
    assert res.json()["full_name"] == "اسم جديد"
    assert res.json()["phone"] == "0966666666"
    assert "avatar_url" in res.json()


def test_update_me_ignores_password_fields(client, make_user, make_token):
    """PUT /me لا يغيّر كلمة المرور (منفصلة عنها) — الحقول تُتجاهل."""
    user = make_user(email="igp@example.com", password="OldPass123!")
    token = make_token(user)

    res = client.put(
        "/api/auth/me",
        headers=bearer(token),
        json={"full_name": "بدون كلمة مرور", "new_password": "Hacked123!", "current_password": "OldPass123!"},
    )
    assert res.status_code == 200

    assert client.post(
        "/api/auth/login",
        json={"email": "igp@example.com", "password": "OldPass123!"},
    ).status_code == 200
    assert client.post(
        "/api/auth/login",
        json={"email": "igp@example.com", "password": "Hacked123!"},
    ).status_code == 401


# =========================================================
# تغيير كلمة المرور (صفحة الأمان المنفصلة)
# =========================================================

def test_change_password_success(client, make_user, make_token):
    user = make_user(email="cpw@example.com", password="OldPass123!")
    token = make_token(user)

    res = client.post(
        "/api/auth/change-password",
        headers=bearer(token),
        json={"current_password": "OldPass123!", "new_password": "NewPass123!"},
    )
    assert res.status_code == 200

    assert client.post(
        "/api/auth/login",
        json={"email": "cpw@example.com", "password": "OldPass123!"},
    ).status_code == 401
    assert client.post(
        "/api/auth/login",
        json={"email": "cpw@example.com", "password": "NewPass123!"},
    ).status_code == 200


def test_change_password_resets_must_change_flag(client, make_user, make_token):
    user = make_user(email="must@example.com", password="OldPass123!", must_change_password=True)
    token = make_token(user)

    res = client.post(
        "/api/auth/change-password",
        headers=bearer(token),
        json={"current_password": "OldPass123!", "new_password": "NewPass123!"},
    )
    assert res.status_code == 200
    assert res.json()["user"]["must_change_password"] is False


def test_change_password_wrong_current(client, make_user, make_token):
    user = make_user(email="cpw2@example.com", password="OldPass123!")
    token = make_token(user)

    res = client.post(
        "/api/auth/change-password",
        headers=bearer(token),
        json={"current_password": "incorrect", "new_password": "NewPass123!"},
    )
    assert res.status_code == 400


def test_change_password_short_new(client, make_user, make_token):
    user = make_user(email="cpw3@example.com", password="OldPass123!")
    token = make_token(user)

    res = client.post(
        "/api/auth/change-password",
        headers=bearer(token),
        json={"current_password": "OldPass123!", "new_password": "abc"},
    )
    assert res.status_code == 400


# =========================================================
# صورة المستخدم (avatar)
# =========================================================

def test_avatar_upload(client, make_user, make_token):
    user = make_user(email="ava@example.com")
    token = make_token(user)

    res = client.post(
        "/api/auth/avatar",
        headers=bearer(token),
        files={"file": ("photo.png", b"fake-png-bytes", "image/png")},
    )
    assert res.status_code == 200
    avatar_url = res.json()["user"]["avatar_url"]
    assert avatar_url.startswith("/uploads/avatar_")

    me = client.get("/api/auth/me", headers=bearer(token)).json()
    assert me["avatar_url"] == avatar_url


def test_avatar_upload_rejects_bad_type(client, make_user, make_token):
    user = make_user(email="ava2@example.com")
    token = make_token(user)

    res = client.post(
        "/api/auth/avatar",
        headers=bearer(token),
        files={"file": ("evil.exe", b"fake", "application/octet-stream")},
    )
    assert res.status_code == 400