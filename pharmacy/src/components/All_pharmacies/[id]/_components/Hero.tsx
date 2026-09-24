"use client";

import "./style2.css";

interface PageHeroProps {
  searchQuery1: string;
  onSearchChange1: (query: string) => void;
  totalCount: number;
  openCount: number;
  citiesCount: number;
}
const PageHero: React.FC<PageHeroProps> = ({
// const PageHero = ({
  searchQuery1,
  onSearchChange1,
  totalCount,
  openCount,
  citiesCount,
}) => {
  return (
    <section className="page-hero1">
      {/* العناصر الزخرفية */}
      <div className="page-hero__deco1" aria-hidden="true">
        <span className="plus plus--1" />
        <span className="plus plus--2" />
        <span className="dot dot--1" />
      </div>

      <div className="page-hero__inner">
        {/* العنوان */}
        <p className="page-hero__eyebrow1">
          شركاؤنا في كل مكان
        </p>

        <h1 className="page-hero__title1">
          جميع الصيدليات
        </h1>

        <p className="page-hero__subtitle1">
          اكتشف الصيدليات الموثوقة القريبة منك، وتحقق من حالة
          عملها وتقييمها قبل زيارتها أو الطلب منها.
        </p>

        {/* البحث */}
        <div className="page-hero__search1">
          <svg
            className="page-hero__search-icon1"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            aria-hidden="true"
          >
            <path
              fill="none"
              d="m21 21-4.35-4.35M18.5 11a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          <input
            type="text"
            id="pharmSearch"
            value={searchQuery1}
            onChange={(e) => onSearchChange1(e.target.value)}
            placeholder="ابحث باسم الصيدلية أو المدينة..."
            aria-label="البحث عن صيدلية"
          />
        </div>

        {/* الإحصائيات */}
        <div className="page-hero__stats1">
          <div className="page-hero__stat1">
            <strong>{totalCount}</strong>
            <span>صيدلية شريكة</span>
          </div>

          <div className="stat-sep1" aria-hidden="true" />

          <div className="page-hero__stat1">
            <strong>{openCount}</strong>
            <span>مفتوحة الآن</span>
          </div>

          <div className="stat-sep1" aria-hidden="true" />

          <div className="page-hero__stat1">
            <strong>{citiesCount}</strong>
            <span>مدينة مغطاة</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PageHero;


// "use client";

// import './style1.css';

// interface PageHeroProps {
//   searchQuery1: string;
//   onSearchChange1: (query: string) => void;
//   totalCount: number;
//   openCount: number;
//   citiesCount: number;
// }

// const PageHero: React.FC<PageHeroProps> = ({
//   searchQuery1,
//   onSearchChange1,
//   totalCount,
//   openCount,
//   citiesCount,
// }) => {
//   return (
//     <section className="page-hero">
//       <div className="page-hero__deco" aria-hidden="true">
//         <span className="plus plus--1"></span>
//         <span className="plus plus--2"></span>
//         <span className="dot dot--1"></span>
//       </div>
//       <div className="container page-hero__inner">
//         <p className="page-hero__eyebrow">شركاؤنا في كل مكان</p>
//         <h1 className="page-hero__title">جميع الصيدليات</h1>
//         <p className="page-hero__subtitle">
//           اكتشف الصيدليات الموثوقة القريبة منك، وتحقق من حالة عملها وتقييمها قبل زيارتها أو الطلب منها.
//         </p>

//         <div className="page-hero__search">
//           <svg viewBox="0 0 24 24" width="18" height="18">
//             <path
//               fill="currentColor"
//               d="m21 21-4.35-4.35M18.5 11a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
//               stroke="currentColor"
//               strokeWidth="2"
//               strokeLinecap="round"
//             />
//           </svg>
//           <input
//             type="text"
//             id="pharmSearch"
//             value={searchQuery1}
//             onChange={(e) => onSearchChange1(e.target.value)}
//             placeholder="ابحث باسم الصيدلية أو المدينة…"
//           />
//         </div>

//         <div className="page-hero__stats ">
//           <div>
//             <strong id="statTotal">{totalCount}</strong>
//             <span>صيدلية شريكة</span>
//           </div>
//           <div className="stat-sep"></div>
//           <div>
//             <strong id="statOpen">{openCount}</strong>
//             <span>مفتوحة الآن</span>
//           </div>
//           <div className="stat-sep"></div>
//           <div>
//             <strong id="statCities">{citiesCount}</strong>
//             <span>مدينة مغطاة</span>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default PageHero;

