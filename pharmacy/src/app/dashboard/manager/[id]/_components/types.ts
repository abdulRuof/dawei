export interface Medicine {
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
}

export type SectionId = 'overview' | 'medicines' | 'employees' | 'activity' | 'stats';
export type FocusType = 'none' | 'qty' | 'price';