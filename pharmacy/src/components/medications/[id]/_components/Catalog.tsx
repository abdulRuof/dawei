"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { isAvailable, Medicine, minPrice, imageUrl } from "@/lib/api";
import "./style.css";

const PAGE_SIZE = 8;

interface CatalogProps {
  medicines: Medicine[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  initialCategory?: string | null;
}

const Catalog: React.FC<CatalogProps> = ({
  medicines,
  loading,
  searchQuery,
  onSearchChange,
  initialCategory,
}) => {
  const [selectedCat, setSelectedCat] = useState(initialCategory ?? "الكل");
  const [selectedPrice, setSelectedPrice] = useState("الكل");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortOption, setSortOption] = useState("default");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [openPharmacies, setOpenPharmacies] = useState<Record<number, boolean>>({});
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const categories = useMemo(() => {
    const found = new Map<string, string | null>();
    medicines.forEach((m) => {
      if (m.category_name) found.set(m.category_name, m.category_name);
    });
    return Array.from(found.keys());
  }, [medicines]);

  const filteredMedicines = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const list = medicines.filter((m) => {
      const matchesCat = selectedCat === "الكل" || m.category_name === selectedCat;
      const matchesQuery =
        !q ||
        m.name.toLowerCase().includes(q) ||
        (m.generic_name ?? "").toLowerCase().includes(q);
      const matchesStock = !inStockOnly || isAvailable(m);
      let matchesPrice = true;

      if (selectedPrice !== "الكل") {
        const [min, max] = selectedPrice.split("-").map(Number);
        const p = minPrice(m);
        matchesPrice = p != null && p >= min && p <= max;
      }

      return matchesCat && matchesQuery && matchesStock && matchesPrice;
    });

    if (sortOption === "price-asc")
      list.sort((a, b) => (minPrice(a) ?? Infinity) - (minPrice(b) ?? Infinity));
    else if (sortOption === "price-desc")
      list.sort((a, b) => (minPrice(b) ?? -Infinity) - (minPrice(a) ?? -Infinity));
    else if (sortOption === "name")
      list.sort((a, b) => a.name.localeCompare(b.name, "ar"));

    return list;
  }, [medicines, searchQuery, selectedCat, selectedPrice, inStockOnly, sortOption]);

  const visibleMedicines = filteredMedicines.slice(0, visibleCount);

  const handleCategoryChange = (cat: string) => {
    setSelectedCat(cat);
    setVisibleCount(PAGE_SIZE);
  };

  const handleReset = () => {
    onSearchChange("");
    setSelectedCat("الكل");
    setSelectedPrice("الكل");
    setInStockOnly(false);
    setSortOption("default");
    setVisibleCount(PAGE_SIZE);
  };

  const togglePharmList = (id: number) => {
    setOpenPharmacies((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="catalog-section">
      <div className="container catalog-layout">

        <aside className={`filters ${isFiltersOpen ? "is-open" : ""}`} id="filtersPanel">
          <div className="filters__head">
            <h3>الفلاتر</h3>
            <button className="filters__reset" onClick={handleReset}>
              إعادة تعيين
            </button>
          </div>

          <div className="filter-group">
            <span className="filter-group__title">التصنيف</span>
            <div className="filter-options">
              {["الكل", ...categories].map((cat) => (
                <label key={cat} className="filter-check">
                  <input
                    type="radio"
                    name="cat"
                    value={cat}
                    checked={selectedCat === cat}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-group__title">السعر</span>
            <div className="filter-options">
              {[
                { label: "كل الأسعار", value: "الكل" },
                { label: "أقل من 10 د.ل", value: "0-10" },
                { label: "10 – 25 د.ل", value: "10-25" },
                { label: "أكثر من 25 د.ل", value: "25-1000" },
              ].map((p) => (
                <label key={p.value} className="filter-check">
                  <input
                    type="radio"
                    name="price"
                    value={p.value}
                    checked={selectedPrice === p.value}
                    onChange={(e) => {
                      setSelectedPrice(e.target.value);
                      setVisibleCount(PAGE_SIZE);
                    }}
                  />
                  <span>{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-group__title">التوفر</span>
            <label className="filter-check">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => {
                  setInStockOnly(e.target.checked);
                  setVisibleCount(PAGE_SIZE);
                }}
              />
              <span>عرض المتوفر فقط</span>
            </label>
          </div>
        </aside>

        <div className="catalog-results">
          <div className="results-toolbar">
            <div className="chip-row" id="chipRow">
              <button
                className={`chip ${selectedCat === "الكل" ? "is-active" : ""}`}
                onClick={() => handleCategoryChange("الكل")}
              >
                الكل
              </button>
              {categories.slice(0, 6).map((cat) => (
                <button
                  key={cat}
                  className={`chip ${selectedCat === cat ? "is-active" : ""}`}
                  onClick={() => handleCategoryChange(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="sort-row">
              <button
                className="filters-toggle"
                onClick={() => setIsFiltersOpen((prev) => !prev)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M4 6h16v2H4V6Zm3 5h10v2H7v-2Zm4 5h2v2h-2v-2Z" />
                </svg>
                الفلاتر
              </button>
              <label htmlFor="sortSelect">ترتيب حسب</label>
              <select
                id="sortSelect"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="default">الافتراضي</option>
                <option value="price-asc">السعر: الأقل أولًا</option>
                <option value="price-desc">السعر: الأعلى أولًا</option>
                <option value="name">الاسم (أ - ي)</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p className="empty-state">جارٍ تحميل الأدوية…</p>
          ) : visibleMedicines.length > 0 ? (
            <div className="med-grid" id="medGrid">
              {visibleMedicines.map((medicine) => {
                const available = isAvailable(medicine);
                const price = minPrice(medicine);

                return (
                  <article className="catalog-med-card" key={medicine.id}>
                    <div className="catalog-med-card__top">
                      <span className="catalog-med-card__icon">
                        {medicine.image_url ? (
                          <img
                            src={imageUrl(medicine.image_url) ?? ""}
                            alt={medicine.name}
                            loading="lazy"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: "inherit",
                            }}
                          />
                        ) : (
                          <svg viewBox="0 0 24 24" width="40" height="40">
                            <path
                              fill="currentColor"
                              d="M4.9 19.1a5.2 5.2 0 0 1 0-7.35l6.85-6.85a5.2 5.2 0 1 1 7.35 7.35l-6.85 6.85a5.2 5.2 0 0 1-7.35 0Zm3.68-9.6-3.03 3.03a3.2 3.2 0 0 0 4.52 4.52l3.03-3.03-4.52-4.52Z"
                            />
                          </svg>
                        )}
                      </span>

                      <span className={`catalog-med-card__stock ${available ? "" : "out"}`}>
                        {available ? "متوفر" : "غير متوفر"}
                      </span>
                    </div>

                    <span className="catalog-med-card__cat">
                      {medicine.category_name ?? "عام"}
                    </span>

                    <Link
                      href={`/drugs/${medicine.id}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <div className="catalog-med-card__name">{medicine.name}</div>
                    </Link>

                    <div className="catalog-med-card__meta">
                      {medicine.generic_name ?? "دواء متوفر"}
                    </div>

                    <div className="catalog-med-card__foot">
                      <span className="catalog-med-card__price">
                        {price != null ? `${formatPrice(price)} د.ل` : "غير متوفر"}
                      </span>
                    </div>

                    <button
                      className={`catalog-med-card__pharm-toggle ${openPharmacies[medicine.id] ? "is-open" : ""}`}
                      type="button"
                      onClick={() => togglePharmList(medicine.id)}
                    >
                      <span>الصيدليات المتوفرة ({medicine.pharmacies.length})</span>
                      <svg viewBox="0 0 24 24" width="14" height="14">
                        <path
                          fill="currentColor"
                          d="M12 15 6 9h12l-6 6Z"
                        />
                      </svg>
                    </button>

                    <ul
                      className={`catalog-med-card__pharm-list ${openPharmacies[medicine.id] ? "is-open" : ""}`}
                    >
                      {medicine.pharmacies.map((p) => (
                        <li key={p.pharmacy_id} className={p.is_available ? "" : "out"}>
                          <span>
                            <span className="pharm-name">{p.pharmacy_name}</span>
                            <span className="pharm-city">{p.city}</span>
                          </span>
                          <span className="pharm-price">
                            {p.is_available ? `${formatPrice(p.price)} د.ل` : "غير متوفر"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="empty-state" id="emptyState">
              لا توجد أدوية مطابقة لبحثك أو الفلاتر المحددة.
            </p>
          )}

          {!loading && visibleCount < filteredMedicines.length && (
            <div className="load-more-wrap">
              <button
                className="load-more-btn"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              >
                عرض المزيد من الأدوية
              </button>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};

function formatPrice(n: number): string {
  return n.toFixed(2).replace(/\.00$/, "");
}

export default Catalog;