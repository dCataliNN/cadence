import type { Track } from "@/types/music";

export interface HistoryEntry {
  id: string;
  track: Track;
  /** Epoch ms when the play was recorded. */
  playedAt: number;
  /** Seconds actually listened (seeking does not count). */
  playDuration: number;
  completed: boolean;
}

/** A play counts after 30s, or half the track if it is shorter than a minute. */
export const MIN_COUNTED_SECONDS = 30;

export function shouldRecordPlay(listenedSeconds: number, durationSeconds: number): boolean {
  const threshold =
    durationSeconds > 0 ? Math.min(MIN_COUNTED_SECONDS, durationSeconds / 2) : MIN_COUNTED_SECONDS;
  return listenedSeconds >= threshold;
}

/** Most recent play of each distinct track, newest first. */
export function dedupeRecent(entries: HistoryEntry[], limit = Infinity): HistoryEntry[] {
  const seen = new Set<string>();
  const result: HistoryEntry[] = [];
  for (const entry of entries) {
    if (seen.has(entry.track.id)) continue;
    seen.add(entry.track.id);
    result.push(entry);
    if (result.length >= limit) break;
  }
  return result;
}

/** Most frequent genre among recent plays, used to seed recommendations. */
export function topGenre(entries: HistoryEntry[], sample = 50): string | undefined {
  const counts = new Map<string, number>();
  for (const entry of entries.slice(0, sample)) {
    const genre = entry.track.genre;
    if (genre) counts.set(genre, (counts.get(genre) ?? 0) + 1);
  }
  let best: string | undefined;
  let bestCount = 0;
  for (const [genre, count] of counts) {
    if (count > bestCount) [best, bestCount] = [genre, count];
  }
  return best;
}
