"use client";

import "@/app/globals.css";
import { useState } from "react";
import DrugCard from "@/components/drugs/[id]/_components/DrugCard";
import SearchBar from "@/components/search/SearchBar";
import { Medicine, searchMedicines } from "@/lib/api";

export default function Home() {
  const [searchResults, setSearchResults] = useState<Medicine[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query: string) => {
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    try {
      const res = await searchMedicines(cleanQuery);
      setSearchResults(res.results);
      setHasSearched(true);
    } catch {
      setSearchResults([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <SearchBar onSearch={handleSearch} />

      <DrugCard
        medicines={searchResults}
        hasSearched={hasSearched}
        loading={loading}
      />
    </main>
  );
}