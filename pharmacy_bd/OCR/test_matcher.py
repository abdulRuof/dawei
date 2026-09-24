# -*- coding: utf-8 -*-
"""
test_matcher.py
---------------
اختبارات آلية لمحرك مطابقة الأدوية (Medicine Matching Engine).

التشغيل:
    python OCR/test_matcher.py

كل حالة اختبار تحتوي:
    query      : نص OCR (قد يحتوي أخطاء قراءة)
    expected   : كلمة يجب أن تظهر في اسم أفضل نتيجة
    min_score  : الحد الأدنى المقبول لنسبة المطابقة

النتيجة النهائية: عدد الحالات الناجحة / الفاشلة
"""

import sys
from pathlib import Path

# إتاحة استيراد الموديول من نفس المجلد
sys.path.insert(0, str(Path(__file__).resolve().parent))

from medicine_matcher import MedicineMatcher


TEST_CASES = [
    # مثال من الملخص
    {
        "query": "r omeprazole ij 40mg",
        "expected": "omeprazole",
        "min_score": 85.0,
        "note": "مثال الملخص",
    },
    # سطور حقيقية من dataset (مع أخطاء OCR)
    {
        "query": "Ry Coversyl- plus 10/2-5 mg tab.",
        "expected": "coversyl",
        "min_score": 80.0,
        "note": "Coversyl Plus من dataset/1.json",
    },
    {
        "query": "R/ Noruasc 5 mg tab.",
        "expected": "norvasc",
        "min_score": 80.0,
        "note": "Norvasc (خطأ Noruasc)",
    },
    {
        "query": "R iamicron - 60 MR tab",
        "expected": "diamicron",
        "min_score": 80.0,
        "note": "Diamicron MR (خطأ iamicron)",
    },
    {
        "query": "Ry Crestor 10 mg tab.",
        "expected": "crestor",
        "min_score": 85.0,
        "note": "Crestor من dataset/1.json",
    },
    {
        "query": "Plavixtab.",
        "expected": "plavix",
        "min_score": 75.0,
        "note": "Plavix (ملتصق مع tab)",
    },
    {
        "query": "R Colchicinc 05 mg tab.",
        "expected": "colchicine",
        "min_score": 85.0,
        "note": "Colchicine (خطأ Colchicinc)",
    },
    # أسماء شائعة أخرى
    {
        "query": "panadol extra 650mg",
        "expected": "panadol",
        "min_score": 85.0,
        "note": "Panadol من القاموس المحلي",
    },
    {
        "query": "buscopan 10 mg tab",
        "expected": "buscopan",
        "min_score": 85.0,
        "note": "Buscopan من القاموس المحلي",
    },
    {
        "query": "augmentin 625 mg",
        "expected": "augmentin",
        "min_score": 80.0,
        "note": "Augmentin من القاموس المحلي",
    },
    # نص تعليمات لا يحتوي دواء -> يجب ألا ينتج نتيجة
    {
        "query": "فزصقبل الفظار بنصف ساعة",
        "expected": None,
        "min_score": 0.0,
        "note": "سطر تعليمات عربي بلا دواء",
    },
]


def main():

    matcher = MedicineMatcher()

    print("=" * 62)
    print("اختبار محرك مطابقة الأدوية")
    print(
        f"القاموس: {matcher.entry_count} سجل "
        f"(منها {matcher.entry_count - 49749} من القاموس المحلي)"
    )
    print("=" * 62)

    passed = 0
    failed = 0

    for case in TEST_CASES:

        query = case["query"]
        expected = case["expected"]
        min_score = case["min_score"]

        result = matcher.match(query)

        matches = result["matches"]

        if not matches:
            top_name, top_score = "", 0.0
        else:
            top = matches[0]
            top_name = (top["brand_name"] or top["generic_name"] or "").lower()
            top_score = top["match_score"]

        # -------------------------------------------------
        # تقييم الحالة
        # -------------------------------------------------

        if expected is None:

            # لا نتوقع أي تطابق -> النجاح هو عدم وجود نتيجة قوية
            ok = not matches

            status = "PASS" if ok else "FAIL"

        else:

            ok = (
                expected in top_name
                and top_score >= min_score
            )

            status = "PASS" if ok else "FAIL"

        if status == "PASS":
            passed += 1
        else:
            failed += 1

        print(f"\n[{status}] {query}")

        if matches:
            top = matches[0]
            name = top["brand_name"] or top["generic_name"]
            print(f"    أفضل نتيجة : {name}")
            print(f"    النسبة     : {top['match_score']}%  ({top['match_type']})")
        else:
            print("    أفضل نتيجة : (لا يوجد تطابق)")

        print(f"    المتوقع    : {expected}  ({case['note']})")

    print("\n" + "=" * 62)
    print(f"النتيجة: {passed} نجحت، {failed} فشلت")

    if failed:
        print("يوجد حالات فاشلة.")
        print("=" * 62)
        sys.exit(1)

    print("كل الاختبارات نجحت.")
    print("=" * 62)


if __name__ == "__main__":
    main()