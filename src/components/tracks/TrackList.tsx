"use client";

import { Pause, Play } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Artwork } from "@/components/ui/Artwork";
import { useIsCurrentTrack, useIsTrackPlaying } from "@/hooks/usePlayback";
import { cn } from "@/lib/cn";
import { formatCount, formatDuration } from "@/lib/format";
import { routes } from "@/lib/routes";
import { usePlayerStore } from "@/stores/player.store";
import type { Track } from "@/types/music";
import { LikeButton } from "./LikeButton";
import { TrackActionsMenu } from "./TrackActionsMenu";

export function EqualizerIcon({ className }: { className?: string }) {
  return (
    <span className={cn("flex h-3.5 items-end gap-[2px]", className)} aria-hidden>
      {[0, 0.25, 0.5].map((delay) => (
        <span
          key={delay}
          className="eq-bar bg-primary h-full w-[3px] rounded-sm"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </span>
  );
}

interface TrackListProps {
  tracks: Track[];
  showArtwork?: boolean;
  showPlays?: boolean;
  showHeader?: boolean;
  /** Override what clicking a row plays (defaults to the list from that row). */
  onPlay?: (index: number) => void;
  menuExtras?: (track: Track, index: number) => ReactNode;
  /** Extra per-row trailing content, e.g. reorder controls. */
  rowExtras?: (track: Track, index: number) => ReactNode;
  /** Stable React keys when the same track can appear twice (user playlists). */
  rowKeys?: string[];
}

export function TrackList({
  tracks,
  showArtwork = true,
  showPlays = false,
  showHeader = true,
  onPlay,
  menuExtras,
  rowExtras,
  rowKeys,
}: TrackListProps) {
  const play = (index: number) =>
    onPlay ? onPlay(index) : usePlayerStore.getState().playTracks(tracks, index);

  return (
    <div role="list" className="flex flex-col">
      {showHeader && (
        <div
          aria-hidden
          className="border-border label-mono text-subtle hidden grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-4 border-b px-3 pb-3 md:grid md:grid-cols-[2rem_minmax(0,1fr)_6rem_auto]"
        >
          <span className="text-center">No.</span>
          <span>Title</span>
          <span className="text-right">{showPlays ? "Plays" : ""}</span>
          <span className="w-[7.5rem] pr-10 text-right">Time</span>
        </div>
      )}
      {tracks.map((track, index) => (
        <TrackRow
          key={rowKeys?.[index] ?? `${track.id}-${index}`}
          track={track}
          index={index}
          showArtwork={showArtwork}
          showPlays={showPlays}
          onPlay={play}
          menuExtras={menuExtras?.(track, index)}
          rowExtras={rowExtras?.(track, index)}
        />
      ))}
    </div>
  );
}

function TrackRow({
  track,
  index,
  showArtwork,
  showPlays,
  onPlay,
  menuExtras,
  rowExtras,
}: {
  track: Track;
  index: number;
  showArtwork: boolean;
  showPlays: boolean;
  onPlay: (index: number) => void;
  menuExtras?: ReactNode;
  rowExtras?: ReactNode;
}) {
  const isCurrent = useIsCurrentTrack(track.id);
  const isPlaying = useIsTrackPlaying(track.id);
  const disabled = !track.isPlayable;

  const toggle = () => {
    if (disabled) return;
    if (isCurrent) usePlayerStore.getState().togglePlay();
    else onPlay(index);
  };

  return (
    <div
      role="listitem"
      onClick={(e) => {
        // Row clicks play, except when the click landed on a link or control inside it.
        if ((e.target as HTMLElement).closest("a,button,[role=menuitem]")) return;
        toggle();
      }}
      className={cn(
        "group border-border/60 relative grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-4 border-b px-3 py-2 transition-colors last:border-b-0 md:grid-cols-[2rem_minmax(0,1fr)_6rem_auto]",
        disabled ? "opacity-45" : "hover:bg-muted/70 cursor-pointer",
        isCurrent && "bg-primary/[0.06]",
      )}
    >
      {isCurrent && (
        <span aria-hidden className="bg-primary absolute inset-y-2 left-0 w-0.5 rounded-full" />
      )}
      <div className="text-subtle relative flex h-8 items-center justify-center font-mono text-xs tabular-nums [&:has(button:focus-visible)>span]:invisible">
        <span className={cn(!disabled && "group-hover:invisible")}>
          {isPlaying ? (
            <EqualizerIcon />
          ) : (
            <span className={cn(isCurrent && "text-primary")}>
              {String(index + 1).padStart(2, "0")}
            </span>
          )}
        </span>
        {!disabled && (
          <button
            type="button"
            onClick={toggle}
            aria-label={isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
            className="text-primary absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [&_svg]:size-4 [&_svg]:fill-current"
          >
            {isPlaying ? <Pause /> : <Play />}
          </button>
        )}
      </div>

      <div className="flex min-w-0 items-center gap-3">
        {showArtwork && (
          <Artwork image={track.artwork} size="small" className="size-10 shrink-0" rounded="md" />
        )}
        <div className="min-w-0">
          <Link
            href={routes.track(track.id)}
            className={cn(
              "block truncate text-[15px] font-medium tracking-[-0.01em] hover:underline",
              isCurrent && "text-primary",
            )}
          >
            {track.title}
          </Link>
          <div className="text-muted-foreground flex min-w-0 items-center gap-1 text-sm">
            {disabled && (
              <span className="border-border label-mono shrink-0 rounded-sm border px-1.5 py-0.5 text-[9px]">
                Unavailable
              </span>
            )}
            <Link
              href={routes.artist(track.artist.id)}
              className="hover:text-foreground truncate hover:underline"
            >
              {track.artist.name}
            </Link>
          </div>
        </div>
      </div>

      <span className="text-muted-foreground hidden text-right font-mono text-xs tabular-nums md:block">
        {showPlays ? formatCount(track.playCount) : ""}
      </span>

      <div className="flex items-center justify-end gap-1">
        {rowExtras}
        <LikeButton
          track={track}
          className="hidden opacity-0 group-hover:opacity-100 focus-visible:opacity-100 aria-pressed:opacity-100 sm:inline-flex"
        />
        <span className="text-muted-foreground hidden w-12 text-right font-mono text-xs tabular-nums sm:block">
          {formatDuration(track.duration)}
        </span>
        <TrackActionsMenu track={track} extraItems={menuExtras} />
      </div>
    </div>
  );
}

export function TrackListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="flex flex-col" aria-busy>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="border-border/60 flex items-center gap-4 border-b px-3 py-2.5">
          <div className="bg-muted h-4 w-6 animate-pulse rounded" />
          <div className="bg-muted size-10 animate-pulse rounded-md" />
          <div className="flex-1">
            <div className="bg-muted h-4 w-1/3 animate-pulse rounded" />
            <div className="bg-muted mt-2 h-3 w-1/5 animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
