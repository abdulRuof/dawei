export type SectionId =
  | 'overview'
  | 'pharmacies'
  | 'requests'
  | 'accounts'
  | 'categories'
  | 'system-monitoring'
  | 'medicines'
  | 'stats'
  | 'monitor'



export interface Pharmacy {
  id: number;
  name: string;
  city: string;
  address?: string | null;
  phone?: string | null;
  ownerName?: string | null;
  joined: string;
  rating: number;
  status: "نشطة" | "موقوفة";
  initials: string;
  color: string;
}

export interface RegistrationRequest {
  id: number;
  name: string;
  owner: string;
  city: string;
  date: string;
  license: string;
  ownerPhone?: string | null;
}

export interface Account {
  id: number;
  name: string;
  type: "مستخدم" | "صيدلية";
  email: string;
  phone?: string | null;
  joined: string;
  status: "نشط" | "موقوف";
}
export interface Medicine {
  id: number;
  name: string;
  meta: string;
  cat: string;
  qty: number;
  price: number;
  sold: number;
  
}

export interface Category {
  id: number;
  name: string;
  desc: string;
  count: number;
}

export interface SystemLog {
  tag: string;
  cls: string;
  text: string;
  time: string;
}

export interface Activity {
  text: string;
  time: string;
  type: string;
}

export interface LoadData {
  hour: string;
  value: number;
}