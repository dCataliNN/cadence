/** Browsable genres; names match Audius genre values exactly since they are passed through as filters. */
export const GENRES: Array<{ name: string; color: string }> = [
  { name: "Electronic", color: "#3b5bdb" },
  { name: "Hip-Hop/Rap", color: "#c2410c" },
  { name: "Lo-Fi", color: "#7c6f9b" },
  { name: "House", color: "#0e7490" },
  { name: "Alternative", color: "#4d7c0f" },
  { name: "R&B/Soul", color: "#9d174d" },
  { name: "Pop", color: "#db2777" },
  { name: "Techno", color: "#334155" },
  { name: "Ambient", color: "#0f766e" },
  { name: "Dubstep", color: "#6d28d9" },
  { name: "Drum & Bass", color: "#b45309" },
  { name: "Trap", color: "#991b1b" },
  { name: "Rock", color: "#57534e" },
  { name: "Jazz", color: "#a16207" },
  { name: "Experimental", color: "#4338ca" },
  { name: "Latin", color: "#be123c" },
  { name: "Acoustic", color: "#78716c" },
  { name: "Soundtrack", color: "#1e40af" },
];

export function isKnownGenre(value: string): boolean {
  return GENRES.some((g) => g.name === value);
}
