"""اختبارات سير العمل: تسجيل الصيدلية والموافقة/الرفض، الإشعارات، التقييمات، التنبيهات."""
import pytest


def bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def superadmin(make_user, make_token):
    admin = make_user(email="admin@dawei.ly", phone="0918000001", superadmin=True)
    return {"token": make_token(admin, role="superadmin")}


REQUEST_PAYLOAD = {
    "full_name": "موسى الفارسي",
    "email": "musa@example.com",
    "phone": "0918102000",
    "password": "Password123!",
    "pharmacy_name": "صيدلية الواحة",
    "pharmacy_phone": "0923102000",
    "city": "سبها",
    "address": "شارع الجيش، قرب السوق",
    "description": "صيدلية جديدة",
}


# =========================================================
# طلبات تسجيل الصيدلية (standalone)
# =========================================================

def test_create_pharmacy_request(client):
    res = client.post("/api/pharmacy-requests/", json=REQUEST_PAYLOAD)
    assert res.status_code == 200
    data = res.json()
    assert data["request"]["status"] == "pending"
    assert data["request"]["pharmacy_name"] == "صيدلية الواحة"


def test_create_pharmacy_request_rejects_duplicate_email(client):
    assert client.post("/api/pharmacy-requests/", json=REQUEST_PAYLOAD).status_code == 200
    res = client.post("/api/pharmacy-requests/", json=REQUEST_PAYLOAD)
    assert res.status_code == 400


def test_create_pharmacy_request_missing_field(client):
    payload = dict(REQUEST_PAYLOAD, pharmacy_name="")
    res = client.post("/api/pharmacy-requests/", json=payload)
    assert res.status_code == 400
    assert "pharmacy_name" in res.json()["detail"]


def test_list_requests_requires_superadmin(client, make_user, make_token):
    client.post("/api/pharmacy-requests/", json=REQUEST_PAYLOAD)
    user = make_user(email="plain@example.com", phone="0918102001")
    token = make_token(user)

    res = client.get("/api/pharmacy-requests/?status=pending", headers=bearer(token))
    assert res.status_code == 403


def test_approve_request_and_owner_can_manage(client, superadmin):
    client.post("/api/pharmacy-requests/", json=REQUEST_PAYLOAD)

    res = client.post(
        "/api/pharmacy-requests/1/approve",
        headers=bearer(superadmin["token"]),
    )
    assert res.status_code == 200
    data = res.json()
    assert data["request"]["status"] == "approved"
    pharmacy_id = data["pharmacy"]["id"]
    assert data["owner"]["created_separate_account"] is False

    # مقدم الطلب أصبح مالكًا — يسجّل دخولًا ويصل لمخزونه
    res = client.post(
        "/api/auth/login",
        json={"email": "musa@example.com", "password": "Password123!"},
    )
    assert res.status_code == 200
    owner_token = res.json()["access_token"]

    res = client.get(
        f"/api/pharmacies/{pharmacy_id}/inventory",
        headers=bearer(owner_token),
    )
    assert res.status_code == 200
    assert res.json()["count"] == 0


def test_approve_non_pending_request(client, superadmin):
    client.post("/api/pharmacy-requests/", json=REQUEST_PAYLOAD)
    client.post(
        "/api/pharmacy-requests/1/approve",
        headers=bearer(superadmin["token"]),
    )

    res = client.post(
        "/api/pharmacy-requests/1/approve",
        headers=bearer(superadmin["token"]),
    )
    assert res.status_code == 400
    assert "already" in res.json()["detail"]


def test_reject_request(client, superadmin):
    client.post("/api/pharmacy-requests/", json=REQUEST_PAYLOAD)

    res = client.post(
        "/api/pharmacy-requests/1/reject",
        headers=bearer(superadmin["token"]),
    )
    assert res.status_code == 200
    assert res.json()["request"]["status"] == "rejected"

    # لا يمكن إعادة الرفض
    res = client.post(
        "/api/pharmacy-requests/1/reject",
        headers=bearer(superadmin["token"]),
    )
    assert res.status_code == 400


def test_approve_unknown_request(client, superadmin):
    res = client.post(
        "/api/pharmacy-requests/999/approve",
        headers=bearer(superadmin["token"]),
    )
    assert res.status_code == 404


def test_from_account_approve_creates_separate_owner(
    client, make_user, make_token,
):
    # مستخدم مسجل ليس له صيدلية
    user = make_user(
        email="salem@example.com",
        phone="0918200000",
        password="Password123!",
    )
    token = make_token(user)

    res = client.post(
        "/api/pharmacy-requests/from-account",
        headers=bearer(token),
        json={
            "pharmacy_name": "صيدلية الجبل",
            "pharmacy_phone": "0923200000",
            "city": "غات",
            "address": "الشارع العام",
        },
    )
    assert res.status_code == 200

    admin = make_user(email="admin2@dawei.ly", phone="0918000002", superadmin=True)
    admin_token = make_token(admin, role="superadmin")

    res = client.post(
        "/api/pharmacy-requests/1/approve",
        headers=bearer(admin_token),
    )
    assert res.status_code == 200
    data = res.json()
    assert data["owner"]["created_separate_account"] is True
    assert data["owner"]["email"] == "salem+pharmacy@example.com"
    pharmacy_id = data["pharmacy"]["id"]

    # المستخدم الأصلي يتلقى إشعارًا بالقبول مع بيانات حساب المدير الجديد
    notifs = client.get("/api/notifications", headers=bearer(token)).json()
    assert notifs["count"] == 1
    assert notifs["results"][0]["type"] == "PHARMACY_APPROVED"
    assert "salem+pharmacy@example.com" in notifs["results"][0]["body"]

    # دخول المالك بالبريد الجديد وكلمة مرور حسابه الحالية
    res = client.post(
        "/api/auth/login",
        json={"email": "salem+pharmacy@example.com", "password": "Password123!"},
    )
    assert res.status_code == 200
    owner_login = res.json()
    assert owner_login["user"]["must_change_password"] is True
    owner_token = owner_login["access_token"]

    # لوحة التحكم محجوبة حتى تغيير كلمة المرور
    res = client.get(
        f"/api/pharmacies/{pharmacy_id}/inventory",
        headers=bearer(owner_token),
    )
    assert res.status_code == 428
    assert res.json()["detail"] == "MUST_CHANGE_PASSWORD"

    # تغيير كلمة المرور يفتح لوحة التحكم
    res = client.post(
        "/api/auth/change-password",
        headers=bearer(owner_token),
        json={"current_password": "Password123!", "new_password": "Owner123!"},
    )
    assert res.status_code == 200
    assert res.json()["user"]["must_change_password"] is False

    res = client.get(
        f"/api/pharmacies/{pharmacy_id}/inventory",
        headers=bearer(owner_token),
    )
    assert res.status_code == 200


def test_from_account_accepts_owner_phone(client, make_user, make_token):
    user = make_user(email="phone-step@example.com", phone=None)
    token = make_token(user)

    res = client.post(
        "/api/pharmacy-requests/from-account",
        headers=bearer(token),
        json={
            "pharmacy_name": "صيدلية الخطوة الأولى",
            "pharmacy_phone": "0929998888",
            "city": "الزنتان",
            "address": "سوق الزنتان",
            "phone": "0912345678",
        },
    )
    assert res.status_code == 200

    me = client.get("/api/auth/me", headers=bearer(token)).json()
    assert me["phone"] == "0912345678"


def test_from_account_creates_missing_region(client, make_user, make_token, superadmin):
    user = make_user(email="region-user@example.com")
    token = make_token(user)

    res = client.post(
        "/api/pharmacy-requests/from-account",
        headers=bearer(token),
        json={
            "pharmacy_name": "صيدلية الوادي الجديد",
            "pharmacy_phone": "0921112222",
            "city": "مرزق",
            "address": "حي الوادي",
            "region_name": "حي الوادي الجديد",
        },
    )
    assert res.status_code == 200

    res = client.post(
        "/api/pharmacy-requests/1/approve",
        headers=bearer(superadmin["token"]),
    )
    assert res.status_code == 200
    pharmacy_id = res.json()["pharmacy"]["id"]

    listing = client.get("/api/pharmacies").json()
    pharmacy = next(p for p in listing["results"] if p["id"] == pharmacy_id)
    assert pharmacy["region"]["name"] == "حي الوادي الجديد"


def test_from_account_phone_duplicate_rejected(client, make_user, make_token):
    make_user(email="has-phone@example.com", phone="0919999999")
    user = make_user(email="dup-phone@example.com")
    token = make_token(user)

    res = client.post(
        "/api/pharmacy-requests/from-account",
        headers=bearer(token),
        json={
            "pharmacy_name": "صيدلية هاتف مكرر",
            "pharmacy_phone": "0921112223",
            "city": "طرابلس",
            "address": "شارع عمرو",
            "phone": "0919999999",
        },
    )
    assert res.status_code == 400


# =========================================================
# الإشعارات
# =========================================================

def test_create_request_notifies_superadmin(client, superadmin):
    client.post("/api/pharmacy-requests/", json=REQUEST_PAYLOAD)

    res = client.get("/api/notifications", headers=bearer(superadmin["token"]))
    assert res.status_code == 200
    data = res.json()
    assert data["count"] == 1
    assert data["unread_count"] == 1
    assert data["results"][0]["type"] == "PHARMACY_REGISTRATION_REQUEST"


def test_mark_notification_read(client, superadmin):
    client.post("/api/pharmacy-requests/", json=REQUEST_PAYLOAD)
    notif_id = client.get(
        "/api/notifications", headers=bearer(superadmin["token"])
    ).json()["results"][0]["id"]

    res = client.patch(
        f"/api/notifications/{notif_id}/read",
        headers=bearer(superadmin["token"]),
    )
    assert res.status_code == 200

    data = client.get(
        "/api/notifications", headers=bearer(superadmin["token"])
    ).json()
    assert data["unread_count"] == 0


def test_notifications_are_scoped_to_user(client, make_user, make_token):
    admin = make_user(email="admin3@dawei.ly", phone="0918000003", superadmin=True)
    admin_token = make_token(admin, role="superadmin")
    client.post("/api/pharmacy-requests/", json=REQUEST_PAYLOAD)

    other = make_user(email="other@example.com", phone="0918300000")
    other_token = make_token(other)

    res = client.get("/api/notifications", headers=bearer(other_token))
    assert res.json()["count"] == 0
    assert client.get("/api/notifications", headers=bearer(admin_token)).json()["count"] == 1


def test_notifications_scope_admin(client, superadmin):
    client.post("/api/pharmacy-requests/", json=REQUEST_PAYLOAD)

    res = client.get("/api/notifications?scope=admin", headers=bearer(superadmin["token"]))
    assert res.status_code == 200
    data = res.json()
    assert data["scope"] == "admin"
    assert data["count"] == 1
    assert data["results"][0]["type"] == "PHARMACY_REGISTRATION_REQUEST"

    # الإشعار يظهر في نطاق المنصة فقط لا في نطاق المستخدم
    user_scope = client.get("/api/notifications?scope=user", headers=bearer(superadmin["token"]))
    assert user_scope.json()["count"] == 0


def test_notifications_scope_denied_for_plain_user(client, make_user, make_token):
    client.post("/api/pharmacy-requests/", json=REQUEST_PAYLOAD)
    user = make_user(email="plain-scope@example.com")
    token = make_token(user)

    res = client.get("/api/notifications?scope=admin", headers=bearer(token))
    assert res.status_code == 403


def test_notifications_scope_unknown(client, make_user, make_token):
    user = make_user(email="bad-scope@example.com")
    token = make_token(user)

    res = client.get("/api/notifications?scope=plumbing", headers=bearer(token))
    assert res.status_code == 400


def test_notifications_summary(client, superadmin, make_user, make_token):
    client.post("/api/pharmacy-requests/", json=REQUEST_PAYLOAD)
    user = make_user(email="sum-user@example.com")
    user_token = make_token(user)

    res = client.get("/api/notifications/summary", headers=bearer(superadmin["token"]))
    assert res.status_code == 200
    assert res.json()["scopes"] == ["user", "admin"]

    res = client.get("/api/notifications/summary", headers=bearer(user_token))
    assert res.status_code == 200
    assert res.json()["scopes"] == ["user"]
    assert res.json()["unread"]["user"] == 0


def test_mark_all_read_with_scope(client, superadmin):
    client.post("/api/pharmacy-requests/", json=REQUEST_PAYLOAD)

    res = client.patch(
        "/api/notifications/read-all?scope=admin",
        headers=bearer(superadmin["token"]),
    )
    assert res.status_code == 200

    data = client.get("/api/notifications?scope=admin", headers=bearer(superadmin["token"])).json()
    assert data["unread_count"] == 0


def test_pharmacy_scope_lists_approval_notification(client, superadmin, make_user, make_token):
    # طلب من حساب → إشعار PHARMACY_APPROVED يظهر في نطاق الصيدلية للمالك
    user = make_user(email="scope-owner@example.com", password="Password123!")
    token = make_token(user)
    client.post(
        "/api/pharmacy-requests/from-account",
        headers=bearer(token),
        json={
            "pharmacy_name": "صيدلية نطاق الصيدلية",
            "pharmacy_phone": "0922223333",
            "city": "البيضاء",
            "address": "الشارع الرئيسي",
        },
    )
    client.post("/api/pharmacy-requests/1/approve", headers=bearer(superadmin["token"]))

    login = client.post(
        "/api/auth/login",
        json={"email": "scope-owner+pharmacy@example.com", "password": "Password123!"},
    ).json()
    owner_token = login["access_token"]

    res = client.get("/api/notifications?scope=pharmacy", headers=bearer(owner_token))
    assert res.status_code == 200
    assert res.json()["count"] == 1
    assert res.json()["results"][0]["type"] == "PHARMACY_APPROVED"


# =========================================================
# التقييمات والتنبيهات
# =========================================================

def test_review_create_and_update(client, make_user, make_token, make_pharmacy):
    user = make_user(email="critic@example.com", phone="0918400000")
    token = make_token(user)
    pharmacy = make_pharmacy(name="صيدلية التقييم")

    res = client.post(
        "/api/reviews",
        headers=bearer(token),
        json={"pharmacy_id": pharmacy.id, "rating": 4, "comment": "خدمة ممتازة"},
    )
    assert res.status_code == 200

    res = client.post(
        "/api/reviews",
        headers=bearer(token),
        json={"pharmacy_id": pharmacy.id, "rating": 2},
    )
    assert res.status_code == 200
    assert "تحديث" in res.json()["message"]

    listing = client.get(f"/api/pharmacies/{pharmacy.id}/reviews").json()
    assert listing["count"] == 1
    assert listing["average_rating"] == 2.0


def test_review_validation(client, make_user, make_token):
    user = make_user(email="critic2@example.com", phone="0918400001")
    token = make_token(user)

    res = client.post(
        "/api/reviews",
        headers=bearer(token),
        json={"rating": 10},
    )
    assert res.status_code == 400

    res = client.post(
        "/api/reviews",
        headers=bearer(token),
        json={"pharmacy_id": 1, "medicine_id": 1, "rating": 3},
    )
    assert res.status_code == 400


def test_alert_flow(client, make_user, make_token, make_pharmacy, seed_medicine):
    user = make_user(email="watcher@example.com", phone="0918500000")
    token = make_token(user)
    pharmacy = make_pharmacy(name="صيدلية التنبيهات")
    medicine, inv = seed_medicine(pharmacy=pharmacy, name="أنسولين", qty=0, is_active=True)

    res = client.post(
        "/api/alerts",
        headers=bearer(token),
        json={"medicine_id": medicine.id},
    )
    assert res.status_code == 200

    res = client.get("/api/alerts", headers=bearer(token))
    assert res.status_code == 200
    assert res.json()["count"] == 1

    alert_id = res.json()["results"][0]["id"]
    res = client.delete(f"/api/alerts/{alert_id}", headers=bearer(token))
    assert res.status_code == 200

    res = client.get("/api/alerts", headers=bearer(token))
    assert res.json()["count"] == 0


def test_alert_unknown_medicine(client, make_user, make_token):
    user = make_user(email="watcher2@example.com", phone="0918500001")
    token = make_token(user)

    res = client.post(
        "/api/alerts",
        headers=bearer(token),
        json={"medicine_id": 999},
    )
    assert res.status_code == 404