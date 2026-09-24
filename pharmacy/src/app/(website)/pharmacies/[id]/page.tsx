import PharmacyHeader from "@/components/pharmacies/[id]/_components/PharmacyHeader";
import PharmacyInventoryList from "@/components/pharmacies/[id]/_components/PharmacyInventoryList";
import ReviewsSection from "@/components/reviews/ReviewsSection";
import Breadcrumb from "@/components/layout/Breadcrumb";
import { getPharmacy } from "@/lib/api";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PharmacyPage({ params }: PageProps) {
  const { id } = await params;

  const pharmacy = await getPharmacy(id).catch(() => null);

  if (!pharmacy) {
    return (
      <main>
        <Breadcrumb items={[{ label: "الصيدليات", href: "/Allpharmacies/1" }]} />
        <section className="section">
          <div className="container">
            <p className="empty-state">الصيدلية غير موجودة.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <Breadcrumb
        items={[
          { label: "الصيدليات", href: "/Allpharmacies/1" },
          { label: pharmacy.name },
        ]}
      />
      <PharmacyHeader pharmacy={pharmacy} />
      <PharmacyInventoryList pharmacy={pharmacy} />
      <ReviewsSection targetId={pharmacy.id} targetType="pharmacy" />
    </main>
  );
}