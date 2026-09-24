"""
يبني قاموس أسماء الأدوية المحلية/الإقليمية من ويكيبيديا (Wikidata):

- لكل منتج دوائي (خاصية P3781 "has active ingredient")
  نأخذ: الاسم التجاري (itemLabel) + المادة الفعالة (ingLabel) + رمز ATC.

الناتج: OCR/wikidata_drug_aliases.json
        (بنية مطابقة لـ local_drug_aliases.json — لا يُحرَّر يدوياً).

التشغيل:
    OCR\\ocr-venv\\Scripts\\python.exe OCR\\build_wikidata_dict.py

يتطلب اتصالاً بالإنترنت (نقطة SPARQL العامة) ولا يحتاج مكتبات خارجية.
"""

import io
import json
import ssl
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

_ssl_ctx = ssl.create_default_context()
_ssl_ctx.check_hostname = False
_ssl_ctx.verify_mode = ssl.CERT_NONE  # بعض البيئات تحوي شهادات CA منتهية الصلاحية

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

OUT = Path(__file__).resolve().parent / "wikidata_drug_aliases.json"

SPARQL_QUERY = """
SELECT DISTINCT ?item ?itemLabel ?itemLabelAr ?ing ?ingLabel ?atc WHERE {
  ?item wdt:P3781 ?ing .
  ?ing wdt:P267 ?atc .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,ar". }
}
"""


def fetch(query: str) -> dict:
    url = "https://query.wikidata.org/sparql?" + urllib.parse.urlencode(
        {"query": query, "format": "json"}
    )
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "PharmacyOCR/1.0 (medicine-dictionary-builder)"},
    )
    with urllib.request.urlopen(req, timeout=180, context=_ssl_ctx) as resp:
        return json.load(resp)


def is_arabic(text: str) -> bool:
    return any("\u0600" <= ch <= "\u06ff" for ch in text)


def norm(text: str) -> str:
    return " ".join(text.lower().split())


def main():
    print("جارٍ تنزيل أدوية ويكيبيديا (Wikidata)...", flush=True)

    try:
        data = fetch(SPARQL_QUERY)
    except Exception as exc:
        print(f"فشل الاتصال بويكيبيديا: {exc}", flush=True)
        sys.exit(1)

    rows = data["results"]["bindings"]
    print(f"تم جلب {len(rows)} صفاً", flush=True)

    drugs = {}

    for b in rows:
        def value(key: str) -> str:
            return b.get(key, {}).get("value", "")

        brand = value("itemLabel")
        brand_ar = value("itemLabelAr")
        generic = value("ingLabel")
        atc = value("atc")

        if not brand or not generic:
            continue

        # تخطّي العناصر التي اسم منتجها == اسم المادة (ضجيج: sulfur→sulfur...)
        if norm(brand) == norm(generic):
            continue

        key = (norm(brand), norm(generic))

        if key in drugs:
            if atc and atc not in drugs[key]["atc_codes"]:
                drugs[key]["atc_codes"].append(atc)
            continue

        aliases = [brand.lower()]
        if " " in brand:
            aliases.append(brand.lower().replace(" ", ""))
        if is_arabic(brand_ar) and norm(brand_ar) != norm(brand):
            aliases.append(brand_ar)

        # إزالة التكرار مع الحفاظ على الترتيب
        seen = set()
        unique_aliases = []
        for alias in aliases:
            if alias not in seen:
                seen.add(alias)
                unique_aliases.append(alias)

        drugs[key] = {
            "aliases": unique_aliases,
            "brand_name": brand,
            "generic_name": generic,
            "dosage_form": "",
            "active_ingredients": [generic.upper()],
            "atc_codes": [atc] if atc else [],
        }

    entries = list(drugs.values())
    entries.sort(key=lambda d: (d["generic_name"].lower(), d["brand_name"].lower()))

    payload = {
        "description": (
            "قاموس أدوية تلقائي من ويكيبيديا (Wikidata): كل منتج دوائي "
            "(خاصية P3781) باسمه التجاري ومادته الفعالة ورمز ATC. "
            "بُني عبر OCR/build_wikidata_dict.py ولا يُحرَّر يدوياً."
        ),
        "source": "https://query.wikidata.org/sparql",
        "built_at": datetime.now(timezone.utc).isoformat(),
        "drugs": entries,
    }

    OUT.write_text(
        json.dumps(payload, ensure_ascii=False, indent=1),
        encoding="utf-8",
    )

    print(f"كُتب {len(entries)} دواءً في {OUT}", flush=True)


if __name__ == "__main__":
    main()