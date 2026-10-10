import type { QueueItem, RepeatMode, Track } from "@/types/music";

/**
 * Pure queue operations. The player store composes these; keeping them free of
 * React/Zustand makes the trickiest player behaviour (shuffle restore, repeat,
 * index bookkeeping) directly unit-testable.
 */
export interface QueueState {
  items: QueueItem[];
  /** Pre-shuffle order, kept so turning shuffle off restores it. Null when not shuffled. */
  original: QueueItem[] | null;
  /** Index of the current item in `items`; -1 when the queue is empty. */
  index: number;
}

export type Rng = () => number;

export const EMPTY_QUEUE: QueueState = { items: [], original: null, index: -1 };

let uidCounter = 0;
// Not crypto.randomUUID(): it is undefined outside secure contexts (e.g. a
// phone hitting the dev server over LAN http). Uniqueness per session suffices.
export function createUid(): string {
  uidCounter = (uidCounter + 1) % 1_000_000;
  return `${Date.now().toString(36)}${uidCounter.toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function toQueueItems(tracks: Track[]): QueueItem[] {
  return tracks.map((track) => ({ uid: createUid(), track }));
}

export function currentItem(state: QueueState): QueueItem | null {
  return state.items[state.index] ?? null;
}

function fisherYates<T>(input: T[], rng: Rng): T[] {
  const result = [...input];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Current item first, everything else shuffled after it. */
function shuffledAround(items: QueueItem[], index: number, rng: Rng): QueueItem[] {
  const current = items[index];
  if (!current) return fisherYates(items, rng);
  return [
    current,
    ...fisherYates(
      items.filter((_, i) => i !== index),
      rng,
    ),
  ];
}

export function loadQueue(
  tracks: Track[],
  startIndex: number,
  options: { shuffle?: boolean; rng?: Rng } = {},
): QueueState {
  const items = toQueueItems(tracks);
  if (items.length === 0) return EMPTY_QUEUE;
  const index = Math.min(Math.max(0, startIndex), items.length - 1);
  if (!options.shuffle) return { items, original: null, index };
  return {
    items: shuffledAround(items, index, options.rng ?? Math.random),
    original: items,
    index: 0,
  };
}

export function shuffleQueue(state: QueueState, rng: Rng = Math.random): QueueState {
  if (state.original || state.items.length === 0) return state;
  return {
    items: shuffledAround(state.items, state.index, rng),
    original: state.items,
    index: state.index >= 0 ? 0 : -1,
  };
}

export function unshuffleQueue(state: QueueState): QueueState {
  if (!state.original) return state;
  const current = currentItem(state);
  const index = current ? state.original.findIndex((item) => item.uid === current.uid) : -1;
  return {
    items: state.original,
    original: null,
    index: index >= 0 ? index : Math.min(0, state.original.length - 1),
  };
}

export function appendToQueue(state: QueueState, tracks: Track[]): QueueState {
  const added = toQueueItems(tracks);
  const items = [...state.items, ...added];
  return {
    items,
    original: state.original ? [...state.original, ...added] : null,
    index: state.index >= 0 ? state.index : 0,
  };
}

export function insertNext(state: QueueState, tracks: Track[]): QueueState {
  const added = toQueueItems(tracks);
  if (state.items.length === 0)
    return { items: added, original: null, index: added.length ? 0 : -1 };

  const items = [...state.items];
  items.splice(state.index + 1, 0, ...added);

  let original = state.original;
  if (original) {
    // Mirror the insertion in the unshuffled order so the track still plays
    // "next" relative to the current one after shuffle is turned off.
    const current = currentItem(state);
    const at = current ? original.findIndex((item) => item.uid === current.uid) : -1;
    original = [...original];
    original.splice(at + 1, 0, ...added);
  }
  return { items, original, index: state.index };
}

export function removeFromQueue(state: QueueState, uid: string): QueueState {
  const removeAt = state.items.findIndex((item) => item.uid === uid);
  if (removeAt === -1) return state;
  const items = state.items.filter((item) => item.uid !== uid);
  const original = state.original?.filter((item) => item.uid !== uid) ?? null;

  let index = state.index;
  if (removeAt < state.index) index -= 1;
  // Removing the current item makes the following one current (or the new last).
  if (index >= items.length) index = items.length - 1;
  return { items, original, index };
}

export function moveQueueItem(state: QueueState, from: number, to: number): QueueState {
  const len = state.items.length;
  if (from === to || from < 0 || to < 0 || from >= len || to >= len) return state;
  const current = currentItem(state);
  const items = [...state.items];
  const [moved] = items.splice(from, 1);
  items.splice(to, 0, moved);
  const index = current ? items.findIndex((item) => item.uid === current.uid) : state.index;
  return { ...state, items, index };
}

/** Removes everything after the current item, keeping history for "previous". */
export function clearUpcoming(state: QueueState): QueueState {
  if (state.index < 0) return EMPTY_QUEUE;
  const items = state.items.slice(0, state.index + 1);
  const kept = new Set(items.map((item) => item.uid));
  return {
    items,
    original: state.original?.filter((item) => kept.has(item.uid)) ?? null,
    index: state.index,
  };
}

export function jumpTo(state: QueueState, uid: string): QueueState {
  const index = state.items.findIndex((item) => item.uid === uid);
  return index === -1 ? state : { ...state, index };
}

function findPlayable(items: QueueItem[], from: number, step: 1 | -1, wrap: boolean): number {
  const len = items.length;
  for (let n = 1; n <= len; n++) {
    let i = from + step * n;
    if (i < 0 || i >= len) {
      if (!wrap) return -1;
      i = (i + len) % len;
    }
    if (items[i].track.isPlayable) return i;
  }
  return -1;
}

export interface AdvanceResult {
  state: QueueState;
  /** True when playback reached the end of the queue and should stop. */
  ended: boolean;
}

/**
 * @param auto true when called because the current track finished, false for
 * a user pressing "next". Repeat-one only loops on natural completion; an
 * explicit skip should still move on.
 */
export function advance(state: QueueState, repeat: RepeatMode, auto: boolean): AdvanceResult {
  if (state.items.length === 0) return { state, ended: true };
  if (auto && repeat === "one") return { state, ended: false };
  const next = findPlayable(state.items, state.index, 1, repeat !== "off");
  if (next === -1) return { state, ended: true };
  return { state: { ...state, index: next }, ended: false };
}

export function retreat(state: QueueState, repeat: RepeatMode): QueueState {
  if (state.items.length === 0) return state;
  const prev = findPlayable(state.items, state.index, -1, repeat === "all");
  return prev === -1 ? state : { ...state, index: prev };
}

export function hasNext(state: QueueState, repeat: RepeatMode): boolean {
  return findPlayable(state.items, state.index, 1, repeat !== "off") !== -1;
}
