"use client";

import { Maximize2, Pause, Play, Search } from "lucide-react";
import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { useHydrated } from "@/stores/hydration";
import { selectCurrentTrack, usePlayerStore } from "@/stores/player.store";
import { useUiStore } from "@/stores/ui.store";
import type { Track } from "@/types/music";

/** Primary hero CTA: resume the restored session if there is one, otherwise start the trending chart. */
export function HeroActions({ trending }: { trending: Track[] }) {
  const hydrated = useHydrated();
  const current = usePlayerStore(selectCurrentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playable = trending.filter((t) => t.isPlayable);

  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      {hydrated && current ? (
        <>
          <button
            type="button"
            className={cn(buttonClass("primary"), "h-11 px-6")}
            onClick={() => usePlayerStore.getState().togglePlay()}
          >
            {isPlaying ? (
              <>
                <Pause className="fill-current" /> Pause
              </>
            ) : (
              <>
                <Play className="fill-current" /> Resume
              </>
            )}
          </button>
          <button
            type="button"
            className={cn(buttonClass("secondary"), "h-11 max-w-full px-5")}
            onClick={() => useUiStore.getState().setNowPlayingOpen(true)}
          >
            <Maximize2 />
            <span className="truncate normal-case">{current.title}</span>
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            disabled={playable.length === 0}
            className={cn(buttonClass("primary"), "h-11 px-6")}
            onClick={() => usePlayerStore.getState().playTracks(playable, 0)}
          >
            <Play className="fill-current" /> Play the chart
          </button>
          <Link href={routes.search()} className={cn(buttonClass("secondary"), "h-11 px-5")}>
            <Search /> Search
          </Link>
        </>
      )}
    </div>
  );
}
