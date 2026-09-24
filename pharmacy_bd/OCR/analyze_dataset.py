import io
import json
import sys
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

dataset = Path("OCR/dataset")

files = [p for p in dataset.glob("*.json") if p.name != "images.json"]

print(f"{'Image':<12} {'Matched':<8} {'Unmatched':<9} {'Top Conf':<10} {'Best Med':<22} {'OCR-lines'}")
print("=" * 85)

for f in sorted(files, key=lambda p: int(p.stem) if p.stem.isdigit() else 9999):
    try:
        d = json.loads(f.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"{f.name:<12} ERROR: {exc}")
        continue

    matched = d.get("matched_medicines", [])
    unmatched = d.get("unmatched_medicine_lines", [])

    top_conf = max((m.get("match_score", 0) for m in matched), default=0)
    best = max(
        ((m.get("match_score", 0), m.get("medicine_name", "")) for m in matched),
        default=(0, "-"),
    )
    items = d.get("items", [])
    n_ocr = len(items)

    print(
        f"{f.name:<12} {len(matched):<8} {len(unmatched):<9} "
        f"{round(top_conf*100):<10} {best[1]:<22} {n_ocr}"
    )

print("\n--- تفاصيل الصور بدون نتائج ---")
for f in sorted(files, key=lambda p: int(p.stem) if p.stem.isdigit() else 9999):
    d = json.loads(f.read_text(encoding="utf-8"))
    matched = d.get("matched_medicines", [])
    if not matched:
        items = d.get("items", [])
        texts = [it.get("text", "") for it in items]
        print(f"\n{f.name}: OCR قرأ {len(texts)} سطر")
        for t in texts[:12]:
            print(f"   [{t}]")