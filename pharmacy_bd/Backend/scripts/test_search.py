# فحص سريع لنقطة البحث (بدون اختبارات آلية)
#   pharma venv python scripts\test_search.py

import io
import json
import sys
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

for q in ["Paracetamol", "باراسيتامول", "Coversyl"]:
    resp = client.get(f"/api/medicines/search", params={"q": q})
    print(f"\n=== q='{q}' -> {resp.status_code} ===")
    data = resp.json()
    for r in data.get("results", [])[:3]:
        print(
            f"  {r.get('id')} | {r.get('name')} | pharmacies={len(r.get('pharmacies', []))}"
        )
        for p in r.get("pharmacies", [])[:3]:
            print(f"    - pharmacy_id={p.get('pharmacy_id')} name={p.get('pharmacy_name')} city={p.get('city')} price={p.get('price')} avail={p.get('is_available')}")