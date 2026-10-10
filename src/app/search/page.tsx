import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchView } from "@/components/search/SearchView";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage() {
  // useSearchParams() in SearchView needs a Suspense boundary for static rendering.
  return (
    <Suspense>
      <SearchView />
    </Suspense>
  );
}
