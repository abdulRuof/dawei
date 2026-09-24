import React from 'react';
import './style.css'

export interface CartItem {
  id: number;
  name: string;
  meta: string;
  price: number;
  qty: number;
  pharmacy: string;
  pharmacyColor: string;
}

interface CartItemsListProps {
  groups: Record<string, { color: string; items: CartItem[] }>;
  deliveryPerPharmacy: number;
  onUpdateQty: (id: number, delta: number) => void;
  onRemoveItem: (id: number, name: string) => void;
}

const PillIcon = (
  <svg viewBox="0 0 24 24" width="22" height="22">
    <path
      fill="currentColor"
      d="M4.9 19.1a5.2 5.2 0 0 1 0-7.35l6.85-6.85a5.2 5.2 0 1 1 7.35 7.35l-6.85 6.85a5.2 5.2 0 0 1-7.35 0Zm3.68-9.6-3.03 3.03a3.2 3.2 0 0 0 4.52 4.52l3.03-3.03-4.52-4.52Z"
    />
  </svg>
);

export const CartItemsList: React.FC<CartItemsListProps> = ({
  groups,
  deliveryPerPharmacy,
  onUpdateQty,
  onRemoveItem,
}) => {
  return (
    <div className="cart-items" id="cartItems">
      {Object.entries(groups).map(([pharmacy, group]) => {
        const initials = pharmacy.replace('صيدلية', '').trim().slice(0, 2);
        return (
          <div className="pharm-group" key={pharmacy} data-pharmacy={pharmacy}>
            <div className="pharm-group__head">
              <span
                className="pharm-group__logo"
                style={{ background: group.color }}
              >
                {initials}
              </span>
              <span className="pharm-group__name">{pharmacy}</span>
              <span className="pharm-group__delivery">
                توصيل: {deliveryPerPharmacy.toFixed(2)} د.ل
              </span>
            </div>

            {group.items.map((item) => (
              <div className="cart-row" key={item.id} data-id={item.id}>
                <span className="cart-row__icon">{PillIcon}</span>
                <div className="cart-row__body">
                  <div className="cart-row__name">{item.name}</div>
                  <div className="cart-row__meta">{item.meta}</div>
                  <div className="cart-row__unit">
                    {item.price.toFixed(2)} د.ل / وحدة
                  </div>
                </div>

                <span className="qty-stepper">
                  <button
                    type="button"
                    className="qty-minus"
                    aria-label="إنقاص الكمية"
                    onClick={() => onUpdateQty(item.id, -1)}
                  >
                    −
                  </button>
                  <span>{item.qty}</span>
                  <button
                    type="button"
                    className="qty-plus"
                    aria-label="زيادة الكمية"
                    onClick={() => onUpdateQty(item.id, 1)}
                  >
                    +
                  </button>
                </span>

                <span className="cart-row__total">
                  {(item.price * item.qty).toFixed(2)} د.ل
                </span>

                <button
                  type="button"
                  className="cart-row__remove"
                  aria-label="حذف من السلة"
                  onClick={() => onRemoveItem(item.id, item.name)}
                >
                  <svg viewBox="0 0 24 24" width="15" height="15">
                    <path
                      fill="currentColor"
                      d="M6 7h12l-1 14H7L6 7Zm3-4h6l1 2h4v2H4V5h4l1-2Z"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};