import type { Metadata } from "next";
import { Suspense } from "react";
import { TrendingTracksShelf } from "@/components/home/CatalogShelves";
import { PlayCollectionButtons } from "@/components/collection/PlayCollectionButtons";
import { TrackList } from "@/components/tracks/TrackList";
import { ShelfSkeleton, SectionHeading } from "@/components/ui/Shelf";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { GENRES } from "@/lib/genres";
import { describeProviderError, musicService } from "@/services/music/music.service";
import type { Track } from "@/types/music";

type Props = PageProps<"/genre/[genre]">;

const MAX_GENRE_LENGTH = 40;

async function readGenre(params: Props["params"]): Promise<string> {
  const { genre } = await params;
  let decoded = genre;
  try {
    decoded = decodeURIComponent(genre);
  } catch {
    // Already decoded, or a malformed escape; use it as-is.
  }
  return decoded.slice(0, MAX_GENRE_LENGTH);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: await readGenre(params) };
}

export default async function GenrePage({ params }: Props) {
  const genre = await readGenre(params);
  const color = GENRES.find((g) => g.name === genre)?.color ?? "#3f3f46";

  let tracks: Track[] = [];
  let error: unknown = null;
  try {
    tracks = await musicService.getTrending({ genre, limit: 40 });
  } catch (e) {
    error = e;
  }

  return (
    <div>
      <header
        className="border-border relative -mx-4 -mt-6 mb-8 overflow-hidden border-b px-4 pt-16 pb-8 md:-mx-8 md:-mt-8 md:px-8 md:pt-24"
        style={{
          background: `linear-gradient(to bottom, color-mix(in oklab, ${color} 38%, transparent), transparent)`,
        }}
      >
        <div className="bg-dot-grid absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)] opacity-40" />
        <p className="label-mono relative flex items-center gap-2">
          <span className="h-3 w-1 rounded-full" style={{ background: color }} />
          Genre
        </p>
        <h1 className="relative mt-3 text-[clamp(2.25rem,6vw,4.5rem)] leading-[1] font-medium tracking-[-0.055em]">
          {genre}
        </h1>
        <p className="text-muted-foreground relative mt-3 font-mono text-xs tracking-wide">
          The most-played {genre} tracks this week
        </p>
      </header>

      {error ? (
        <ErrorState message={describeProviderError(error)} />
      ) : tracks.length === 0 ? (
        <EmptyState
          title={`No ${genre} tracks trending right now`}
          description="Try another genre or search instead."
        />
      ) : (
        <>
          <PlayCollectionButtons tracks={tracks} />
          <section className="mb-10">
            <SectionHeading title={`Trending in ${genre}`} eyebrow="This week" index={1} />
            <TrackList tracks={tracks} showPlays />
          </section>
          <Suspense fallback={<ShelfSkeleton title={`Underground ${genre}`} />}>
            <TrendingTracksShelf
              index={2}
              eyebrow="Rising"
              title={`Underground ${genre}`}
              genre={genre}
              underground
            />
          </Suspense>
        </>
      )}
    </div>
  );
}
