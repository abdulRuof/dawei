import io
import json
import sys
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

BASE = "http://localhost:8000"


def get(path):
    with urllib.request.urlopen(BASE + path) as r:
        return json.loads(r.read().decode("utf-8"))


meds = get("/api/medicines")
print("medicines count:", meds["count"])

first = meds["results"][0]
print("sample keys:", sorted(first.keys()))
print("sample:", json.dumps({k: first[k] for k in ("id", "name", "category_id", "category_name")}, ensure_ascii=False))
print("pharmacies sample:", json.dumps(first["pharmacies"][:2], ensure_ascii=False))

with_ph = sum(1 for m in meds["results"] if m["pharmacies"])
print("medicines with >=1 pharmacy:", with_ph)

s = get("/api/medicines/search?q=بندول")
print("search بندول:", json.dumps([m["id"] for m in s["results"]], ensure_ascii=False))

d = get("/api/medicines/9")
print("drug id=9:", json.dumps({k: d[k] for k in ("name", "category_name", "generic_name")}, ensure_ascii=False), "| pharmacies:", len(d["pharmacies"]))

ph = get("/api/pharmacies/")
print("pharmacies count:", ph["count"])
print("pharmacies:", json.dumps([p["name"] for p in ph["results"]], ensure_ascii=False))

pd = get("/api/pharmacies/2")
print("pharmacy 2:", json.dumps({k: pd[k] for k in ("name", "city", "medicines_count")}, ensure_ascii=False))
print("  first med:", json.dumps(pd["medicines"][0], ensure_ascii=False))