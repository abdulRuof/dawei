"use client";


import React, { useState, useRef, ChangeEvent, FormEvent } from "react";
import { Header } from "./_components/Header";
import { StepOwner } from "./_components/StepOwner";
import { StepPharmacy } from "./_components/StepPharmacy";
import { SuccessState } from "./_components/SuccessState";
import { Toast } from "./_components/Toast";
import { PharmacyFormData, FormErrors } from "@/components/pharmacy-registration/[id]/types/pharmacy";
import { createPharmacyRequest } from "@/lib/api";
import '../[id]/_components/style.css'

export const PharmacyRegistration: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState<PharmacyFormData>({
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    ownerPassword: "",
    ownerConfirmPassword: "",
    pharmName: "",
    pharmPhone: "",
    pharmCity: "",
    pharmAddress: "",
    pharmDesc: "",
    coords: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 2400);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    if (id === "pharmDesc" && value.length > 300) return;

    setFormData((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: false }));
  };

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};
    let valid = true;
    const fields = ["ownerName", "ownerEmail", "ownerPhone", "ownerPassword", "ownerConfirmPassword"];

    fields.forEach((field) => {
      if (!formData[field as keyof PharmacyFormData]) {
        newErrors[field] = true;
        valid = false;
      }
    });

    if (formData.ownerPassword.length < 8) {
      newErrors.ownerPassword = true;
      valid = false;
    }

    if (formData.ownerConfirmPassword !== formData.ownerPassword || !formData.ownerConfirmPassword) {
      newErrors.ownerConfirmPassword = true;
      valid = false;
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return valid;
  };

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};
    let valid = true;
    const fields = ["pharmName", "pharmPhone", "pharmCity", "pharmAddress", "pharmDesc"];

    fields.forEach((field) => {
      if (!formData[field as keyof PharmacyFormData]) {
        newErrors[field] = true;
        valid = false;
      }
    });

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return valid;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    } else {
      showToast("يرجى تعبئة جميع الحقول المطلوبة بشكل صحيح");
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showToast("المتصفح لا يدعم تحديد الموقع");
      return;
    }
    showToast("جارٍ تحديد موقعك…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        }));
        showToast("✓ تم تحديد موقع الصيدلية");
      },
      () => showToast("تعذّر الوصول لموقعك — تحقق من إذن الموقع")
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) {
      showToast("يرجى تعبئة جميع بيانات الصيدلية");
      return;
    }
    try {
      await createPharmacyRequest({
        full_name: formData.ownerName,
        email: formData.ownerEmail,
        phone: formData.ownerPhone,
        password: formData.ownerPassword,
        pharmacy_name: formData.pharmName,
        pharmacy_phone: formData.pharmPhone,
        city: formData.pharmCity,
        address: formData.pharmAddress,
        description: formData.pharmDesc,
      });
      showToast("✓ تم إرسال طلب التسجيل بنجاح");
      setTimeout(() => setIsSubmitted(true), 600);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "تعذّر إرسال الطلب — تحقق من البيانات");
    }
  };

  return (
    <div className="registration-container" dir="rtl">
      {/* <Header /> */}
      <main id="registerPage">
        <section className="page-hero">
           <div className="page-hero__deco" aria-hidden="true">
      <span className="plus plus--1"></span>
      <span className="plus plus--2"></span>
      <span className="dot dot--1"></span>
    </div>
          <div className="container page-hero__inner">
            <p className="page-hero__eyebrow">انضم كصيدلية شريكة</p>
            <h1 className="page-hero__title">سجّل صيدليتك مع روشتة</h1>
            <p className="page-hero__subtitle">أدخل بياناتك وبيانات صيدليتك لمراجعة الطلب والتواصل معك.</p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            {!isSubmitted ? (
              <div className="form-card">
                <div className="steps">
                  <div className={`step ${currentStep === 1 ? "is-active" : ""} ${currentStep > 1 ? "is-done" : ""}`}>
                    <span className="step__circle">١</span>
                    <span className="step__label">بيانات المالك</span>
                  </div>
                  <div className="step-line"></div>
                  <div className={`step ${currentStep === 2 ? "is-active" : ""}`}>
                    <span className="step__circle">٢</span>
                    <span className="step__label">بيانات الصيدلية</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  {currentStep === 1 && (
                    <StepOwner formData={formData} errors={errors} onChange={handleChange} onNext={handleNext} />
                  )}
                  {currentStep === 2 && (
                    <StepPharmacy
                      formData={formData}
                      errors={errors}
                      onChange={handleChange}
                      onPrev={() => setCurrentStep(1)}
                      onGetLocation={handleGetLocation}
                    />
                  )}
                </form>
              </div>
            ) : (
              <SuccessState />
            )}
          </div>
        </section>
      </main>
      <Toast message={toastMessage} />
    </div>
  );
};