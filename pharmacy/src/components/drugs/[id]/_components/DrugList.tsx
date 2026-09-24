'use client';

import React, { useState, useEffect } from 'react';

// تعريف نوع بيانات الدواء (TypeScript Interface)
interface Medicine {
  name: string;
  meta: string;
  price: string;
  cat: string;
  stock: string;
  pharmacy: string;
}

// قائمة بيانات الأدوية
const medicinesData: Medicine[] = [
  { name: "باراسيتامول 500 مجم", meta: "أقراص · مسكن وخافض حرارة", price: "5 د.ل", cat: "مسكنات", stock: "متوفر" ,pharmacy: "صيدلية النهضة"},
  { name: "بانادول إكسترا", meta: "أقراص · مسكن مضاعف", price: "8 د.ل", cat: "مسكنات", stock: "متوفر" ,pharmacy: "صيدلية النهضة"},
  { name: "فولتارين جل", meta: "جل موضعي · آلام العضلات", price: "18 د.ل", cat: "مسكنات", stock: "كمية محدودة" ,pharmacy: "صيدلية النهضة"},
  { name: "أوجمنتين 1 جم", meta: "أقراص · مضاد حيوي", price: "22 د.ل", cat: "مضادات حيوية", stock: "متوفر" ,pharmacy: "صيدلية النهضة"},
  { name: "أموكسيسيلين 500 مجم", meta: "كبسولات · مضاد حيوي", price: "16 د.ل", cat: "مضادات حيوية", stock: "متوفر",pharmacy: "صيدلية النهضة" },
  { name: "فيتامين D3 5000", meta: "كبسولات · مكمل غذائي", price: "35 د.ل", cat: "فيتامينات", stock: "متوفر",pharmacy: "صيدلية النهضة" },
  { name: "أوميغا 3", meta: "كبسولات · صحة القلب", price: "40 د.ل", cat: "فيتامينات", stock: "متوفر" ,pharmacy: "صيدلية النهضة"},
  { name: "فيتامين سي فوار", meta: "أقراص فوارة · مناعة", price: "20 د.ل", cat: "فيتامينات", stock: "كمية محدودة" ,pharmacy: "صيدلية النهضة"},
  { name: "نقط سيتال للأطفال", meta: "نقط فموية · خافض حرارة", price: "12 د.ل", cat: "أطفال", stock: "متوفر" ,pharmacy: "صيدلية النهضة"},
  { name: "شراب أوجمنتين للأطفال", meta: "شراب · مضاد حيوي", price: "19 د.ل", cat: "أطفال", stock: "متوفر" ,pharmacy: "صيدلية النهضة"},
  { name: "كريم مرطب للبشرة", meta: "كريم · عناية يومية", price: "27 د.ل", cat: "بشرة", stock: "متوفر" ,pharmacy: "صيدلية النهضة"},
  { name: "واقي شمس SPF 50", meta: "كريم · حماية من الشمس", price: "45 د.ل", cat: "بشرة", stock: "متوفر" ,pharmacy: "صيدلية النهضة"},
  { name: "بانادول إكسترا", meta: "أقراص · مسكن مضاعف", price: "8 د.ل", cat: "مسكنات", stock: "متوفر" ,pharmacy: "صيدلية اوركي"},
  { name: "بانادول إكسترا", meta: "أقراص · مسكن مضاعف", price: "8 د.ل", cat: "مسكنات", stock: "متوفر" ,pharmacy: "صيدلية النهضة"},
  { name: "بانادول إكسترا", meta: "أقراص · مسكن مضاعف", price: "8 د.ل", cat: "مسكنات", stock: "متوفر" ,pharmacy: "صيدلية النهضة"},
  { name: "بانادول إكسترا", meta: "أقراص · مسكن مضاعف", price: "8 د.ل", cat: "مسكنات", stock: "متوفر" ,pharmacy: "صيدلية النهضة"},
  { name: "بانادول إكسترا", meta: "أقراص · مسكن مضاعف", price: "8 د.ل", cat: "مسكنات", stock: "متوفر" ,pharmacy: "صيدلية النهضة"},
  { name: "بانادول إكسترا", meta: "أقراص · مسكن مضاعف", price: "8 د.ل", cat: "مسكنات", stock: "متوفر" ,pharmacy: "صيدلية النهضة"},
  { name: "بانادول إكسترا", meta: "أقراص · مسكن مضاعف", price: "8 د.ل", cat: "مسكنات", stock: "متوفر" ,pharmacy: "صيدلية النهضة"},

];

const categories = [
  { label: "الكل", value: "الكل" },
  { label: "مسكنات", value: "مسكنات" },
  { label: "مضادات حيوية", value: "مضادات حيوية" },
  { label: "فيتامينات", value: "فيتامينات" },
  { label: "أدوية الأطفال", value: "أطفال" },
  { label: "العناية بالبشرة", value: "بشرة" },
];

const DrugList: React.FC = () => {
  // حالة التحكم بالبحث والتصنيف
  const [activeCat, setActiveCat] = useState<string>("الكل");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // تفعيل تأثير التمرير (Intersection Observer / Reveal)
  useEffect(() => {
    const revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      revealEls.forEach((el) => io.observe(el));
      return () => io.disconnect();
    } else {
      revealEls.forEach((el) => el.classList.add('is-visible'));
    }
  }, []);

  // فلترة الأدوية بناءً على خيار التصنيف وشريط البحث
  const filteredMedicines = medicinesData.filter((med) => {
    const q = searchQuery.trim();
    const matchesCat = activeCat === "الكل" || med.cat === activeCat;
    const matchesQuery = !q || med.name.includes(q);
    return matchesCat && matchesQuery;
  });

  return (
    <section className="section section--tint" id="pharmacy-medicines">
      <div className="container">
        
        {/* رأس القسم مع شريط البحث */}
        <div className="section__head reveal">
          <div>
            <p className="section__eyebrow">المخزون المتوفر</p>
            <h2 className="section__title">جميع الأدوية في صيدلية النهضة</h2>
          </div>
          <div className="pharm-search">
            <svg viewBox="0 0 24 24" width="17" height="17">
              <path
                fill="currentColor"
                d="m21 21-4.35-4.35M18.5 11a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="text"
              placeholder="ابحث داخل أدوية هذه الصيدلية…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* أزرار الفلترة حسب التصنيف */}
        <div className="chip-row chip-row--filter reveal">
          {categories.map((cat) => (
            <button
              key={cat.value}
              className={`chip ${activeCat === cat.value ? 'is-active' : ''}`}
              onClick={() => setActiveCat(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* عرض شبكة الأدوية أو تنبيه عدم وجود نتائج */}
        {filteredMedicines.length === 0 ? (
          <p className="empty-state">
            لا توجد أدوية مطابقة لبحثك داخل هذه الصيدلية.
          </p>
        ) : (
          <div className="pharm-med-grid">
            {filteredMedicines.map((m, idx) => (
              <article key={idx} className="med-card">
                <span className="med-card__icon">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path
                      fill="currentColor"
                      d="M4.9 19.1a5.2 5.2 0 0 1 0-7.35l6.85-6.85a5.2 5.2 0 1 1 7.35 7.35l-6.85 6.85a5.2 5.2 0 0 1-7.35 0Zm3.68-9.6-3.03 3.03a3.2 3.2 0 0 0 4.52 4.52l3.03-3.03-4.52-4.52Z"
                    />
                  </svg>
                </span>
                <div>
                  <div className="med-card__name">{m.name}</div>
                  <div className="med-card__meta">{m.meta}</div>
                  <div className="med-card__meta">{m.pharmacy}</div>

                </div>
                <div className="med-card__foot">
                  <span className="med-card__price">{m.price}</span>
                  <span
                    className={`med-card__stock ${
                      m.stock === "كمية محدودة" ? "low" : ""
                    }`}
                  >
                    {m.stock}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};

export default DrugList;