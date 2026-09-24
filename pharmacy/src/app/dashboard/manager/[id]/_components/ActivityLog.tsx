'use client';

import React, { useState } from 'react';
import { ActivityLogItem } from '@/lib/api';
import './style.css'

interface ActivityLogProps {
  activities: ActivityLogItem[];
  loading?: boolean;
}

const ACTION_LABELS: Record<string, string> = {
  add_medicine: 'إضافة دواء',
  update_medicine: 'تعديل دواء',
  delete_medicine: 'حذف دواء',
  toggle_visibility: 'إخفاء/إظهار دواء',
  upload_image: 'رفع صورة',
  remove_image: 'حذف صورة',
  add_employee: 'إضافة موظف',
  toggle_employee: 'تفعيل/تعطيل موظف',
  delete_employee: 'حذف موظف',
  login: 'دخول إلى اللوحة',
  pharmacy_status: 'فتح/إغلاق الصيدلية',
};

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('ar-LY', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatTimeFull(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('ar-LY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

const ActivityLog: React.FC<ActivityLogProps> = ({ activities, loading }) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <section className="dash-section is-active" id="section-activity">
      <div className="section-head-row">
        <h2 className="section-title">سجل العمليات</h2>
        <p className="section-subtitle">
          من قام بماذا وفي أي وقت — اضغط على أي سجل لعرض التفاصيل الكاملة
        </p>
      </div>

      {loading ? (
        <p className="empty-state">جارٍ تحميل السجل…</p>
      ) : activities.length === 0 ? (
        <p className="empty-state">لا توجد عمليات مسجلة بعد.</p>
      ) : (
        <div className="activity-list" id="activityList">
          {activities.map((a) => {
            const isOpen = expandedId === a.id;
            return (
              <div
                className={`activity-item ${isOpen ? 'is-open' : ''}`}
                key={a.id}
              >
                <span className={`activity-dot role-${a.role ?? 'unknown'}`} />
                <div className="activity-item__body">
                  <div className="activity-item__title">
                    <strong>{a.user_name}</strong>
                    <span className="activity-action">
                      {ACTION_LABELS[a.action] ?? a.action}
                    </span>
                    <span className={`role-tag role-${a.role ?? 'unknown'}`}>
                      {a.role === 'owner' ? 'مدير الصيدلية' : 'موظف'}
                    </span>
                  </div>
                  {a.description && (
                    <p className="activity-item__desc">
                      {a.description}
                    </p>
                  )}
                  <span className="activity-item__time">
                    {formatTime(a.created_at)}
                  </span>

                  {isOpen && (
                    <div className="activity-item__details">
                      <div className="activity-item__details-row">
                        <span className="details-label">نوع العملية</span>
                        <span>{ACTION_LABELS[a.action] ?? a.action}</span>
                      </div>
                      <div className="activity-item__details-row">
                        <span className="details-label">الوقت بالكامل</span>
                        <span>{formatTimeFull(a.created_at)}</span>
                      </div>
                      {a.description && (
                        <div className="activity-item__details-row">
                          <span className="details-label">التفاصيل</span>
                          <span>{a.description}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="activity-item__toggle"
                  onClick={() => setExpandedId(isOpen ? null : a.id)}
                  aria-label={isOpen ? 'طي التفاصيل' : 'عرض التفاصيل'}
                  aria-expanded={isOpen}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform .2s ease',
                    }}
                  >
                    <path
                      fill="currentColor"
                      d="M12 15.5 5 8.5a1 1 0 0 1 1.4-1.4L12 12.7l5.6-5.6a1 1 0 1 1 1.4 1.4l-7 7Z"
                    />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ActivityLog;