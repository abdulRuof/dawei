"use client";

import { useEffect, useState } from "react";
import "./_components/style.css";

import Topbar from "@/components/layout/Topbar";
import Sidebar from "./_components/Sidebar";
import Overview from "./_components/Overview";

import { PharmaciesManagement } from "./_components/Pharmacies_management";
import RegistrationRequests from "./_components/Registration_requests";
import AccountsManagement from "./_components/Accounts_management";
import CategoriesManagement from "./_components/Categories_management";
import SystemMonitoring from "./_components/System_monitoring";
import AdminEntityDetails from "./_components/AdminEntityDetails";

import {
  approvePharmacyRequest,
  clearToken,
  createAdminCategory,
  deleteAdminAccount,
  deleteAdminCategory,
  deleteAdminPharmacy,
  getAdminAccounts,
  getAdminCategories,
  getAdminPharmacies,
  getMedicines,
  getPendingRequests,
  getToken,
  login,
  minPrice,
  rejectPharmacyRequest,
  setAccountActive,
  setPharmacyOpen,
  setToken,
  updateAdminCategory,
  type AdminAccount,
  type AdminCategory,
  type AdminPharmacy,
  type Medicine as ApiMedicine,
  type PharmacyRequestItem,
} from "@/lib/api";

import type {
  Pharmacy,
  RegistrationRequest,
  Account,
  Category,
  SectionId,
  Medicine,
} from "./_components/types";

// =========================
// Mapping
// =========================

const PHARMACY_COLOR = "linear-gradient(135deg,#0F6E5C,#159A80)";
const STOPPED_COLOR = "linear-gradient(135deg,#E24E36,#FF6B4A)";

function mapPharmacy(p: AdminPharmacy): Pharmacy {
  return {
    id: p.id,
    name: p.name,
    city: p.city,
    address: p.address,
    phone: p.phone,
    ownerName: p.owner_name,
    joined: (p.created_at || "").slice(0, 10),
    rating: 0,
    status: p.is_open ? "نشطة" : "موقوفة",
    initials: p.name.slice(0, 2) || "ص",
    color: p.is_open ? PHARMACY_COLOR : STOPPED_COLOR,
  };
}

function mapRequest(r: PharmacyRequestItem): RegistrationRequest {
  return {
    id: r.id,
    name: r.pharmacy_name,
    owner: r.full_name || "غير معروف",
    city: r.city || "—",
    date: (r.created_at || "").slice(0, 10),
    license: r.pharmacy_phone || r.phone || "—",
  };
}

function mapAccount(a: AdminAccount): Account {
  return {
    id: a.id,
    name: a.pharmacy_name || a.full_name,
    type: a.type === "صيدلية" ? "صيدلية" : "مستخدم",
    email: a.email,
    phone: a.phone,
    joined: a.created_at ? a.created_at.slice(0, 10) : "—",
    status: a.is_active ? "نشط" : "موقوف",
  };
}

function mapCategory(c: AdminCategory): Category {
  return {
    id: c.id,
    name: c.name,
    desc: c.desc || "",
    count: c.count,
  };
}

function mapMedicine(m: ApiMedicine): Medicine {
  return {
    id: m.id,
    name: m.name,
    meta: m.generic_name || "دواء",
    cat: m.category_name || "غير مصنف",
    qty: m.pharmacies.reduce((sum, p) => sum + p.quantity, 0),
    price: minPrice(m) ?? 0,
    sold: 0,
  };
}

// =========================
// Component
// =========================

export default function DashboardClient() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // المصادقة
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // القسم الحالي
  const [activeSection, setActiveSection] =
    useState<SectionId>("pharmacies");

  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // نافذة تفاصيل الكيان (صيدلية أو حساب)
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2600);
  };

  const loadData = async (token: string) => {
    setIsLoadingData(true);
    try {
      const [meds, pharms, reqs, accs, cats] = await Promise.all([
        getMedicines(),
        getAdminPharmacies(token),
        getPendingRequests(token),
        getAdminAccounts(token),
        getAdminCategories(token),
      ]);

      setMedicines(meds.results.map(mapMedicine));
      setPharmacies(pharms.results.map(mapPharmacy));
      setRequests(reqs.results.map(mapRequest));
      setAccounts(accs.results
        .filter((a) => !a.is_superadmin)
        .map(mapAccount));
      setCategories(cats.results.map(mapCategory));
    } catch (err) {
      throw err;
    } finally {
      setIsLoadingData(false);
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
      try {
        await loadData(token);
        if (cancelled) return;
        setIsAuthed(true);
      } catch (err) {
        if (cancelled) return;
        setAuthError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        if (!cancelled) setAuthChecked(true);
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
      await loadData(res.access_token);
      setIsAuthed(true);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    setMedicines([]);
    setPharmacies([]);
    setRequests([]);
    setAccounts([]);
    setCategories([]);
    setIsAuthed(false);
    setAuthError(null);
  };

  const onNavigate = (section: SectionId) => {
    setActiveSection(section);
  };

  // =========================
  // إدارة الصيدليات
  // =========================

  const onTogglePharmacyStatus = async (id: number) => {
    const token = getToken();
    if (!token) return;
    const pharmacy = pharmacies.find((p) => p.id === id);
    if (!pharmacy) return;

    try {
      const res = await setPharmacyOpen(id, token, pharmacy.status === "موقوفة");
      setPharmacies((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status: res.is_open ? "نشطة" : "موقوفة",
                color: res.is_open ? PHARMACY_COLOR : STOPPED_COLOR,
              }
            : p
        )
      );
      showToast(`✓ تم ${res.is_open ? "تفعيل" : "إيقاف"} "${res.name}"`);
    } catch (err) {
      showToast(err instanceof Error ? `✗ ${err.message}` : "فشل التعديل");
    }
  };

  const onDeletePharmacy = async (id: number) => {
    const token = getToken();
    if (!token) return;

    try {
      await deleteAdminPharmacy(id, token);
      setPharmacies((prev) => prev.filter((p) => p.id !== id));
      showToast("🗑 تم حذف الصيدلية");
    } catch (err) {
      showToast(err instanceof Error ? `✗ ${err.message}` : "فشل الحذف");
    }
  };

  // =========================
  // طلبات التسجيل
  // =========================

  const onApproveRequest = async (request: RegistrationRequest) => {
    const token = getToken();
    if (!token) return;

    try {
      await approvePharmacyRequest(request.id, token);
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      const pharms = await getAdminPharmacies(token);
      setPharmacies(pharms.results.map(mapPharmacy));
      showToast(`✓ تمت الموافقة على "${request.name}" وانضمت للمنصة`);
    } catch (err) {
      showToast(err instanceof Error ? `✗ ${err.message}` : "فشلت الموافقة");
    }
  };

  const onRejectRequest = async (request: RegistrationRequest) => {
    const token = getToken();
    if (!token) return;

    try {
      await rejectPharmacyRequest(request.id, token);
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      showToast(`تم رفض طلب "${request.name}"`);
    } catch (err) {
      showToast(err instanceof Error ? `✗ ${err.message}` : "فشل الرفض");
    }
  };

  // =========================
  // الحسابات
  // =========================

  const onToggleAccountStatus = async (id: number) => {
    const token = getToken();
    if (!token) return;
    const account = accounts.find((a) => a.id === id);
    if (!account) return;

    try {
      const res = await setAccountActive(id, token, account.status === "موقوف");
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: res.is_active ? "نشط" : "موقوف" } : a
        )
      );
      showToast(`✓ تم ${res.is_active ? "تفعيل" : "إيقاف"} حساب "${res.full_name}"`);
    } catch (err) {
      showToast(err instanceof Error ? `✗ ${err.message}` : "فشل التعديل");
    }
  };

  const onDeleteAccount = async (id: number) => {
    const token = getToken();
    if (!token) return;

    try {
      await deleteAdminAccount(id, token);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      showToast("🗑 تم حذف الحساب");
    } catch (err) {
      showToast(err instanceof Error ? `✗ ${err.message}` : "فشل الحذف");
    }
  };

  // =========================
  // التصنيفات
  // =========================

  const onAddCategory = async (category: Omit<Category, "id">) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await createAdminCategory(token, category.name);
      setCategories((prev) => [...prev, mapCategory(res)]);
      showToast(`✓ تمت إضافة تصنيف "${res.name}"`);
    } catch (err) {
      showToast(err instanceof Error ? `✗ ${err.message}` : "فشلت الإضافة");
    }
  };

  const onUpdateCategory = async (category: Category) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await updateAdminCategory(category.id, token, category.name);
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? mapCategory(res) : c))
      );
      showToast("✓ تم تعديل التصنيف");
    } catch (err) {
      showToast(err instanceof Error ? `✗ ${err.message}` : "فشل التعديل");
    }
  };

  const onDeleteCategory = async (id: number) => {
    const token = getToken();
    if (!token) return;

    try {
      await deleteAdminCategory(id, token);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      showToast("🗑 تم حذف التصنيف");
    } catch (err) {
      showToast(err instanceof Error ? `✗ ${err.message}` : "فشل الحذف");
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
              <h2 className="owner-login__title">دخول مدير المنصة</h2>
              <p className="owner-login__sub">
                سجّل الدخول بحساب السوبر أدمن لإدارة المنصة
              </p>

              <form className="owner-login__form" onSubmit={handleLogin}>
                <label className="owner-login__field">
                  <span>البريد الإلكتروني</span>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@example.com"
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

  return (
    <div className="dash">
      <Sidebar
        activeSection={activeSection}
        onNavigate={onNavigate}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />

      <div className="dash-main">
        <Topbar onLogout={handleLogout} pharmacyName="لوحة التحكم" onMenuToggle={() => setIsOpen(true)} />

        <div className="dash-content">
          {isLoadingData ? (
            <p className="empty-state">جارٍ تحميل بيانات المنصة…</p>
          ) : (
            <>
              {activeSection === "overview" && (
                <Overview
                  medicines={medicines}
                  onNavigate={onNavigate}
                  lowStockThreshold={10}
                />
              )}

              {activeSection === "pharmacies" && (
                <PharmaciesManagement
                  pharmacies={pharmacies}
                  onToggleStatus={onTogglePharmacyStatus}
                  onDelete={onDeletePharmacy}
                  onView={(id) =>
                    setSelectedPharmacy(
                      pharmacies.find((p) => p.id === id) ?? null
                    )
                  }
                />
              )}

              {activeSection === "requests" && (
                <RegistrationRequests
                  requests={requests}
                  setRequests={setRequests}
                  setPharmacies={setPharmacies}
                  showToast={showToast}
                  onApprove={onApproveRequest}
                  onReject={onRejectRequest}
                />
              )}

              {activeSection === "accounts" && (
                <AccountsManagement
                  accounts={accounts}
                  setAccounts={setAccounts}
                  showToast={showToast}
                  onToggleStatus={onToggleAccountStatus}
                  onDelete={onDeleteAccount}
                  onView={(id) =>
                    setSelectedAccount(
                      accounts.find((a) => a.id === id) ?? null
                    )
                  }
                />
              )}

              {activeSection === "categories" && (
                <CategoriesManagement
                  categories={categories}
                  setCategories={setCategories}
                  showToast={showToast}
                  onAdd={onAddCategory}
                  onUpdate={onUpdateCategory}
                  onDelete={onDeleteCategory}
                />
              )}

              {activeSection === "system-monitoring" && (
                <SystemMonitoring />
              )}
            </>
          )}
        </div>
      </div>

      {(selectedPharmacy || selectedAccount) && (
        <AdminEntityDetails
          kind={selectedPharmacy ? "pharmacy" : "account"}
          pharmacy={selectedPharmacy ?? undefined}
          account={selectedAccount ?? undefined}
          ownerAccount={
            selectedPharmacy
              ? accounts.find(
                  (a) => a.type === "صيدلية" && a.name === selectedPharmacy.name
                ) ?? null
              : null
          }
          onToggleStatus={() => {
            if (selectedPharmacy) {
              onTogglePharmacyStatus(selectedPharmacy.id);
            } else if (selectedAccount) {
              onToggleAccountStatus(selectedAccount.id);
            }
          }}
          onDelete={() => {
            if (selectedPharmacy) {
              onDeletePharmacy(selectedPharmacy.id);
              setSelectedPharmacy(null);
            } else if (selectedAccount) {
              onDeleteAccount(selectedAccount.id);
              setSelectedAccount(null);
            }
          }}
          onClose={() => {
            setSelectedPharmacy(null);
            setSelectedAccount(null);
          }}
        />
      )}

      {/* Toast Notification */}
      <div className={`toast ${toast ? "is-visible" : ""}`}>{toast}</div>
    </div>
  );
}