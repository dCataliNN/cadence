"use client";

import { ListMusic, Maximize2, X } from "lucide-react";
import Link from "next/link";
import { LikeButton } from "@/components/tracks/LikeButton";
import { Artwork } from "@/components/ui/Artwork";
import { IconButton } from "@/components/ui/Button";
import { routes } from "@/lib/routes";
import { selectCurrentTrack, usePlayerStore } from "@/stores/player.store";
import { useProgressStore } from "@/stores/progress.store";
import { useUiStore } from "@/stores/ui.store";
import { PlayerControls, PlayPauseButton } from "./PlayerControls";
import { ProgressBar } from "./ProgressBar";
import { QueueList } from "./QueueList";
import { Stage } from "./Stage";
import { VolumeControl } from "./VolumeControl";

const openStage = () => useUiStore.getState().setNowPlayingOpen(true);

function NowPlayingInfo() {
  const track = usePlayerStore(selectCurrentTrack);
  const error = usePlayerStore((s) => s.error);
  if (!track) {
    return <p className="label-mono text-subtle">Nothing playing</p>;
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <button
        type="button"
        onClick={openStage}
        aria-label={`Open stage for ${track.title}`}
        className="group/art border-border relative shrink-0 overflow-hidden rounded-md border"
      >
        <Artwork image={track.artwork} size="small" className="size-12 rounded-none" eager />
        <span className="bg-background/60 absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover/art:opacity-100">
          <Maximize2 className="size-4" />
        </span>
      </button>
      <div className="min-w-0">
        <Link
          href={routes.track(track.id)}
          className="block truncate text-sm font-medium tracking-[-0.01em] hover:underline"
        >
          {track.title}
        </Link>
        {error ? (
          <p className="text-destructive truncate text-xs" role="status">
            {error}
          </p>
        ) : (
          <Link
            href={routes.artist(track.artist.id)}
            className="text-muted-foreground block truncate text-xs hover:underline"
          >
            {track.artist.name}
          </Link>
        )}
      </div>
      <LikeButton track={track} className="shrink-0" />
    </div>
  );
}

function TempoBadge() {
  const bpm = usePlayerStore((s) => selectCurrentTrack(s)?.bpm);
  if (!bpm) return null;
  return (
    <span className="label-mono border-border hidden rounded-sm border px-1.5 py-1 text-[10px] xl:inline">
      {bpm} bpm
    </span>
  );
}

function DesktopPlayer() {
  const queueOpen = useUiStore((s) => s.queueOpen);
  const hasTrack = usePlayerStore((s) => s.queue.index >= 0);
  return (
    <div className="border-border bg-background/85 fixed inset-x-0 bottom-0 z-40 hidden h-(--player-height) grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] items-center gap-4 border-t px-4 backdrop-blur-xl md:grid">
      <NowPlayingInfo />
      <div className="flex max-w-2xl min-w-0 flex-col items-center gap-0.5 justify-self-center sm:w-full">
        <PlayerControls />
        <ProgressBar className="w-full" />
      </div>
      <div className="flex items-center justify-end gap-1">
        <TempoBadge />
        <IconButton label="Open stage" disabled={!hasTrack} onClick={openStage}>
          <Maximize2 className="size-[18px]!" />
        </IconButton>
        <IconButton
          label={queueOpen ? "Hide queue" : "Show queue"}
          aria-pressed={queueOpen}
          active={queueOpen}
          onClick={() => useUiStore.getState().toggleQueue()}
        >
          <ListMusic />
        </IconButton>
        <div className="hidden lg:block">
          <VolumeControl />
        </div>
      </div>
    </div>
  );
}

function QueueDrawer() {
  const open = useUiStore((s) => s.queueOpen);
  if (!open) return null;
  return (
    <aside
      aria-label="Queue"
      className="animate-fade-in border-border bg-background/95 fixed top-0 right-0 bottom-(--player-height) z-30 hidden w-96 flex-col border-l backdrop-blur-xl md:flex"
    >
      <div className="border-border flex items-center justify-between border-b px-4 py-3">
        <p className="label-mono">
          <span className="text-primary">{"// "}</span>Queue
        </p>
        <IconButton label="Close queue" onClick={() => useUiStore.getState().setQueueOpen(false)}>
          <X />
        </IconButton>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <QueueList />
      </div>
    </aside>
  );
}

function MiniProgress() {
  const currentTime = useProgressStore((s) => s.currentTime);
  const duration = useProgressStore((s) => s.duration);
  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  return (
    <div className="bg-foreground/10 absolute inset-x-0 bottom-0 h-px" aria-hidden>
      <div
        className="bg-primary h-full shadow-[0_0_8px_var(--primary)]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function MobileMiniPlayer() {
  const track = usePlayerStore(selectCurrentTrack);
  if (!track) return null;
  return (
    <div className="fixed inset-x-2 bottom-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom)+0.375rem)] z-40 md:hidden">
      <div className="border-border bg-card/90 relative flex h-(--mini-player-height) items-center gap-3 overflow-hidden rounded-lg border px-2 shadow-xl shadow-black/40 backdrop-blur-xl">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-label={`Open stage: ${track.title} by ${track.artist.name}`}
          onClick={openStage}
        >
          <Artwork image={track.artwork} size="small" className="size-10 shrink-0" eager />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{track.title}</span>
            <span className="text-muted-foreground block truncate text-xs">
              {track.artist.name}
            </span>
          </span>
        </button>
        <LikeButton track={track} />
        <PlayPauseButton className="mr-1 size-9" />
        <MiniProgress />
      </div>
    </div>
  );
}

/** Everything player-related that lives outside page content and survives navigation. */
export function PlayerBar() {
  return (
    <>
      <DesktopPlayer />
      <QueueDrawer />
      <MobileMiniPlayer />
      <Stage />
    </>
  );
}
