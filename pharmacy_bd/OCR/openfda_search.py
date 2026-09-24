import requests
from urllib.parse import quote


# =========================================================
# إعدادات OpenFDA
# =========================================================

BASE_URL = "https://api.fda.gov/drug/ndc.json"


# =========================================================
# البحث عن دواء
# =========================================================

def search_medicine(query, limit=10):

    query = query.strip()

    if not query:
        return []


    # -----------------------------------------------------
    # البحث في brand_name أو generic_name
    # -----------------------------------------------------

    search_query = (
        f'brand_name:"{query}" '
        f'OR generic_name:"{query}"'
    )


    params = {
        "search": search_query,
        "limit": limit
    }


    try:

        response = requests.get(
            BASE_URL,
            params=params,
            timeout=10
        )


        # -------------------------------------------------
        # إذا لم توجد نتائج
        # -------------------------------------------------

        if response.status_code == 404:
            return []


        response.raise_for_status()


        data = response.json()


    except requests.RequestException as e:

        print(f"خطأ في الاتصال بـ openFDA: {e}")

        return []


    # =====================================================
    # تجهيز النتائج
    # =====================================================

    results = []


    for item in data.get("results", []):

        result = {

            "brand_name": item.get(
                "brand_name"
            ),

            "generic_name": item.get(
                "generic_name"
            ),

            "active_ingredients": item.get(
                "active_ingredients", []
            ),

            "dosage_form": item.get(
                "dosage_form"
            ),

            "route": item.get(
                "route", []
            ),

            "labeler_name": item.get(
                "labeler_name"
            ),

            "product_ndc": item.get(
                "product_ndc"
            )

        }


        results.append(result)


    return results


# =========================================================
# اختبار السكربت
# =========================================================

if __name__ == "__main__":

    print("=" * 60)
    print("OpenFDA Medicine Search")
    print("=" * 60)


    query = input(
        "\nاكتب اسم الدواء للبحث: "
    ).strip()


    results = search_medicine(query)


    print("\n" + "=" * 60)
    print("النتائج")
    print("=" * 60)


    if not results:

        print("لم يتم العثور على نتائج.")


    else:

        for index, medicine in enumerate(
            results,
            start=1
        ):

            print(f"\n[{index}]")

            print(
                "Brand:",
                medicine["brand_name"]
            )

            print(
                "Generic:",
                medicine["generic_name"]
            )

            print(
                "Dosage form:",
                medicine["dosage_form"]
            )

            print(
                "Route:",
                ", ".join(
                    medicine["route"]
                )
            )

            print(
                "Manufacturer:",
                medicine["labeler_name"]
            )

            print(
                "NDC:",
                medicine["product_ndc"]
            )

            print("-" * 40)