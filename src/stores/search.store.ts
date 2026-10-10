import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const MAX_RECENT = 8;

interface SearchState {
  recent: string[];
  addRecent(query: string): void;
  removeRecent(query: string): void;
  clearRecent(): void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      recent: [],
      addRecent(query) {
        const q = query.trim();
        if (!q) return;
        set((s) => ({
          recent: [q, ...s.recent.filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(
            0,
            MAX_RECENT,
          ),
        }));
      },
      removeRecent(query) {
        set((s) => ({ recent: s.recent.filter((r) => r !== query) }));
      },
      clearRecent() {
        set({ recent: [] });
      },
    }),
    {
      name: "cadence-search",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
