import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { HistoryEntry } from "@/lib/history";
import { createUid } from "@/lib/queue";
import type { Track } from "@/types/music";

/** Bounded so localStorage stays small; older plays add little value locally. */
const MAX_ENTRIES = 500;

interface HistoryState {
  entries: HistoryEntry[];
  record(track: Track, playDuration: number): string;
  update(id: string, patch: Partial<Pick<HistoryEntry, "playDuration" | "completed">>): void;
  clear(): void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      record(track, playDuration) {
        const id = createUid();
        const entry: HistoryEntry = {
          id,
          track,
          playedAt: Date.now(),
          playDuration,
          completed: false,
        };
        set((s) => ({ entries: [entry, ...s.entries].slice(0, MAX_ENTRIES) }));
        return id;
      },
      update(id, patch) {
        set((s) => ({ entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
      },
      clear() {
        set({ entries: [] });
      },
    }),
    {
      name: "cadence-history",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
