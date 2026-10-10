import type { Track } from "@/types/music";

/** Thin, feature-detected wrapper around the Media Session API (OS media keys, lock screen). */

const supported = () => typeof navigator !== "undefined" && "mediaSession" in navigator;

export function setMediaMetadata(track: Track | null): void {
  if (!supported()) return;
  if (!track) {
    navigator.mediaSession.metadata = null;
    return;
  }
  const sizes: Array<[string | undefined, string]> = [
    [track.artwork?.small, "150x150"],
    [track.artwork?.medium, "480x480"],
    [track.artwork?.large, "1000x1000"],
  ];
  const artwork: MediaImage[] = sizes.flatMap(([src, size]) =>
    src ? [{ src, sizes: size, type: "image/jpeg" }] : [],
  );
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist.name,
    artwork,
  });
}

export function setMediaPlaybackState(state: MediaSessionPlaybackState): void {
  if (supported()) navigator.mediaSession.playbackState = state;
}

export function setMediaPositionState(position: number, duration: number): void {
  if (!supported() || !navigator.mediaSession.setPositionState) return;
  if (!(duration > 0) || !Number.isFinite(duration)) return;
  try {
    navigator.mediaSession.setPositionState({
      duration,
      position: Math.min(Math.max(0, position), duration),
      playbackRate: 1,
    });
  } catch {
    // Browsers throw on transiently inconsistent values while a track switches.
  }
}

export function registerMediaHandlers(
  handlers: Partial<Record<MediaSessionAction, MediaSessionActionHandler>>,
): () => void {
  if (!supported()) return () => {};
  const actions = Object.keys(handlers) as MediaSessionAction[];
  for (const action of actions) {
    try {
      navigator.mediaSession.setActionHandler(action, handlers[action] ?? null);
    } catch {
      // Unsupported actions throw in some browsers; the rest still work.
    }
  }
  return () => {
    for (const action of actions) {
      try {
        navigator.mediaSession.setActionHandler(action, null);
      } catch {}
    }
  };
}
