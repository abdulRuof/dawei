export interface PharmacyFormData {
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerPassword: string;
  ownerConfirmPassword: string;
  pharmName: string;
  pharmPhone: string;
  pharmCity: string;
  pharmAddress: string;
  pharmDesc: string;
  coords: { lat: number; lng: number } | null;
}

export interface FormErrors {
  [key: string]: boolean;
}