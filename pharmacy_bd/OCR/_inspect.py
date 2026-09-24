import io
import json
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

d = json.load(open("OCR/dataset/prescription.json", encoding="utf-8"))
print("image:", d.get("image"))
print("created_at:", d.get("created_at"))
print("matched:", len(d.get("matched_medicines", [])))
print("OCR lines:", len(d.get("items", [])))
for it in d.get("items", []):
    print(f"  [{it.get('text')}]  ({it.get('score')})")