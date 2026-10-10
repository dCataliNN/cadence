"use client";

import { Heart, History, Home, Library, ListMusic, Plus, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType } from "react";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { useLibraryStore } from "@/stores/library.store";
import { ThemePicker } from "./ThemePicker";

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const PRIMARY: NavItem[] = [
  { href: routes.home, label: "Home", icon: Home },
  { href: routes.search(), label: "Search", icon: Search },
  { href: routes.library, label: "Library", icon: Library },
];

const COLLECTION: NavItem[] = [
  { href: routes.liked, label: "Liked Songs", icon: Heart },
  { href: routes.history, label: "Recently Played", icon: History },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Three rising bars: a signal meter, echoing the app's beat-driven visuals. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-6 shrink-0", className)} aria-hidden>
      <rect x="3" y="13" width="4" height="8" rx="1" fill="var(--primary)" opacity="0.55" />
      <rect x="10" y="8" width="4" height="13" rx="1" fill="var(--primary)" opacity="0.8" />
      <rect x="17" y="3" width="4" height="18" rx="1" fill="var(--primary)" />
    </svg>
  );
}

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-3" aria-label="Cadence home">
      <LogoMark />
      {!compact && (
        <>
          <span className="text-[1.0625rem] font-semibold tracking-[-0.03em]">cadence</span>
          <span className="border-border text-subtle rounded-sm border px-1.5 py-0.5 font-mono text-[9px] tracking-wider uppercase">
            beta
          </span>
        </>
      )}
    </Link>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="label-mono text-subtle px-3 pt-5 pb-2 md:sr-only lg:not-sr-only">
      <span aria-hidden className="text-primary/70">
        {"// "}
      </span>
      {children}
    </p>
  );
}

function SidebarLink({
  item,
  index,
  pathname,
}: {
  item: NavItem;
  index: number;
  pathname: string;
}) {
  const active = isActive(pathname, item.href.split("?")[0]);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      title={item.label}
      className={cn(
        "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors md:justify-center lg:justify-start",
        active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {/* Active marker: a short signal-coloured bar instead of a filled pill. */}
      <span
        aria-hidden
        className={cn(
          "bg-primary absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full transition-opacity",
          active ? "opacity-100" : "opacity-0",
        )}
      />
      <Icon className="size-[18px] shrink-0 lg:hidden" />
      <span
        aria-hidden
        className={cn(
          "hidden w-5 font-mono text-[10px] tabular-nums lg:inline",
          active ? "text-primary" : "text-subtle group-hover:text-muted-foreground",
        )}
      >
        {String(index).padStart(2, "0")}
      </span>
      <span className="font-medium md:sr-only lg:not-sr-only">{item.label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const playlists = useLibraryStore((s) => s.playlists);

  const createPlaylist = () => {
    const playlist = useLibraryStore.getState().createPlaylist();
    router.push(routes.userPlaylist(playlist.id));
  };

  return (
    <aside className="border-border bg-background fixed top-0 bottom-(--player-height) left-0 z-30 hidden w-20 flex-col border-r px-2 md:flex lg:w-(--sidebar-width)">
      <div className="flex h-16 items-center md:justify-center lg:justify-start">
        <span className="hidden lg:block">
          <Logo />
        </span>
        <span className="lg:hidden">
          <Logo compact />
        </span>
      </div>

      <SectionLabel>Browse</SectionLabel>
      <nav aria-label="Main" className="flex flex-col gap-0.5">
        {PRIMARY.map((item, i) => (
          <SidebarLink key={item.href} item={item} index={i + 1} pathname={pathname} />
        ))}
      </nav>

      <SectionLabel>Collection</SectionLabel>
      <nav aria-label="Your collection" className="flex flex-col gap-0.5">
        {COLLECTION.map((item, i) => (
          <SidebarLink
            key={item.href}
            item={item}
            index={PRIMARY.length + i + 1}
            pathname={pathname}
          />
        ))}
      </nav>

      <div className="flex items-center justify-between pr-1 md:mt-4 md:justify-center lg:mt-0 lg:justify-between">
        <SectionLabel>Playlists</SectionLabel>
        <button
          type="button"
          onClick={createPlaylist}
          aria-label="Create playlist"
          title="Create playlist"
          className="text-muted-foreground hover:border-border hover:text-primary rounded-md border border-transparent p-1 transition-colors lg:mt-3"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <nav
        aria-label="Your playlists"
        className="-mx-1 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-1"
      >
        {playlists.length === 0 && (
          <p className="text-subtle hidden px-3 py-1 text-xs lg:block">
            No playlists yet. Use + to start one.
          </p>
        )}
        {playlists.map((p) => {
          const href = routes.userPlaylist(p.id);
          const active = pathname === href;
          return (
            <Link
              key={p.id}
              href={href}
              title={p.name}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm md:justify-center lg:justify-start",
                active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ListMusic className="size-4 shrink-0 lg:hidden" />
              <span className="truncate md:sr-only lg:not-sr-only">{p.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-border -mx-2 mt-2 border-t px-2 py-2">
        <span className="hidden lg:block">
          <ThemePicker />
        </span>
        <span className="flex justify-center lg:hidden">
          <ThemePicker compact />
        </span>
        <a
          href="https://audius.co"
          target="_blank"
          rel="noopener noreferrer"
          className="label-mono text-subtle hover:text-muted-foreground mt-1 hidden items-center gap-2 px-3 py-2 normal-case lg:flex"
        >
          <span className="relative flex size-1.5">
            <span className="bg-primary absolute inset-0 animate-ping rounded-full opacity-60" />
            <span className="bg-primary relative size-1.5 rounded-full" />
          </span>
          Streaming from Audius
        </a>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="border-border bg-background/90 fixed inset-x-0 bottom-0 z-40 flex h-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom))] items-start justify-around border-t pt-2.5 backdrop-blur-md md:hidden"
    >
      {PRIMARY.map((item) => {
        const active = isActive(pathname, item.href.split("?")[0]);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-w-16 flex-col items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase",
              active ? "text-foreground" : "text-subtle",
            )}
          >
            <Icon className={cn("size-[22px]", active && "text-primary")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
