"use client";

import { useSyncExternalStore } from "react";
import { applyTheme, DEFAULT_THEME, isThemeId, type ThemeId } from "@/lib/themes";

// The <html data-theme> attribute is the source of truth (set before paint by
// the boot script), so components subscribe to it instead of duplicating state.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function getSnapshot(): ThemeId {
  const value = document.documentElement.dataset.theme;
  return isThemeId(value) ? value : DEFAULT_THEME;
}

export function useTheme(): [ThemeId, (id: ThemeId) => void] {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_THEME);
  return [theme, applyTheme];
}
