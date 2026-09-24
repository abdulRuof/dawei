"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getMedicines, getPharmacies, minPrice, Medicine } from "@/lib/api";
import "./style.css";

type SearchBarProps = {
  onSearch: (query: string) => void;
};

const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [pharmaciesCount, setPharmaciesCount] = useState<number>(0);

  useEffect(() => {
    const revealEls = document.querySelectorAll(".reveal");

    revealEls.forEach((el) => {
      el.classList.add("is-visible");
    });
  }, []);

  useEffect(() => {
    getMedicines()
      .then((res) => setMedicines(res.results))
      .catch(() => {
        setMedicines([]);
      });

    getPharmacies()
      .then((res) => setPharmaciesCount(res.count))
      .catch(() => {
        setPharmaciesCount(0);
      });
  }, []);

  const filteredMedicines = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return medicines
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.generic_name ?? "").toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [query, medicines]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    onSearch(query);

    setShowSuggest(false);
  };

  const handleSelectMedicine = (name: string) => {
    setQuery(name);
    setShowSuggest(false);

    onSearch(name);
  };

  const handleClear = () => {
    setQuery("");
    setShowSuggest(false);

    onSearch("");
  };

  return (
    <section className="hero">
      <div className="hero__deco" aria-hidden="true">
        <span className="plus plus--1"></span>
        <span className="plus plus--2"></span>
        <span className="plus plus--3"></span>
        <span className="dot dot--1"></span>
        <span className="dot dot--2"></span>
      </div>

      <div className="container hero__inner">

        <p className="hero__eyebrow reveal">
          أقرب صيدلية إليك… على بُعد نقرة
        </p>

        <h1 className="hero__title reveal">
          دواؤك في متناول يدك
        </h1>

        <p className="hero__subtitle reveal">
          ابحث عن اسم الدواء أو المادة الفعّالة، قارن بين الصيدليات القريبة،
          واطلب التوصيل لباب بيتك خلال دقائق.
        </p>

        <form
          className="search-capsule reveal"
          role="search"
          onSubmit={handleSubmit}
        >

          <button
            type="submit"
            className="search-capsule__submit"
            aria-label="بحث"
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d="m21 21-4.35-4.35M18.5 11a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <input
            type="text"
            className="search-capsule__input"
            placeholder="اكتب اسم الدواء… مثال: باراسيتامول"
            value={query}
            onChange={(e) => {
              const value = e.target.value;

              setQuery(value);
              setShowSuggest(value.trim().length > 0);
            }}
            autoComplete="off"
          />

          {query && (
            <button
              type="button"
              className="search-capsule__clear"
              aria-label="مسح البحث"
              onClick={handleClear}
            >
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path
                  fill="currentColor"
                  d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4l5.6 5.6 1.4-1.4L13.4 12l5.6-5.6L17.6 5 12 10.6 6.4 5Z"
                />
              </svg>
            </button>
          )}

          {showSuggest && (
            <div className="search-suggest">

              {filteredMedicines.length > 0 ? (

                filteredMedicines.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="search-suggest__item"
                    onClick={() => handleSelectMedicine(m.name)}
                  >
                    <span>{m.name}</span>

                    <span
                      style={{
                        marginInlineStart: "auto",
                        color: "var(--ink-soft)",
                        fontSize: ".8rem",
                      }}
                    >
                      {minPrice(m) != null ? `يبدأ من ${minPrice(m)} د.ل` : "—"}
                    </span>
                  </button>
                ))

              ) : (

                <div className="search-suggest__empty">
                  لا توجد أدوية مطابقة
                </div>

              )}

            </div>
          )}

        </form>

        <div className="chip-row reveal">
          {[
            "مسكنات الألم",
            "مضادات حيوية",
            "فيتامينات ومكملات",
            "أدوية القلب والضغط",
            "أمراض مزمنة",
            "المعدة والجهاز الهضمي",
          ].map((cat) => (
            <Link
              key={cat}
              href={`/medications?cat=${encodeURIComponent(cat)}`}
              className="chip"
            >
              {cat}
            </Link>
          ))}
        </div>

        <div className="hero__stats reveal">

          <Link href="/medications" className="hero__stat-link" style={{ textDecoration: "none", color: "inherit" }}>
            <div>
              <strong>+{medicines.length}</strong>
              <span>دواء متوفر</span>
            </div>
          </Link>

          <div className="stat-sep"></div>

          <Link href="/Allpharmacies/1" className="hero__stat-link" style={{ textDecoration: "none", color: "inherit" }}>
            <div>
              <strong>+{pharmaciesCount}</strong>
              <span>صيدلية شريكة</span>
            </div>
          </Link>

          <div className="stat-sep"></div>

          <div>
            <strong>30 دقيقة</strong>
            <span>متوسط التوصيل</span>
          </div>

        </div>

      </div>
    </section>
  );
};

export default SearchBar;