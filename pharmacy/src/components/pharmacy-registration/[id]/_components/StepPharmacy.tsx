import React, { ChangeEvent } from "react";
import { Building, Phone, MapPin, Navigation } from "lucide-react";
import { PharmacyFormData, FormErrors } from "@/components/pharmacy-registration/[id]/types/pharmacy";
import './style.css';


interface StepPharmacyProps {
  formData: PharmacyFormData;
  errors: FormErrors;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onPrev: () => void;
  onGetLocation: () => void;
}

export const StepPharmacy: React.FC<StepPharmacyProps> = ({ formData, errors, onChange, onPrev, onGetLocation }) => {
  return (
    <fieldset className="form-step is-active">
      <legend className="form-step__title">بيانات الصيدلية</legend>
      <p className="form-step__subtitle">هذه البيانات ستظهر للمستخدمين في صفحة صيدليتك على المنصة.</p>

      <div className={`field ${errors.pharmName ? "has-error" : ""}`}>
        <label htmlFor="pharmName">اسم الصيدلية</label>
        <div className="field__control">
          <Building size={18} />
          <input type="text" id="pharmName" value={formData.pharmName} onChange={onChange} placeholder="مثال: صيدلية النهضة" required />
        </div>
      </div>

      <div className="field-grid">
        <div className={`field ${errors.pharmPhone ? "has-error" : ""}`}>
          <label htmlFor="pharmPhone">رقم هاتف الصيدلية</label>
          <div className="field__control">
            <Phone size={18} />
            <input type="tel" id="pharmPhone" value={formData.pharmPhone} onChange={onChange} placeholder="021 123 4567" dir="ltr" required />
          </div>
        </div>

        <div className={`field ${errors.pharmCity ? "has-error" : ""}`}>
          <label htmlFor="pharmCity">المدينة</label>
          <div className="field__control">
            <MapPin size={18} />
            <select id="pharmCity" value={formData.pharmCity} onChange={onChange} required>
              <option value="" disabled>اختر المدينة</option>
              <option value="سبها">سبها</option>
              <option value="طرابلس">طرابلس</option>
              <option value="بنغازي">بنغازي</option>
              <option value="مصراتة">مصراتة</option>
              <option value="زليتن">زليتن</option>
              <option value="أخرى">مدينة أخرى</option>
            </select>
          </div>
        </div>
      </div>

      <div className={`field ${errors.pharmAddress ? "has-error" : ""}`}>
        <label htmlFor="pharmAddress">العنوان</label>
        <div className="field__control">
          <MapPin size={18} />
          <input type="text" id="pharmAddress" value={formData.pharmAddress} onChange={onChange} placeholder="الحي، الشارع، أقرب معلم مميز" required />
        </div>
      </div>

      <div className={`field ${errors.pharmDesc ? "has-error" : ""}`}>
        <label htmlFor="pharmDesc">الوصف</label>
        <textarea id="pharmDesc" rows={4} value={formData.pharmDesc} onChange={onChange} placeholder="نبذة مختصرة عن صيدليتك..." required />
        <p className="char-count">
          <span>{formData.pharmDesc.length}</span> / 300 حرف
        </p>
      </div>

      <div className="field">
        <label>الموقع على الخريطة</label>
        <div className="map-picker">
          <div className="map-picker__canvas" id="mapCanvas">
            <div className="map-grid"></div>
            <span className="map-pin">
              <MapPin size={30} />
            </span>
          </div>
          <div className="map-picker__actions">
            <button type="button" className="btn btn--outline" onClick={onGetLocation}>
              <Navigation size={16} />
              استخدام موقعي الحالي
            </button>
            <span className={`map-coords ${formData.coords ? "is-set" : ""}`}>
              {formData.coords
                ? `تم التحديد: ${formData.coords.lat.toFixed(5)}, ${formData.coords.lng.toFixed(5)}`
                : "لم يُحدَّد الموقع بعد"}
            </span>
          </div>
        </div>
      </div>

      <div className="step-actions">
        <button type="button" className="btn btn--outline prev-step" onClick={onPrev}>
          → السابق
        </button>
        <button type="submit" className="btn btn--coral">إرسال طلب التسجيل</button>
      </div>
    </fieldset>
  );
};