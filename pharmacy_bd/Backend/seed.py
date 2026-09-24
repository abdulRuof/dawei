"""
تعبئة قاعدة البيانات ببيانات أساسية حقيقية (قابلة للتكرار الآمن):

- الفئات (مسكنات، مضادات حيوية، ...)
- الأدوية (45 دواءً شائعاً بالأسواق الليبية/العربية، بأسماء عربية)
- الصيدليات (صيدليات سبها)
- المخزون (أدوية × صيدليات بأسعار وكميات)

التشغيل:
    Backend\\venv\\Scripts\\python.exe Backend\\seed.py

آمن للتكرار: يتخطى أي فئة/دواء/صيدلية موجودة سابقاً، ويُضيف الباقي فقط.
"""

import sys
from decimal import Decimal

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, "Backend")

from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.category import Category
from app.models.medicine import Medicine
from app.models.pharmacy import Pharmacy
from app.models.inventory import PharmacyInventory


# =========================================================
# الفئات
# =========================================================

CATEGORIES = [
    "مسكنات الألم",
    "مضادات حيوية",
    "فيتامينات ومكملات",
    "أدوية القلب والضغط",
    "أمراض مزمنة",
    "المعدة والجهاز الهضمي",
    "أدوية الجلد والبشرة",
    "أدوية الحساسية والمناعة",
    "أدوية الأعصاب والمهدئات",
]

# =========================================================
# الأدوية: (اسم عربي, اسم تجاري للبحث/المرادفات, المادة الفعالة, الفئة, وصف)
# =========================================================

MEDICINES = [
    ("بندول", "Panadol", "Paracetamol", "مسكنات الألم", "مسكن للألم وخافض للحرارة"),
    ("فولتارين", "Voltaren", "Diclofenac Sodium", "مسكنات الألم", "مسكن ومضاد التهاب"),
    ("بروفين", "Brufen", "Ibuprofen", "مسكنات الألم", "مسكن ومضاد التهاب"),
    ("أنسيلاكوكس", "Anselacox", "Etoricoxib", "مسكنات الألم", "مسكن COX-2 لالتهاب المفاصل والنقرس"),
    ("كاتافلام", "Cataflam", "Diclofenac Potassium", "مسكنات الألم", "مسكن سريع المفعول"),
    ("أوغمنتين", "Augmentin", "Amoxicillin and Clavulanate", "مضادات حيوية", "مضاد حيوي واسع الطيف"),
    ("موكسيكلاف", "Moxiclav", "Amoxicillin and Clavulanate", "مضادات حيوية", "مضاد حيوي واسع الطيف"),
    ("أموكسيل", "Amoxil", "Amoxicillin", "مضادات حيوية", "مضاد حيوي بينيسيليني"),
    ("سيبروكسين", "Ciproxin", "Ciprofloxacin", "مضادات حيوية", "مضاد حيوي كينولوني"),
    ("زيثروماكس", "Zithromax", "Azithromycin", "مضادات حيوية", "مضاد حيوي ماكروليدي"),
    ("كلاسيد", "Klacid", "Clarithromycin", "مضادات حيوية", "مضاد حيوي ماكروليدي"),
    ("سيفيكس", "Cefix", "Cefixime", "مضادات حيوية", "سيفالوسبورين من الجيل الثالث"),
    ("فلاجيل", "Flagyl", "Metronidazole", "مضادات حيوية", "مضاد طفيليات وبكتيريا"),
    ("إيبيماج", "Epimag", "Magnesium Citrate", "فيتامينات ومكملات", "مكمل مغنيسيوم فوار"),
    ("مالتاك", "Multaq", "Dronedarone", "أدوية القلب والضغط", "لعلاج اضطراب نظم القلب"),
    ("كونكور", "Concor", "Bisoprolol Fumarate", "أدوية القلب والضغط", "حاصر بيتا لضغط الدم وقلب"),
    ("ديوفان", "Diovan", "Valsartan", "أدوية القلب والضغط", "مضاد مستقبلات أنجيوتنسين"),
    ("ميكارديس", "Micardis", "Telmisartan", "أدوية القلب والضغط", "مضاد مستقبلات أنجيوتنسين"),
    ("كوزار", "Cozaar", "Losartan Potassium", "أدوية القلب والضغط", "مضاد مستقبلات أنجيوتنسين"),
    ("ترايتاس", "Tritace", "Ramipril", "أدوية القلب والضغط", "مثبط ACE لضغط الدم"),
    ("رينيتك", "Renitec", "Enalapril Maleate", "أدوية القلب والضغط", "مثبط ACE لضغط الدم"),
    ("كابوتين", "Capoten", "Captopril", "أدوية القلب والضغط", "مثبط ACE لضغط الدم"),
    ("تنورمين", "Tenormin", "Atenolol", "أدوية القلب والضغط", "حاصر بيتا لضغط الدم"),
    ("لازيكس", "Lasix", "Furosemide", "أدوية القلب والضغط", "مدرّ بول لعلاج الوذمة"),
    ("أسبرين", "Aspirin", "Acetylsalicylic Acid", "أدوية القلب والضغط", "حماية قلبية ومميّع للدم"),
    ("كارديبرين", "Cardiprin", "Acetylsalicylic Acid", "أدوية القلب والضغط", "أسبرين وقائي للأوعية الدموية"),
    ("دياميكرون", "Diamicron MR", "Gliclazide", "أمراض مزمنة", "خافض لسكر الدم"),
    ("جلوكوفاج", "Glucophage", "Metformin", "أمراض مزمنة", "أول خط لعلاج السكري"),
    ("أماريل", "Amaryl", "Glimepiride", "أمراض مزمنة", "خافض لسكر الدم"),
    ("ليبيتور", "Lipitor", "Atorvastatin Calcium", "أمراض مزمنة", "خافض للكوليسترول"),
    ("زوكور", "Zocor", "Simvastatin", "أمراض مزمنة", "خافض للكوليسترول"),
    ("كريستور", "Crestor", "Rosuvastatin Calcium", "أمراض مزمنة", "خافض للكوليسترول"),
    ("زيلوريك", "Zyloric", "Allopurinol", "أمراض مزمنة", "لعلاج النقرس وارتفاع حمض اليوريك"),
    ("كوفرسيل", "Coversyl", "Perindopril", "أدوية القلب والضغط", "مثبط ACE لضغط الدم"),
    ("كوفرسيل بلس", "Coversyl Plus", "Perindopril and Indapamide", "أدوية القلب والضغط", "مثبط ACE + مدر للبول"),
    ("نكسيوم", "Nexium", "Esomeprazole", "المعدة والجهاز الهضمي", "مثبط مضخة البروتون"),
    ("لانزور", "Lanzor", "Lansoprazole", "المعدة والجهاز الهضمي", "مثبط مضخة البروتون"),
    ("زانتاك", "Zantac", "Ranitidine Hydrochloride", "المعدة والجهاز الهضمي", "مثبط مستقبلات H2"),
    ("فارولانت", "Varolant", "Metoclopramide", "المعدة والجهاز الهضمي", "مضاد للغثيان والقيء"),
    ("بوسكوبان", "Buscopan", "Hyoscine Butylbromide", "المعدة والجهاز الهضمي", "مضاد تشنجات المعدة والأمعاء"),
    ("جافيسكون", "Gaviscon", "Alginic Acid", "المعدة والجهاز الهضمي", "مضاد لحرقة المعدة والارتجاع"),
    ("ديرموفيت", "Dermovate", "Clobetasol Propionate", "أدوية الجلد والبشرة", "كورتيكوستيرويد موضعي قوي"),
    ("فينيرغان", "Phenergan", "Promethazine Hydrochloride", "أدوية الحساسية والمناعة", "مضاد هيستامين ومهدئ"),
    ("بلاكينيل", "Plaquenil", "Hydroxychloroquine", "أدوية الحساسية والمناعة", "لعلاج الأمراض المناعية والروماتيزم"),
    ("فاليوم", "Valium", "Diazepam", "أدوية الأعصاب والمهدئات", "مهدئ ومرخٍ للعضلات"),
]

# =========================================================
# الصيدليات (سبها)
# =========================================================

PHARMACIES = [
    ("صيدلية الشفاء", "شارع الجرّاح - وسط سبها", "0925501133", "سبها", 27.0176, 14.4287, True, "صيدلية عامة في قلب المدينة"),
    ("صيدلية النهضة", "حي النهضة - سبها", "0925502233", "سبها", 27.0276, 14.4187, True, "توفّر أدوية متنوعة مع خدمة توصيل"),
    ("صيدلية الأمل", "حي الجديدة - سبها", "0915503344", "سبها", 27.0076, 14.4387, True, "صيدلية عامة"),
    ("صيدلية ابن سينا", "شارع الاستاد - سبها", "0915504455", "سبها", 27.0256, 14.4357, True, "متخصصة في الأمراض المزمنة"),
    ("صيدلية الحياة", "شارع الجامعة - سبها", "0925505566", "سبها", 27.0206, 14.4407, True, "أسعار منافسة"),
    ("صيدلية الفجر", "حي الفجر - سبها", "0915506677", "سبها", 27.0126, 14.4157, False, "صيدلية عامة"),
    ("صيدلية الصداقة", "شارع المطار - سبها", "0925507788", "سبها", 27.0306, 14.4257, True, "توفّر مستلزمات طبية"),
]


# أسعار تقريبية بالدينار الليبي لكل مادة فعالة (تُستخدم للتعبئة)
PRICE_HINT = {
    "Paracetamol": 2.50, "Diclofenac Sodium": 3.00, "Diclofenac Potassium": 3.50,
    "Ibuprofen": 2.80, "Etoricoxib": 6.50, "Amoxicillin and Clavulanate": 9.00,
    "Amoxicillin": 4.00, "Ciprofloxacin": 3.50, "Azithromycin": 7.00,
    "Clarithromycin": 8.00, "Cefixime": 6.00, "Metronidazole": 2.20,
    "Magnesium Citrate": 8.00, "Dronedarone": 25.00, "Bisoprolol Fumarate": 5.00,
    "Valsartan": 5.50, "Telmisartan": 6.00, "Losartan Potassium": 4.00,
    "Ramipril": 4.50, "Enalapril Maleate": 3.20, "Captopril": 2.50,
    "Atenolol": 2.50, "Furosemide": 2.00, "Acetylsalicylic Acid": 1.50,
    "Gliclazide": 4.00, "Metformin": 2.50, "Glimepiride": 3.50,
    "Atorvastatin Calcium": 6.00, "Simvastatin": 5.00, "Rosuvastatin Calcium": 7.00,
    "Allopurinol": 2.80, "Perindopril": 5.00, "Perindopril and Indapamide": 7.00,
    "Esomeprazole": 5.50, "Lansoprazole": 4.50, "Ranitidine Hydrochloride": 3.00,
    "Metoclopramide": 2.20, "Hyoscine Butylbromide": 3.50, "Alginic Acid": 6.00,
    "Clobetasol Propionate": 7.50, "Promethazine Hydrochloride": 2.80,
    "Hydroxychloroquine": 10.00, "Diazepam": 3.00,
}


def _category(db: Session, name: str) -> Category:
    cat = db.query(Category).filter(Category.name == name).first()
    if not cat:
        cat = Category(name=name)
        db.add(cat)
        db.flush()
        print(f"  [+] فئة جديدة: {name}")
    return cat


def _pharmacy(db: Session, tuple_data) -> Pharmacy:
    name, address, phone, city, lat, lng, is_open, desc = tuple_data
    ph = db.query(Pharmacy).filter(Pharmacy.name == name).first()
    if not ph:
        ph = Pharmacy(
            name=name, address=address, phone=phone, city=city,
            latitude=lat, longitude=lng, is_open=is_open, description=desc,
        )
        db.add(ph)
        db.flush()
        print(f"  [+] صيدلية جديدة: {name}")
    return ph


def main():
    db = SessionLocal()
    try:
        print("=== الفئات ===")
        cat_map = {}
        for c in CATEGORIES:
            cat_map[c] = _category(db, c)

        print("=== الأدوية ===")
        med_rows = []
        for arabic, brand, generic, category, desc in MEDICINES:
            existing = (
                db.query(Medicine)
                .filter(Medicine.name == arabic)
                .first()
            )
            if existing:
                med_rows.append((existing, brand, generic, category))
                continue

            med = Medicine(
                name=arabic,
                generic_name=generic,
                description=desc,
                category_id=cat_map[category].id,
            )
            db.add(med)
            db.flush()
            print(f"  [+] دواء جديد: {arabic} ({generic})")
            med_rows.append((med, brand, generic, category))

        # معالجة التكرار القديم: صيدليتان باسم "صيدلية الشفاء" → إعادة تسمية الثانية
        shifaa = db.query(Pharmacy).filter(Pharmacy.name == "صيدلية الشفاء").order_by(Pharmacy.id).all()
        if len(shifaa) > 1:
            rename_to = "صيدلية النهضة"
            second = shifaa[1]
            second.name = rename_to
            db.flush()
            print(f"  [~] أُعيدت تسمية صيدلية مكررة إلى: {rename_to} (id={second.id})")

        print("=== الصيدليات ===")
        ph_rows = []
        for ph_tuple in PHARMACIES:
            ph_rows.append(_pharmacy(db, ph_tuple))

        print("=== المخزون ===")
        count = 0
        for idx, (med, brand, generic, category) in enumerate(med_rows):
            # كل دواء معروض في 2-3 صيدليات
            start = idx % len(ph_rows)
            for offset in range(min(3, len(ph_rows))):
                ph = ph_rows[(start + offset) % len(ph_rows)]
                existing_inv = (
                    db.query(PharmacyInventory)
                    .filter(
                        PharmacyInventory.medicine_id == med.id,
                        PharmacyInventory.pharmacy_id == ph.id,
                    )
                    .first()
                )
                if existing_inv:
                    continue

                base_price = PRICE_HINT.get(generic, 4.00)
                price = Decimal(str(round(base_price + (offset * 0.75), 2)))
                qty = 20 + (idx * 7) % 300

                db.add(PharmacyInventory(
                    pharmacy_id=ph.id,
                    medicine_id=med.id,
                    price=price,
                    quantity=qty,
                    is_available=True,
                ))
                count += 1

        db.commit()

        totals = {
            "categories": db.query(Category).count(),
            "medicines": db.query(Medicine).count(),
            "pharmacies": db.query(Pharmacy).count(),
            "inventory": db.query(PharmacyInventory).count(),
        }
        print("\n=== تم التعبئة بنجاح ===")
        print("الفئات:", totals["categories"])
        print("الأدوية:", totals["medicines"])
        print("الصيدليات:", totals["pharmacies"])
        print("صفوف المخزون:", totals["inventory"])
        print("(أُضيفت صفوف مخزون جديدة:", count, "بالفعل)")

    finally:
        db.close()


if __name__ == "__main__":
    main()