"use client";
import { SectionHeading } from "@/components/ui/Shelf";

import { History, Library, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ArtistCard } from "@/components/artists/ArtistCard";
import { PlaylistCard } from "@/components/playlists/PlaylistCard";
import { LikedSongsCover, PlaylistMosaic } from "@/components/playlists/PlaylistMosaic";
import { ThemePicker } from "@/components/layout/ThemePicker";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { cn } from "@/lib/cn";
import { pluralize } from "@/lib/format";
import { routes } from "@/lib/routes";
import { useHydrated } from "@/stores/hydration";
import { useLibraryStore } from "@/stores/library.store";

type Filter = "all" | "playlists" | "artists";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "playlists", label: "Playlists" },
  { id: "artists", label: "Artists" },
];

function Tile({
  href,
  cover,
  title,
  subtitle,
}: {
  href: string;
  cover: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link href={href} className="group hover:bg-muted rounded-lg p-2 transition-colors">
      <div className="aspect-square w-full shadow-lg shadow-black/30">{cover}</div>
      <p className="mt-3 truncate text-sm font-semibold">{title}</p>
      <p className="text-muted-foreground truncate text-sm">{subtitle}</p>
    </Link>
  );
}

const grid = "grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6";

export default function LibraryPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const { likedTracks, playlists, savedPlaylists, followedArtists } = useLibraryStore();

  const showPlaylists = filter !== "artists";
  const showArtists = filter !== "playlists";
  const isEmpty = playlists.length + savedPlaylists.length + followedArtists.length === 0;

  return (
    <div>
      <PageHeader
        eyebrow="Collection"
        title="Your Library"
        description="Kept on this device. No account needed."
        action={
          <div className="flex items-center gap-2">
            {/* The sidebar (and its theme picker) is hidden on phones. */}
            <span className="md:hidden">
              <ThemePicker compact />
            </span>
            <Button
              variant="primary"
              onClick={() => {
                const playlist = useLibraryStore.getState().createPlaylist();
                router.push(routes.userPlaylist(playlist.id));
              }}
            >
              <Plus /> New playlist
            </Button>
          </div>
        }
      />

      <div
        className="border-border mb-6 inline-flex gap-0.5 rounded-md border p-0.5"
        role="group"
        aria-label="Filter library"
      >
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "label-mono flex items-center gap-1.5 rounded-sm px-3 py-2 transition-colors",
              filter === f.id ? "bg-muted text-foreground" : "text-subtle hover:text-foreground",
            )}
          >
            {filter === f.id && <span className="bg-primary size-1 rounded-full" />}
            {f.label}
          </button>
        ))}
      </div>

      {!hydrated ? (
        <div className={grid}>
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : (
        <>
          {showPlaylists && (
            <div className={cn(grid, "mb-10")}>
              <Tile
                href={routes.liked}
                cover={<LikedSongsCover className="size-full" />}
                title="Liked Songs"
                subtitle={pluralize(likedTracks.length, "song")}
              />
              <Tile
                href={routes.history}
                cover={
                  <div className="bg-accent text-muted-foreground flex size-full items-center justify-center rounded-lg">
                    <History className="size-1/3" />
                  </div>
                }
                title="Recently played"
                subtitle="History"
              />
              {playlists.map((p) => (
                <Tile
                  key={p.id}
                  href={routes.userPlaylist(p.id)}
                  cover={
                    <PlaylistMosaic tracks={p.tracks.map((t) => t.track)} className="size-full" />
                  }
                  title={p.name}
                  subtitle={`Playlist · ${pluralize(p.tracks.length, "song")}`}
                />
              ))}
              {savedPlaylists.map(({ playlist }) => (
                <PlaylistCard key={playlist.id} playlist={playlist} fluid />
              ))}
            </div>
          )}

          {showArtists && followedArtists.length > 0 && (
            <section className="mb-10">
              <SectionHeading title="Artists you follow" eyebrow="Following" />
              <div className={grid}>
                {followedArtists.map(({ artist }) => (
                  <ArtistCard key={artist.id} artist={artist} fluid />
                ))}
              </div>
            </section>
          )}

          {isEmpty && (
            <EmptyState
              icon={<Library />}
              title="Build your library"
              description="Create playlists, save albums and follow artists. Everything is kept on this device; no account needed."
            />
          )}
        </>
      )}
    </div>
  );
}
