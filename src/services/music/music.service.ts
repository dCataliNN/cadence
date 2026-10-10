import "server-only";
import { DEFAULT_SOURCE, getProvider } from "@/providers/registry";
import { ProviderError, type RecommendationSeed } from "@/providers/types";
import type { MusicSource, SearchResults, Track } from "@/types/music";

/**
 * Server-side entry point for catalog data. Pages and route handlers go through
 * here instead of touching a provider directly, so multi-provider behaviour
 * (merging, fallbacks) has one home.
 */
export const musicService = {
  search(query: string, limit?: number): Promise<SearchResults> {
    return getProvider(DEFAULT_SOURCE).search(query, limit);
  },

  getTrending(options?: { genre?: string; underground?: boolean; limit?: number }) {
    return getProvider(DEFAULT_SOURCE).getTrending(options);
  },

  getTrendingPlaylists(limit?: number) {
    return getProvider(DEFAULT_SOURCE).getTrendingPlaylists(limit);
  },

  getTrack(source: string, id: string) {
    return getProvider(source).getTrack(id);
  },

  getArtist(source: string, id: string) {
    return getProvider(source).getArtist(id);
  },

  getPlaylist(source: string, id: string) {
    return getProvider(source).getPlaylist(id);
  },

  async getRecommendations(
    source: MusicSource | string,
    seed: RecommendationSeed,
    limit?: number,
  ): Promise<Track[]> {
    const provider = getProvider(source);
    if (provider.getRecommendations) return provider.getRecommendations(seed, limit);
    // Providers without a recommendation endpoint fall back to what's trending.
    return provider.getTrending({ genre: seed.genre, limit });
  },
};

export function isNotFound(error: unknown): boolean {
  return error instanceof ProviderError && error.kind === "not_found";
}

/** Message safe to show users; never leaks upstream URLs or stack traces. */
export function describeProviderError(error: unknown): string {
  if (!(error instanceof ProviderError)) return "Something went wrong loading music.";
  switch (error.kind) {
    case "rate_limited":
      return "The music service is busy right now. Try again in a moment.";
    case "timeout":
    case "unavailable":
      return "The music service is unreachable right now.";
    case "not_found":
      return "That couldn't be found.";
    default:
      return "Something went wrong loading music.";
  }
}
