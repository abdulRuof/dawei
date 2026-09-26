"""
سيناريوهات اختبار تحميل لمنصة دوائي (الباكند).

التشغيل:
    pip install locust
    locust -f loadtest/locustfile.py --host http://localhost:8000

ثم افتح http://localhost:8089  وابدأ الاختبار.
لمزيد من التفاصيل راجع loadtest/README.md
"""
from random import choice

from locust import HttpUser, between, task

SEARCH_QUERIES = [
    "بندول", "فولتارين", "Panadol", "Concor", "سيفيكس",
    "بروفين", "فيتامين سي", "أوغمنتين", "Nexium", "Aspirin",
    "جلوكوفاج", "ليبيتور", "زيلوريك", "Crestor", "دياميكرون",
]


class MarketplaceUser(HttpUser):
    wait_time = between(0.5, 2.5)

    pharmacy_ids: list[int] = []

    def on_start(self):
        if not MarketplaceUser.pharmacy_ids:
            resp = self.client.get("/api/pharmacies/")
            if resp.ok:
                MarketplaceUser.pharmacy_ids = [
                    p["id"] for p in resp.json().get("results", [])
                ]

    @task(30)
    def list_medicines(self):
        self.client.get("/api/medicines")

    @task(30)
    def search_medicines(self):
        self.client.get(
            "/api/medicines/search",
            params={"q": choice(SEARCH_QUERIES)},
        )

    @task(15)
    def pharmacy_detail(self):
        if MarketplaceUser.pharmacy_ids:
            self.client.get(f"/api/pharmacies/{choice(MarketplaceUser.pharmacy_ids)}")

    @task(15)
    def pharmacies_list(self):
        self.client.get("/api/pharmacies/")

    @task(5)
    def public_regions(self):
        self.client.get("/api/regions/")

    @task(2)
    def health(self):
        self.client.get("/")