import { create } from "zustand";
import { useHistoryStore } from "./history.store";
import { useLibraryStore } from "./library.store";
import { usePlayerStore } from "./player.store";
import { useSearchStore } from "./search.store";

/**
 * Persisted stores use `skipHydration` so the server render and the first
 * client render agree (both empty). They are rehydrated once after mount;
 * pages that depend on local data wait for this flag to avoid flashing an
 * empty state before the library loads.
 */
export const useHydrationStore = create<{ hydrated: boolean }>()(() => ({ hydrated: false }));

export async function hydrateStores(): Promise<void> {
  await Promise.all([
    usePlayerStore.persist.rehydrate(),
    useLibraryStore.persist.rehydrate(),
    useHistoryStore.persist.rehydrate(),
    useSearchStore.persist.rehydrate(),
  ]);
  useHydrationStore.setState({ hydrated: true });
}

export const useHydrated = () => useHydrationStore((s) => s.hydrated);
