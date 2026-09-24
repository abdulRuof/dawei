import React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import './style.css';


export const SuccessState: React.FC = () => (
  <div className="success-card">
    <div className="success-card__icon">
      <Check size={40} />
    </div>
    <h2>تم إرسال طلبك بنجاح 🎉</h2>
    <p>سيقوم فريق روشتة بمراجعة بيانات صيدليتك والتواصل معك خلال <strong>24–48 ساعة</strong> لتفعيل حسابك.</p>
    <Link href="/" className="btn btn--coral">العودة للرئيسية</Link>
  </div>
);