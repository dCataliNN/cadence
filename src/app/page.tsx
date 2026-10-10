import { connection } from "next/server";
import { Suspense } from "react";
import { TrendingPlaylistsShelf, TrendingTracksShelf } from "@/components/home/CatalogShelves";
import { GenreGrid } from "@/components/home/GenreGrid";
import { Hero } from "@/components/home/Hero";
import { ForYouShelf, RecentlyPlayedShelf } from "@/components/home/PersonalShelves";
import { ShelfSkeleton } from "@/components/ui/Shelf";

export default async function HomePage() {
  // Render per request (backed by the fetch data cache) instead of at build
  // time, so builds never depend on the music provider being reachable.
  await connection();

  return (
    <div>
      <Hero />
      <RecentlyPlayedShelf />
      <ForYouShelf />
      <Suspense fallback={<ShelfSkeleton title="Trending this week" />}>
        <TrendingTracksShelf index={1} eyebrow="Chart" title="Trending this week" />
      </Suspense>
      <Suspense fallback={<ShelfSkeleton title="Underground hits" />}>
        <TrendingTracksShelf index={2} eyebrow="Rising" title="Underground hits" underground />
      </Suspense>
      <Suspense fallback={<ShelfSkeleton title="Popular playlists" />}>
        <TrendingPlaylistsShelf index={3} eyebrow="Curated" title="Popular playlists" />
      </Suspense>
      <GenreGrid index={4} />
    </div>
  );
}
