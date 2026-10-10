"use client";

import { Pause, Play } from "lucide-react";
import Link from "next/link";
import { Artwork } from "@/components/ui/Artwork";
import { tileClass } from "@/components/ui/tile";
import { useIsCurrentTrack, useIsTrackPlaying } from "@/hooks/usePlayback";
import { cn } from "@/lib/cn";
import { formatCount, formatDuration } from "@/lib/format";
import { routes } from "@/lib/routes";
import { usePlayerStore } from "@/stores/player.store";
import type { Track } from "@/types/music";
import { EqualizerIcon } from "./TrackList";

export function PlayOverlayButton({
  playing,
  label,
  onClick,
  className,
}: {
  playing: boolean;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-full shadow-[0_0_28px_-6px_var(--primary)] transition-all hover:scale-105 hover:brightness-110 [&_svg]:size-4 [&_svg]:fill-current",
        playing
          ? "translate-y-0 opacity-100"
          : "translate-y-1.5 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100",
        className,
      )}
    >
      {playing ? <Pause /> : <Play className="translate-x-px" />}
    </button>
  );
}

/**
 * @param tracks the surrounding list, so playing one card queues the rest of the shelf after it.
 */
export function TrackCard({
  track,
  tracks,
  index,
}: {
  track: Track;
  tracks: Track[];
  index: number;
}) {
  const isCurrent = useIsCurrentTrack(track.id);
  const isPlaying = useIsTrackPlaying(track.id);

  return (
    <div className={cn(tileClass, "w-40 sm:w-48", isCurrent && "border-primary/50")}>
      <div className="relative">
        <Link href={routes.track(track.id)} tabIndex={-1} aria-hidden>
          <Artwork image={track.artwork} size="medium" className="aspect-square w-full" />
        </Link>
        <span className="label-mono bg-background/75 text-foreground absolute top-2 left-2 rounded-sm px-1.5 py-1 text-[10px] backdrop-blur-sm">
          {String(index + 1).padStart(2, "0")}
        </span>
        {isPlaying && (
          <span className="bg-background/75 absolute top-2 right-2 rounded-sm px-1.5 py-1 backdrop-blur-sm">
            <EqualizerIcon className="h-2.5" />
          </span>
        )}
        {track.isPlayable && (
          <PlayOverlayButton
            className="absolute right-2 bottom-2"
            playing={isPlaying}
            label={isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
            onClick={() =>
              isCurrent
                ? usePlayerStore.getState().togglePlay()
                : usePlayerStore.getState().playTracks(tracks, index)
            }
          />
        )}
      </div>
      <div className="px-0.5 pt-3 pb-1">
        <Link
          href={routes.track(track.id)}
          className={cn(
            "block truncate text-sm font-medium tracking-[-0.01em] hover:underline",
            isCurrent && "text-primary",
          )}
        >
          {track.title}
        </Link>
        <Link
          href={routes.artist(track.artist.id)}
          className="text-muted-foreground block truncate text-[13px] hover:underline"
        >
          {track.artist.name}
        </Link>
        <p className="label-mono text-subtle mt-2.5 flex justify-between text-[10px]">
          <span>{formatDuration(track.duration)}</span>
          {track.playCount !== undefined && <span>{formatCount(track.playCount)} plays</span>}
        </p>
      </div>
    </div>
  );
}
