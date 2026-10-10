/** Builds app URLs from normalized global IDs (`source:providerId`). */

export function splitGlobalId(id: string): { source: string; providerId: string } {
  const at = id.indexOf(":");
  return at === -1
    ? { source: "", providerId: id }
    : { source: id.slice(0, at), providerId: id.slice(at + 1) };
}

const path = (kind: string, id: string) => {
  const { source, providerId } = splitGlobalId(id);
  return `/${kind}/${encodeURIComponent(source)}/${encodeURIComponent(providerId)}`;
};

export const routes = {
  home: "/",
  search: (query?: string) => (query ? `/search?q=${encodeURIComponent(query)}` : "/search"),
  library: "/library",
  liked: "/liked",
  history: "/history",
  track: (id: string) => path("track", id),
  artist: (id: string) => path("artist", id),
  playlist: (id: string) => path("playlist", id),
  userPlaylist: (id: string) => `/library/playlists/${encodeURIComponent(id)}`,
  genre: (genre: string) => `/genre/${encodeURIComponent(genre)}`,
};
