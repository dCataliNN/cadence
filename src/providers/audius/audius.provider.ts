import type { MusicProvider, ProviderInfo, RecommendationSeed } from "@/providers/types";
import { ProviderError } from "@/providers/types";
import type {
  ArtistDetails,
  Playlist,
  PlaylistDetails,
  SearchResults,
  Track,
  TrackDetails,
} from "@/types/music";
import { audiusGet, buildAudiusUrl } from "./audius.client";
import {
  isPublicPlaylist,
  mapArtist,
  mapPlaylist,
  mapPlaylistDetails,
  mapSearchResults,
  mapTrackDetails,
  mapTracks,
} from "./audius.mapper";
import type { AudiusFullSearch, AudiusPlaylist, AudiusTrack, AudiusUser } from "./audius.types";

// Audius IDs are short base62-ish hashes. Rejecting anything else up front
// stops arbitrary user input from being spliced into upstream URL paths.
const AUDIUS_ID = /^[A-Za-z0-9]{1,32}$/;

function assertId(id: string): string {
  if (!AUDIUS_ID.test(id)) throw new ProviderError("not_found", "Invalid Audius ID");
  return id;
}

async function settled<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

export class AudiusProvider implements MusicProvider {
  readonly info: ProviderInfo = {
    source: "audius",
    name: "Audius",
    homepage: "https://audius.co",
    capabilities: {
      search: true,
      directAudio: true,
      playlists: true,
      recommendations: true,
      artistProfiles: true,
      genres: true,
    },
  };

  async search(query: string, limit = 10): Promise<SearchResults> {
    const data = await audiusGet<AudiusFullSearch>("/search/full", {
      params: { query, limit },
      revalidate: 120,
    });
    return mapSearchResults(query, data);
  }

  async getTrending(
    options: { genre?: string; underground?: boolean; limit?: number } = {},
  ): Promise<Track[]> {
    const path = options.underground ? "/tracks/trending/underground" : "/tracks/trending";
    const tracks = await audiusGet<AudiusTrack[]>(path, {
      params: { genre: options.genre, limit: options.limit ?? 20, time: "week" },
    });
    return mapTracks(tracks);
  }

  async getTrendingPlaylists(limit = 12): Promise<Playlist[]> {
    const playlists = await audiusGet<AudiusPlaylist[]>("/playlists/trending", {
      params: { limit, time: "week" },
    });
    return playlists.filter(isPublicPlaylist).map(mapPlaylist);
  }

  async getTrack(id: string): Promise<TrackDetails> {
    const track = await audiusGet<AudiusTrack>(`/tracks/${assertId(id)}`);
    if (!track || track.is_delete) throw new ProviderError("not_found", "Track was deleted");
    return mapTrackDetails(track);
  }

  getStreamUrl(id: string): string {
    return buildAudiusUrl(`/tracks/${assertId(id)}/stream`);
  }

  async getArtist(id: string): Promise<ArtistDetails> {
    assertId(id);
    const user = await audiusGet<AudiusUser>(`/users/${id}`);
    if (!user || user.is_deactivated) throw new ProviderError("not_found", "Artist is unavailable");

    // Secondary sections are best-effort: a slow "related artists" call must
    // not take the whole artist page down with it.
    const [tracks, playlists, albums, related] = await Promise.all([
      settled(
        audiusGet<AudiusTrack[]>(`/users/${id}/tracks`, { params: { limit: 50, sort: "plays" } }),
        [],
      ),
      settled(audiusGet<AudiusPlaylist[]>(`/users/${id}/playlists`, { params: { limit: 12 } }), []),
      settled(audiusGet<AudiusPlaylist[]>(`/users/${id}/albums`, { params: { limit: 12 } }), []),
      settled(audiusGet<AudiusUser[]>(`/users/${id}/related`, { params: { limit: 12 } }), []),
    ]);

    // The API's sort parameter is not reliably honoured, so rank locally.
    const popularTracks = mapTracks(tracks)
      .sort((a, b) => (b.playCount ?? 0) - (a.playCount ?? 0))
      .slice(0, 20);

    return {
      ...mapArtist(user),
      popularTracks,
      playlists: [...albums, ...playlists].filter(isPublicPlaylist).map(mapPlaylist),
      relatedArtists: related.filter((u) => !u.is_deactivated).map(mapArtist),
    };
  }

  async getPlaylist(id: string): Promise<PlaylistDetails> {
    assertId(id);
    // The playlist endpoint embeds only a handful of tracks; fetch the full list separately.
    const [playlists, tracks] = await Promise.all([
      audiusGet<AudiusPlaylist[]>(`/playlists/${id}`),
      audiusGet<AudiusTrack[]>(`/playlists/${id}/tracks`),
    ]);
    const playlist = playlists?.[0];
    if (!playlist || !isPublicPlaylist(playlist)) {
      throw new ProviderError("not_found", "Playlist is unavailable");
    }
    return mapPlaylistDetails(playlist, tracks);
  }

  async getRecommendations(seed: RecommendationSeed, limit = 20): Promise<Track[]> {
    const tracks = await audiusGet<AudiusTrack[]>("/tracks/recommended", {
      params: {
        genre: seed.genre,
        limit,
        time: "month",
        exclusion_list: seed.excludeProviderIds?.filter((id) => AUDIUS_ID.test(id)).slice(0, 50),
      },
      revalidate: 600,
    });
    return mapTracks(tracks);
  }
}
