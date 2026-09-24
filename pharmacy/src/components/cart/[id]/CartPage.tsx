"use client";


// app/components/cart/CartPage.tsx
import React, { useState, useMemo } from 'react';
import Link from "next/link";
import { CartItemsList } from '../[id]/_components/CartItemsList';
import { EmptyCart } from '../[id]/_components/EmptyCart';
import { OrderSummary } from '../[id]/_components/OrderSummary';
import './_components/style.css'

export interface CartItem {
  id: number;
  name: string;
  meta: string;
  price: number;
  qty: number;
  pharmacy: string;
  pharmacyColor: string;
}

const INITIAL_CART: CartItem[] = [
  { id: 1, name: "باراسيتامول 500 مجم", meta: "أقراص · عبوة 20 قرص", price: 5, qty: 2, pharmacy: "صيدلية النهضة", pharmacyColor: "linear-gradient(135deg,#0F6E5C,#1FB496)" },
  { id: 2, name: "فيتامين D3 5000", meta: "كبسولات · مكمل غذائي", price: 35, qty: 1, pharmacy: "صيدلية النهضة", pharmacyColor: "linear-gradient(135deg,#0F6E5C,#1FB496)" },
  { id: 3, name: "أوجمنتين 1 جم", meta: "أقراص · مضاد حيوي", price: 22, qty: 1, pharmacy: "صيدلية الأمل", pharmacyColor: "linear-gradient(135deg,#0F6E5C,#0B2E28)" },
  { id: 4, name: "واقي شمس SPF 50", meta: "كريم · حماية من الشمس", price: 45, qty: 1, pharmacy: "صيدلية الشفاء", pharmacyColor: "linear-gradient(135deg,#0E3F35,#159A80)" },
];

const DELIVERY_PER_PHARMACY = 5;
const PROMO_CODES: Record<string, number> = { روشتة10: 0.1, صحة20: 0.2 };

export const CartPage: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>(INITIAL_CART);
  const [appliedPromo, setAppliedPromo] = useState<number | null>(null);
  const [promoStatus, setPromoStatus] = useState<{ msg: string; isError: boolean } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2200);
  };

  // تجميع الأدوية حسب الصيدلية
  const pharmacyGroups = useMemo(() => {
    const groups: Record<string, { color: string; items: CartItem[] }> = {};
    cart.forEach((item) => {
      if (!groups[item.pharmacy]) {
        groups[item.pharmacy] = { color: item.pharmacyColor, items: [] };
      }
      groups[item.pharmacy].items.push(item);
    });
    return groups;
  }, [cart]);

  // الحسابات المالية
  const totalQty = useMemo(() => cart.reduce((sum, i) => sum + i.qty, 0), [cart]);
  const subtotal = useMemo(() => cart.reduce((sum, i) => sum + i.price * i.qty, 0), [cart]);
  const pharmacyCount = Object.keys(pharmacyGroups).length;
  const delivery = cart.length > 0 ? pharmacyCount * DELIVERY_PER_PHARMACY : 0;
  const discount = appliedPromo ? subtotal * appliedPromo : 0;
  const total = Math.max(0, subtotal + delivery - discount);

  // تحديث الكميات
  const handleUpdateQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.qty + delta);
          return { ...item, qty: newQty };
        }
        return item;
      })
    );
  };

  // حذف عنصر من السلة
  const handleRemoveItem = (id: number, name: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    showToast(`🗑 تم حذف "${name}" من السلة`);
  };

  // تطبيق الكوبون
  const handleApplyPromo = (code: string) => {
    if (!code) return;
    if (PROMO_CODES[code]) {
      const discountVal = PROMO_CODES[code];
      setAppliedPromo(discountVal);
      setPromoStatus({ msg: `✓ تم تطبيق خصم ${Math.round(discountVal * 100)}٪`, isError: false });
      showToast("✓ تم تطبيق كود الخصم");
    } else {
      setAppliedPromo(null);
      setPromoStatus({ msg: "كود الخصم غير صحيح", isError: true });
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    showToast("✓ سيتم تحويلك إلى صفحة الدفع");
  };

  return (
    <>

      <main id="cartPage">
        {/* Breadcrumb */}
        <div className="breadcrumb-bar">
          <div className="container breadcrumb">
            <Link href="/">الرئيسية</Link>
            <span className="sep">/</span>
            <span className="current">سلة التسوق</span>
          </div>
        </div>

        <section className="section">
          <div className="container">
            <div className="cart-head reveal is-visible">
              <h1>سلة التسوق</h1>
              <p>{totalQty > 0 ? `لديك ${totalQty} عنصر في سلتك` : "سلتك فارغة حاليًا"}</p>
            </div>

            {cart.length > 0 ? (
              <div className="cart-layout" id="cartLayout">
                <CartItemsList
                  groups={pharmacyGroups}
                  deliveryPerPharmacy={DELIVERY_PER_PHARMACY}
                  onUpdateQty={handleUpdateQty}
                  onRemoveItem={handleRemoveItem}
                />

                <OrderSummary
                  subtotal={subtotal}
                  delivery={delivery}
                  discount={discount}
                  total={total}
                  onApplyPromo={handleApplyPromo}
                  promoStatus={promoStatus}
                  onCheckout={handleCheckout}
                />
              </div>
            ) : (
              <EmptyCart />
            )}
          </div>
        </section>
      </main>

      {/* Toast Notification */}
      <div className={`toast ${toastMessage ? 'is-visible' : ''}`}>
        {toastMessage}
      </div>
    </>
  );
};

export default CartPage;