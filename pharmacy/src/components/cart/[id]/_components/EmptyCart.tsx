import React from 'react';
import Link from "next/link";
import './style.css'


export const EmptyCart: React.FC = () => {
  return (
    <div className="cart-empty" id="cartEmpty">
      <div className="cart-empty__icon">
        <svg viewBox="0 0 24 24" width="46" height="46">
          <path
            fill="currentColor"
            d="M6 6h15l-1.6 8.6a2 2 0 0 1-2 1.6H8.9a2 2 0 0 1-2-1.7L5.2 4.4A1 1 0 0 0 4.2 3.6H2v1.6h1.5L6 6Zm2.5 14a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm8 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
          />
        </svg>
      </div>
      <h2>سلة التسوق فارغة</h2>
      <p>لم تُضِف أي أدوية بعد. تصفّح الأدوية المتوفرة وابدأ التسوق الآن.</p>
      <Link href="/medications" className="btn btn--coral">
        تصفح الأدوية
      </Link>
    </div>
  );
};