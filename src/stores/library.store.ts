import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createUid } from "@/lib/queue";
import type { Artist, ArtistRef, Playlist, Track } from "@/types/music";

/**
 * Guest library, persisted to localStorage. Entries store a metadata snapshot
 * plus the provider reference, never audio; the provider stays the source of
 * the playable content. Shapes mirror the planned server schema so signed-in
 * sync can later reuse them.
 */
export interface LikedTrack {
  track: Track;
  likedAt: number;
}

export interface FollowedArtist {
  artist: ArtistRef & { source: Artist["source"]; providerId: string };
  followedAt: number;
}

export interface SavedPlaylist {
  playlist: Playlist;
  savedAt: number;
}

export interface UserPlaylistTrack {
  uid: string;
  track: Track;
  addedAt: number;
}

export interface UserPlaylist {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  tracks: UserPlaylistTrack[];
}

export const PLAYLIST_NAME_MAX = 100;

interface LibraryState {
  likedTracks: LikedTrack[];
  followedArtists: FollowedArtist[];
  savedPlaylists: SavedPlaylist[];
  playlists: UserPlaylist[];

  toggleLike(track: Track): boolean;
  toggleFollow(artist: Artist): boolean;
  toggleSavePlaylist(playlist: Playlist): boolean;

  createPlaylist(name?: string, tracks?: Track[]): UserPlaylist;
  renamePlaylist(id: string, name: string, description?: string): void;
  deletePlaylist(id: string): void;
  addToPlaylist(id: string, tracks: Track[]): number;
  removeFromPlaylist(id: string, uid: string): void;
  movePlaylistTrack(id: string, from: number, to: number): void;
}

function normalizeName(name: string, fallback: string): string {
  return name.trim().slice(0, PLAYLIST_NAME_MAX) || fallback;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => {
      const updatePlaylist = (id: string, fn: (p: UserPlaylist) => UserPlaylist) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === id ? { ...fn(p), updatedAt: Date.now() } : p,
          ),
        }));

      return {
        likedTracks: [],
        followedArtists: [],
        savedPlaylists: [],
        playlists: [],

        toggleLike(track) {
          const liked = get().likedTracks.some((l) => l.track.id === track.id);
          set((s) => ({
            likedTracks: liked
              ? s.likedTracks.filter((l) => l.track.id !== track.id)
              : [{ track, likedAt: Date.now() }, ...s.likedTracks],
          }));
          return !liked;
        },

        toggleFollow(artist) {
          const following = get().followedArtists.some((f) => f.artist.id === artist.id);
          const snapshot = {
            id: artist.id,
            providerId: artist.providerId,
            source: artist.source,
            name: artist.name,
            handle: artist.handle,
            image: artist.image,
          };
          set((s) => ({
            followedArtists: following
              ? s.followedArtists.filter((f) => f.artist.id !== artist.id)
              : [{ artist: snapshot, followedAt: Date.now() }, ...s.followedArtists],
          }));
          return !following;
        },

        toggleSavePlaylist(playlist) {
          const saved = get().savedPlaylists.some((p) => p.playlist.id === playlist.id);
          set((s) => ({
            savedPlaylists: saved
              ? s.savedPlaylists.filter((p) => p.playlist.id !== playlist.id)
              : [{ playlist, savedAt: Date.now() }, ...s.savedPlaylists],
          }));
          return !saved;
        },

        createPlaylist(name = "", tracks = []) {
          const now = Date.now();
          const playlist: UserPlaylist = {
            id: createUid(),
            name: normalizeName(name, `My Playlist #${get().playlists.length + 1}`),
            createdAt: now,
            updatedAt: now,
            tracks: tracks.map((track) => ({ uid: createUid(), track, addedAt: now })),
          };
          set((s) => ({ playlists: [playlist, ...s.playlists] }));
          return playlist;
        },

        renamePlaylist(id, name, description) {
          updatePlaylist(id, (p) => ({
            ...p,
            name: normalizeName(name, p.name),
            description:
              description === undefined ? p.description : description.trim() || undefined,
          }));
        },

        deletePlaylist(id) {
          set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) }));
        },

        addToPlaylist(id, tracks) {
          const playlist = get().playlists.find((p) => p.id === id);
          if (!playlist) return 0;
          // Skip tracks already in the playlist; accidental double-adds are far
          // more common than wanting a deliberate duplicate.
          const existing = new Set(playlist.tracks.map((t) => t.track.id));
          const fresh = tracks.filter((t) => !existing.has(t.id));
          if (fresh.length === 0) return 0;
          const now = Date.now();
          updatePlaylist(id, (p) => ({
            ...p,
            tracks: [
              ...p.tracks,
              ...fresh.map((track) => ({ uid: createUid(), track, addedAt: now })),
            ],
          }));
          return fresh.length;
        },

        removeFromPlaylist(id, uid) {
          updatePlaylist(id, (p) => ({ ...p, tracks: p.tracks.filter((t) => t.uid !== uid) }));
        },

        movePlaylistTrack(id, from, to) {
          updatePlaylist(id, (p) => {
            if (
              from === to ||
              from < 0 ||
              to < 0 ||
              from >= p.tracks.length ||
              to >= p.tracks.length
            )
              return p;
            const tracks = [...p.tracks];
            const [moved] = tracks.splice(from, 1);
            tracks.splice(to, 0, moved);
            return { ...p, tracks };
          });
        },
      };
    },
    {
      name: "cadence-library",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
