'use client';

import React, { useState, useMemo } from 'react';
import { Medicine, FocusType } from './types';
import { imageUrl } from '@/lib/api';
import './style.css'


interface MedicinesManagementProps {
  medicines: Medicine[];
  onSaveMedicine: (updatedMed: Medicine) => void;
  onDeleteMedicine: (id: number) => void;
  onAddMedicine: (newMed: Omit<Medicine, 'id' | 'sold'>) => void;
  onUploadImage: (itemId: number, file: File) => void;
  onRemoveImage: (itemId: number) => void;
  onToggleVisibility: (med: Medicine) => void;
  isAdmin: boolean;
  activeFocus: FocusType;
  showToast: (message: string) => void;
}

const LOW_STOCK = 10;

const pillIcon = (
  <svg viewBox="0 0 24 24" width="18" height="18">
    <path
      fill="currentColor"
      d="M4.9 19.1a5.2 5.2 0 0 1 0-7.35l6.85-6.85a5.2 5.2 0 1 1 7.35 7.35l-6.85 6.85a5.2 5.2 0 0 1-7.35 0Zm3.68-9.6-3.03 3.03a3.2 3.2 0 0 0 4.52 4.52l3.03-3.03-4.52-4.52Z"
    />
  </svg>
);

const CATEGORIES = [
  'مسكنات الألم',
  'مضادات حيوية',
  'فيتامينات ومكملات',
  'أدوية القلب والضغط',
  'أمراض مزمنة',
  'المعدة والجهاز الهضمي',
  'أدوية الجلد والبشرة',
  'أدوية الحساسية والمناعة',
  'أدوية الأعصاب والمهدئات',
] as const;

const MedicinesManagement: React.FC<MedicinesManagementProps> = ({
  medicines,
  onSaveMedicine,
  onDeleteMedicine,
  onAddMedicine,
  onUploadImage,
  onRemoveImage,
  onToggleVisibility,
  isAdmin,
  activeFocus,
  showToast,
}) => {
  // حالة البحث والتصفية
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('الكل');

  // حالة نموذج إضافة دواء جديد
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedCat, setNewMedCat] = useState('مسكنات الألم');
  const [newMedQty, setNewMedQty] = useState<number | ''>('');
  const [newMedPrice, setNewMedPrice] = useState<number | ''>('');
  const [newMedMin, setNewMedMin] = useState<number | ''>('');

  // مسودة التعديلات المحلية للجدول قبل الحفظ (Draft values)
  const [drafts, setDrafts] = useState<{
    [id: number]: { qty: number; price: number; min_stock: number };
  }>({});

  // تحديث المسودة للسطر المكتوب
  const handleDraftChange = (
    id: number,
    field: 'qty' | 'price' | 'min_stock',
    value: number
  ) => {
    setDrafts((prev) => {
      const current = prev[id] || {
        qty: medicines.find((m) => m.id === id)?.qty ?? 0,
        price: medicines.find((m) => m.id === id)?.price ?? 0,
        min_stock: medicines.find((m) => m.id === id)?.min_stock ?? 10,
      };
      return {
        ...prev,
        [id]: {
          ...current,
          [field]: Math.max(0, value),
        },
      };
    });
  };

  // حاسبة الحالة (Status Badge)
  const getStatus = (qty: number, minStock?: number) => {
    if (qty <= 0) return { cls: 'out', label: 'نفذ من المخزون' };
    if (qty < (minStock ?? LOW_STOCK)) return { cls: 'low', label: 'مخزون منخفض' };
    return { cls: 'ok', label: 'متوفر' };
  };

  // فلترة الأدوية
  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      const matchesCat = categoryFilter === 'الكل' || m.cat === categoryFilter;
      const matchesSearch =
        !searchTerm.trim() ||
        m.name.toLowerCase().includes(searchTerm.trim().toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [medicines, categoryFilter, searchTerm]);

  // حفظ سطر معين
  const handleSaveRow = (med: Medicine) => {
    const draft = drafts[med.id];
    const updatedQty = draft ? draft.qty : med.qty;
    const updatedPrice = draft ? draft.price : med.price;
    const updatedMin = draft ? draft.min_stock : med.min_stock ?? 10;

    onSaveMedicine({
      ...med,
      qty: updatedQty,
      price: updatedPrice,
      min_stock: updatedMin,
    });
    showToast(`✓ تم حفظ تغييرات "${med.name}"`);
  };

  // إضافة دواء جديد
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;

    onAddMedicine({
      name: newMedName.trim(),
      cat: newMedCat,
      qty: Number(newMedQty) || 0,
      min_stock: Number(newMedMin) || 10,
      price: Number(newMedPrice) || 0,
      meta: 'أقراص',
      image_url: null,
      is_active: true,
    });

    showToast(`✓ تمت إضافة "${newMedName.trim()}" إلى القائمة`);

    // إعادة تعيين النموذج
    setNewMedName('');
    setNewMedCat('مسكنات الألم');
    setNewMedQty('');
    setNewMedPrice('');
    setNewMedMin('');
    setIsAddFormOpen(false);
  };

  return (
    <section className="dash-section is-active" id="section-medicines">
      {/* شريط الأدوات: البحث والفلترة وإضافة دواء */}
      <div className="table-toolbar reveal is-visible">
        <div className="dash-search dash-search--wide">
          <svg viewBox="0 0 24 24" width="16" height="16">
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
            id="medTableSearch"
            placeholder="ابحث عن دواء…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          id="medCatFilter"
          className="select-input"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="الكل">كل التصنيفات</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <button
          type="button"
          className="btn btn--coral"
          id="addMedBtn"
          onClick={() => setIsAddFormOpen((prev) => !prev)}
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
          </svg>
          إضافة دواء
        </button>
      </div>

      {/* نموذج إضافة دواء جديد */}
      {isAddFormOpen && (
        <form
          className="add-med-form"
          id="addMedForm"
          onSubmit={handleFormSubmit}
        >
          <input
            type="text"
            id="newMedName"
            placeholder="اسم الدواء"
            required
            value={newMedName}
            onChange={(e) => setNewMedName(e.target.value)}
          />
          <select
            id="newMedCat"
            required
            value={newMedCat}
            onChange={(e) => setNewMedCat(e.target.value)}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            type="number"
            id="newMedQty"
            placeholder="الكمية"
            min="0"
            required
            value={newMedQty}
            onChange={(e) => setNewMedQty(e.target.value ? Number(e.target.value) : '')}
          />
          <input
            type="number"
            id="newMedPrice"
            placeholder="السعر (د.ل)"
            min="0"
            step="0.25"
            required
            value={newMedPrice}
            onChange={(e) => setNewMedPrice(e.target.value ? Number(e.target.value) : '')}
          />
          <input
            type="number"
            id="newMedMin"
            placeholder="حد التنبيه"
            min="0"
            value={newMedMin}
            onChange={(e) => setNewMedMin(e.target.value ? Number(e.target.value) : '')}
          />
          <div className="add-med-form__actions">
            <button type="submit" className="btn btn--ghost">
              حفظ الدواء
            </button>
            <button
              type="button"
              className="btn btn--outline"
              id="cancelAddMed"
              onClick={() => setIsAddFormOpen(false)}
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      {/* جدول الأدوية */}
      <div className="table-wrap reveal is-visible" id="tableWrap">
        <table className="med-table">
          <thead>
            <tr>
              <th>الدواء</th>
              <th>الصورة</th>
              <th>التصنيف</th>
              <th
                data-col="qty"
                className={activeFocus === 'qty' ? 'col-highlight' : ''}
              >
                الكمية
              </th>
              <th
                data-col="price"
                className={activeFocus === 'price' ? 'col-highlight' : ''}
              >
                السعر
              </th>
              <th>حد التنبيه</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody id="medTableBody">
            {filteredMedicines.map((m) => {
              const currentQty =
                drafts[m.id]?.qty !== undefined ? drafts[m.id].qty : m.qty;
              const currentPrice =
                drafts[m.id]?.price !== undefined ? drafts[m.id].price : m.price;
              const currentMin =
                drafts[m.id]?.min_stock !== undefined
                  ? drafts[m.id].min_stock
                  : m.min_stock ?? 10;
              const status = getStatus(m.qty, m.min_stock ?? 10);

              return (
                <tr key={m.id} data-id={m.id} className={!m.is_active ? "row-hidden" : ""}>
                  <td>
                    <div className="med-name-cell">
                      <span className="med-name-cell__icon">{pillIcon}</span>
                      <div>
                        <strong>{m.name}</strong>
                        <span>{m.meta}</span>
                        {!m.is_active && (
                          <span className="hidden-badge">مخفي عن الموقع</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="med-img-cell">
                      {m.image_url ? (
                        <img
                          src={imageUrl(m.image_url) ?? ""}
                          alt={m.name}
                          loading="lazy"
                        />
                      ) : (
                        <span className="med-img-cell__placeholder">{pillIcon}</span>
                      )}
                      <label className="img-upload-btn" title="رفع صورة">
                        <svg viewBox="0 0 24 24" width="14" height="14">
                          <path
                            fill="currentColor"
                            d="M12 16V4m0 0 4 4m-4-4-4 4M4 20h16"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onUploadImage(m.id, file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      {m.image_url && (
                        <button
                          type="button"
                          className="img-remove-btn"
                          title="حذف الصورة"
                          onClick={() => onRemoveImage(m.id)}
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14">
                            <path
                              fill="currentColor"
                              d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4 6.4 5Z"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="cat-tag">{m.cat}</span>
                  </td>
                  <td
                    className={`qty-cell ${
                      activeFocus === 'qty' ? 'col-highlight' : ''
                    }`}
                  >
                    <span className="qty-stepper">
                      <button
                        type="button"
                        className="qty-minus"
                        aria-label="إنقاص الكمية"
                        onClick={() =>
                          handleDraftChange(m.id, 'qty', currentQty - 1)
                        }
                      >
                        −
                      </button>
                      <input
                        type="number"
                        className="qty-input"
                        value={currentQty}
                        min="0"
                        onChange={(e) =>
                          handleDraftChange(
                            m.id,
                            'qty',
                            Number(e.target.value) || 0
                          )
                        }
                      />
                      <button
                        type="button"
                        className="qty-plus"
                        aria-label="زيادة الكمية"
                        onClick={() =>
                          handleDraftChange(m.id, 'qty', currentQty + 1)
                        }
                      >
                        +
                      </button>
                    </span>
                  </td>
                  <td
                    className={`price-cell ${
                      activeFocus === 'price' ? 'col-highlight' : ''
                    }`}
                  >
                    <span className="price-input-wrap">
                      <input
                        type="number"
                        className="price-input"
                        value={currentPrice}
                        min="0"
                        step="0.25"
                        onChange={(e) =>
                          handleDraftChange(
                            m.id,
                            'price',
                            Number(e.target.value) || 0
                          )
                        }
                      />
                      <span>د.ل</span>
                    </span>
                  </td>
                  <td>
                    <span className="price-input-wrap">
                      <input
                        type="number"
                        className="price-input"
                        value={currentMin}
                        min="0"
                        onChange={(e) =>
                          handleDraftChange(
                            m.id,
                            'min_stock',
                            Number(e.target.value) || 0
                          )
                        }
                      />
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${status.cls}`}>
                      {status.label}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      {isAdmin && (
                        <button
                          type="button"
                          className={`visibility-btn ${m.is_active ? "" : "is-off"}`}
                          aria-label={m.is_active ? "إخفاء الدواء عن الموقع" : "إعادة عرض الدواء"}
                          title={m.is_active ? "إخفاء الدواء عن الموقع" : "إعادة عرض الدواء"}
                          onClick={() => onToggleVisibility(m)}
                        >
                          {m.is_active ? (
                            <svg viewBox="0 0 24 24" width="15" height="15">
                              <path
                                fill="currentColor"
                                d="M12 5C7 5 3 11 3 11s4 6 9 6 9-6 9-6-4-6-9-6Zm0 9.5A2.5 2.5 0 1 1 12 9.5a2.5 2.5 0 0 1 0 5Z"
                              />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" width="15" height="15">
                              <path
                                fill="currentColor"
                                d="M2 5.27 3.28 4 20 20.72 18.73 22l-2.26-2.27A9.8 9.8 0 0 1 12 21c-5 0-9-6-9-6a17 17 0 0 1 3.06-3.93L2 5.27ZM12 7a5 5 0 0 1 5 5c0 .34-.04.67-.1 1l-2-2a2.5 2.5 0 0 0-2.9-2.9l-2-2A5.2 5.2 0 0 1 12 7Zm7.3 1.35A17 17 0 0 1 21 11s-4 6-9 6c-.6 0-1.18-.1-1.74-.26L8.6 15.1A5 5 0 0 0 15.1 8.6l-1.15-1.15A8 8 0 0 1 19.3 8.35ZM12 9.5c.3 0 .58.06.84.15L9.65 12.85A2.5 2.5 0 0 1 12 9.5Z"
                              />
                            </svg>
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        className="save-btn"
                        aria-label="حفظ التغييرات"
                        onClick={() => handleSaveRow(m)}
                      >
                        <svg viewBox="0 0 24 24" width="15" height="15">
                          <path
                            fill="currentColor"
                            d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4Zm-5 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM6 6h9v4H6V6Z"
                          />
                        </svg>
                      </button>

                      {isAdmin && (
                      <button
                        type="button"
                        className="delete-btn"
                        aria-label="حذف الدواء"
                        onClick={() => {
                          onDeleteMedicine(m.id);
                          showToast('🗑 تم حذف الدواء من القائمة');
                        }}
                      >
                        <svg viewBox="0 0 24 24" width="15" height="15">
                          <path
                            fill="currentColor"
                            d="M6 7h12l-1 14H7L6 7Zm3-4h6l1 2h4v2H4V5h4l1-2Z"
                          />
                        </svg>
                      </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* الحالة الفارغة (Empty State) */}
      {filteredMedicines.length === 0 && (
        <p className="empty-state" id="tableEmptyState">
          لا توجد أدوية مطابقة.
        </p>
      )}
    </section>
  );
};

export default MedicinesManagement;