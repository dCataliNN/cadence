import type {
  ArtistDetails,
  MusicSource,
  Playlist,
  PlaylistDetails,
  SearchResults,
  Track,
  TrackDetails,
} from "@/types/music";

export interface ProviderCapabilities {
  search: boolean;
  /** Tracks expose a URL a plain <audio> element can play. */
  directAudio: boolean;
  playlists: boolean;
  recommendations: boolean;
  artistProfiles: boolean;
  genres: boolean;
}

export interface ProviderInfo {
  source: MusicSource;
  name: string;
  homepage: string;
  capabilities: ProviderCapabilities;
}

export interface RecommendationSeed {
  genre?: string;
  excludeProviderIds?: string[];
}

/**
 * Contract every music source implements. Methods take provider-native IDs
 * (`Track.providerId`), never the global `Track.id`.
 */
export interface MusicProvider {
  readonly info: ProviderInfo;

  search(query: string, limit?: number): Promise<SearchResults>;
  getTrending(options?: {
    genre?: string;
    underground?: boolean;
    limit?: number;
  }): Promise<Track[]>;
  getTrendingPlaylists(limit?: number): Promise<Playlist[]>;
  getTrack(id: string): Promise<TrackDetails>;
  getStreamUrl(id: string): string;
  getArtist(id: string): Promise<ArtistDetails>;
  getPlaylist(id: string): Promise<PlaylistDetails>;
  getRecommendations?(seed: RecommendationSeed, limit?: number): Promise<Track[]>;
}

export type ProviderErrorKind =
  "not_found" | "rate_limited" | "timeout" | "unavailable" | "invalid";

export class ProviderError extends Error {
  constructor(
    readonly kind: ProviderErrorKind,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
