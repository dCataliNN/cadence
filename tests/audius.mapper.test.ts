import { describe, expect, it } from "vitest";
import {
  isAudiusTrackPlayable,
  mapArtist,
  mapArtwork,
  mapPlaylistDetails,
  mapSearchResults,
  mapTrack,
  mapTrackDetails,
  mapTracks,
} from "@/providers/audius/audius.mapper";
import type { AudiusPlaylist, AudiusTrack, AudiusUser } from "@/providers/audius/audius.types";
import trending from "./fixtures/audius/trending.json";
import playlistFixture from "./fixtures/audius/playlist.json";
import userFixture from "./fixtures/audius/user.json";

// Fixtures are real API responses captured from https://api.audius.co/v1.
const track = trending.data[0] as unknown as AudiusTrack;
const playlist = playlistFixture.data[0] as unknown as AudiusPlaylist;
const user = userFixture.data as unknown as AudiusUser;

describe("mapTrack", () => {
  it("normalizes a real trending track", () => {
    const mapped = mapTrack(track);
    expect(mapped).toMatchObject({
      id: "audius:xkQaGx",
      providerId: "xkQaGx",
      source: "audius",
      title: "iLLPeTiLL - Wonky/Deep/Body Buzz Bass Mix/Mashup",
      duration: 417,
      genre: "Dubstep",
      bpm: 138,
      isPlayable: true,
      externalUrl: "https://audius.co/iLLPeTiLL/illpetill-wonkydeepbody-buzz-bass-mixmashup",
      artist: { id: expect.stringMatching(/^audius:/), handle: "iLLPeTiLL" },
    });
    expect(mapped.artwork?.medium).toMatch(/480x480\.jpg$/);
    expect(mapped.artwork?.mirrors?.length).toBeGreaterThan(0);
  });

  it("points streamUrl at the official stream endpoint with an app name", () => {
    const url = new URL(mapTrack(track).streamUrl!);
    expect(url.pathname).toBe("/v1/tracks/xkQaGx/stream");
    expect(url.searchParams.get("app_name")).toBeTruthy();
  });

  it("marks gated, deleted and deactivated-artist tracks unplayable and omits their stream", () => {
    const gated = mapTrack({ ...track, is_stream_gated: true });
    expect(gated.isPlayable).toBe(false);
    expect(gated.streamUrl).toBeUndefined();
    expect(isAudiusTrackPlayable({ ...track, is_delete: true })).toBe(false);
    expect(isAudiusTrackPlayable({ ...track, is_streamable: false })).toBe(false);
    expect(isAudiusTrackPlayable({ ...track, user: { ...track.user, is_deactivated: true } })).toBe(
      false,
    );
  });

  it("falls back safely when optional fields are missing", () => {
    const sparse = mapTrack({
      ...track,
      title: "   ",
      artwork: null,
      genre: "",
      permalink: null,
      user: { ...track.user, name: "", profile_picture: null },
    });
    expect(sparse.title).toBe("Untitled");
    expect(sparse.artwork).toBeUndefined();
    expect(sparse.genre).toBeUndefined();
    expect(sparse.externalUrl).toBeUndefined();
    expect(mapTrack({ ...track, bpm: 0 }).bpm).toBeUndefined();
    expect(mapTrack({ ...track, bpm: 999 }).bpm).toBeUndefined();
    expect(sparse.artist.name).toBe(track.user.handle);
  });
});

describe("mapTrackDetails", () => {
  it("splits comma-separated tags", () => {
    const details = mapTrackDetails({ ...track, tags: "house, deep ,,techno" });
    expect(details.tags).toEqual(["house", "deep", "techno"]);
  });
});

describe("mapArtwork", () => {
  it("returns undefined when no sizes exist", () => {
    expect(mapArtwork({ "150x150": null, mirrors: [] })).toBeUndefined();
    expect(mapArtwork(undefined)).toBeUndefined();
  });
});

describe("mapArtist", () => {
  it("normalizes a real user", () => {
    expect(mapArtist(user)).toMatchObject({
      id: "audius:LKdlD",
      name: "deadmau5",
      handle: "deadmau5",
      isVerified: true,
      externalUrl: "https://audius.co/deadmau5",
    });
    expect(mapArtist(user).coverImage?.large).toMatch(/2000x\.jpg$/);
  });
});

describe("mapTracks / mapPlaylistDetails", () => {
  it("drops deleted tracks", () => {
    expect(mapTracks([track, { ...track, id: "gone", is_delete: true }])).toHaveLength(1);
    expect(mapTracks(null)).toEqual([]);
  });

  it("normalizes a real playlist with its tracks", () => {
    const details = mapPlaylistDetails(playlist, playlist.tracks ?? []);
    expect(details).toMatchObject({
      id: "audius:Dv9QV",
      title: "MONKEYS CHILL",
      isAlbum: false,
      owner: { handle: "solanaMBS" },
      trackCount: 10,
    });
    expect(details.tracks.length).toBeGreaterThan(0);
  });
});

describe("mapSearchResults", () => {
  it("filters private playlists and deactivated users", () => {
    const results = mapSearchResults("q", {
      tracks: [track],
      users: [user, { ...user, id: "x", is_deactivated: true }],
      playlists: [playlist, { ...playlist, id: "p", is_private: true }],
    });
    expect(results.tracks).toHaveLength(1);
    expect(results.artists).toHaveLength(1);
    expect(results.playlists).toHaveLength(1);
    expect(results.albums).toEqual([]);
  });
});
