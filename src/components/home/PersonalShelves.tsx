"use client";

import { useEffect, useMemo, useState } from "react";
import { TrackShelf } from "@/components/tracks/TrackShelf";
import { ShelfSkeleton } from "@/components/ui/Shelf";
import { dedupeRecent, topGenre } from "@/lib/history";
import { routes } from "@/lib/routes";
import { useHistoryStore } from "@/stores/history.store";
import { useHydrated } from "@/stores/hydration";
import type { Track } from "@/types/music";

export function RecentlyPlayedShelf() {
  const entries = useHistoryStore((s) => s.entries);
  const tracks = useMemo(() => dedupeRecent(entries, 12).map((e) => e.track), [entries]);
  return (
    <TrackShelf
      title="Recently played"
      subtitle="Your rotation"
      href={routes.history}
      tracks={tracks}
    />
  );
}

/** Genre-seeded recommendations from local listening history; hidden for brand-new listeners. */
export function ForYouShelf() {
  const hydrated = useHydrated();
  const entries = useHistoryStore((s) => s.entries);
  const genre = useMemo(() => topGenre(entries), [entries]);
  const [state, setState] = useState<{ genre: string; tracks: Track[] } | null>(null);

  // Keyed on genre only: refetching on every new history entry would be wasteful,
  // so the exclusion list is read once per seed rather than subscribed to.
  useEffect(() => {
    if (!genre) return;
    const controller = new AbortController();
    const exclude = dedupeRecent(useHistoryStore.getState().entries, 50).map((e) => e.track.id);
    const params = new URLSearchParams({ genre, exclude: exclude.join(","), limit: "16" });
    fetch(`/api/recommendations?${params}`, { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<Track[]>) : []))
      .then((tracks) => setState({ genre, tracks }))
      .catch(() => {
        // Recommendations are optional garnish; the shelf simply stays hidden on failure.
      });
    return () => controller.abort();
  }, [genre]);

  if (!hydrated || !genre) return null;
  if (!state) return <ShelfSkeleton />;
  return (
    <TrackShelf
      subtitle="Recommended for you"
      title={`Because you listen to ${state.genre}`}
      href={routes.genre(state.genre)}
      tracks={state.tracks}
    />
  );
}
