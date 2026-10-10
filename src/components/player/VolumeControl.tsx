"use client";

import { Volume1, Volume2, VolumeX } from "lucide-react";
import { IconButton } from "@/components/ui/Button";
import { usePlayerStore } from "@/stores/player.store";

export function VolumeControl() {
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const effective = muted ? 0 : volume;
  const Icon = effective === 0 ? VolumeX : effective < 0.5 ? Volume1 : Volume2;

  return (
    <div className="flex items-center gap-1">
      <IconButton
        label={muted ? "Unmute (M)" : "Mute (M)"}
        onClick={() => usePlayerStore.getState().toggleMute()}
      >
        <Icon />
      </IconButton>
      <input
        type="range"
        className="range w-24"
        min={0}
        max={1}
        step={0.01}
        value={effective}
        aria-label="Volume"
        aria-valuetext={`${Math.round(effective * 100)}%`}
        style={{ "--fill": `${effective * 100}%` } as React.CSSProperties}
        onChange={(e) => usePlayerStore.getState().setVolume(Number(e.target.value))}
      />
    </div>
  );
}
