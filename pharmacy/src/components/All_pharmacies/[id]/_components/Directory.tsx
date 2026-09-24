"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Pharmacy, imageUrl } from "@/lib/api";
import "./style1.css";

interface DirectoryProps {
  pharmacies: Pharmacy[];
  searchQuery: string;
  loading?: boolean;
}

const PAGE_SIZE = 8;

const bannerGradients = [
  "linear-gradient(120deg,#0F6E5C,#1FB496)",
  "linear-gradient(120deg,#0E3F35,#159A80)",
  "linear-gradient(120deg,#E24E36,#FF6B4A)",
  "linear-gradient(120deg,#159A80,#0B2E28)",
  "linear-gradient(120deg,#0F6E5C,#0B2E28)",
];

const logoGradients = [
  "linear-gradient(135deg,#0F6E5C,#1FB496)",
  "linear-gradient(135deg,#0E3F35,#159A80)",
  "linear-gradient(135deg,#E24E36,#FF6B4A)",
  "linear-gradient(135deg,#159A80,#0B2E28)",
  "linear-gradient(135deg,#0F6E5C,#0B2E28)",
];

const getInitials = (name: string) => {
  if (!name) return "ص";
  const parts = name.replace("صيدلية", "").trim().split(" ");
  return (parts[0] || name).slice(0, 2);
};

const LocationIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13">
    <path
      fill="currentColor"
      d="M12 2c-4.1 0-7.5 3.4-7.5 7.5C4.5 15.5 12 22 12 22s7.5-6.5 7.5-12.5C19.5 5.4 16.1 2 12 2Zm0 10.2a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4Z"
    />
  </svg>
);

const Directory: React.FC<DirectoryProps> = ({
  pharmacies,
  searchQuery,
  loading,
}) => {
  const [selectedCity, setSelectedCity] = useState("الكل");
  const [openOnly, setOpenOnly] = useState(false);
  const [sortOption, setSortOption] = useState("name");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const cities = useMemo(() => {
    const found = new Set<string>();
    pharmacies.forEach((p) => {
      if (p.city) found.add(p.city);
    });
    return Array.from(found);
  }, [pharmacies]);

  const filteredPharmacies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const list = pharmacies.filter((p) => {
      const matchesCity = selectedCity === "الكل" || p.city === selectedCity;
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.city ?? "").toLowerCase().includes(q);
      const matchesOpen = !openOnly || p.is_open;
      return matchesCity && matchesQuery && matchesOpen;
    });

    if (sortOption === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name, "ar"));
    }

    return list;
  }, [pharmacies, searchQuery, selectedCity, openOnly, sortOption]);

  const visiblePharmacies = filteredPharmacies.slice(0, visibleCount);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setVisibleCount(PAGE_SIZE);
  };

  const handleReset = () => {
    setSelectedCity("الكل");
    setOpenOnly(false);
    setSortOption("name");
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <section className="section">
      <div className="container catalog-layout">
        <aside className={`filters ${isFiltersOpen ? "is-open" : ""}`} id="filtersPanel">
          <div className="filters__head">
            <h3>الفلاتر</h3>
            <button className="filters__reset" id="resetFilters" onClick={handleReset}>
              إعادة تعيين
            </button>
          </div>

          <div className="filter-group">
            <span className="filter-group__title">المدينة</span>
            <div className="filter-options" id="cityOptions">
              {[
                { label: "كل المدن", value: "الكل" },
                ...cities.map((c) => ({ label: c, value: c })),
              ].map((c) => (
                <label key={c.value} className="filter-check">
                  <input
                    type="radio"
                    name="city"
                    value={c.value}
                    checked={selectedCity === c.value}
                    onChange={(e) => handleCityChange(e.target.value)}
                  />
                  <span>{c.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-group__title">حالة العمل</span>
            <label className="filter-check">
              <input
                type="checkbox"
                id="openOnly"
                checked={openOnly}
                onChange={(e) => {
                  setOpenOnly(e.target.checked);
                  setVisibleCount(PAGE_SIZE);
                }}
              />
              <span>عرض المفتوحة الآن فقط</span>
            </label>
          </div>
        </aside>

        <div className="catalog-results">
          <div className="results-toolbar">
            <div className="chip-row" id="chipRow">
              <button
                className={`chip ${selectedCity === "الكل" ? "is-active" : ""}`}
                onClick={() => handleCityChange("الكل")}
              >
                كل المدن
              </button>
              {cities.map((c) => (
                <button
                  key={c}
                  className={`chip ${selectedCity === c ? "is-active" : ""}`}
                  onClick={() => handleCityChange(c)}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="sort-row">
              <button
                className="filters-toggle"
                id="filtersToggle"
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
                <option value="name">الاسم (أ - ي)</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p className="empty-state">جارٍ تحميل الصيدليات…</p>
          ) : (
            <>
              <div className="pharm-grid" id="pharmGrid">
                {visiblePharmacies.map((p, i) => {
                  const banner = bannerGradients[i % bannerGradients.length];
                  const logo = logoGradients[i % logoGradients.length];

                  return (
                    <article className="pharm-card" key={p.id}>
                      <div
                        className="pharm-card__banner"
                        style={
                          p.image_url
                            ? {
                                backgroundImage: `url(${imageUrl(p.image_url)})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }
                            : { background: banner }
                        }
                      >
                        <span className={`pharm-card__status ${p.is_open ? "" : "closed"}`}>
                          {p.is_open ? "مفتوحة الآن" : "مغلقة حاليًا"}
                        </span>
                      </div>
                      <span className="pharm-card__logo" style={{ background: logo }}>
                        {getInitials(p.name)}
                      </span>
                      <div className="pharm-card__body">
                        <div className="pharm-card__name">{p.name}</div>
                        <div className="pharm-card__loc">
                          <LocationIcon />
                          <span>
                            {p.city ?? "—"}
                            {p.address ? ` — ${p.address}` : ""}
                          </span>
                        </div>
                        {p.description && (
                          <div className="pharm-card__tags">
                            <span className="pharm-card__tag">{p.description}</span>
                          </div>
                        )}
                        <Link href={`/pharmacies/${p.id}`} className="pharm-card__cta">
                          عرض التفاصيل
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>

              {filteredPharmacies.length === 0 && (
                <p className="empty-state" id="emptyState">
                  لا توجد صيدليات مطابقة لبحثك أو الفلاتر المحددة.
                </p>
              )}

              {visibleCount < filteredPharmacies.length && (
                <div className="load-more-wrap">
                  <button
                    className="btn btn--outline"
                    id="loadMoreBtn"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  >
                    عرض المزيد من الصيدليات
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default Directory;