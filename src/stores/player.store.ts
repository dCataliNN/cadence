import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import * as Q from "@/lib/queue";
import { playbackControls } from "@/lib/playback/controls";
import type { QueueItem, RepeatMode, Track } from "@/types/music";
import { useProgressStore } from "./progress.store";
import { toast } from "./toast.store";

/** Pressing "previous" this far into a track restarts it instead of going back. */
const RESTART_THRESHOLD_SECONDS = 3;
/** Stop auto-skipping after this many failures in a row (e.g. the provider is down). */
const MAX_CONSECUTIVE_ERRORS = 3;

export interface PlayerState {
  queue: Q.QueueState;
  /** What the user wants; the engine reconciles the audio element to it. */
  isPlaying: boolean;
  volume: number;
  muted: boolean;
  repeat: RepeatMode;
  shuffle: boolean;
  error: string | null;
  /** Saved position so a reload can resume the current track where it was. */
  resumePosition: number;
  consecutiveErrors: number;

  playTracks(tracks: Track[], startIndex?: number, options?: { shuffle?: boolean }): void;
  play(): void;
  pause(): void;
  togglePlay(): void;
  next(): void;
  previous(): void;
  seek(seconds: number): void;
  setVolume(volume: number): void;
  toggleMute(): void;
  toggleShuffle(): void;
  setRepeatMode(mode: RepeatMode): void;
  cycleRepeatMode(): void;
  addToQueue(tracks: Track[]): void;
  playNext(tracks: Track[]): void;
  removeFromQueue(uid: string): void;
  moveQueueItem(from: number, to: number): void;
  clearQueue(): void;
  jumpTo(uid: string): void;
  handleEnded(): void;
  handleError(message: string): void;
  setResumePosition(seconds: number): void;
}

const REPEAT_CYCLE: Record<RepeatMode, RepeatMode> = { off: "all", all: "one", one: "off" };

function firstPlayableIndex(tracks: Track[], from: number): number {
  for (let i = 0; i < tracks.length; i++) {
    const index = (from + i) % tracks.length;
    if (tracks[index].isPlayable) return index;
  }
  return -1;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      queue: Q.EMPTY_QUEUE,
      isPlaying: false,
      volume: 0.8,
      muted: false,
      repeat: "off",
      shuffle: false,
      error: null,
      resumePosition: 0,
      consecutiveErrors: 0,

      playTracks(tracks, startIndex = 0, options = {}) {
        const start = firstPlayableIndex(tracks, Math.max(0, startIndex));
        if (start === -1) {
          toast("This track isn't available to stream.", "error");
          return;
        }
        const shuffle = options.shuffle ?? get().shuffle;
        set({
          queue: Q.loadQueue(tracks, start, { shuffle }),
          shuffle,
          isPlaying: true,
          error: null,
          resumePosition: 0,
          consecutiveErrors: 0,
        });
      },

      play() {
        if (Q.currentItem(get().queue)) set({ isPlaying: true, error: null });
      },

      pause() {
        set({ isPlaying: false });
      },

      togglePlay() {
        if (get().isPlaying) get().pause();
        else get().play();
      },

      next() {
        const { queue, repeat } = get();
        const { state, ended } = Q.advance(queue, repeat, false);
        if (ended) return;
        set({ queue: state, isPlaying: true, resumePosition: 0, error: null });
      },

      previous() {
        const { queue, repeat } = get();
        const restart = () => get().seek(0);
        if (useProgressStore.getState().currentTime > RESTART_THRESHOLD_SECONDS) return restart();
        const state = Q.retreat(queue, repeat);
        if (state.index === queue.index) return restart();
        set({ queue: state, isPlaying: true, resumePosition: 0, error: null });
      },

      seek(seconds) {
        const duration = useProgressStore.getState().duration;
        const clamped = Math.max(0, duration > 0 ? Math.min(seconds, duration) : seconds);
        useProgressStore.setState({ currentTime: clamped });
        // Also the load position if audio hasn't been fetched yet (restored queue).
        set({ resumePosition: clamped });
        playbackControls.seek(clamped);
      },

      setVolume(volume) {
        const clamped = Math.min(1, Math.max(0, volume));
        set({ volume: clamped, muted: clamped === 0 });
      },

      toggleMute() {
        const { muted, volume } = get();
        // Unmuting at zero volume would be silent and look broken.
        set(muted && volume === 0 ? { muted: false, volume: 0.5 } : { muted: !muted });
      },

      toggleShuffle() {
        const { shuffle, queue } = get();
        set({
          shuffle: !shuffle,
          queue: shuffle ? Q.unshuffleQueue(queue) : Q.shuffleQueue(queue),
        });
      },

      setRepeatMode(mode) {
        set({ repeat: mode });
      },

      cycleRepeatMode() {
        set({ repeat: REPEAT_CYCLE[get().repeat] });
      },

      addToQueue(tracks) {
        const playable = tracks.filter((t) => t.isPlayable);
        if (playable.length === 0) return;
        const wasEmpty = !Q.currentItem(get().queue);
        set({ queue: Q.appendToQueue(get().queue, playable) });
        if (wasEmpty) set({ isPlaying: true, resumePosition: 0 });
      },

      playNext(tracks) {
        const playable = tracks.filter((t) => t.isPlayable);
        if (playable.length === 0) return;
        const wasEmpty = !Q.currentItem(get().queue);
        set({ queue: Q.insertNext(get().queue, playable) });
        if (wasEmpty) set({ isPlaying: true, resumePosition: 0 });
      },

      removeFromQueue(uid) {
        const before = Q.currentItem(get().queue);
        const queue = Q.removeFromQueue(get().queue, uid);
        const after = Q.currentItem(queue);
        set({
          queue,
          ...(before?.uid !== after?.uid && { resumePosition: 0 }),
          ...(!after && { isPlaying: false }),
        });
      },

      moveQueueItem(from, to) {
        set({ queue: Q.moveQueueItem(get().queue, from, to) });
      },

      clearQueue() {
        set({ queue: Q.clearUpcoming(get().queue) });
      },

      jumpTo(uid) {
        const queue = Q.jumpTo(get().queue, uid);
        if (queue === get().queue) return;
        set({ queue, isPlaying: true, resumePosition: 0, error: null });
      },

      handleEnded() {
        const { queue, repeat } = get();
        const { state, ended } = Q.advance(queue, repeat, true);
        if (ended) {
          set({ isPlaying: false, resumePosition: 0 });
          get().seek(0);
          return;
        }
        // Repeat-one, or repeat-all on a one-track queue: same slot, so the
        // engine sees no track change and must be told to restart explicitly.
        if (Q.currentItem(state)?.uid === Q.currentItem(queue)?.uid) {
          get().seek(0);
          set({ isPlaying: true, consecutiveErrors: 0 });
          playbackControls.resume();
          return;
        }
        set({ queue: state, isPlaying: true, resumePosition: 0, consecutiveErrors: 0 });
      },

      handleError(message) {
        const { queue, repeat, consecutiveErrors } = get();
        const title = Q.currentItem(queue)?.track.title;
        const errors = consecutiveErrors + 1;
        const { state, ended } = Q.advance(queue, repeat, false);
        const sameSlot = Q.currentItem(state)?.uid === Q.currentItem(queue)?.uid;

        if (ended || sameSlot || errors >= MAX_CONSECUTIVE_ERRORS) {
          toast(title ? `Couldn't play “${title}”. ${message}` : message, "error");
          set({ isPlaying: false, error: message, consecutiveErrors: errors });
          return;
        }
        toast(title ? `Couldn't play “${title}”, skipping.` : message, "error");
        // Keep the queue intact and move on: one broken track must not stop the session.
        set({
          queue: state,
          isPlaying: true,
          resumePosition: 0,
          error: null,
          consecutiveErrors: errors,
        });
      },

      setResumePosition(seconds) {
        set({ resumePosition: seconds });
      },
    }),
    {
      name: "cadence-player",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Hydrated manually after mount so server and first client render match.
      skipHydration: true,
      partialize: (s) => ({
        queue: s.queue,
        volume: s.volume,
        muted: s.muted,
        repeat: s.repeat,
        shuffle: s.shuffle,
        resumePosition: s.resumePosition,
      }),
    },
  ),
);

export const selectCurrentItem = (s: PlayerState): QueueItem | null => Q.currentItem(s.queue);
export const selectCurrentTrack = (s: PlayerState): Track | null =>
  Q.currentItem(s.queue)?.track ?? null;
