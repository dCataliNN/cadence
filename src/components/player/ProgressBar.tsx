"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/format";
import { usePlayerStore } from "@/stores/player.store";
import { useProgressStore } from "@/stores/progress.store";

/**
 * Native range input: keyboard, screen reader and touch support come free.
 * While dragging we only update a local value and seek once on release, so a
 * drag doesn't fire dozens of seeks (each one re-buffers the stream).
 */
export function ProgressBar({ className, compact }: { className?: string; compact?: boolean }) {
  const currentTime = useProgressStore((s) => s.currentTime);
  const duration = useProgressStore((s) => s.duration);
  const hasTrack = usePlayerStore((s) => s.queue.index >= 0);
  const [dragValue, setDragValue] = useState<number | null>(null);

  const value = dragValue ?? currentTime;
  const max = duration > 0 ? duration : 1;
  const fill = `${Math.min(100, (value / max) * 100)}%`;

  const commit = () => {
    if (dragValue !== null) usePlayerStore.getState().seek(dragValue);
    setDragValue(null);
  };

  return (
    <div
      className={cn(
        "text-muted-foreground flex items-center gap-2.5 font-mono text-[11px] tabular-nums",
        className,
      )}
    >
      {!compact && <span className="w-10 text-right">{formatDuration(value)}</span>}
      <input
        type="range"
        className="range w-full"
        min={0}
        max={max}
        step={1}
        value={Math.min(value, max)}
        disabled={!hasTrack}
        aria-label="Seek"
        aria-valuetext={`${formatDuration(value)} of ${formatDuration(duration)}`}
        style={{ "--fill": fill } as React.CSSProperties}
        onPointerDown={() => setDragValue(currentTime)}
        onChange={(e) => {
          const next = Number(e.target.value);
          if (dragValue !== null) setDragValue(next);
          else usePlayerStore.getState().seek(next); // keyboard step
        }}
        onPointerUp={commit}
        onPointerCancel={() => setDragValue(null)}
        onBlur={commit}
      />
      {!compact && <span className="w-10">{formatDuration(duration)}</span>}
    </div>
  );
}
