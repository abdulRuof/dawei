"use client";

import React, { useState, useEffect } from "react";
import "./style.css";

// =========================================================
// Props Definition
// =========================================================
interface PageHeaderProps {
  totalMedicines?: number | string;
  totalPharmacies?: number | string;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
}

// =========================================================
// PageHeader Component
// =========================================================
const PageHeader: React.FC<PageHeaderProps> = ({
  totalMedicines = "—",
  totalPharmacies = "—",
  searchQuery,
  onSearchChange,
}) => {
  // حالة محلية للبحث في حال لم تُمَرَّر حالة من المكوّن الأب
  const [internalQuery, setInternalQuery] = useState("");

  const currentQuery = searchQuery !== undefined ? searchQuery : internalQuery;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setInternalQuery(value);
    }
  };

  // تفعيل تأثير الظهور (reveal on scroll) عند تحميل المكوّن
  useEffect(() => {
    const revealEls = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );

      revealEls.forEach((el) => observer.observe(el));
      return () => observer.disconnect();
    } else {
      revealEls.forEach((el) => el.classList.add("is-visible"));
    }
  }, []);

  return (
    <section className="catalog-hero">
      <div className="container catalog-hero__inner">
        {/* الهوية والتفاصيل */}
        <div className="catalog-hero__identity reveal">
          <span className="catalog-hero__logo">
            <svg
              viewBox="0 0 24 24"
              width="26"
              height="26"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M4.9 19.1a5.2 5.2 0 0 1 0-7.35l6.85-6.85a5.2 5.2 0 1 1 7.35 7.35l-6.85 6.85a5.2 5.2 0 0 1-7.35 0Zm3.68-9.6-3.03 3.03a3.2 3.2 0 0 0 4.52 4.52l3.03-3.03-4.52-4.52Z"
              />
            </svg>
          </span>

          <div>
            <p className="catalog-hero__eyebrow">
              كل الأدوية في مكان واحد
            </p>

            <h1 className="catalog-hero__title">
              جميع الأدوية
            </h1>

            <p className="catalog-hero__meta">
              <strong id="resultCount">{totalMedicines}</strong> دواء · متوفر في{" "}
              <strong id="pharmacyCount">{totalPharmacies}</strong> صيدلية شريكة
            </p>
          </div>
        </div>

        {/* حقل البحث */}
        <div className="catalog-hero__search reveal">
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            aria-hidden="true"
          >
            <path
              d="m21 21-4.35-4.35M18.5 11a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>

          <input
            type="text"
            id="medSearch"
            value={currentQuery}
            onChange={handleInputChange}
            placeholder="ابحث عن أي دواء في كل الصيدليات…"
            autoComplete="off"
          />
        </div>
      </div>
    </section>
  );
};

export default PageHeader;


// "use client";

// import "./style.css";

// const PageHeader = () => {
//   return (
//     <section className="catalog-hero">
//       <div className="container catalog-hero__inner">

//         <div className="catalog-hero__identity reveal">

//           <span className="catalog-hero__logo">
//             <svg
//               viewBox="0 0 24 24"
//               width="26"
//               height="26"
//               aria-hidden="true"
//             >
//               <path
//                 fill="currentColor"
//                 d="M4.9 19.1a5.2 5.2 0 0 1 0-7.35l6.85-6.85a5.2 5.2 0 1 1 7.35 7.35l-6.85 6.85a5.2 5.2 0 0 1-7.35 0Zm3.68-9.6-3.03 3.03a3.2 3.2 0 0 0 4.52 4.52l3.03-3.03-4.52-4.52Z"
//               />
//             </svg>
//           </span>

//           <div>
//             <p className="catalog-hero__eyebrow">
//               كل الأدوية في مكان واحد
//             </p>

//             <h1 className="catalog-hero__title">
//               جميع الأدوية
//             </h1>

//             <p className="catalog-hero__meta">
//               <strong id="resultCount">—</strong>
//               {" "}دواء · متوفر في{" "}
//               <strong id="pharmacyCount">—</strong>
//               {" "}صيدلية شريكة
//             </p>
//           </div>

//         </div>

//         <div className="catalog-hero__search reveal">

//           <svg
//             viewBox="0 0 24 24"
//             width="18"
//             height="18"
//             aria-hidden="true"
//           >
//             <path
//               d="m21 21-4.35-4.35M18.5 11a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
//               stroke="currentColor"
//               strokeWidth="2"
//               fill="none"
//               strokeLinecap="round"
//             />
//           </svg>

//           <input
//             type="text"
//             id="medSearch"
//             placeholder="ابحث عن أي دواء في كل الصيدليات…"
//             autoComplete="off"
//           />

//         </div>

//       </div>
//     </section>
//   );
// };

// export default PageHeader;