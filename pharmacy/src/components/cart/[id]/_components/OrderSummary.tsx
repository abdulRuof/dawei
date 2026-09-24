// app/components/cart/OrderSummary.tsx
import React, { useState } from 'react';
import Link from "next/link";
import './style.css'


interface OrderSummaryProps {
  subtotal: number;
  delivery: number;
  discount: number;
  total: number;
  onApplyPromo: (code: string) => void;
  promoStatus: { msg: string; isError: boolean } | null;
  onCheckout: () => void;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  subtotal,
  delivery,
  discount,
  total,
  onApplyPromo,
  promoStatus,
  onCheckout,
}) => {
  const [promoCode, setPromoCode] = useState('');

  const handleApply = () => {
    onApplyPromo(promoCode.trim());
  };

  return (
    <aside className="order-summary reveal is-visible">
      <div className="order-summary__card">
        <h3>ملخص الطلب</h3>

        <div className="promo-row">
          <input 
            type="text" 
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="أدخل كود الخصم" 
            autoComplete="off" 
          />
          <button type="button" className="btn btn--outline" onClick={handleApply}>تطبيق</button>
        </div>

        {promoStatus && (
          <p className={`promo-hint ${promoStatus.isError ? 'is-error' : ''}`}>
            {promoStatus.msg}
          </p>
        )}

        <div className="summary-rows">
          <div className="summary-row">
            <span>المجموع الفرعي</span>
            <strong>{subtotal.toFixed(2)} د.ل</strong>
          </div>
          <div className="summary-row">
            <span>رسوم التوصيل</span>
            <strong>{delivery.toFixed(2)} د.ل</strong>
          </div>
          {discount > 0 && (
            <div className="summary-row summary-row--discount">
              <span>الخصم</span>
              <strong>−{discount.toFixed(2)} د.ل</strong>
            </div>
          )}
        </div>

        <div className="summary-total">
          <span>الإجمالي</span>
          <strong>{total.toFixed(2)} د.ل</strong>
        </div>

        <button type="button" className="btn btn--coral btn--block" onClick={onCheckout}>إتمام الطلب</button>
        <Link href="/medications" className="continue-link">متابعة التسوق ←</Link>
      </div>

      <div className="order-note reveal is-visible">
        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 2 1 21h22L12 2Zm1 15h-2v2h2v-2Zm0-8h-2v6h2V9Z"/></svg>
        <p>قد تُرسل الأدوية من صيدليات مختلفة في طلبات توصيل منفصلة حسب توفرها.</p>
      </div>
    </aside>
  );
};