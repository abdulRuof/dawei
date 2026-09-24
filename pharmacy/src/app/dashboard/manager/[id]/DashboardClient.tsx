"use client";

import { useEffect, useRef, useState } from "react";
import '../[id]/_components/style.css'
import Topbar from "@/components/layout/Topbar";
import Sidebar from "./_components/Sidebar";
import Overview from "./_components/Overview";
import MedicinesManagement from "./_components/MedicinesManagement";
import {
  addEmployee,
  addInventoryMedicine,
  clearToken,
  deleteEmployee,
  deleteInventoryMedicine,
  getActivityLog,
  getEmployees,
  getInventory,
  getMe,
  getPharmacy,
  getToken,
  login,
  removeInventoryImage,
  removePharmacyImage,
  setEmployeeActive,
  setInventoryVisibility,
  setToken,
  togglePharmacyStatus,
  updateInventoryMedicine,
  updateMe,
  updatePharmacyWorkingHours,
  uploadInventoryImage,
  uploadPharmacyImage,
} from "@/lib/api";

import type {
  ActivityLogItem,
  PharmacyEmployee,
} from "@/lib/api";

import type {
  Medicine,
  SectionId,
  FocusType,
} from "./_components/types";
import EmployeesManagement from "./_components/EmployeesManagement";
import ActivityLog from "./_components/ActivityLog";

interface DashboardClientProps {
  pharmacyId: number;
}

function toMed(medicines: Medicine[], item: {
  id: number;
  name: string;
  meta: string;
  cat: string;
  qty: number;
  min_stock?: number;
  price: number;
  sold: number;
  image_url: string | null;
  is_active: boolean;
}): Medicine {
  const found = medicines.find((m) => m.id === item.id);
  return {
    id: item.id,
    name: item.name,
    meta: item.meta,
    cat: item.cat,
    qty: item.qty,
    min_stock: item.min_stock ?? 10,
    price: item.price,
    sold: found?.sold ?? item.sold,
    image_url: item.image_url,
    is_active: item.is_active,
  };
}

export default function DashboardClient({
  pharmacyId,
}: DashboardClientProps) {
  // الأدوية (مخزون الصيدلية من الـ API)
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [employees, setEmployees] = useState<PharmacyEmployee[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // حالة المصادقة
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [mustChange, setMustChange] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwNew2, setPwNew2] = useState("");
  const [isChangingPw, setIsChangingPw] = useState(false);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [pharmacyName, setPharmacyName] = useState("");
  const [pharmacyOpen, setPharmacyOpen] = useState(true);
  const [pharmacyImage, setPharmacyImage] = useState<string | null>(null);
  const [workOpen, setWorkOpen] = useState<string | null>(null);
  const [workClose, setWorkClose] = useState<string | null>(null);
  const [workTimer, setWorkTimer] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  // القسم الحالي
  const [activeSection, setActiveSection] =
    useState<SectionId>("overview");

  // التركيز الحالي
  const [activeFocus, setActiveFocus] =
    useState<FocusType>("none");

  // فتح وإغلاق Sidebar
  const [isOpen, setIsOpen] = useState(false);

  const fetchInventory = async (token: string): Promise<Medicine[]> => {
    try {
      const p = await getPharmacy(pharmacyId);
      setPharmacyName(p.name);
      setPharmacyOpen(p.is_open);
      setPharmacyImage(p.image_url ?? null);
      setWorkOpen(p.work_open ?? null);
      setWorkClose(p.work_close ?? null);
      setWorkTimer(!!p.work_timer);
    } catch {
      // keep current name
    }
    const res = await getInventory(pharmacyId, token);
    return res.results.map((item) => ({
      id: item.id,
      name: item.name,
      meta: item.meta,
      cat: item.cat,
      qty: item.qty,
      min_stock: item.min_stock ?? 10,
      price: item.price,
      sold: item.sold,
      image_url: item.image_url,
      is_active: item.is_active,
    }));
  };

  const fetchActivities = async (token: string): Promise<void> => {
    setIsLoadingActivity(true);
    try {
      const res = await getActivityLog(pharmacyId, token);
      setActivities(res.results);
    } catch {
      setActivities([]);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  const fetchEmployees = async (token: string): Promise<void> => {
    try {
      const res = await getEmployees(pharmacyId, token);
      setEmployees(res.results);
      setIsOwner(true);
      await fetchActivities(token);
    } catch {
      setIsOwner(false);
      setEmployees([]);
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const token = getToken();
      if (!token) {
        await Promise.resolve();
        if (!cancelled) setAuthChecked(true);
        return;
      }

      await Promise.resolve();
      setIsLoadingInventory(true);
      try {
        const items = await fetchInventory(token);
        if (cancelled) return;
        setMedicines(items);
        setIsAuthed(true);
        try {
          const me = await getMe();
          if (!cancelled && me.must_change_password) setMustChange(true);
        } catch {
          /* ignore */
        }
        await fetchEmployees(token);
      } catch (err) {
        if (cancelled) return;
        setAuthError(err instanceof Error ? err.message : "Failed to load inventory");
      } finally {
        if (!cancelled) {
          setIsLoadingInventory(false);
          setAuthChecked(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);
    try {
      const res = await login(loginEmail.trim(), loginPassword);
      setToken(res.access_token);
      const items = await fetchInventory(res.access_token);
      setMedicines(items);
      setIsAuthed(true);
      setMustChange(!!res.user.must_change_password);
      await fetchEmployees(res.access_token);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    setMedicines([]);
    setEmployees([]);
    setIsOwner(false);
    setIsAuthed(false);
    setMustChange(false);
    setAuthError(null);
  };

  // تغيير كلمة المرور المؤقتة عند أول دخول (الموظف الجديد)
  const handleForceChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError(null);

    if (pwNew.length < 8) {
      setAuthError("كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف");
      return;
    }
    if (pwNew !== pwNew2) {
      setAuthError("تأكيد كلمة المرور غير مطابق");
      return;
    }

    setIsChangingPw(true);
    try {
      await updateMe({ current_password: pwCurrent, new_password: pwNew });
      setMustChange(false);
      setPwCurrent("");
      setPwNew("");
      setPwNew2("");
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "فشل تغيير كلمة المرور");
    } finally {
      setIsChangingPw(false);
    }
  };

  // إظهار رسالة
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  // التنقل بين الأقسام
  const onNavigate = (
    section: SectionId,
    focus: FocusType
  ) => {
    setActiveSection(section);
    setActiveFocus(focus);
  };

  const approveAccess = () => {
    try {
      const token = getToken();
      if (!token) {
        setAuthError("No access token");
        return false;
      }
      return token;
    } catch {
      setAuthError("No access token");
      return false;
    }
  };

  // إضافة دواء إلى مخزون الصيدلية
  const onAddMedicine = async (
    newMed: Omit<Medicine, "id" | "sold">
  ) => {
    const token = approveAccess();
    if (!token) return;

    try {
      const item = await addInventoryMedicine(pharmacyId, token, {
        name: newMed.name,
        category: newMed.cat,
        qty: newMed.qty,
        price: newMed.price,
        min_stock: newMed.min_stock ?? 10,
      });
      setMedicines((prev) => [...prev, toMed(prev, item)]);
      showToast(`✓ تمت إضافة "${item.name}" إلى المخزون`);
    } catch (err) {
      showToast(err instanceof Error ? `✗ ${err.message}` : "فشلت الإضافة");
    }
  };

  // تعديل دواء (الكمية/السعر)
  const onSaveMedicine = async (
    updatedMed: Medicine
  ) => {
    const token = approveAccess();
    if (!token) return;

    try {
      const item = await updateInventoryMedicine(pharmacyId, updatedMed.id, token, {
        qty: updatedMed.qty,
        price: updatedMed.price,
        min_stock: updatedMed.min_stock,
      });
      setMedicines((prev) =>
        prev.map((m) => (m.id === updatedMed.id ? toMed(prev, item) : m))
      );
      showToast(`✓ تم حفظ تغييرات "${item.name}"`);
    } catch (err) {
      showToast(err instanceof Error ? `✗ ${err.message}` : "فشل الحفظ");
    }
  };

  // حذف دواء من المخزون
  const onDeleteMedicine = async (id: number) => {
    const token = approveAccess();
    if (!token) return;

    try {
      await deleteInventoryMedicine(pharmacyId, id, token);
      setMedicines((prev) => prev.filter((m) => m.id !== id));
      await fetchActivities(token);
      showToast("🗑 تم حذف الدواء من المخزون");
    } catch (err) {
      showToast(err instanceof Error ? `✗ ${err.message}` : "فشل الحذف");
    }
  };

  // إخفاء/إظهار دواء عن الموقع العام (للمدير فقط)
  const onToggleVisibility = async (med: Medicine) => {
    const token = approveAccess();
    if (!token) return;

    try {
      const updated = await setInventoryVisibility(
        pharmacyId,
        med.id,
        token,
        !med.is_active
      );
      setMedicines((prev) =>
        prev.map((m) => (m.id === med.id ? toMed(prev, updated) : m))
      );
      await fetchActivities(token);
      showToast(
        updated.is_active ? "✓ تمت إعادة عرض الدواء" : "✓ تم إخفاء الدواء عن الموقع"
      );
    } catch (err) {
      showToast(err instanceof Error ? `✗ ${err.message}` : "فشل تغيير الحالة");
    }
  };

  // رفع صورة لدواء في المخزون
  const onUploadImage = async (itemId: number, file: File) => {
    const token = approveAccess();
    if (!token) return;

    try {
      const updated = await uploadInventoryImage(pharmacyId, itemId, token, file);
      setMedicines((prev) =>
        prev.map((m) => (m.id === itemId ? toMed(prev, updated) : m))
      );
      showToast("✓ تم رفع صورة الدواء");
    } catch (err) {
      showToast(err instanceof Error ? `✗ ${err.message}` : "فشل رفع الصورة");
    }
  };

  // حذف صورة دواء
  const onRemoveImage = async (itemId: number) => {
    const token = approveAccess();
    if (!token) return;

    try {
      const updated = await removeInventoryImage(pharmacyId, itemId, token);
      setMedicines((prev) =>
        prev.map((m) => (m.id === itemId ? toMed(prev, updated) : m))
      );
      showToast("✓ تم حذف صورة الدواء");
    } catch (err) {
      showToast(err instanceof Error ? `✗ ${err.message}` : "فشل حذف الصورة");
    }
  };

  // إضافة موظف إلى الصيدلية
  const onAddEmployee = async (payload: {
    full_name: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    const token = approveAccess();
    if (!token) return false;

    try {
      const emp = await addEmployee(pharmacyId, token, payload);
      setEmployees((prev) => [...prev, emp]);
      await fetchActivities(token);
      showToast(`✓ تمت إضافة "${emp.full_name}" كموظف للصيدلية`);
      return true;
    } catch (err) {
      showToast(err instanceof Error ? `✗ ${err.message}` : "فشل إضافة الموظف");
      return false;
    }
  };

  // تفعيل/إيقاف موظف
  const onToggleEmployee = async (employee: PharmacyEmployee) => {
    const token = approveAccess();
    if (!token) return;

    try {
      const updated = await setEmployeeActive(
        pharmacyId,
        employee.id,
        token,
        !employee.is_active
      );
      setEmployees((prev) =>
        prev.map((e) => (e.id === updated.id ? updated : e))
      );
    } catch (err) {
      showToast(err instanceof Error ? `✗ ${err.message}` : "فشل تغيير الحالة");
    }
  };

  // حذف موظف من الصيدلية
  const onDeleteEmployee = async (employeeId: number) => {
    const token = approveAccess();
    if (!token) return;

    try {
      await deleteEmployee(pharmacyId, employeeId, token);
      setEmployees((prev) => prev.filter((e) => e.id !== employeeId));
    } catch (err) {
      showToast(err instanceof Error ? `✗ ${err.message}` : "فشل الحذف");
    }
  };

  // فتح/إغلاق الصيدلية
  const onToggleStatus = async () => {
    if (statusBusy) return;
    setStatusBusy(true);
    try {
      const res = await togglePharmacyStatus(pharmacyId);
      setPharmacyOpen(res.is_open);
      if (res.work_timer === false) setWorkTimer(false);
      showToast(
        res.is_open ? "✓ الصيدلية مفتوحة الآن" : "✓ تم إغلاق الصيدلية"
      );
      fetchActivities(approveAccess() || "");
    } catch (err) {
      showToast(err instanceof Error ? `✗ ${err.message}` : "تعذّر تغيير الحالة");
    } finally {
      setStatusBusy(false);
    }
  };

  // رفع صورة الصيدلية (المدير)
  const onUploadPharmacyImage = async (file: File) => {
    const token = approveAccess();
    if (!token) return;
    try {
      const updated = await uploadPharmacyImage(pharmacyId, token, file);
      setPharmacyImage(updated.image_url ?? null);
      showToast("✓ تم رفع صورة الصيدلية");
    } catch (err) {
      showToast(err instanceof Error ? `✗ ${err.message}` : "فشل رفع الصورة");
    }
  };

  // حذف صورة الصيدلية
  const onRemovePharmacyImage = async () => {
    const token = approveAccess();
    if (!token) return;
    try {
      const updated = await removePharmacyImage(pharmacyId, token);
      setPharmacyImage(updated.image_url ?? null);
      showToast("✓ تم حذف صورة الصيدلية");
    } catch (err) {
      showToast(err instanceof Error ? `✗ ${err.message}` : "فشل حذف الصورة");
    }
  };

  // حفظ ساعات العمل + الموقت التلقائي
  const onSaveWorkingHours = async (
    open: string | null,
    close: string | null,
    timer: boolean
  ) => {
    const token = approveAccess();
    if (!token) return;
    try {
      const updated = await updatePharmacyWorkingHours(pharmacyId, {
        work_open: open,
        work_close: close,
        work_timer: timer,
      });
      setWorkOpen(updated.work_open ?? null);
      setWorkClose(updated.work_close ?? null);
      setWorkTimer(!!updated.work_timer);
      if (updated.is_open !== pharmacyOpen) setPharmacyOpen(updated.is_open);
      showToast("✓ تم حفظ ساعات العمل");
      fetchActivities(token);
    } catch (err) {
      showToast(err instanceof Error ? `✗ ${err.message}` : "فشل حفظ ساعات العمل");
    }
  };

  if (!authChecked) {
    return (
      <div className="dash">
        <div className="dash-main">
          <div className="owner-login">
            <p className="owner-login__hint">جاري التحقق…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="dash">
        <div className="dash-main">
          <div className="owner-login">
            <div className="owner-login__card">
              <h2 className="owner-login__title">دخول إدارة الصيدلية</h2>
              <p className="owner-login__sub">
                سجّل الدخول لإدارة الصيدلية (الرقم: {pharmacyId})
              </p>

              <form className="owner-login__form" onSubmit={handleLogin}>
                <label className="owner-login__field">
                  <span>البريد الإلكتروني</span>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="owner@example.com"
                  />
                </label>
                <label className="owner-login__field">
                  <span>كلمة المرور</span>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••"
                  />
                </label>

                {authError && (
                  <p className="owner-login__error">{authError}</p>
                )}

                <button
                  type="submit"
                  className="btn btn--coral"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? "جارٍ الدخول…" : "دخول"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mustChange) {
    return (
      <div className="dash">
        <div className="dash-main">
          <div className="owner-login">
            <div className="owner-login__card">
              <h2 className="owner-login__title">تغيير كلمة المرور</h2>
              <p className="owner-login__sub">
                هذه أول زيارة لك بحساب الموظف — يرجى تعيين كلمة مرور جديدة
                قبل استكمال استخدام لوحة التحكم.
              </p>

              <form
                className="owner-login__form"
                onSubmit={handleForceChangePassword}
              >
                <label className="owner-login__field">
                  <span>كلمة المرور المؤقتة</span>
                  <input
                    type="password"
                    required
                    value={pwCurrent}
                    onChange={(e) => setPwCurrent(e.target.value)}
                  />
                </label>
                <label className="owner-login__field">
                  <span>كلمة المرور الجديدة</span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={pwNew}
                    onChange={(e) => setPwNew(e.target.value)}
                    placeholder="8 أحرف على الأقل"
                  />
                </label>
                <label className="owner-login__field">
                  <span>تأكيد كلمة المرور الجديدة</span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={pwNew2}
                    onChange={(e) => setPwNew2(e.target.value)}
                  />
                </label>

                {authError && (
                  <p className="owner-login__error">{authError}</p>
                )}

                <button
                  type="submit"
                  className="btn btn--coral"
                  disabled={isChangingPw}
                >
                  {isChangingPw ? "جارٍ الحفظ…" : "حفظ كلمة المرور الجديدة"}
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={handleLogout}
                  style={{ marginTop: "8px", width: "100%" }}
                >
                  تسجيل الخروج
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dash">

      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        activeFocus={activeFocus}
        onNavigate={onNavigate}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        showEmployees={isOwner}
      />

      {/* المحتوى الرئيسي */}
      <div className="dash-main">
        <Topbar onLogout={handleLogout} pharmacyName={pharmacyName || undefined} onMenuToggle={() => setIsOpen(true)} />
        <div className="dash-content">

        {isLoadingInventory ? (
          <p className="empty-state">جارٍ تحميل المخزون…</p>
        ) : (
        <>
        {activeSection === "overview" && (
          <Overview
            medicines={medicines}
            onNavigate={onNavigate}
            lowStockThreshold={10}
            pharmacyOpen={pharmacyOpen}
            onToggleStatus={onToggleStatus}
            statusBusy={statusBusy}
            showSettings={isOwner}
            pharmacyImage={pharmacyImage}
            workOpen={workOpen}
            workClose={workClose}
            workTimer={workTimer}
            onUploadPharmacyImage={onUploadPharmacyImage}
            onRemovePharmacyImage={onRemovePharmacyImage}
            onSaveWorkingHours={onSaveWorkingHours}
          />
        )}

        {activeSection === "medicines" && (
          <MedicinesManagement
            medicines={medicines}
            onSaveMedicine={onSaveMedicine}
            onDeleteMedicine={onDeleteMedicine}
            onAddMedicine={onAddMedicine}
            onUploadImage={onUploadImage}
            onRemoveImage={onRemoveImage}
            onToggleVisibility={onToggleVisibility}
            isAdmin={isOwner}
            activeFocus={activeFocus}
            showToast={showToast}
          />
        )}

        {activeSection === "employees" && isOwner && (
          <EmployeesManagement
            employees={employees}
            onAddEmployee={onAddEmployee}
            onToggleEmployee={onToggleEmployee}
            onDeleteEmployee={onDeleteEmployee}
            showToast={showToast}
          />
        )}

        {activeSection === "activity" && isOwner && (
          <ActivityLog
            activities={activities}
            loading={isLoadingActivity}
          />
        )}
        </>
        )}

      </div>
      </div>

      <div className={`toast ${toast ? 'is-visible' : ''}`} role="status">
        {toast}
      </div>
    </div>
  );
}