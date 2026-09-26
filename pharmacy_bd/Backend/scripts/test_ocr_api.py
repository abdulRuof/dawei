# اختبار نقطة قراءة الوصفات من الصور
# الاستخدام:
#   venv\Scripts\python.exe Backend\scripts\test_ocr_api.py

import sys
import time
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)

IMAGE = Path(__file__).resolve().parents[2] / "OCR" / "images" / "phramcy" / "1.jpg"


def main():
    if not IMAGE.exists():
        print(f"الصورة غير موجودة: {IMAGE}")
        return

    start = time.time()

    with IMAGE.open("rb") as f:
        response = client.post(
            "/api/prescriptions/ocr",
            files={"image": (IMAGE.name, f, "image/jpeg")},
        )

    elapsed = round(time.time() - start, 2)

    print(f"TIME_ELAPSED_SECONDS={elapsed}")
    print(f"الحالة: {response.status_code}")

    if response.status_code != 200:
        print(response.text)
        return

    data = response.json()
    print(f"رسالة: {data['message']}")

    result = data["data"]
    medicines = result.get("matched_medicines", [])

    print(f"\nعدد الأدوية المطابقة: {len(medicines)}")
    for i, med in enumerate(medicines, 1):
        score = med.get("match_score", med.get("confidence", "-"))
        if isinstance(score, float):
            score = round(score * 100)

        print(
            f"  {i}. {med.get('medicine_name', med.get('name'))} "
            f"({score}%)  {med.get('dose', med.get('dosage_text', ''))}"
        )

    print(f"\nأسطر غير مطابقة: {len(result.get('unmatched_medicine_lines', []))}")


if __name__ == "__main__":
    main()