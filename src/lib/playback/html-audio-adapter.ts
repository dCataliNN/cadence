import type { Track } from "@/types/music";
import type { PlaybackAdapter, PlaybackEvents } from "./playback-adapter";

const MEDIA_ERRORS: Record<number, string> = {
  1: "Playback was aborted.",
  2: "A network error interrupted playback.",
  3: "This track's audio could not be decoded.",
  4: "This track can't be streamed right now.",
};

/** Plays tracks that expose a direct audio URL, through one shared <audio> element. */
export class HtmlAudioAdapter implements PlaybackAdapter {
  private readonly audio: HTMLAudioElement;
  private pendingSeek: number | null = null;
  /** True between swapping `src` and the new media being ready; see onPause. */
  private switching = false;
  private readonly cleanup: Array<() => void> = [];

  constructor(private readonly events: PlaybackEvents) {
    this.audio = new Audio();
    this.audio.preload = "auto";

    const on = <K extends keyof HTMLMediaElementEventMap>(type: K, fn: () => void) => {
      this.audio.addEventListener(type, fn);
      this.cleanup.push(() => this.audio.removeEventListener(type, fn));
    };

    on("loadedmetadata", () => {
      if (this.pendingSeek !== null && Number.isFinite(this.audio.duration)) {
        this.audio.currentTime = Math.min(this.pendingSeek, Math.max(0, this.audio.duration - 1));
      }
      this.pendingSeek = null;
    });
    on("loadeddata", () => (this.switching = false));
    on("durationchange", () => {
      if (Number.isFinite(this.audio.duration)) events.onDurationChange(this.audio.duration);
    });
    on("timeupdate", () => events.onTimeUpdate(this.audio.currentTime));
    on("waiting", () => events.onBuffering(true));
    on("playing", () => {
      events.onBuffering(false);
      events.onPlayStateChange(true);
    });
    // Pauses we didn't ask for (headphones unplugged, OS interruption) must be
    // reflected in the store; pauses caused by swapping tracks must not.
    on("pause", () => {
      if (!this.switching && !this.audio.ended) events.onPlayStateChange(false);
    });
    on("ended", () => events.onEnded());
    on("error", () => {
      // An error from an emptied/replaced source is not a real playback failure.
      if (!this.audio.getAttribute("src")) return;
      this.switching = false;
      events.onBuffering(false);
      events.onError(MEDIA_ERRORS[this.audio.error?.code ?? 0] ?? "Playback failed.");
    });
  }

  canPlay(track: Track): boolean {
    return track.isPlayable && Boolean(track.streamUrl);
  }

  load(track: Track, startAt = 0): void {
    this.switching = true;
    this.pendingSeek = startAt > 0 ? startAt : null;
    this.events.onTimeUpdate(startAt);
    this.events.onDurationChange(track.duration);
    this.audio.src = track.streamUrl ?? "";
  }

  async play(): Promise<void> {
    try {
      await this.audio.play();
    } catch (error) {
      // AbortError means a newer load() superseded this play() call, which is
      // exactly what happens when users skip quickly. Not a failure.
      if (error instanceof DOMException && error.name === "AbortError") return;
      throw error;
    }
  }

  pause(): void {
    this.audio.pause();
  }

  seek(seconds: number): void {
    if (this.audio.readyState === 0) {
      this.pendingSeek = seconds;
      return;
    }
    const max = Number.isFinite(this.audio.duration) ? this.audio.duration : seconds;
    this.audio.currentTime = Math.min(Math.max(0, seconds), max);
  }

  setVolume(volume: number): void {
    this.audio.volume = Math.min(1, Math.max(0, volume));
  }

  setMuted(muted: boolean): void {
    this.audio.muted = muted;
  }

  stop(): void {
    this.switching = true;
    this.audio.pause();
    this.audio.removeAttribute("src");
    this.audio.load();
  }

  destroy(): void {
    this.stop();
    this.cleanup.forEach((fn) => fn());
  }
}
