import type { Metadata } from "next";

import PrescriptionReader from "@/components/prescription/PrescriptionReader";
import Breadcrumb from "@/components/layout/Breadcrumb";

export const metadata: Metadata = {
  title: "اقرأ الروشتة - روشتة",
  description: "ارفع صورة وصفة طبية ليستخرج النظام الأدوية منها تلقائياً",
};

export default function PrescriptionPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "اقرأ الروشتة" }]} />
      <PrescriptionReader />
    </>
  );
}