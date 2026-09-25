export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface PharmacyOffer {
  pharmacy_id: number;
  pharmacy_name: string;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  price: number;
  quantity: number;
  is_available: boolean;
}

export interface Medicine {
  id: number;
  name: string;
  generic_name: string | null;
  description: string | null;
  category_id: number | null;
  category_name?: string | null;
  image_url: string | null;
  pharmacies: PharmacyOffer[];
}

export interface Pharmacy {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  is_open: boolean;
  description: string | null;
  image_url?: string | null;
  work_open?: string | null;
  work_close?: string | null;
  work_timer?: boolean;
}

export interface PharmacyInventoryItem {
  id: number;
  name: string;
  generic_name: string | null;
  price: number;
  quantity: number;
  is_available: boolean;
  image_url: string | null;
}

export interface PharmacyDetail extends Pharmacy {
  medicines_count: number;
  medicines: PharmacyInventoryItem[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });

  if (!res.ok) {
    let detail = `API error ${res.status}`;
    try {
      const body = await res.json();
      if (body && body.detail) detail = String(body.detail);
    } catch {
      // ليست JSON
    }
    throw new Error(friendlyError(detail));
  }

  return res.json() as Promise<T>;
}

const FRIENDLY_ERRORS: { match: RegExp; message: string }[] = [
  { match: /already registered|Email already/i, message: "هذا البريد أو الهاتف مسجّل مسبقًا" },
  { match: /Invalid email or password/i, message: "البريد أو كلمة المرور غير صحيحة" },
  { match: /Password must be at least/i, message: "كلمة المرور يجب ألا تقل عن 8 أحرف" },
  { match: /all fields are required|Field .* is required/i, message: "يرجى تعبئة جميع الحقول المطلوبة" },
  { match: /inactive/i, message: "هذا الحساب موقوف — تواصل مع الإدارة" },
  { match: /permission/i, message: "ليس لديك صلاحية لهذا الإجراء" },
];

function friendlyError(detail: string): string {
  for (const rule of FRIENDLY_ERRORS) {
    if (rule.match.test(detail)) return rule.message;
  }
  return detail;
}

export const getMedicines = () =>
  request<{ count: number; results: Medicine[] }>("/api/medicines");

export const searchMedicines = (q: string) =>
  request<{ query: string; results: Medicine[] }>(
    `/api/medicines/search?q=${encodeURIComponent(q)}`
  );

export const getMedicine = (id: number | string) =>
  request<Medicine & { message?: string }>(`/api/medicines/${id}`);

export const getPharmacies = () =>
  request<{ count: number; results: Pharmacy[] }>("/api/pharmacies/");

export const getPharmacy = (id: number | string) =>
  request<PharmacyDetail>(`/api/pharmacies/${id}`);

export const minPrice = (m: Medicine): number | null => {
  if (!m.pharmacies || m.pharmacies.length === 0) return null;
  return Math.min(...m.pharmacies.map((p) => p.price));
};

export const isAvailable = (m: Medicine): boolean =>
  m.pharmacies.some((p) => p.is_available);

export const formatPrice = (n: number | null): string =>
  n == null ? "—" : n.toFixed(2).replace(/\.00$/, "");

export const imageUrl = (path: string | null | undefined): string | null =>
  path ? `${API_URL}${path}` : null;

// =========================
// Auth + Pharmacy inventory (owner dashboard)
// =========================

export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  pharmacy_id: number | null;
  is_superadmin?: boolean;
  must_change_password?: boolean;
  avatar_url?: string | null;
}

export interface LoginResponse {
  message: string;
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface InventoryMedicine {
  id: number;
  medicine_id: number;
  name: string;
  generic_name: string | null;
  meta: string;
  cat: string;
  qty: number;
  min_stock?: number;
  price: number;
  is_available: boolean;
  sold: number;
  image_url: string | null;
  is_active: boolean;
}

const TOKEN_KEY = "dawei_token";

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
};

export const clearToken = () => {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(TOKEN_KEY);
  }
};

export const login = (email: string, password: string) =>
  request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const register = (
  fullName: string,
  email: string,
  password: string
) =>
  request<LoginResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ full_name: fullName, email, password }),
  });

export interface PharmacyRequestPayload {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  pharmacy_name: string;
  pharmacy_phone: string;
  city: string;
  address: string;
  description: string;
}

export const createPharmacyRequest = (payload: PharmacyRequestPayload) =>
  request<{ message: string; request: object }>("/api/pharmacy-requests/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export interface PharmacyEmployee {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
}

export const getEmployees = (pharmacyId: number, token: string) =>
  authRequest<{ count: number; results: PharmacyEmployee[] }>(
    `/api/pharmacies/${pharmacyId}/employees`,
    token
  );

export const addEmployee = (
  pharmacyId: number,
  token: string,
  payload: { full_name: string; email: string; phone: string; password: string }
) =>
  authRequest<PharmacyEmployee>(`/api/pharmacies/${pharmacyId}/employees`, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const setEmployeeActive = (
  pharmacyId: number,
  employeeId: number,
  token: string,
  isActive: boolean
) =>
  authRequest<PharmacyEmployee>(
    `/api/pharmacies/${pharmacyId}/employees/${employeeId}`,
    token,
    { method: "PATCH", body: JSON.stringify({ is_active: isActive }) }
  );

export const deleteEmployee = (
  pharmacyId: number,
  employeeId: number,
  token: string
) =>
  authRequest<{ message: string }>(
    `/api/pharmacies/${pharmacyId}/employees/${employeeId}`,
    token,
    { method: "DELETE" }
  );

function authRequest<T>(
  path: string,
  token: string,
  init?: RequestInit
): Promise<T> {
  return request<T>(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
}

export const getInventory = (pharmacyId: number, token: string) =>
  authRequest<{ count: number; results: InventoryMedicine[] }>(
    `/api/pharmacies/${pharmacyId}/inventory`,
    token
  );

export const addInventoryMedicine = (
  pharmacyId: number,
  token: string,
  payload: { name: string; category?: string; qty: number; price: number; min_stock?: number }
) =>
  authRequest<InventoryMedicine>(
    `/api/pharmacies/${pharmacyId}/inventory`,
    token,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

export const updateInventoryMedicine = (
  pharmacyId: number,
  itemId: number,
  token: string,
  payload: { qty?: number; price?: number; min_stock?: number; is_available?: boolean }
) =>
  authRequest<InventoryMedicine>(
    `/api/pharmacies/${pharmacyId}/inventory/${itemId}`,
    token,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );

export const deleteInventoryMedicine = (
  pharmacyId: number,
  itemId: number,
  token: string
) =>
  authRequest<{ message: string }>(
    `/api/pharmacies/${pharmacyId}/inventory/${itemId}`,
    token,
    { method: "DELETE" }
  );

async function formRequest<T>(
  path: string,
  token: string,
  formData: FormData
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    let detail = `API error ${res.status}`;
    try {
      const body = await res.json();
      if (body && body.detail) detail = String(body.detail);
    } catch {
      // ليست JSON
    }
    throw new Error(friendlyError(detail));
  }

  return res.json() as Promise<T>;
}

export const uploadInventoryImage = (
  pharmacyId: number,
  itemId: number,
  token: string,
  file: File
) => {
  const formData = new FormData();
  formData.append("file", file);
  return formRequest<InventoryMedicine>(
    `/api/pharmacies/${pharmacyId}/inventory/${itemId}/image`,
    token,
    formData
  );
};

export const removeInventoryImage = (
  pharmacyId: number,
  itemId: number,
  token: string
) =>
  authRequest<InventoryMedicine>(
    `/api/pharmacies/${pharmacyId}/inventory/${itemId}/image`,
    token,
    { method: "DELETE" }
  );

export const setInventoryVisibility = (
  pharmacyId: number,
  itemId: number,
  token: string,
  isActive: boolean
) =>
  authRequest<InventoryMedicine>(
    `/api/pharmacies/${pharmacyId}/inventory/${itemId}/visibility`,
    token,
    { method: "PATCH", body: JSON.stringify({ is_active: isActive }) }
  );

export interface ActivityLogItem {
  id: number;
  user_name: string;
  role: string | null;
  action: string;
  entity_type?: string | null;
  entity_id?: number | null;
  old_value?: string | null;
  new_value?: string | null;
  description: string | null;
  created_at: string;
}

export const getActivityLog = (pharmacyId: number, token: string) =>
  authRequest<{ count: number; results: ActivityLogItem[] }>(
    `/api/pharmacies/${pharmacyId}/activity`,
    token
  );

// =========================
// Account + notifications + reviews
// =========================

const tok = (): string => {
  const t = getToken();
  if (!t) throw new Error("ليس لديك جلسة دخول — سجّل الدخول أولًا");
  return t;
};

export const getMe = () =>
  authRequest<AuthUser>(`/api/auth/me`, tok());

export const updateMe = (data: {
  full_name?: string;
  phone?: string;
}) => authRequest<AuthUser>(`/api/auth/me`, tok(), { method: "PUT", body: JSON.stringify(data) });

export const changePassword = (current_password: string, new_password: string) =>
  authRequest<{ message: string; user: AuthUser }>(`/api/auth/change-password`, tok(), {
    method: "POST",
    body: JSON.stringify({ current_password, new_password }),
  });

export const uploadAvatar = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return formRequest<{ message: string; user: AuthUser }>(`/api/auth/avatar`, tok(), formData);
};

export const forgotPassword = (email: string) =>
  request<{ message: string; code: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const resetPassword = (data: {
  email: string;
  code: string;
  new_password: string;
}) =>
  request<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(data),
  });

export interface ReviewItem {
  id: number;
  user_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface ReviewsResponse {
  count: number;
  average_rating: number | null;
  results: ReviewItem[];
}

export const getPharmacyReviews = (id: number | string) =>
  request<ReviewsResponse>(`/api/pharmacies/${id}/reviews`);

export const getMedicineReviews = (id: number | string) =>
  request<ReviewsResponse>(`/api/medicines/${id}/reviews`);

export const createReview = (data: {
  pharmacy_id?: number;
  medicine_id?: number;
  rating: number;
  comment?: string;
}) =>
  request<{ message: string; review: ReviewItem }>(`/api/reviews`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tok()}` },
    body: JSON.stringify(data),
  });

export interface NotificationItem {
  id: number;
  type?: string | null;
  title: string;
  body: string | null;
  link: string | null;
  entity_type?: string | null;
  entity_id?: number | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsSummary {
  scopes: string[];
  unread: Record<string, number>;
  total_unread: number;
}

export type NotificationScope = "user" | "pharmacy" | "admin";

export interface NotificationsResponse {
  scope?: string | null;
  count: number;
  unread_count: number;
  results: NotificationItem[];
  scopes?: {
    available: string[];
    unread: Record<string, number>;
  };
}

export const getNotifications = (scope?: NotificationScope) =>
  authRequest<NotificationsResponse>(
    `/api/notifications${scope ? `?scope=${scope}` : ""}`,
    tok()
  );

export const getNotificationsSummary = () =>
  authRequest<NotificationsSummary>(`/api/notifications/summary`, tok());

export const markNotificationRead = (id: number) =>
  authRequest<{ message: string }>(`/api/notifications/${id}/read`, tok(), {
    method: "PATCH",
  });

export const markAllNotificationsRead = (scope?: NotificationScope) =>
  authRequest<{ message: string }>(
    `/api/notifications/read-all${scope ? `?scope=${scope}` : ""}`,
    tok(),
    {
      method: "PATCH",
    }
  );

export const togglePharmacyStatus = (pharmacyId: number) =>
  authRequest<{ message: string; is_open: boolean; work_timer?: boolean }>(
    `/api/pharmacies/${pharmacyId}/status`,
    tok(),
    { method: "PATCH" }
  );

export const updatePharmacyWorkingHours = (
  pharmacyId: number,
  payload: { work_open?: string | null; work_close?: string | null; work_timer?: boolean }
) =>
  authRequest<Pharmacy>(`/api/pharmacies/${pharmacyId}/working-hours`, tok(), {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const uploadPharmacyImage = (
  pharmacyId: number,
  token: string,
  file: File
) => {
  const formData = new FormData();
  formData.append("file", file);
  return formRequest<Pharmacy>(
    `/api/pharmacies/${pharmacyId}/image`,
    token,
    formData
  );
};

export const removePharmacyImage = (pharmacyId: number, token: string) =>
  authRequest<Pharmacy>(`/api/pharmacies/${pharmacyId}/image`, token, {
    method: "DELETE",
  });

// =========================
// Medicine availability alerts
// =========================

export interface AlertItem {
  id: number;
  medicine_id: number;
  medicine_name: string;
  pharmacy_id: number | null;
  pharmacy_name: string | null;
  is_active: boolean;
  created_at: string;
}

export const createAlert = (medicineId: number, pharmacyId?: number) =>
  authRequest<{ message: string; alert: AlertItem }>(`/api/alerts`, tok(), {
    method: "POST",
    body: JSON.stringify({
      medicine_id: medicineId,
      pharmacy_id: pharmacyId ?? null,
    }),
  });

export const getMyAlerts = () =>
  authRequest<{ count: number; results: AlertItem[] }>(`/api/alerts`, tok());

export const deactivateAlert = (alertId: number) =>
  authRequest<{ message: string }>(`/api/alerts/${alertId}`, tok(), {
    method: "DELETE",
  });

export const createPharmacyRequestFromAccount = (data: {
  pharmacy_name: string;
  pharmacy_phone: string;
  city: string;
  address: string;
  description?: string;
  phone?: string;
  region_name?: string;
  region_id?: number;
  latitude?: number;
  longitude?: number;
}) =>
  authRequest<{ message: string; request: object }>(
    "/api/pharmacy-requests/from-account",
    tok(),
    { method: "POST", body: JSON.stringify(data) }
  );

// =========================
// Super Admin
// =========================

export interface AdminStats {
  medicines: number;
  pharmacies: number;
  pending_requests: number;
  users: number;
  categories: number;
}

export interface AdminPharmacy {
  id: number;
  name: string;
  city: string;
  address: string | null;
  phone: string | null;
  is_open: boolean;
  created_at: string;
  medicines_count: number;
  owner_name: string | null;
}

export interface AdminAccount {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  type: string;
  pharmacy_name: string | null;
  is_active: boolean;
  is_superadmin: boolean;
  created_at: string;
}

export interface AdminCategory {
  id: number;
  name: string;
  desc: string;
  count: number;
}

export interface PharmacyRequestItem {
  id: number;
  user_id: number;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  owner_phone?: string | null;
  pharmacy_name: string;
  address: string | null;
  pharmacy_phone: string | null;
  city: string | null;
  description: string | null;
  status: string;
  created_at: string;
}

export const getAdminStats = (token: string) =>
  authRequest<AdminStats>("/api/admin/stats", token);

export const getAdminPharmacies = (token: string) =>
  authRequest<{ count: number; results: AdminPharmacy[] }>(
    "/api/admin/pharmacies",
    token
  );

export const setPharmacyOpen = (
  pharmacyId: number,
  token: string,
  is_open: boolean
) =>
  authRequest<{ id: number; name: string; is_open: boolean }>(
    `/api/admin/pharmacies/${pharmacyId}`,
    token,
    { method: "PATCH", body: JSON.stringify({ is_open }) }
  );

export const deleteAdminPharmacy = (pharmacyId: number, token: string) =>
  authRequest<{ message: string }>(
    `/api/admin/pharmacies/${pharmacyId}`,
    token,
    { method: "DELETE" }
  );

export const getPendingRequests = (token: string) =>
  authRequest<{ count: number; results: PharmacyRequestItem[] }>(
    "/api/pharmacy-requests/?status=pending",
    token
  );

export const approvePharmacyRequest = (requestId: number, token: string) =>
  authRequest<{ message: string }>(
    `/api/pharmacy-requests/${requestId}/approve`,
    token,
    { method: "POST", body: JSON.stringify({}) }
  );

export const rejectPharmacyRequest = (requestId: number, token: string) =>
  authRequest<{ message: string }>(
    `/api/pharmacy-requests/${requestId}/reject`,
    token,
    { method: "POST", body: JSON.stringify({}) }
  );

export const getAdminAccounts = (token: string) =>
  authRequest<{ count: number; results: AdminAccount[] }>(
    "/api/admin/accounts",
    token
  );

export const setAccountActive = (
  accountId: number,
  token: string,
  is_active: boolean
) =>
  authRequest<{ id: number; full_name: string; email: string; is_active: boolean }>(
    `/api/admin/accounts/${accountId}`,
    token,
    { method: "PATCH", body: JSON.stringify({ is_active }) }
  );

export const deleteAdminAccount = (accountId: number, token: string) =>
  authRequest<{ message: string }>(
    `/api/admin/accounts/${accountId}`,
    token,
    { method: "DELETE" }
  );

export const getAdminCategories = (token: string) =>
  authRequest<{ count: number; results: AdminCategory[] }>(
    "/api/admin/categories",
    token
  );

export const createAdminCategory = (token: string, name: string) =>
  authRequest<AdminCategory>("/api/admin/categories", token, {
    method: "POST",
    body: JSON.stringify({ name }),
  });

export const updateAdminCategory = (
  categoryId: number,
  token: string,
  name: string
) =>
  authRequest<AdminCategory>(
    `/api/admin/categories/${categoryId}`,
    token,
    { method: "PUT", body: JSON.stringify({ name }) }
  );

export const deleteAdminCategory = (categoryId: number, token: string) =>
  authRequest<{ message: string }>(
    `/api/admin/categories/${categoryId}`,
    token,
    { method: "DELETE" }
  );

// =========================
// Regions (المناطق / المدن)
// =========================

export interface Region {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  pharmacies_count: number;
}

export interface PublicRegion {
  id: number;
  name: string;
}

export const getPublicRegions = () =>
  request<{ count: number; results: PublicRegion[] }>("/api/regions/");

export const getRegions = (token: string) =>
  authRequest<{ count: number; results: Region[] }>("/api/admin/regions", token);

export const createRegion = (token: string, name: string) =>
  authRequest<Region>("/api/admin/regions", token, {
    method: "POST",
    body: JSON.stringify({ name }),
  });

export const updateRegion = (
  regionId: number,
  token: string,
  payload: { name?: string; is_active?: boolean }
) =>
  authRequest<Region>(
    `/api/admin/regions/${regionId}`,
    token,
    { method: "PATCH", body: JSON.stringify(payload) }
  );

export const deleteRegion = (regionId: number, token: string) =>
  authRequest<{ message: string }>(
    `/api/admin/regions/${regionId}`,
    token,
    { method: "DELETE" }
  );