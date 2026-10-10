"use client";

import { useEffect } from "react";
import { SEEK_STEP_SECONDS } from "@/lib/playback/engine";
import { usePlayerStore } from "@/stores/player.store";
import { useProgressStore } from "@/stores/progress.store";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  // Range inputs (seek/volume) own their own arrow keys.
  return target instanceof HTMLInputElement;
}

/** Global playback shortcuts; ignored while typing or when modifier keys are held. */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target))
        return;
      // Let focused buttons/links/menus keep Space for activation.
      const interactive =
        e.target instanceof HTMLElement &&
        e.target.closest("button,a,[role=menuitem],[role=slider]");
      const player = usePlayerStore.getState();
      const seekBy = (delta: number) =>
        player.seek(useProgressStore.getState().currentTime + delta);

      switch (e.key) {
        case " ":
          if (interactive) return;
          player.togglePlay();
          break;
        case "ArrowLeft":
          seekBy(-SEEK_STEP_SECONDS);
          break;
        case "ArrowRight":
          seekBy(SEEK_STEP_SECONDS);
          break;
        case "m":
        case "M":
          player.toggleMute();
          break;
        case "n":
        case "N":
          player.next();
          break;
        case "p":
        case "P":
          player.previous();
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
