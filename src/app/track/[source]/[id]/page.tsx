import type { Metadata } from "next";
import Link from "next/link";
import { CollectionHeader } from "@/components/collection/CollectionHeader";
import { PlayCollectionButtons } from "@/components/collection/PlayCollectionButtons";
import { LikeButton } from "@/components/tracks/LikeButton";
import { TrackActionsMenu } from "@/components/tracks/TrackActionsMenu";
import { TrackList } from "@/components/tracks/TrackList";
import { formatCount, formatDate, formatDuration } from "@/lib/format";
import { routes } from "@/lib/routes";
import { loadOr404, optional } from "@/services/music/load";
import { musicService } from "@/services/music/music.service";
import { SOURCE_NAMES, toTrack } from "@/types/music";
import { SectionHeading } from "@/components/ui/Shelf";

type Props = PageProps<"/track/[source]/[id]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { source, id } = await params;
  const track = await optional(musicService.getTrack(source, id), null);
  return track ? { title: `${track.title} · ${track.artist.name}` } : { title: "Track" };
}

export default async function TrackPage({ params }: Props) {
  const { source, id } = await params;
  const track = await loadOr404(musicService.getTrack(source, id));
  const related = await optional(
    musicService.getRecommendations(
      track.source,
      { genre: track.genre, excludeProviderIds: [track.providerId] },
      10,
    ),
    [],
  );
  const released = formatDate(track.releaseDate);
  const snapshot = toTrack(track);

  return (
    <div>
      <CollectionHeader
        image={track.artwork}
        kind={track.genre ? `Song · ${track.genre}` : "Song"}
        title={track.title}
        meta={
          <span className="flex flex-wrap items-center justify-center gap-x-1.5 sm:justify-start">
            <Link
              href={routes.artist(track.artist.id)}
              className="text-foreground font-semibold hover:underline"
            >
              {track.artist.name}
            </Link>
            {released && <span>· {released}</span>}
            <span>· {formatDuration(track.duration)}</span>
            {track.playCount !== undefined && <span>· {formatCount(track.playCount)} plays</span>}
          </span>
        }
      />

      <PlayCollectionButtons tracks={[snapshot]} showShuffle={false}>
        <LikeButton track={snapshot} className="size-11 [&_svg]:size-7" />
        <TrackActionsMenu track={snapshot} className="size-11 [&_svg]:size-7" />
      </PlayCollectionButtons>

      {!track.isPlayable && (
        <p className="border-border bg-card text-muted-foreground mb-6 rounded-lg border px-4 py-3 text-sm">
          This track isn&apos;t available for free streaming. You can still find it on{" "}
          {SOURCE_NAMES[track.source]}.
        </p>
      )}

      {(track.description || track.tags) && (
        <section className="mb-10 max-w-3xl">
          {track.description && (
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
              {track.description}
            </p>
          )}
          {track.tags && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tags">
              {track.tags.slice(0, 12).map((tag) => (
                <li key={tag}>
                  <Link
                    href={routes.search(tag)}
                    className="bg-muted text-muted-foreground hover:bg-accent hover:text-foreground rounded-full px-3 py-1 text-xs"
                  >
                    #{tag}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {related.length > 0 && (
        <section className="mb-10">
          <SectionHeading title="More like this" eyebrow="Same frequency" />
          <TrackList tracks={related} showHeader={false} />
        </section>
      )}

      {track.externalUrl && (
        <p className="text-subtle text-xs">
          Streamed via {SOURCE_NAMES[track.source]} ·{" "}
          <a
            href={track.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-muted-foreground underline"
          >
            Listen on {SOURCE_NAMES[track.source]}
          </a>
        </p>
      )}
    </div>
  );
}
