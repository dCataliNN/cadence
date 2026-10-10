/**
 * Subset of the Audius REST API (https://api.audius.co/v1/swagger.yaml) that
 * we read. Fields are optional/nullable where the API has been observed to
 * omit them, so the mapper is forced to handle gaps.
 */

export interface AudiusResponse<T> {
  data: T;
}

export interface AudiusArtwork {
  "150x150"?: string | null;
  "480x480"?: string | null;
  "1000x1000"?: string | null;
  mirrors?: string[] | null;
}

export interface AudiusCoverPhoto {
  "640x"?: string | null;
  "2000x"?: string | null;
  mirrors?: string[] | null;
}

export interface AudiusUser {
  id: string;
  name: string;
  handle: string;
  bio?: string | null;
  location?: string | null;
  is_verified?: boolean;
  is_deactivated?: boolean;
  follower_count?: number;
  track_count?: number;
  profile_picture?: AudiusArtwork | null;
  cover_photo?: AudiusCoverPhoto | null;
}

export interface AudiusTrack {
  id: string;
  title: string;
  duration: number;
  user: AudiusUser;
  artwork?: AudiusArtwork | null;
  genre?: string | null;
  mood?: string | null;
  tags?: string | null;
  description?: string | null;
  release_date?: string | null;
  play_count?: number;
  bpm?: number | null;
  favorite_count?: number;
  repost_count?: number;
  permalink?: string | null;
  is_streamable?: boolean;
  is_stream_gated?: boolean;
  is_delete?: boolean;
  is_unlisted?: boolean;
  is_available?: boolean;
}

export interface AudiusPlaylist {
  id: string;
  playlist_name: string;
  is_album: boolean;
  description?: string | null;
  user: AudiusUser;
  artwork?: AudiusArtwork | null;
  track_count?: number;
  total_play_count?: number;
  permalink?: string | null;
  is_private?: boolean;
  is_delete?: boolean;
  is_stream_gated?: boolean;
  tracks?: AudiusTrack[];
}

export interface AudiusFullSearch {
  tracks?: AudiusTrack[];
  users?: AudiusUser[];
  playlists?: AudiusPlaylist[];
  albums?: AudiusPlaylist[];
}
