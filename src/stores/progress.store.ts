import { create } from "zustand";

/**
 * High-frequency playback position, deliberately separate from the persisted
 * player store: `timeupdate` fires ~4×/s and must not trigger localStorage
 * writes or re-render components that only care about the current track.
 */
interface ProgressState {
  currentTime: number;
  duration: number;
  buffering: boolean;
}

export const useProgressStore = create<ProgressState>()(() => ({
  currentTime: 0,
  duration: 0,
  buffering: false,
}));
