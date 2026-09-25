"""اختبارات الصلاحيات: مالك الصيدلية، الموظف، المستخدم العادي، والسوبر أدمن."""
import pytest


def bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# =========================================================
# مالك الصيدلية
# =========================================================

@pytest.fixture()
def owner_context(make_user, make_pharmacy, make_token, seed_medicine):
    user = make_user(email="owner@example.com", phone="0912000001")
    pharmacy = make_pharmacy(owner=user, name="صيدلية الأمانة")
    seed_medicine(pharmacy=pharmacy, name="بانادول", price=6.0)
    token = make_token(user, role="owner", pharmacy_id=pharmacy.id)
    return {"user": user, "pharmacy": pharmacy, "token": token}


@pytest.fixture()
def owner_context_empty(make_user, make_pharmacy, make_token):
    user = make_user(email="owner2@example.com", phone="0912000002")
    pharmacy = make_pharmacy(owner=user, name="صيدلية الأمانة الثانية")
    token = make_token(user, role="owner", pharmacy_id=pharmacy.id)
    return {"user": user, "pharmacy": pharmacy, "token": token}


def test_owner_reads_own_inventory(client, owner_context):
    res = client.get(
        f"/api/pharmacies/{owner_context['pharmacy'].id}/inventory",
        headers=bearer(owner_context["token"]),
    )
    assert res.status_code == 200
    assert res.json()["count"] == 1
    assert res.json()["results"][0]["name"] == "بانادول"


def test_owner_adds_medicine(client, owner_context_empty):
    res = client.post(
        f"/api/pharmacies/{owner_context_empty['pharmacy'].id}/inventory",
        headers=bearer(owner_context_empty["token"]),
        json={"name": "أسبرين", "category": "مسكنات", "qty": 15, "price": 3.5},
    )
    assert res.status_code == 200
    assert res.json()["name"] == "أسبرين"


def test_owner_deletes_inventory_item(client, owner_context):
    item_id = owner_context["pharmacy"].inventory_items[0].id
    res = client.delete(
        f"/api/pharmacies/{owner_context['pharmacy'].id}/inventory/{item_id}",
        headers=bearer(owner_context["token"]),
    )
    assert res.status_code == 200


def test_owner_toggles_pharmacy_status(client, owner_context):
    res = client.patch(
        f"/api/pharmacies/{owner_context['pharmacy'].id}/status",
        headers=bearer(owner_context["token"]),
    )
    assert res.status_code == 200
    assert res.json()["is_open"] is False


def test_owner_updates_working_hours(client, owner_context):
    res = client.patch(
        f"/api/pharmacies/{owner_context['pharmacy'].id}/working-hours",
        headers=bearer(owner_context["token"]),
        json={"work_open": "09:00", "work_close": "22:00"},
    )
    assert res.status_code == 200
    assert res.json()["work_open"] == "09:00"
    assert res.json()["work_close"] == "22:00"


def test_owner_invalid_working_hours(client, owner_context):
    res = client.patch(
        f"/api/pharmacies/{owner_context['pharmacy'].id}/working-hours",
        headers=bearer(owner_context["token"]),
        json={"work_open": "25:99"},
    )
    assert res.status_code == 400


# =========================================================
# الموظف (staff)
# =========================================================

def test_staff_reads_inventory(client, make_user, make_pharmacy, make_token, seed_medicine):
    user = make_user(email="staff@example.com", phone="0913000001")
    pharmacy = make_pharmacy(staff=[user], name="صيدلية المستقبل")
    seed_medicine(pharmacy=pharmacy, name="فيتامين سي")
    token = make_token(user, role="staff", pharmacy_id=pharmacy.id)

    res = client.get(
        f"/api/pharmacies/{pharmacy.id}/inventory",
        headers=bearer(token),
    )
    assert res.status_code == 200
    assert res.json()["count"] == 1


def test_staff_adds_medicine(client, make_user, make_pharmacy, make_token):
    user = make_user(email="staff2@example.com", phone="0913000002")
    pharmacy = make_pharmacy(staff=[user], name="صيدلية المستقبل الثانية")
    token = make_token(user, role="staff", pharmacy_id=pharmacy.id)

    res = client.post(
        f"/api/pharmacies/{pharmacy.id}/inventory",
        headers=bearer(token),
        json={"name": "مضاد حيوي", "category": "مضادات حيوية", "qty": 8, "price": 12.0},
    )
    assert res.status_code == 200


def test_staff_cannot_delete_inventory(client, make_user, make_pharmacy, make_token, seed_medicine):
    user = make_user(email="staff3@example.com", phone="0913000003")
    pharmacy = make_pharmacy(staff=[user], name="صيدلية الموظفين")
    medicine, inv = seed_medicine(pharmacy=pharmacy, name="دواء للحذف")
    token = make_token(user, role="staff", pharmacy_id=pharmacy.id)

    res = client.delete(
        f"/api/pharmacies/{pharmacy.id}/inventory/{inv.id}",
        headers=bearer(token),
    )
    assert res.status_code == 403


def test_staff_cannot_update_visibility(client, make_user, make_pharmacy, make_token, seed_medicine):
    user = make_user(email="staff4@example.com", phone="0913000004")
    pharmacy = make_pharmacy(staff=[user], name="صيدلية الظهور")
    medicine, inv = seed_medicine(pharmacy=pharmacy, name="دواء للإخفاء")
    token = make_token(user, role="staff", pharmacy_id=pharmacy.id)

    res = client.patch(
        f"/api/pharmacies/{pharmacy.id}/inventory/{inv.id}/visibility",
        headers=bearer(token),
        json={"is_active": False},
    )
    assert res.status_code == 403


# =========================================================
# المستخدم العادي
# =========================================================

def test_plain_user_cannot_access_inventory(client, make_user, make_token, make_pharmacy):
    user = make_user(email="customer@example.com", phone="0914000001")
    pharmacy = make_pharmacy(name="صيدلية مغلقة أمام الجمهور")
    token = make_token(user)

    res = client.get(
        f"/api/pharmacies/{pharmacy.id}/inventory",
        headers=bearer(token),
    )
    assert res.status_code == 403


# =========================================================
# صلاحية الفصل بين الصيدليات
# =========================================================

def test_owner_cannot_access_other_pharmacy(client, make_user, make_pharmacy, make_token):
    user = make_user(email="two-pharm@example.com", phone="0915000001")
    own = make_pharmacy(owner=user, name="صيدليتي")
    other = make_pharmacy(name="صيدلية الغير")
    token = make_token(user, role="owner", pharmacy_id=own.id)

    res = client.get(
        f"/api/pharmacies/{other.id}/inventory",
        headers=bearer(token),
    )
    assert res.status_code == 403

    res = client.patch(
        f"/api/pharmacies/{other.id}/status",
        headers=bearer(token),
    )
    assert res.status_code == 403


# =========================================================
# السوبر أدمن
# =========================================================

def test_superadmin_can_access_admin_stats(client, make_user, make_token):
    admin = make_user(email="super@example.com", phone="0916000001", superadmin=True)
    token = make_token(admin, role="superadmin")

    res = client.get("/api/admin/stats", headers=bearer(token))
    assert res.status_code == 200
    assert "medicines" in res.json()


def test_non_superadmin_cannot_access_admin_stats(client, make_user, make_token):
    user = make_user(email="not-super@example.com", phone="0916000002")
    token = make_token(user)

    res = client.get("/api/admin/stats", headers=bearer(token))
    assert res.status_code == 403


def test_superadmin_can_list_pending_requests(client, make_user, make_token):
    admin = make_user(email="super2@example.com", phone="0916000003", superadmin=True)
    token = make_token(admin, role="superadmin")

    res = client.get("/api/pharmacy-requests/?status=pending", headers=bearer(token))
    assert res.status_code == 200


def test_superadmin_can_list_regions(client, make_user, make_token):
    admin = make_user(email="super3@example.com", phone="0916000004", superadmin=True)
    token = make_token(admin, role="superadmin")

    res = client.get("/api/admin/regions", headers=bearer(token))
    assert res.status_code == 200


# =========================================================
# بوابة تغيير كلمة المرور (MUST_CHANGE_PASSWORD)
# =========================================================

def test_dashboard_blocked_until_password_changed(client, make_user, make_token, make_pharmacy):
    user = make_user(email="gate1@example.com", password="OldPass123!", must_change_password=True)
    pharmacy = make_pharmacy(owner=user, name="صيدلية البوابة")
    token = make_token(user, role="owner", pharmacy_id=pharmacy.id)

    res = client.get(
        f"/api/pharmacies/{pharmacy.id}/inventory",
        headers=bearer(token),
    )
    assert res.status_code == 428
    assert res.json()["detail"] == "MUST_CHANGE_PASSWORD"

    # تغيير كلمة المرور يرفع البوابة
    res = client.post(
        "/api/auth/change-password",
        headers=bearer(token),
        json={"current_password": "OldPass123!", "new_password": "NewPass123!"},
    )
    assert res.status_code == 200

    res = client.get(
        f"/api/pharmacies/{pharmacy.id}/inventory",
        headers=bearer(token),
    )
    assert res.status_code == 200


def test_dashboard_not_blocked_when_password_already_changed(client, owner_context):
    res = client.get(
        f"/api/pharmacies/{owner_context['pharmacy'].id}/inventory",
        headers=bearer(owner_context["token"]),
    )
    assert res.status_code == 200