/**
 * Imperative commands the store needs to send to the active playback engine.
 * These are events rather than state (seeking, restarting a finished track),
 * so they bypass the store; the engine registers real handlers when it mounts.
 */
export const playbackControls = {
  seek: (seconds: number): void => {
    void seconds;
  },
  /** Starts the already-loaded media again, e.g. after it ended. */
  resume: (): void => {},
};
