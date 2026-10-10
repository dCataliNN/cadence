/**
 * Normalized, provider-agnostic domain models.
 *
 * UI code, stores and persistence only ever see these shapes. Each provider
 * maps its own response objects into them (see `src/providers/<name>/*.mapper.ts`).
 */

export type MusicSource = "audius";

/**
 * Artwork in the sizes providers usually offer. `mirrors` are alternative
 * origins serving the same paths: decentralised hosts (Audius content nodes)
 * go down often enough that a single URL is not reliable.
 */
export interface ImageSet {
  small?: string;
  medium?: string;
  large?: string;
  mirrors?: string[];
}

export interface ArtistRef {
  id: string;
  name: string;
  handle?: string;
  image?: ImageSet;
}

export interface Track {
  /** Globally unique key: `${source}:${providerId}`. */
  id: string;
  providerId: string;
  source: MusicSource;
  title: string;
  artist: ArtistRef;
  artwork?: ImageSet;
  /** Seconds. */
  duration: number;
  /** Absent when the provider needs a playback adapter other than plain audio. */
  streamUrl?: string;
  /** False for gated/deleted tracks we must not try to play. */
  isPlayable: boolean;
  genre?: string;
  mood?: string;
  playCount?: number;
  /** Tempo, when the provider knows it; drives the visualiser's pulse. */
  bpm?: number;
  /** Link to the track on the provider's own site, for attribution. */
  externalUrl?: string;
}

export interface TrackDetails extends Track {
  description?: string;
  releaseDate?: string;
  tags?: string[];
  likeCount?: number;
  repostCount?: number;
}

export interface Artist {
  id: string;
  providerId: string;
  source: MusicSource;
  name: string;
  handle?: string;
  image?: ImageSet;
  coverImage?: ImageSet;
  bio?: string;
  location?: string;
  followerCount?: number;
  trackCount?: number;
  isVerified?: boolean;
  externalUrl?: string;
}

export interface ArtistDetails extends Artist {
  popularTracks: Track[];
  playlists: Playlist[];
  relatedArtists: Artist[];
}

export interface Playlist {
  id: string;
  providerId: string;
  source: MusicSource;
  title: string;
  isAlbum: boolean;
  owner: ArtistRef;
  artwork?: ImageSet;
  description?: string;
  trackCount: number;
  playCount?: number;
  externalUrl?: string;
}

export interface PlaylistDetails extends Playlist {
  tracks: Track[];
}

export interface SearchResults {
  query: string;
  tracks: Track[];
  artists: Artist[];
  playlists: Playlist[];
  albums: Playlist[];
}

/**
 * A track's slot in the play queue. `uid` is unique per slot so the same track
 * can appear twice and still be reordered/removed independently.
 */
export interface QueueItem {
  uid: string;
  track: Track;
}

export type RepeatMode = "off" | "all" | "one";

export function globalId(source: MusicSource, providerId: string): string {
  return `${source}:${providerId}`;
}

/** Display names for attribution ("Open on Audius"); safe to import client-side. */
export const SOURCE_NAMES: Record<MusicSource, string> = {
  audius: "Audius",
};

/** Strips detail-only fields so persisted snapshots (queue, likes) stay small. */
export function toTrack({
  description,
  releaseDate,
  tags,
  likeCount,
  repostCount,
  ...track
}: TrackDetails): Track {
  void [description, releaseDate, tags, likeCount, repostCount];
  return track;
}
