import DrugHeader from "@/components/drugs/[id]/_components/DrugHeader";
import AlternativesList from "@/components/drugs/[id]/_components/AlternativesList";
import PharmacyAvailabilityTable from "@/components/drugs/[id]/_components/PharmacyAvailabilityTable";
import MedicineAlertButton from "@/components/drugs/[id]/_components/MedicineAlertButton";
import ReviewsSection from "@/components/reviews/ReviewsSection";
import Breadcrumb from "@/components/layout/Breadcrumb";
import { getMedicine, getMedicines } from "@/lib/api";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Drug({ params }: PageProps) {
  const { id } = await params;

  const [result, allMedicines] = await Promise.all([
    getMedicine(id).catch(() => null),
    getMedicines().catch(() => ({ count: 0, results: [] })),
  ]);

  if (!result || result.id == null) {
    return (
      <main>
        <Breadcrumb items={[{ label: "الأدوية", href: "/medications" }]} />
        <section className="section">
          <div className="container">
            <p className="empty-state">الدواء غير موجود.</p>
          </div>
        </section>
      </main>
    );
  }

  const alternatives = allMedicines.results
    .filter(
      (m) =>
        m.id !== result.id &&
        (m.generic_name === result.generic_name ||
          m.category_id === result.category_id)
    )
    .slice(0, 4);

  return (
    <main>
      <Breadcrumb
        items={[
          { label: "الأدوية", href: "/medications" },
          { label: result.name },
        ]}
      />
      <DrugHeader medicine={result} />
      <PharmacyAvailabilityTable pharmacies={result.pharmacies} />
      <MedicineAlertButton
        medicineId={result.id}
        available={result.pharmacies.some((p) => p.is_available)}
      />
      <AlternativesList medicines={alternatives} />
      <ReviewsSection targetId={result.id} targetType="medicine" />
    </main>
  );
}