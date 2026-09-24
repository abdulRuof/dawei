'use client';

import React, { useState } from 'react';
import { PharmacyEmployee } from '@/lib/api';
import './style.css'


interface EmployeesManagementProps {
  employees: PharmacyEmployee[];
  onAddEmployee: (payload: {
    full_name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<boolean>;
  onToggleEmployee: (employee: PharmacyEmployee) => void;
  onDeleteEmployee: (employeeId: number) => void;
  showToast: (message: string) => void;
}

const userIcon = (
  <svg viewBox="0 0 24 24" width="18" height="18">
    <path
      fill="currentColor"
      d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 1.5c-4.4 0-8 2.2-8 5V21h16v-2.5c0-2.8-3.6-5-8-5Z"
    />
  </svg>
);

const EmployeesManagement: React.FC<EmployeesManagementProps> = ({
  employees,
  onAddEmployee,
  onToggleEmployee,
  onDeleteEmployee,
  showToast,
}) => {
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || password.length < 8) {
      showToast('يرجى تعبئة جميع الحقول (كلمة المرور 8 أحرف على الأقل)');
      return;
    }

    setIsSubmitting(true);
    const ok = await onAddEmployee({
      full_name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
    });
    setIsSubmitting(false);

    if (!ok) return;

    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setIsAddFormOpen(false);
  };

  return (
    <section className="dash-section is-active" id="section-employees">
      <div className="table-toolbar reveal is-visible">
        <h2 className="section-title">موظفو الصيدلية</h2>
        <p className="section-subtitle">
          يستطيع الموظف إدارة الأدوية والكميات والأسعار، دون صلاحيات التحكم بالصيدلية أو الموظفين الآخرين.
        </p>
        <button
          type="button"
          className="btn btn--coral"
          onClick={() => setIsAddFormOpen((prev) => !prev)}
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
          </svg>
          إضافة موظف
        </button>
      </div>

      {isAddFormOpen && (
        <form className="add-med-form" id="addEmpForm" onSubmit={handleFormSubmit}>
          <input
            type="text"
            placeholder="اسم الموظف الكامل"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            placeholder="البريد الإلكتروني"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="tel"
            placeholder="رقم الهاتف"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            type="password"
            placeholder="كلمة المرور (8+ أحرف)"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="add-med-form__actions">
            <button type="submit" className="btn btn--ghost" disabled={isSubmitting}>
              {isSubmitting ? 'جارٍ الحفظ…' : 'حفظ الموظف'}
            </button>
            <button
              type="button"
              className="btn btn--outline"
              onClick={() => setIsAddFormOpen(false)}
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      <div className="table-wrap reveal is-visible">
        <table className="med-table">
          <thead>
            <tr>
              <th>الموظف</th>
              <th>البريد</th>
              <th>الهاتف</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td>
                  <div className="med-name-cell">
                    <span className="med-name-cell__icon">{userIcon}</span>
                    <div>
                      <strong>{emp.full_name}</strong>
                      <span>{emp.role === 'staff' ? 'موظف الصيدلية' : 'مدير'}</span>
                    </div>
                  </div>
                </td>
                <td>{emp.email}</td>
                <td dir="ltr">{emp.phone}</td>
                <td>
                  <span className={`status-badge ${emp.is_active ? 'ok' : 'out'}`}>
                    {emp.is_active ? 'نشط' : 'موقوف'}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      className={`save-btn ${!emp.is_active ? 'btn-take-action' : ''}`}
                      aria-label="تبديل الحالة"
                      onClick={() => {
                        onToggleEmployee(emp);
                        showToast(emp.is_active ? '⏸ تم إيقاف الموظف' : '✓ تم تفعيل الموظف');
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="15" height="15">
                        <path
                          fill="currentColor"
                          d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1 15v-2h2v2h-2Zm0-4V7h2v6h-2Z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="delete-btn"
                      aria-label="حذف الموظف"
                      onClick={() => {
                        onDeleteEmployee(emp.id);
                        showToast(`🗑 تمت إزالة "${emp.full_name}" من الصيدلية`);
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="15" height="15">
                        <path
                          fill="currentColor"
                          d="M6 7h12l-1 14H7L6 7Zm3-4h6l1 2h4v2H4V5h4l1-2Z"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {employees.length === 0 && (
        <p className="empty-state">لا يوجد موظفون بعد — أضف أول موظف للصيدلية.</p>
      )}
    </section>
  );
};

export default EmployeesManagement;