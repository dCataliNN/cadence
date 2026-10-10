import { beforeEach, describe, expect, it } from "vitest";
import { useLibraryStore } from "@/stores/library.store";
import type { Track } from "@/types/music";

const track = (n: number): Track => ({
  id: `audius:t${n}`,
  providerId: `t${n}`,
  source: "audius",
  title: `Track ${n}`,
  artist: { id: "audius:a", name: "Artist" },
  duration: 100,
  isPlayable: true,
});

const store = () => useLibraryStore.getState();

beforeEach(() => {
  useLibraryStore.setState({
    likedTracks: [],
    followedArtists: [],
    savedPlaylists: [],
    playlists: [],
  });
});

describe("likes", () => {
  it("toggles and keeps newest first", () => {
    expect(store().toggleLike(track(1))).toBe(true);
    store().toggleLike(track(2));
    expect(store().likedTracks.map((l) => l.track.id)).toEqual(["audius:t2", "audius:t1"]);
    expect(store().toggleLike(track(1))).toBe(false);
    expect(store().likedTracks).toHaveLength(1);
  });
});

describe("playlists", () => {
  it("creates with a default numbered name and initial tracks", () => {
    const p = store().createPlaylist("", [track(1)]);
    expect(p.name).toBe("My Playlist #1");
    expect(store().createPlaylist("  Road trip  ").name).toBe("Road trip");
    expect(store().playlists[1].tracks).toHaveLength(1);
  });

  it("adds tracks while skipping ones already present", () => {
    const { id } = store().createPlaylist("P", [track(1)]);
    expect(store().addToPlaylist(id, [track(1), track(2)])).toBe(1);
    expect(store().addToPlaylist(id, [track(2)])).toBe(0);
    expect(store().addToPlaylist("missing", [track(3)])).toBe(0);
    expect(store().playlists[0].tracks.map((t) => t.track.id)).toEqual(["audius:t1", "audius:t2"]);
  });

  it("renames, keeps the old name when given blank, and clears descriptions", () => {
    const { id } = store().createPlaylist("Old");
    store().renamePlaylist(id, "New", "desc");
    expect(store().playlists[0]).toMatchObject({ name: "New", description: "desc" });
    store().renamePlaylist(id, "   ", "");
    expect(store().playlists[0].name).toBe("New");
    expect(store().playlists[0].description).toBeUndefined();
  });

  it("reorders, removes and deletes", () => {
    const { id } = store().createPlaylist("P", [track(1), track(2), track(3)]);
    store().movePlaylistTrack(id, 0, 2);
    const titles = () => store().playlists[0].tracks.map((t) => t.track.providerId);
    expect(titles()).toEqual(["t2", "t3", "t1"]);
    store().movePlaylistTrack(id, 0, 9); // out of range: ignored
    expect(titles()).toEqual(["t2", "t3", "t1"]);
    store().removeFromPlaylist(id, store().playlists[0].tracks[1].uid);
    expect(titles()).toEqual(["t2", "t1"]);
    store().deletePlaylist(id);
    expect(store().playlists).toEqual([]);
  });
});
