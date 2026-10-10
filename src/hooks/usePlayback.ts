"use client";

import { selectCurrentTrack, usePlayerStore } from "@/stores/player.store";
import { useLibraryStore } from "@/stores/library.store";

/** Narrow selectors so rows re-render only when *their* playing state flips. */
export function useIsCurrentTrack(trackId: string): boolean {
  return usePlayerStore((s) => selectCurrentTrack(s)?.id === trackId);
}

export function useIsTrackPlaying(trackId: string): boolean {
  return usePlayerStore((s) => s.isPlaying && selectCurrentTrack(s)?.id === trackId);
}

export function useIsLiked(trackId: string): boolean {
  return useLibraryStore((s) => s.likedTracks.some((l) => l.track.id === trackId));
}
