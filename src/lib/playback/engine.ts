import { shouldRecordPlay } from "@/lib/history";
import { currentItem } from "@/lib/queue";
import { useHistoryStore } from "@/stores/history.store";
import { usePlayerStore, type PlayerState } from "@/stores/player.store";
import { useProgressStore } from "@/stores/progress.store";
import type { QueueItem } from "@/types/music";
import { playbackControls } from "./controls";
import { HtmlAudioAdapter } from "./html-audio-adapter";
import {
  registerMediaHandlers,
  setMediaMetadata,
  setMediaPlaybackState,
  setMediaPositionState,
} from "./media-session";

const SEEK_STEP_SECONDS = 10;
const RESUME_SAVE_INTERVAL_SECONDS = 5;
/** Larger jumps between timeupdates are seeks, not listening, and don't count toward history. */
const MAX_LISTEN_DELTA_SECONDS = 2;

interface ListenSession {
  item: QueueItem;
  listened: number;
  lastTime: number;
  historyId: string | null;
}

/**
 * Connects the player store (what the user wants) to the audio adapter (what
 * is actually playing). It is the only code that touches audio, so there is
 * exactly one playing element no matter how many UI controls exist.
 *
 * Audio is loaded lazily, only once playback is requested: restoring a queue
 * after reload must not hit the stream endpoint, which would register a play
 * the user never made.
 */
export function startPlaybackEngine(): () => void {
  const player = usePlayerStore;
  const progress = useProgressStore;

  let loadedUid: string | null = null;
  let targetUid: string | null = null;
  let loadToken = 0;
  let lastSavedPosition = 0;
  let session: ListenSession | null = null;

  const recordIfDue = () => {
    if (!session || session.historyId) return;
    if (shouldRecordPlay(session.listened, session.item.track.duration)) {
      session.historyId = useHistoryStore
        .getState()
        .record(session.item.track, Math.round(session.listened));
    }
  };

  const endSession = (completed: boolean) => {
    if (session?.historyId) {
      useHistoryStore.getState().update(session.historyId, {
        playDuration: Math.round(session.listened),
        completed,
      });
    }
    session = null;
  };

  const adapter = new HtmlAudioAdapter({
    onTimeUpdate(time) {
      progress.setState({ currentTime: time });
      if (session) {
        const delta = time - session.lastTime;
        if (delta > 0 && delta < MAX_LISTEN_DELTA_SECONDS) session.listened += delta;
        session.lastTime = time;
        recordIfDue();
      }
      if (Math.abs(time - lastSavedPosition) >= RESUME_SAVE_INTERVAL_SECONDS) {
        lastSavedPosition = time;
        player.getState().setResumePosition(time);
      }
    },
    onDurationChange(duration) {
      progress.setState({ duration });
      setMediaPositionState(progress.getState().currentTime, duration);
    },
    onBuffering(buffering) {
      progress.setState({ buffering });
    },
    onPlayStateChange(playing) {
      setMediaPlaybackState(playing ? "playing" : "paused");
      // Pausing is the likeliest moment before closing the tab; save the exact spot.
      if (!playing) player.getState().setResumePosition(progress.getState().currentTime);
      if (player.getState().isPlaying !== playing) player.setState({ isPlaying: playing });
    },
    onEnded() {
      endSession(true);
      player.getState().handleEnded();
    },
    onError(message) {
      endSession(false);
      loadedUid = null;
      player.getState().handleError(message);
    },
  });

  const startSession = (item: QueueItem, at: number) => {
    session = { item, listened: 0, lastTime: at, historyId: null };
  };

  const play = () => {
    const token = loadToken;
    adapter.play().catch((error: unknown) => {
      if (token !== loadToken) return; // a newer track superseded this one
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        // Autoplay policy: the browser wants a user gesture first.
        player.setState({ isPlaying: false });
        return;
      }
      player.getState().handleError("Playback failed.");
    });
  };

  const sync = (state: PlayerState, prev?: PlayerState) => {
    const item = currentItem(state.queue);

    if ((item?.uid ?? null) !== targetUid) {
      endSession(false);
      targetUid = item?.uid ?? null;
      if (loadedUid && !state.isPlaying) adapter.stop();
      loadedUid = null;
      lastSavedPosition = state.resumePosition;
      progress.setState({
        currentTime: state.resumePosition,
        duration: item?.track.duration ?? 0,
        buffering: false,
      });
      setMediaMetadata(item?.track ?? null);
      if (!item) {
        adapter.stop();
        setMediaPlaybackState("none");
      }
    }

    if (!prev || state.volume !== prev.volume) adapter.setVolume(state.volume);
    if (!prev || state.muted !== prev.muted) adapter.setMuted(state.muted);

    if (!item) return;

    if (state.isPlaying) {
      if (loadedUid !== item.uid) {
        if (!adapter.canPlay(item.track)) {
          // Deferred: handleError updates the store, and we're inside its listener.
          queueMicrotask(() =>
            player.getState().handleError("This track isn't available to stream."),
          );
          return;
        }
        loadToken++;
        loadedUid = item.uid;
        adapter.load(item.track, state.resumePosition);
        startSession(item, state.resumePosition);
        play();
      } else if (!prev?.isPlaying) {
        if (!session) startSession(item, progress.getState().currentTime);
        play();
      }
    } else if (prev?.isPlaying) {
      adapter.pause();
    }
  };

  playbackControls.seek = (seconds) => {
    adapter.seek(seconds);
    if (session) session.lastTime = seconds;
    setMediaPositionState(seconds, progress.getState().duration);
  };
  playbackControls.resume = () => {
    const item = currentItem(player.getState().queue);
    if (item && loadedUid === item.uid) {
      startSession(item, 0); // a repeat counts as a new listen
      play();
    }
  };

  const unsubscribe = player.subscribe(sync);
  sync(player.getState());

  const seekBy = (delta: number) => player.getState().seek(progress.getState().currentTime + delta);
  const unregisterMedia = registerMediaHandlers({
    play: () => player.getState().play(),
    pause: () => player.getState().pause(),
    nexttrack: () => player.getState().next(),
    previoustrack: () => player.getState().previous(),
    seekbackward: (d) => seekBy(-(d.seekOffset ?? SEEK_STEP_SECONDS)),
    seekforward: (d) => seekBy(d.seekOffset ?? SEEK_STEP_SECONDS),
    seekto: (d) => {
      if (d.seekTime !== undefined) player.getState().seek(d.seekTime);
    },
  });

  return () => {
    unsubscribe();
    unregisterMedia();
    endSession(false);
    playbackControls.seek = () => {};
    playbackControls.resume = () => {};
    adapter.destroy();
  };
}

export { SEEK_STEP_SECONDS };
