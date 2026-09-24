"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Catalog from "@/components/medications/[id]/_components/Catalog";
import PageHeader from "@/components/medications/[id]/_components/PageHeader";
import Breadcrumb from "@/components/layout/Breadcrumb";
import { getMedicines, getPharmacies, Medicine } from "@/lib/api";

function MedicationsInner() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("cat");

  const [searchQuery, setSearchQuery] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [pharmaciesCount, setPharmaciesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.all([getMedicines(), getPharmacies()])
      .then(([meds, pharms]) => {
        if (!active) return;
        setMedicines(meds.results);
        setPharmaciesCount(pharms.count);
      })
      .catch(() => {
        if (!active) return;
        setMedicines([]);
        setPharmaciesCount(0);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <main>
      <Breadcrumb items={[{ label: "الأدوية" }]} />
      <PageHeader
        totalMedicines={medicines.length}
        totalPharmacies={pharmaciesCount}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />

      <Catalog
        key={initialCategory ?? "all"}
        medicines={medicines}
        loading={loading}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        initialCategory={initialCategory}
      />
    </main>
  );
}

export default function Medications() {
  return (
    <Suspense fallback={null}>
      <MedicationsInner />
    </Suspense>
  );
}