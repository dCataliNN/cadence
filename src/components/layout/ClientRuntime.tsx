"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { startPlaybackEngine } from "@/lib/playback/engine";
import { hydrateStores } from "@/stores/hydration";
import { useToastStore } from "@/stores/toast.store";
import { cn } from "@/lib/cn";

function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--mobile-nav-height)+var(--mini-player-height)+1rem)] z-[60] flex flex-col items-center gap-2 px-4 md:bottom-[calc(var(--player-height)+1rem)]"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.tone === "error" ? "alert" : "status"}
          className={cn(
            "animate-fade-in pointer-events-auto flex max-w-md items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium shadow-xl shadow-black/40",
            t.tone === "error" ? "bg-destructive text-white" : "bg-foreground text-background",
          )}
        >
          <span>{t.message}</span>
          <button
            type="button"
            aria-label="Dismiss"
            className="opacity-60 hover:opacity-100"
            onClick={() => useToastStore.getState().dismiss(t.id)}
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

/** Mount-once client infrastructure: restores local state and starts the audio engine. */
export function ClientRuntime() {
  useKeyboardShortcuts();

  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;
    void hydrateStores().then(() => {
      // Strict Mode mounts effects twice in dev; never start a second engine.
      if (!cancelled) stop = startPlaybackEngine();
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  return <Toaster />;
}
