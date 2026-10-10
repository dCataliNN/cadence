"use client";

import { ChevronDown, ListMusic, Share2 } from "lucide-react";
import Link from "next/link";
import { Dialog as RadixDialog } from "radix-ui";
import { useState } from "react";
import { LikeButton } from "@/components/tracks/LikeButton";
import { TrackActionsMenu } from "@/components/tracks/TrackActionsMenu";
import { Artwork } from "@/components/ui/Artwork";
import { IconButton } from "@/components/ui/Button";
import { SignalField } from "@/components/visual/SignalField";
import { formatDuration } from "@/lib/format";
import { routes } from "@/lib/routes";
import { shareLink } from "@/lib/share";
import { selectCurrentTrack, usePlayerStore } from "@/stores/player.store";
import { useUiStore } from "@/stores/ui.store";
import { SOURCE_NAMES, type Track } from "@/types/music";
import { PlayerControls } from "./PlayerControls";
import { ProgressBar } from "./ProgressBar";
import { QueueList } from "./QueueList";
import { VolumeControl } from "./VolumeControl";

function SpecSheet({ track }: { track: Track }) {
  const specs: Array<[string, string]> = [
    ["Genre", track.genre ?? "—"],
    ["Tempo", track.bpm ? `${track.bpm} bpm` : "—"],
    ["Length", formatDuration(track.duration)],
    ["Source", SOURCE_NAMES[track.source]],
  ];
  return (
    <dl className="border-border bg-border mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-md border sm:grid-cols-4">
      {specs.map(([label, value]) => (
        <div key={label} className="bg-background/80 px-3 py-2.5 backdrop-blur-sm">
          <dt className="label-mono text-subtle text-[10px]">{label}</dt>
          <dd className="mt-1.5 truncate font-mono text-xs">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Full-screen "stage" for the current track, on every breakpoint. The
 * generative field behind it pulses on the track's tempo (see SignalField).
 */
export function Stage() {
  const open = useUiStore((s) => s.nowPlayingOpen);
  const track = usePlayerStore(selectCurrentTrack);
  const [showQueue, setShowQueue] = useState(false);
  const close = () => useUiStore.getState().setNowPlayingOpen(false);

  return (
    <RadixDialog.Root
      open={open && Boolean(track)}
      onOpenChange={(o) => useUiStore.getState().setNowPlayingOpen(o)}
    >
      <RadixDialog.Portal>
        <RadixDialog.Content
          aria-describedby={undefined}
          className="animate-slide-up bg-background fixed inset-0 z-50 flex flex-col overflow-hidden"
        >
          <div className="bg-dot-grid absolute inset-0 opacity-30" />
          <SignalField
            origin={[0.5, 0.62]}
            className="[mask-image:radial-gradient(70%_65%_at_50%_60%,black_20%,transparent_75%)] opacity-90"
          />
          {track && (
            <div className="relative flex min-h-0 flex-1 flex-col px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),1.25rem)] md:px-10 md:pb-8">
              <header className="flex items-center justify-between gap-4">
                <RadixDialog.Close asChild>
                  <IconButton label="Close stage">
                    <ChevronDown />
                  </IconButton>
                </RadixDialog.Close>
                <RadixDialog.Title className="label-mono flex items-center gap-2">
                  <span className="bg-primary size-1.5 rounded-full" aria-hidden />
                  {showQueue ? "Up next" : "Now playing"}
                </RadixDialog.Title>
                <TrackActionsMenu track={track} />
              </header>

              <div className="grid min-h-0 flex-1 gap-10 md:grid-cols-[minmax(0,1fr)_22rem] md:py-6">
                <div className="flex min-h-0 flex-col justify-center">
                  {showQueue ? (
                    <div className="-mx-2 mt-4 min-h-0 flex-1 overflow-y-auto md:hidden">
                      <QueueList />
                    </div>
                  ) : (
                    <div className="mx-auto w-full max-w-xl">
                      <Artwork
                        key={track.id}
                        image={track.artwork}
                        size="large"
                        rounded="lg"
                        eager
                        className="border-border animate-rise-in mx-auto aspect-square w-full max-w-[min(26rem,46vh)] border shadow-[0_30px_80px_-30px_var(--primary)] md:mx-0"
                      />
                      <div className="mt-7 flex items-end gap-3">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={routes.track(track.id)}
                            onClick={close}
                            className="block truncate text-2xl font-medium tracking-[-0.04em] hover:underline md:text-4xl"
                          >
                            {track.title}
                          </Link>
                          <Link
                            href={routes.artist(track.artist.id)}
                            onClick={close}
                            className="text-muted-foreground hover:text-primary mt-1 block truncate"
                          >
                            {track.artist.name}
                          </Link>
                        </div>
                        <LikeButton track={track} className="size-10 [&_svg]:size-6" />
                      </div>
                      <div className="hidden sm:block">
                        <SpecSheet track={track} />
                      </div>
                    </div>
                  )}
                </div>

                <aside
                  aria-label="Queue"
                  className="border-border bg-background/70 hidden min-h-0 flex-col rounded-lg border backdrop-blur-md md:flex"
                >
                  <p className="label-mono border-border border-b px-4 py-3">
                    <span className="text-primary">{"// "}</span>Queue
                  </p>
                  <div className="min-h-0 flex-1 overflow-y-auto p-2">
                    <QueueList />
                  </div>
                </aside>
              </div>

              <div className="mx-auto w-full max-w-2xl">
                <ProgressBar className="mt-4" />
                <div className="mt-3">
                  <PlayerControls size="lg" />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <IconButton
                    label="Share"
                    onClick={() => void shareLink(routes.track(track.id), track.title)}
                  >
                    <Share2 />
                  </IconButton>
                  <div className="hidden md:block">
                    <VolumeControl />
                  </div>
                  <IconButton
                    label={showQueue ? "Hide queue" : "Show queue"}
                    aria-pressed={showQueue}
                    active={showQueue}
                    className="md:invisible"
                    onClick={() => setShowQueue((v) => !v)}
                  >
                    <ListMusic />
                  </IconButton>
                </div>
              </div>
            </div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
