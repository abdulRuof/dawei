"use client";

import { useEffect, useState } from "react";

import Directory from "@/components/All_pharmacies/[id]/_components/Directory";
import PageHero from "@/components/All_pharmacies/[id]/_components/Hero";
import Breadcrumb from "@/components/layout/Breadcrumb";
import { getPharmacies, Pharmacy } from "@/lib/api";

const Allpharmacies = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getPharmacies()
      .then((res) => {
        if (!active) return;
        setPharmacies(res.results);
      })
      .catch(() => {
        if (!active) return;
        setPharmacies([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const openCount = pharmacies.filter((p) => p.is_open).length;
  const citiesCount = new Set(pharmacies.map((p) => p.city).filter(Boolean)).size;

  return (
    <main>
      <Breadcrumb items={[{ label: "الصيدليات" }]} />
      <PageHero
        searchQuery1={searchQuery}
        onSearchChange1={setSearchQuery}
        totalCount={pharmacies.length}
        openCount={openCount}
        citiesCount={citiesCount}
      />
      <Directory pharmacies={pharmacies} searchQuery={searchQuery} loading={loading} />
    </main>
  );
};

export default Allpharmacies;