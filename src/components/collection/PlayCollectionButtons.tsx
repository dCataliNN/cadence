"use client";

import { Pause, Play, Shuffle } from "lucide-react";
import type { ReactNode } from "react";
import { IconButton } from "@/components/ui/Button";
import { selectCurrentTrack, usePlayerStore } from "@/stores/player.store";
import type { Track } from "@/types/music";

/**
 * Play/Shuffle for a list of tracks. "Playing this collection" is approximated
 * as "the current track belongs to it", which avoids tracking a separate
 * playback context id.
 */
export function PlayCollectionButtons({
  tracks,
  showShuffle = true,
  children,
}: {
  tracks: Track[];
  showShuffle?: boolean;
  children?: ReactNode;
}) {
  const ids = new Set(tracks.map((t) => t.id));
  const isThisPlaying = usePlayerStore((s) => {
    const current = selectCurrentTrack(s);
    return s.isPlaying && current !== null && ids.has(current.id);
  });
  const playable = tracks.some((t) => t.isPlayable);

  const play = () => {
    const store = usePlayerStore.getState();
    if (isThisPlaying) store.pause();
    else store.playTracks(tracks, 0, { shuffle: false });
  };

  const shuffle = () => {
    const playableIdx = tracks.flatMap((t, i) => (t.isPlayable ? [i] : []));
    const start = playableIdx[Math.floor(Math.random() * playableIdx.length)] ?? 0;
    usePlayerStore.getState().playTracks(tracks, start, { shuffle: true });
  };

  return (
    <div className="mb-6 flex items-center gap-3">
      <button
        type="button"
        onClick={play}
        disabled={!playable}
        aria-label={isThisPlaying ? "Pause" : "Play"}
        className="bg-primary text-primary-foreground flex size-14 items-center justify-center rounded-full shadow-[0_0_32px_-8px_var(--primary)] transition-transform hover:scale-105 hover:brightness-110 disabled:opacity-40 disabled:shadow-none disabled:hover:scale-100 [&_svg]:size-6 [&_svg]:fill-current"
      >
        {isThisPlaying ? <Pause /> : <Play className="translate-x-0.5" />}
      </button>
      {showShuffle && (
        <IconButton
          label="Shuffle play"
          disabled={!playable}
          onClick={shuffle}
          className="size-11 [&_svg]:size-6"
        >
          <Shuffle />
        </IconButton>
      )}
      {children}
    </div>
  );
}
