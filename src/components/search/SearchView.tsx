"use client";

import { BadgeCheck, Clock, Search, SearchX, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArtistCard } from "@/components/artists/ArtistCard";
import { GenreGrid } from "@/components/home/GenreGrid";
import { PlaylistCard } from "@/components/playlists/PlaylistCard";
import { PlayOverlayButton } from "@/components/tracks/TrackCard";
import { TrackList, TrackListSkeleton } from "@/components/tracks/TrackList";
import { Artwork } from "@/components/ui/Artwork";
import { Button } from "@/components/ui/Button";
import { Shelf, ShelfSkeleton, SectionHeading } from "@/components/ui/Shelf";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useIsTrackPlaying } from "@/hooks/usePlayback";
import { useSearch } from "@/hooks/useSearch";
import { routes } from "@/lib/routes";
import { useHydrated } from "@/stores/hydration";
import { usePlayerStore } from "@/stores/player.store";
import { useSearchStore } from "@/stores/search.store";
import type { Artist, SearchResults, Track } from "@/types/music";

const DEBOUNCE_MS = 300;

type TopResult =
  { kind: "artist"; artist: Artist } | { kind: "track"; track: Track; index: number };

/** An exact/prefix artist name match beats tracks; otherwise the provider's first playable track wins. */
function pickTopResult(results: SearchResults): TopResult | null {
  const q = results.query.toLowerCase();
  const artist = results.artists.find(
    (a) => a.name.toLowerCase() === q || a.handle?.toLowerCase() === q,
  );
  if (artist) return { kind: "artist", artist };
  const index = results.tracks.findIndex((t) => t.isPlayable);
  if (index !== -1) return { kind: "track", track: results.tracks[index], index };
  return results.artists[0] ? { kind: "artist", artist: results.artists[0] } : null;
}

function TopResultCard({ top, tracks }: { top: TopResult; tracks: Track[] }) {
  const trackId = top.kind === "track" ? top.track.id : "";
  const isPlaying = useIsTrackPlaying(trackId);

  if (top.kind === "artist") {
    const { artist } = top;
    return (
      <Link
        href={routes.artist(artist.id)}
        className="group border-border bg-card/50 hover:border-primary/40 flex flex-1 flex-col gap-4 rounded-lg border p-5 transition-colors"
      >
        <Artwork
          image={artist.image}
          size="medium"
          rounded="full"
          placeholder="artist"
          className="size-24"
        />
        <div>
          <p className="flex items-center gap-1.5 text-3xl font-medium tracking-[-0.04em]">
            <span className="truncate">{artist.name}</span>
            {artist.isVerified && (
              <BadgeCheck className="text-primary size-5 shrink-0" aria-label="Verified" />
            )}
          </p>
          <p className="label-mono mt-2">Artist</p>
        </div>
      </Link>
    );
  }

  const { track, index } = top;
  return (
    <div className="group border-border bg-card/50 hover:border-primary/40 relative flex flex-1 flex-col gap-4 rounded-lg border p-5 transition-colors">
      <Artwork image={track.artwork} size="medium" className="size-24" />
      <div className="min-w-0">
        <Link
          href={routes.track(track.id)}
          className="block truncate text-3xl font-medium tracking-[-0.04em] hover:underline"
        >
          {track.title}
        </Link>
        <p className="text-muted-foreground mt-1 truncate text-sm">
          Song ·{" "}
          <Link href={routes.artist(track.artist.id)} className="text-foreground hover:underline">
            {track.artist.name}
          </Link>
        </p>
      </div>
      <PlayOverlayButton
        className="absolute right-5 bottom-5 size-12"
        playing={isPlaying}
        label={isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
        onClick={() => {
          const store = usePlayerStore.getState();
          if (isPlaying) store.pause();
          else store.playTracks(tracks, index);
        }}
      />
    </div>
  );
}

function RecentSearches({ onPick }: { onPick: (q: string) => void }) {
  const hydrated = useHydrated();
  const recent = useSearchStore((s) => s.recent);
  if (!hydrated || recent.length === 0) return null;
  return (
    <section className="mb-10" aria-label="Recent searches">
      <SectionHeading
        title="Recent searches"
        eyebrow="History"
        action={
          <Button
            variant="ghost"
            className="h-8"
            onClick={() => useSearchStore.getState().clearRecent()}
          >
            Clear all
          </Button>
        }
      />
      <ul className="flex flex-wrap gap-2">
        {recent.map((q) => (
          <li
            key={q}
            className="border-border bg-card/50 hover:border-primary/40 flex items-center rounded-md border font-mono text-xs transition-colors"
          >
            <button
              type="button"
              onClick={() => onPick(q)}
              className="hover:text-foreground flex items-center gap-2 py-1.5 pr-1 pl-3"
            >
              <Clock className="text-subtle size-3.5" /> {q}
            </button>
            <button
              type="button"
              aria-label={`Remove ${q} from recent searches`}
              onClick={() => useSearchStore.getState().removeRecent(q)}
              className="text-subtle hover:text-foreground p-1.5"
            >
              <X className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Results({ results }: { results: SearchResults }) {
  const top = pickTopResult(results);
  const hasAnything =
    results.tracks.length +
      results.artists.length +
      results.playlists.length +
      results.albums.length >
    0;

  if (!hasAnything) {
    return (
      <EmptyState
        icon={<SearchX />}
        title={`No results for “${results.query}”`}
        description="Check the spelling, or try fewer or different keywords."
      />
    );
  }

  return (
    <div>
      <div className="mb-10 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {top && (
          <section aria-label="Top result" className="flex flex-col">
            <SectionHeading title="Top result" eyebrow="Best match" />
            <TopResultCard top={top} tracks={results.tracks} />
          </section>
        )}
        {results.tracks.length > 0 && (
          <section aria-label="Songs" className="min-w-0">
            <SectionHeading title="Songs" eyebrow="Tracks" />
            <TrackList
              tracks={results.tracks.slice(0, 5)}
              showHeader={false}
              onPlay={(i) => usePlayerStore.getState().playTracks(results.tracks, i)}
            />
          </section>
        )}
      </div>
      {results.tracks.length > 5 && (
        <section className="mb-10" aria-label="More songs">
          <SectionHeading title="More songs" eyebrow="Tracks" />
          <TrackList
            tracks={results.tracks.slice(5)}
            showHeader={false}
            onPlay={(i) => usePlayerStore.getState().playTracks(results.tracks, i + 5)}
          />
        </section>
      )}
      {results.artists.length > 0 && (
        <Shelf title="Artists">
          {results.artists.map((a) => (
            <ArtistCard key={a.id} artist={a} />
          ))}
        </Shelf>
      )}
      {results.albums.length > 0 && (
        <Shelf title="Albums">
          {results.albums.map((p) => (
            <PlaylistCard key={p.id} playlist={p} />
          ))}
        </Shelf>
      )}
      {results.playlists.length > 0 && (
        <Shelf title="Playlists">
          {results.playlists.map((p) => (
            <PlaylistCard key={p.id} playlist={p} />
          ))}
        </Shelf>
      )}
    </div>
  );
}

export function SearchView() {
  const router = useRouter();
  const pathname = usePathname();
  const urlQuery = useSearchParams().get("q") ?? "";
  const [input, setInput] = useState(urlQuery);
  const [syncedUrlQuery, setSyncedUrlQuery] = useState(urlQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const query = useDebouncedValue(input.trim(), DEBOUNCE_MS);
  const search = useSearch(query);

  // External navigation (sidebar link, back button) changed ?q=: adopt it.
  if (urlQuery !== syncedUrlQuery) {
    setSyncedUrlQuery(urlQuery);
    if (urlQuery !== query) setInput(urlQuery);
  }

  // Mirror the settled query into the URL so searches are shareable and survive refresh.
  // Only once the debounce has settled; otherwise a stale query would overwrite
  // an external navigation that just changed the input.
  const settled = query === input.trim();
  useEffect(() => {
    if (!settled || query === urlQuery) return;
    router.replace(query ? `${pathname}?q=${encodeURIComponent(query)}` : pathname, {
      scroll: false,
    });
  }, [settled, query, urlQuery, pathname, router]);

  const remember = () => {
    if (search.status === "success") useSearchStore.getState().addRecent(input);
  };

  return (
    <div>
      <form
        role="search"
        className="bg-background/90 border-border sticky top-0 z-20 -mx-4 mb-8 border-b px-4 py-4 backdrop-blur-xl md:-mx-8 md:px-8"
        onSubmit={(e) => {
          e.preventDefault();
          inputRef.current?.blur();
          useSearchStore.getState().addRecent(input);
        }}
      >
        <label className="relative block max-w-2xl">
          <span className="sr-only">Search for songs, artists or playlists</span>
          <Search className="text-primary pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2" />
          <input
            ref={inputRef}
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search tracks, artists, playlists…"
            autoFocus
            autoComplete="off"
            enterKeyHint="search"
            maxLength={100}
            className="border-border bg-card/60 placeholder:text-subtle focus:border-primary/60 h-13 w-full rounded-lg border pr-12 pl-12 text-lg tracking-[-0.02em] transition-shadow focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_14%,transparent)] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {input && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setInput("");
                inputRef.current?.focus();
              }}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1.5"
            >
              <X className="size-5" />
            </button>
          )}
        </label>
      </form>

      {/* Clicking into any result counts as a deliberate search worth remembering. */}
      <div onClickCapture={(e) => (e.target as HTMLElement).closest("a,button") && remember()}>
        {search.status === "idle" && (
          <>
            <RecentSearches onPick={setInput} />
            <GenreGrid />
          </>
        )}
        {search.status === "loading" && (
          <div aria-live="polite" aria-busy>
            <span className="sr-only">Searching…</span>
            <TrackListSkeleton rows={5} />
            <div className="mt-10">
              <ShelfSkeleton round />
            </div>
          </div>
        )}
        {search.status === "error" && (
          <ErrorState
            title="Search failed"
            message={search.message}
            action={<Button onClick={search.retry}>Try again</Button>}
          />
        )}
        {search.status === "success" && <Results results={search.results} />}
      </div>
    </div>
  );
}
