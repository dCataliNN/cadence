"use client";

import {
  Loader2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { IconButton } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { hasNext } from "@/lib/queue";
import { usePlayerStore } from "@/stores/player.store";
import { useProgressStore } from "@/stores/progress.store";

const REPEAT_LABELS = {
  off: "Enable repeat",
  all: "Enable repeat one",
  one: "Disable repeat",
} as const;

export function PlayPauseButton({
  size = "md",
  className,
}: {
  size?: "md" | "lg";
  className?: string;
}) {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const hasTrack = usePlayerStore((s) => s.queue.index >= 0);
  const buffering = useProgressStore((s) => s.buffering);

  return (
    <button
      type="button"
      aria-label={isPlaying ? "Pause (Space)" : "Play (Space)"}
      title={isPlaying ? "Pause" : "Play"}
      disabled={!hasTrack}
      onClick={() => usePlayerStore.getState().togglePlay()}
      className={cn(
        "bg-primary text-primary-foreground relative flex shrink-0 items-center justify-center rounded-full shadow-[0_0_22px_-6px_var(--primary)] transition-transform hover:scale-105 disabled:opacity-40 disabled:shadow-none disabled:hover:scale-100 [&_svg]:fill-current",
        size === "lg" ? "size-16 [&_svg]:size-7" : "size-9 [&_svg]:size-4",
        className,
      )}
    >
      {isPlaying && buffering ? (
        <Loader2 className="animate-spin fill-none!" />
      ) : isPlaying ? (
        <Pause />
      ) : (
        <Play className="translate-x-px" />
      )}
    </button>
  );
}

export function PlayerControls({ size = "md" }: { size?: "md" | "lg" }) {
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const hasTrack = usePlayerStore((s) => s.queue.index >= 0);
  const canNext = usePlayerStore((s) => hasNext(s.queue, s.repeat));
  const big = size === "lg" ? "size-12 [&_svg]:size-7" : "";
  const RepeatIcon = repeat === "one" ? Repeat1 : Repeat;

  return (
    <div className={cn("flex items-center justify-center", size === "lg" ? "gap-4" : "gap-2")}>
      <IconButton
        label={shuffle ? "Disable shuffle" : "Enable shuffle"}
        aria-pressed={shuffle}
        active={shuffle}
        className={cn(big, size === "lg" && "[&_svg]:size-6")}
        onClick={() => usePlayerStore.getState().toggleShuffle()}
      >
        <Shuffle />
      </IconButton>
      <IconButton
        label="Previous (P)"
        disabled={!hasTrack}
        className={cn(big, "[&_svg]:fill-current")}
        onClick={() => usePlayerStore.getState().previous()}
      >
        <SkipBack />
      </IconButton>
      <PlayPauseButton size={size} />
      <IconButton
        label="Next (N)"
        disabled={!canNext}
        className={cn(big, "[&_svg]:fill-current")}
        onClick={() => usePlayerStore.getState().next()}
      >
        <SkipForward />
      </IconButton>
      <IconButton
        label={REPEAT_LABELS[repeat]}
        aria-pressed={repeat !== "off"}
        active={repeat !== "off"}
        className={cn(big, size === "lg" && "[&_svg]:size-6")}
        onClick={() => usePlayerStore.getState().cycleRepeatMode()}
      >
        <RepeatIcon />
      </IconButton>
    </div>
  );
}
