'use client';

import React from 'react';
import {  SectionId,Medicine } from './types';
import './style.css'


interface OverviewProps {
  medicines: Medicine[];
  onNavigate: (section: SectionId) => void;
  lowStockThreshold?: number;
}

const Overview: React.FC<OverviewProps> = ({
  medicines,
  onNavigate,
  lowStockThreshold = 10,
}) => {
  // 1. حساب مؤشرات الأداء (KPIs)
  const totalMedicines = medicines.length;
  const lowStockMedicines = medicines.filter(
    (m) => m.qty < lowStockThreshold
  );
  const totalLowStock = lowStockMedicines.length;
  
  const monthlySales = medicines.reduce(
    (sum, m) => sum + m.sold * m.price,
    0
  );
  const todayOrders = 37; // القيمة الثابتة كما في السكريبت الأصلي

  // 2. معالجة الأكثر مبيعًا (Top 5)
  const topSold = [...medicines]
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);
  const maxSold = Math.max(...topSold.map((m) => m.sold), 1);

  return (
    <section className="dash-section is-active" id="section-overview">
      {/* شبكة البطاقات (KPI Grid) */}
      <div className="kpi-grid">
        <div className="kpi-card reveal is-visible">
          <span className="kpi-card__icon kpi-card__icon--teal">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d="M4.9 19.1a5.2 5.2 0 0 1 0-7.35l6.85-6.85a5.2 5.2 0 1 1 7.35 7.35l-6.85 6.85a5.2 5.2 0 0 1-7.35 0Z"
              />
            </svg>
          </span>
          <div>
            <span className="kpi-card__label">إجمالي الأدوية</span>
            <strong className="kpi-card__value">{totalMedicines}</strong>
          </div>
        </div>

        <div className="kpi-card reveal is-visible">
          <span className="kpi-card__icon kpi-card__icon--coral">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d="M12 2 1 21h22L12 2Zm1 15h-2v2h2v-2Zm0-8h-2v6h2V9Z"
              />
            </svg>
          </span>
          <div>
            <span className="kpi-card__label">مخزون منخفض</span>
            <strong className="kpi-card__value">{totalLowStock}</strong>
          </div>
        </div>

        <div className="kpi-card reveal is-visible">
          <span className="kpi-card__icon kpi-card__icon--gold">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d="M12 2a1 1 0 0 1 1 1v1.07c2.28.38 4 2.1 4 4.18h-2c0-1.1-1.34-2-3-2s-3 .9-3 2c0 1.1 1.2 1.6 3.2 2.16C14.6 10.9 17 11.7 17 14.25c0 2.08-1.72 3.8-4 4.18V19.5a1 1 0 1 1-2 0v-1.07c-2.28-.38-4-2.1-4-4.18h2c0 1.1 1.34 2 3 2s3-.9 3-2c0-1.1-1.2-1.6-3.2-2.16C9.4 11.6 7 10.8 7 8.25c0-2.08 1.72-3.8 4-4.18V3a1 1 0 0 1 1-1Z"
              />
            </svg>
          </span>
          <div>
            <span className="kpi-card__label">مبيعات هذا الشهر</span>
            <strong className="kpi-card__value">
              {monthlySales.toLocaleString('en-US')} د.ل
            </strong>
          </div>
        </div>

        <div className="kpi-card reveal is-visible">
          <span className="kpi-card__icon kpi-card__icon--teal">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d="M6 6h15l-1.6 8.6a2 2 0 0 1-2 1.6H8.9a2 2 0 0 1-2-1.7L5.2 4.4A1 1 0 0 0 4.2 3.6H2v1.6h1.5L6 6Z"
              />
            </svg>
          </span>
          <div>
            <span className="kpi-card__label">طلبات اليوم</span>
            <strong className="kpi-card__value">{todayOrders}</strong>
          </div>
        </div>
      </div>

      {/* لوحة التنبيهات والأكثر مبيعاً */}
      <div className="overview-grid">
        {/* قائمة تنبيهات المخزون */}
        <div className="panel reveal is-visible">
          <div className="panel__head">
            <h3>تنبيهات المخزون</h3>
            <button
              type="button"
              className="link-btn"
              onClick={() => onNavigate('medicines')}
            >
              إدارة الكميات ←
            </button>
          </div>
          <ul className="alert-list">
            {lowStockMedicines.length > 0 ? (
              lowStockMedicines.map((m) => (
                <li key={m.id}>
                  <span className="alert-name">{m.name}</span>
                  <span className="alert-qty">{m.qty} متبقي</span>
                </li>
              ))
            ) : (
              <li className="alert-empty">
                لا توجد أدوية منخفضة المخزون 🎉
              </li>
            )}
          </ul>
        </div>

        {/* قائمة الأكثر مبيعاً */}
        <div className="panel reveal is-visible">
          <div className="panel__head">
            <h3>الأكثر مبيعًا هذا الأسبوع</h3>
          </div>
          <ul className="rank-list">
            {topSold.map((m, index) => (
              <li key={m.id}>
                <span className="rank-num">{index + 1}</span>
                <div className="rank-body">
                  <div className="rank-name">{m.name}</div>
                  <div className="rank-bar">
                    <span
                      style={{ width: `${(m.sold / maxSold) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="rank-count">{m.sold} وحدة</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default Overview;