/**
 * Theme registry. Each id matches a `[data-theme]` block in globals.css that
 * defines the shadcn/tweakcn variable set, so adding a theme from tweakcn.com
 * means pasting its variables into a new block and listing it here.
 */
export const THEMES = [
  { id: "signal", name: "Signal", swatch: ["oklch(0.145 0.004 170)", "oklch(0.83 0.19 162)"] },
  {
    id: "ultraviolet",
    name: "Ultraviolet",
    swatch: ["oklch(0.16 0.03 285)", "oklch(0.74 0.17 300)"],
  },
  { id: "ember", name: "Ember", swatch: ["oklch(0.16 0.006 50)", "oklch(0.71 0.19 42)"] },
  { id: "paper", name: "Paper", swatch: ["oklch(0.975 0.006 95)", "oklch(0.58 0.15 158)"] },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "signal";
export const THEME_STORAGE_KEY = "cadence-theme";

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}

/**
 * Inline <head> script: applies the saved theme before first paint so there's
 * no flash of the default theme. Kept tiny and dependency-free on purpose.
 */
export const themeBootScript = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(${JSON.stringify(
  THEMES.map((t) => t.id),
)}.indexOf(t)>-1)document.documentElement.dataset.theme=t}catch(e){}`;

export function applyTheme(id: ThemeId): void {
  document.documentElement.dataset.theme = id;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    // Storage blocked (private mode): the theme still applies for this session.
  }
}
