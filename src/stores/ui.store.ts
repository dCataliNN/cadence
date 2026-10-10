import { create } from "zustand";

interface UiState {
  queueOpen: boolean;
  nowPlayingOpen: boolean;
  setQueueOpen(open: boolean): void;
  toggleQueue(): void;
  setNowPlayingOpen(open: boolean): void;
}

export const useUiStore = create<UiState>()((set) => ({
  queueOpen: false,
  nowPlayingOpen: false,
  setQueueOpen: (queueOpen) => set({ queueOpen }),
  toggleQueue: () => set((s) => ({ queueOpen: !s.queueOpen })),
  setNowPlayingOpen: (nowPlayingOpen) => set({ nowPlayingOpen }),
}));
