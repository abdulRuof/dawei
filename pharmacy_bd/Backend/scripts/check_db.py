import io
import sys
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database.database import SessionLocal
from app.models.medicine import Medicine
from app.models.pharmacy import Pharmacy
from app.models.inventory import PharmacyInventory

db = SessionLocal()

print("medicines:", db.query(Medicine).count())
print("pharmacies:", db.query(Pharmacy).count())
print("inventory:", db.query(PharmacyInventory).count())

print("\n--- أول 15 دواء ---")
for m in db.query(Medicine).limit(15):
    print(f"{m.id} | {m.name} | {m.generic_name}")

print("\n--- أول 5 صيدليات ---")
for p in db.query(Pharmacy).limit(5):
    print(f"{p.id} | {p.name} | {p.city}")

print("\n--- أول 8 من المخزون ---")
for inv in db.query(PharmacyInventory).limit(8):
    print(f"{inv.medicine_id} | pharmacy={inv.pharmacy_id} | price={inv.price} | qty={inv.quantity} | avail={inv.is_available}")

# بحث عما يشبه أسماء الأدوية المطابقة من OCR
for q in ["Coversyl", "Norvasc", "Diamicron", "Crestor", "Plavix", "Colchicine", "Omeprazole"]:
    hits = db.query(Medicine).filter(
        Medicine.name.ilike(f"%{q}%") | Medicine.generic_name.ilike(f"%{q}%")
    ).all()
    print(f"\nبحث '{q}': {len(hits)} نتيجة")
    for h in hits:
        print(f"   {h.id} | {h.name} | {h.generic_name}")