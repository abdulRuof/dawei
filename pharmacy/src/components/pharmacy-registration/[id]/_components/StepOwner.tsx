import React, { useState, ChangeEvent } from "react";
import { User, Mail, Phone, Lock, Eye, EyeOff } from "lucide-react";
import { PharmacyFormData, FormErrors } from "@/components/pharmacy-registration/[id]/types/pharmacy";
import './style.css';


interface StepOwnerProps {
  formData: PharmacyFormData;
  errors: FormErrors;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onNext: () => void;
}

export const StepOwner: React.FC<StepOwnerProps> = ({ formData, errors, onChange, onNext }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getPasswordStrength = () => {
    const val = formData.ownerPassword;
    if (!val) return "";
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
    if (/\d/.test(val) || /[^A-Za-z0-9]/.test(val)) score++;

    if (score <= 1) return "weak";
    if (score === 2) return "medium";
    return "strong";
  };

  return (
    <fieldset className="form-step is-active">
      <legend className="form-step__title">بيانات صاحب الصيدلية</legend>
      <p className="form-step__subtitle">هذه البيانات الخاصة بحسابك الشخصي كصاحب الصيدلية.</p>

      <div className={`field ${errors.ownerName ? "has-error" : ""}`}>
        <label htmlFor="ownerName">الاسم الكامل</label>
        <div className="field__control">
          <User size={18} />
          <input type="text" id="ownerName" value={formData.ownerName} onChange={onChange} placeholder="اسمك الثلاثي" required />
        </div>
      </div>

      <div className="field-grid">
        <div className={`field ${errors.ownerEmail ? "has-error" : ""}`}>
          <label htmlFor="ownerEmail">البريد الإلكتروني</label>
          <div className="field__control">
            <Mail size={18} />
            <input type="email" id="ownerEmail" value={formData.ownerEmail} onChange={onChange} placeholder="example@mail.com" required />
          </div>
        </div>
        <div className={`field ${errors.ownerPhone ? "has-error" : ""}`}>
          <label htmlFor="ownerPhone">رقم الهاتف</label>
          <div className="field__control">
            <Phone size={18} />
            <input type="tel" id="ownerPhone" value={formData.ownerPhone} onChange={onChange} placeholder="091 234 5678" dir="ltr" required />
          </div>
        </div>
      </div>

      <div className="field-grid">
        <div className={`field ${errors.ownerPassword ? "has-error" : ""}`}>
          <label htmlFor="ownerPassword">كلمة المرور</label>
          <div className="field__control">
            <Lock size={18} />
            <input type={showPassword ? "text" : "password"} id="ownerPassword" value={formData.ownerPassword} onChange={onChange} placeholder="8 أحرف على الأقل" required minLength={8} />
            <button type="button" className={`field__toggle ${showPassword ? "is-active" : ""}`} onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className={`password-strength ${getPasswordStrength()}`}>
            <span></span><span></span><span></span>
          </div>
        </div>

        <div className={`field ${errors.ownerConfirmPassword ? "has-error" : ""}`}>
          <label htmlFor="ownerConfirmPassword">تأكيد كلمة المرور</label>
          <div className="field__control">
            <Lock size={18} />
            <input type={showConfirmPassword ? "text" : "password"} id="ownerConfirmPassword" value={formData.ownerConfirmPassword} onChange={onChange} placeholder="أعد كتابة كلمة المرور" required />
            <button type="button" className={`field__toggle ${showConfirmPassword ? "is-active" : ""}`} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {formData.ownerConfirmPassword && (
            <p className={`field__hint ${formData.ownerConfirmPassword === formData.ownerPassword ? "is-ok" : ""}`}>
              {formData.ownerConfirmPassword === formData.ownerPassword ? "✓ كلمتا المرور متطابقتان" : "كلمتا المرور غير متطابقتين"}
            </p>
          )}
        </div>
      </div>

      <div className="step-actions">
        <span></span>
        <button type="button" className="btn btn--coral next-step" onClick={onNext}>
          التالي: بيانات الصيدلية ←
        </button>
      </div>
    </fieldset>
  );
};