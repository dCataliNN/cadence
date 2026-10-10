import { describe, expect, it } from "vitest";
import {
  advance,
  appendToQueue,
  clearUpcoming,
  currentItem,
  EMPTY_QUEUE,
  hasNext,
  insertNext,
  loadQueue,
  moveQueueItem,
  removeFromQueue,
  retreat,
  shuffleQueue,
  unshuffleQueue,
  type QueueState,
} from "@/lib/queue";
import type { Track } from "@/types/music";

function makeTrack(n: number | string, playable = true): Track {
  return {
    id: `audius:t${n}`,
    providerId: `t${n}`,
    source: "audius",
    title: `Track ${n}`,
    artist: { id: "audius:a", name: "Artist" },
    duration: 180,
    isPlayable: playable,
  };
}

const tracks = [1, 2, 3, 4, 5].map((n) => makeTrack(n));
const titles = (s: QueueState) => s.items.map((i) => i.track.title.replace("Track ", ""));
const current = (s: QueueState) => currentItem(s)?.track.title.replace("Track ", "");
// Deterministic "random" so shuffle order is reproducible in assertions.
const seededRng = () => {
  let seed = 42;
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
};

describe("loadQueue", () => {
  it("starts at the requested index", () => {
    const q = loadQueue(tracks, 2);
    expect(current(q)).toBe("3");
    expect(q.original).toBeNull();
  });

  it("clamps out-of-range start indices and handles empty input", () => {
    expect(loadQueue(tracks, 99).index).toBe(4);
    expect(loadQueue([], 0)).toEqual(EMPTY_QUEUE);
  });

  it("puts the chosen track first when starting shuffled", () => {
    const q = loadQueue(tracks, 3, { shuffle: true, rng: seededRng() });
    expect(q.index).toBe(0);
    expect(current(q)).toBe("4");
    expect(q.original?.map((i) => i.track.title)).toEqual(tracks.map((t) => t.title));
  });

  it("gives every slot a unique uid even for duplicate tracks", () => {
    const q = loadQueue([tracks[0], tracks[0]], 0);
    expect(q.items[0].uid).not.toBe(q.items[1].uid);
  });
});

describe("shuffle / unshuffle", () => {
  it("keeps the current track playing and restores the original order", () => {
    const q = { ...loadQueue(tracks, 1) };
    const shuffled = shuffleQueue(q, seededRng());
    expect(current(shuffled)).toBe("2");
    expect(shuffled.index).toBe(0);
    expect([...titles(shuffled)].sort()).toEqual(["1", "2", "3", "4", "5"]);

    const advanced = advance(shuffled, "off", false).state;
    const restored = unshuffleQueue(advanced);
    expect(titles(restored)).toEqual(["1", "2", "3", "4", "5"]);
    expect(current(restored)).toBe(current(advanced));
    expect(restored.original).toBeNull();
  });

  it("is idempotent while already shuffled", () => {
    const shuffled = shuffleQueue(loadQueue(tracks, 0), seededRng());
    expect(shuffleQueue(shuffled, seededRng())).toBe(shuffled);
  });

  it("keeps tracks added while shuffled after unshuffling", () => {
    let q = shuffleQueue(loadQueue(tracks, 0), seededRng());
    q = appendToQueue(q, [makeTrack("A")]);
    q = insertNext(q, [makeTrack("N")]);
    expect(titles(q)[1]).toBe("N");
    const restored = unshuffleQueue(q);
    expect(titles(restored)).toEqual(["1", "N", "2", "3", "4", "5", "A"]);
  });

  it("drops removed tracks from the original order too", () => {
    let q = shuffleQueue(loadQueue(tracks, 0), seededRng());
    const victim = q.items.find((i) => i.track.title === "Track 3")!;
    q = removeFromQueue(q, victim.uid);
    expect(titles(unshuffleQueue(q))).toEqual(["1", "2", "4", "5"]);
  });
});

describe("advance", () => {
  it("moves forward and reports the end with repeat off", () => {
    let q = loadQueue(tracks, 3);
    let r = advance(q, "off", true);
    expect(current(r.state)).toBe("5");
    expect(r.ended).toBe(false);
    q = r.state;
    r = advance(q, "off", true);
    expect(r.ended).toBe(true);
    expect(r.state).toBe(q);
  });

  it("wraps to the start with repeat all", () => {
    const r = advance(loadQueue(tracks, 4), "all", true);
    expect(current(r.state)).toBe("1");
    expect(r.ended).toBe(false);
  });

  it("repeats the same track on natural end with repeat one, but skips on manual next", () => {
    const q = loadQueue(tracks, 2);
    expect(current(advance(q, "one", true).state)).toBe("3");
    expect(current(advance(q, "one", false).state)).toBe("4");
  });

  it("skips unplayable tracks", () => {
    const q = loadQueue([makeTrack(1), makeTrack(2, false), makeTrack(3)], 0);
    expect(current(advance(q, "off", false).state)).toBe("3");
  });

  it("ends when nothing after the current track is playable", () => {
    const q = loadQueue([makeTrack(1), makeTrack(2, false)], 0);
    expect(advance(q, "off", true).ended).toBe(true);
    expect(hasNext(q, "off")).toBe(false);
  });
});

describe("retreat", () => {
  it("moves back, stays at the start with repeat off, wraps with repeat all", () => {
    expect(current(retreat(loadQueue(tracks, 2), "off"))).toBe("2");
    expect(current(retreat(loadQueue(tracks, 0), "off"))).toBe("1");
    expect(current(retreat(loadQueue(tracks, 0), "all"))).toBe("5");
  });
});

describe("insertNext / appendToQueue", () => {
  it("inserts directly after the current track", () => {
    const q = insertNext(loadQueue(tracks, 1), [makeTrack("X"), makeTrack("Y")]);
    expect(titles(q)).toEqual(["1", "2", "X", "Y", "3", "4", "5"]);
    expect(current(q)).toBe("2");
  });

  it("starts a queue when it was empty", () => {
    expect(current(insertNext(EMPTY_QUEUE, [makeTrack("X")]))).toBe("X");
    expect(current(appendToQueue(EMPTY_QUEUE, [makeTrack("Y")]))).toBe("Y");
  });
});

describe("removeFromQueue", () => {
  it("keeps the current track when removing one before it", () => {
    const q = loadQueue(tracks, 2);
    const r = removeFromQueue(q, q.items[0].uid);
    expect(current(r)).toBe("3");
  });

  it("makes the following track current when removing the current one", () => {
    const q = loadQueue(tracks, 2);
    expect(current(removeFromQueue(q, q.items[2].uid))).toBe("4");
  });

  it("falls back to the new last track when removing the last current track", () => {
    const q = loadQueue(tracks, 4);
    expect(current(removeFromQueue(q, q.items[4].uid))).toBe("4");
  });

  it("empties cleanly", () => {
    const q = loadQueue([makeTrack(1)], 0);
    const r = removeFromQueue(q, q.items[0].uid);
    expect(r.items).toEqual([]);
    expect(r.index).toBe(-1);
  });
});

describe("moveQueueItem", () => {
  it("reorders while tracking the current item", () => {
    const q = loadQueue(tracks, 1);
    const moved = moveQueueItem(q, 1, 4);
    expect(titles(moved)).toEqual(["1", "3", "4", "5", "2"]);
    expect(current(moved)).toBe("2");
    expect(moveQueueItem(q, 0, 99)).toBe(q);
  });
});

describe("clearUpcoming", () => {
  it("keeps history and the current track", () => {
    const q = clearUpcoming(loadQueue(tracks, 2));
    expect(titles(q)).toEqual(["1", "2", "3"]);
    expect(current(q)).toBe("3");
  });
});
