"""اختبارات المسارات العامة: الأدوية (بحث/ملف/مقارنة) والصيدليات."""
import pytest


@pytest.fixture()
def catalog(make_pharmacy, seed_medicine):
    """صيدليتان تقدّمان الدواء نفسه بأسعار مختلفة."""
    ph1 = make_pharmacy(name="صيدلية النجاح", city="سبها")
    ph2 = make_pharmacy(name="صيدلية البركة", city="طرابلس")
    seed_medicine(pharmacy=ph1, name="بانادول", generic_name="Paracetamol", price=5.0, qty=20)
    seed_medicine(pharmacy=ph2, name="بانادول", generic_name="Paracetamol", price=4.5, qty=5)
    return {"ph1": ph1, "ph2": ph2}


def test_medicines_list(client, catalog, make_pharmacy):
    res = client.get("/api/medicines")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] == 1
    med = data["results"][0]
    assert med["name"] == "بانادول"
    assert med["category_name"] == "مسكنات"
    assert len(med["pharmacies"]) == 2
    prices = {p["pharmacy_name"]: p["price"] for p in med["pharmacies"]}
    assert prices["صيدلية البركة"] == 4.5
    assert prices["صيدلية النجاح"] == 5.0


def test_medicines_search_by_generic(client, catalog):
    res = client.get("/api/medicines/search", params={"q": "paracet"})
    assert res.status_code == 200
    results = res.json()["results"]
    assert len(results) == 1
    assert results[0]["generic_name"].lower() == "paracetamol"


def test_medicines_search_short_query(client):
    res = client.get("/api/medicines/search", params={"q": "a"})
    assert res.status_code == 422


def test_medicine_detail(client, catalog):
    res = client.get("/api/medicines/1")
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "بانادول"
    assert len(data["pharmacies"]) == 2


def test_medicine_detail_not_found(client):
    res = client.get("/api/medicines/99999")
    assert res.status_code == 200
    assert "message" in res.json()


def test_inactive_inventory_hidden_from_public(client, make_pharmacy, seed_medicine):
    pharmacy = make_pharmacy(name="صيدلية مخفية المخزون")
    seed_medicine(pharmacy=pharmacy, name="بانادول", is_active=False)

    res = client.get("/api/medicines")
    med = res.json()["results"][0]
    assert med["pharmacies"] == []


def test_inactive_region_pharmacy_hidden(client, make_pharmacy, seed_medicine, db):
    from app.models.region import Region

    active_region = Region(name="سبها", is_active=True)
    inactive_region = Region(name="منطقة موقوفة", is_active=False)
    db.add_all([active_region, inactive_region])
    db.commit()

    ph_active = make_pharmacy(name="صيدلية المنطقة النشطة", city="سبها")
    ph_active.region_id = active_region.id
    ph_hidden = make_pharmacy(name="صيدلية المنطقة الموقوفة", city="بنغازي")
    ph_hidden.region_id = inactive_region.id
    db.commit()

    seed_medicine(pharmacy=ph_active, name="فيبوربوفين", generic_name="Ibuprofen")
    seed_medicine(pharmacy=ph_hidden, name="فيبوربوفين", generic_name="Ibuprofen")

    res = client.get("/api/medicines")
    med = res.json()["results"][0]
    assert [p["pharmacy_name"] for p in med["pharmacies"]] == ["صيدلية المنطقة النشطة"]


def test_pharmacies_list(client, catalog):
    res = client.get("/api/pharmacies/")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] == 2
    names = {p["name"] for p in data["results"]}
    assert names == {"صيدلية النجاح", "صيدلية البركة"}


def test_pharmacy_detail(client, catalog):
    ph_id = catalog["ph1"].id
    res = client.get(f"/api/pharmacies/{ph_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "صيدلية النجاح"
    assert data["medicines_count"] == 1
    assert data["medicines"][0]["price"] == 5.0


def test_pharmacy_detail_not_found(client):
    res = client.get("/api/pharmacies/99999")
    assert res.status_code == 404


def test_reviews_public_listing(client, make_user, make_token, make_pharmacy):
    user = make_user(email="reviewer@example.com", phone="0917000001")
    pharmacy = make_pharmacy(name="صيدلية المقيمين")

    # تعليق بدون مصادقة مرفوض
    res = client.post("/api/reviews", json={"pharmacy_id": pharmacy.id, "rating": 5})
    assert res.status_code == 401

    token = make_token(user)
    res = client.post(
        "/api/reviews",
        headers={"Authorization": f"Bearer {token}"},
        json={"pharmacy_id": pharmacy.id, "rating": 5},
    )
    assert res.status_code == 200

    res = client.get(f"/api/pharmacies/{pharmacy.id}/reviews")
    assert res.status_code == 200
    assert res.json()["count"] == 1
    assert res.json()["average_rating"] == 5.0