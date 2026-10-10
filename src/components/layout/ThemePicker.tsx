"use client";

import { Check, Palette } from "lucide-react";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuTrigger } from "@/components/ui/Menu";
import { cn } from "@/lib/cn";
import { useTheme } from "@/hooks/useTheme";
import { THEMES } from "@/lib/themes";

export function ThemePicker({ compact }: { compact?: boolean }) {
  const [theme, setTheme] = useTheme();
  const active = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <Menu modal={false}>
      <MenuTrigger
        aria-label={`Theme: ${active.name}`}
        title="Change theme"
        className={cn(
          "text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
          compact && "justify-center",
        )}
      >
        <Palette className="size-4 shrink-0" />
        {!compact && (
          <>
            <span className="label-mono text-inherit">Theme</span>
            <span className="ml-auto flex items-center gap-2 text-xs">
              {active.name}
              <Swatch colors={active.swatch} />
            </span>
          </>
        )}
      </MenuTrigger>
      <MenuContent side="top" align="start" className="min-w-56">
        <MenuLabel>Theme</MenuLabel>
        {THEMES.map((t) => (
          <MenuItem key={t.id} onSelect={() => setTheme(t.id)}>
            <Swatch colors={t.swatch} />
            <span>{t.name}</span>
            {t.id === theme && <Check className="text-primary! ml-auto" />}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}

function Swatch({ colors: [bg, fg] }: { colors: readonly [string, string] }) {
  return (
    <span
      aria-hidden
      className="border-border relative inline-block size-4 shrink-0 overflow-hidden rounded-full border"
      style={{ background: bg }}
    >
      <span className="absolute inset-y-0 right-0 w-1/2" style={{ background: fg }} />
    </span>
  );
}
