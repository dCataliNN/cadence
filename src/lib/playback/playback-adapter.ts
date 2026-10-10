import type { Track } from "@/types/music";

export interface PlaybackEvents {
  onTimeUpdate(currentTime: number): void;
  onDurationChange(duration: number): void;
  onBuffering(buffering: boolean): void;
  onPlayStateChange(playing: boolean): void;
  onEnded(): void;
  onError(message: string): void;
}

/**
 * One way of turning a Track into sound. Plain audio URLs use the HTML audio
 * adapter; providers that require their own embedded player (e.g. YouTube's
 * IFrame API) or local files can add adapters without touching the store or UI.
 */
export interface PlaybackAdapter {
  canPlay(track: Track): boolean;
  /** Starts loading the track, optionally resuming at `startAt` seconds. */
  load(track: Track, startAt?: number): void;
  play(): Promise<void>;
  pause(): void;
  seek(seconds: number): void;
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
  stop(): void;
  destroy(): void;
}
