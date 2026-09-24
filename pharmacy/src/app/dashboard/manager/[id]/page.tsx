import DashboardClient from "./DashboardClient";
import "@/app/dashboard/dashboard.css";
import '@/app/globals.css'

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({
  params,
}: PageProps) {
  const { id } = await params;

  const pharmacyId = Number(id);

  return (
<>
<main>
  <DashboardClient
      pharmacyId={pharmacyId}
    />
</main>
</>

  );
}