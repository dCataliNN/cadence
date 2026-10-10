import {
  globalId,
  type Artist,
  type ArtistRef,
  type ImageSet,
  type Playlist,
  type PlaylistDetails,
  type SearchResults,
  type Track,
  type TrackDetails,
} from "@/types/music";
import { buildAudiusUrl } from "./audius.client";
import type {
  AudiusArtwork,
  AudiusCoverPhoto,
  AudiusFullSearch,
  AudiusPlaylist,
  AudiusTrack,
  AudiusUser,
} from "./audius.types";

const AUDIUS_WEB = "https://audius.co";
const SOURCE = "audius" as const;

const orUndefined = <T>(value: T | null | undefined): T | undefined => value ?? undefined;

function cleanText(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function mapArtwork(artwork: AudiusArtwork | null | undefined): ImageSet | undefined {
  if (!artwork) return undefined;
  const small = orUndefined(artwork["150x150"]);
  const medium = orUndefined(artwork["480x480"]);
  const large = orUndefined(artwork["1000x1000"]);
  if (!small && !medium && !large) return undefined;
  return { small, medium, large, mirrors: artwork.mirrors?.length ? artwork.mirrors : undefined };
}

function mapCoverPhoto(photo: AudiusCoverPhoto | null | undefined): ImageSet | undefined {
  if (!photo) return undefined;
  const medium = orUndefined(photo["640x"]);
  const large = orUndefined(photo["2000x"]);
  if (!medium && !large) return undefined;
  return { medium, large, mirrors: photo.mirrors?.length ? photo.mirrors : undefined };
}

export function mapArtistRef(user: AudiusUser): ArtistRef {
  return {
    id: globalId(SOURCE, user.id),
    name: cleanText(user.name) ?? user.handle,
    handle: user.handle,
    image: mapArtwork(user.profile_picture),
  };
}

export function mapArtist(user: AudiusUser): Artist {
  return {
    id: globalId(SOURCE, user.id),
    providerId: user.id,
    source: SOURCE,
    name: cleanText(user.name) ?? user.handle,
    handle: user.handle,
    image: mapArtwork(user.profile_picture),
    coverImage: mapCoverPhoto(user.cover_photo),
    bio: cleanText(user.bio),
    location: cleanText(user.location),
    followerCount: user.follower_count,
    trackCount: user.track_count,
    isVerified: user.is_verified ?? false,
    externalUrl: `${AUDIUS_WEB}/${user.handle}`,
  };
}

/** Uploader-supplied BPM is sometimes 0 or nonsense; only keep musically plausible values. */
function plausibleBpm(bpm: number | null | undefined): number | undefined {
  return bpm && bpm >= 40 && bpm <= 260 ? Math.round(bpm) : undefined;
}

export function isAudiusTrackPlayable(track: AudiusTrack): boolean {
  // Gated tracks (purchase/follow/NFT) need a signed-in Audius wallet we don't
  // have; streaming them would fail or play a preview, so we never try.
  return (
    track.is_streamable !== false &&
    !track.is_stream_gated &&
    !track.is_delete &&
    track.is_available !== false &&
    !track.user?.is_deactivated
  );
}

export function mapTrack(track: AudiusTrack): Track {
  const isPlayable = isAudiusTrackPlayable(track);
  return {
    id: globalId(SOURCE, track.id),
    providerId: track.id,
    source: SOURCE,
    title: cleanText(track.title) ?? "Untitled",
    artist: mapArtistRef(track.user),
    artwork: mapArtwork(track.artwork),
    duration: Math.max(0, Math.round(track.duration ?? 0)),
    streamUrl: isPlayable
      ? buildAudiusUrl(`/tracks/${encodeURIComponent(track.id)}/stream`)
      : undefined,
    isPlayable,
    genre: cleanText(track.genre),
    mood: cleanText(track.mood),
    playCount: track.play_count,
    bpm: plausibleBpm(track.bpm),
    externalUrl: track.permalink ? `${AUDIUS_WEB}${track.permalink}` : undefined,
  };
}

export function mapTrackDetails(track: AudiusTrack): TrackDetails {
  const tags = track.tags
    ?.split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  return {
    ...mapTrack(track),
    description: cleanText(track.description),
    releaseDate: orUndefined(track.release_date),
    tags: tags?.length ? tags : undefined,
    likeCount: track.favorite_count,
    repostCount: track.repost_count,
  };
}

export function mapPlaylist(playlist: AudiusPlaylist): Playlist {
  return {
    id: globalId(SOURCE, playlist.id),
    providerId: playlist.id,
    source: SOURCE,
    title: cleanText(playlist.playlist_name) ?? "Untitled",
    isAlbum: playlist.is_album,
    owner: mapArtistRef(playlist.user),
    artwork: mapArtwork(playlist.artwork),
    description: cleanText(playlist.description),
    trackCount: playlist.track_count ?? playlist.tracks?.length ?? 0,
    playCount: playlist.total_play_count,
    externalUrl: playlist.permalink ? `${AUDIUS_WEB}${playlist.permalink}` : undefined,
  };
}

export function mapPlaylistDetails(
  playlist: AudiusPlaylist,
  tracks: AudiusTrack[],
): PlaylistDetails {
  return { ...mapPlaylist(playlist), tracks: mapTracks(tracks) };
}

/** Drops deleted tracks; they carry no usable metadata and can never play. */
export function mapTracks(tracks: AudiusTrack[] | null | undefined): Track[] {
  return (tracks ?? []).filter((t) => t && !t.is_delete && t.user).map(mapTrack);
}

export function isPublicPlaylist(playlist: AudiusPlaylist): boolean {
  return !playlist.is_private && !playlist.is_delete;
}

export function mapSearchResults(query: string, data: AudiusFullSearch): SearchResults {
  return {
    query,
    tracks: mapTracks(data.tracks),
    artists: (data.users ?? []).filter((u) => !u.is_deactivated).map(mapArtist),
    playlists: (data.playlists ?? []).filter(isPublicPlaylist).map(mapPlaylist),
    albums: (data.albums ?? []).filter(isPublicPlaylist).map(mapPlaylist),
  };
}
