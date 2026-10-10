import { describe, expect, it } from "vitest";
import { dedupeRecent, shouldRecordPlay, topGenre, type HistoryEntry } from "@/lib/history";
import type { Track } from "@/types/music";

const track = (id: string, genre?: string): Track => ({
  id,
  providerId: id,
  source: "audius",
  title: id,
  artist: { id: "a", name: "A" },
  duration: 200,
  isPlayable: true,
  genre,
});

const entry = (id: string, playedAt: number, genre?: string): HistoryEntry => ({
  id: `${id}-${playedAt}`,
  track: track(id, genre),
  playedAt,
  playDuration: 60,
  completed: false,
});

describe("shouldRecordPlay", () => {
  it("requires 30 seconds for normal-length tracks", () => {
    expect(shouldRecordPlay(29, 240)).toBe(false);
    expect(shouldRecordPlay(30, 240)).toBe(true);
  });

  it("requires half of very short tracks", () => {
    expect(shouldRecordPlay(9, 20)).toBe(false);
    expect(shouldRecordPlay(10, 20)).toBe(true);
  });

  it("falls back to 30s when duration is unknown", () => {
    expect(shouldRecordPlay(15, 0)).toBe(false);
    expect(shouldRecordPlay(30, 0)).toBe(true);
  });
});

describe("dedupeRecent", () => {
  it("keeps only the latest play of each track, in order", () => {
    const entries = [entry("a", 5), entry("b", 4), entry("a", 3), entry("c", 2)];
    expect(dedupeRecent(entries).map((e) => e.id)).toEqual(["a-5", "b-4", "c-2"]);
    expect(dedupeRecent(entries, 2)).toHaveLength(2);
  });
});

describe("topGenre", () => {
  it("returns the most common genre", () => {
    expect(topGenre([entry("a", 1, "House"), entry("b", 2, "Rock"), entry("c", 3, "House")])).toBe(
      "House",
    );
    expect(topGenre([entry("a", 1)])).toBeUndefined();
  });
});
