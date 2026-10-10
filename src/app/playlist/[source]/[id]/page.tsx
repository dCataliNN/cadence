import type { Metadata } from "next";
import Link from "next/link";
import { CollectionHeader } from "@/components/collection/CollectionHeader";
import { SavePlaylistButton } from "@/components/collection/LibraryButtons";
import { PlayCollectionButtons } from "@/components/collection/PlayCollectionButtons";
import { TrackList } from "@/components/tracks/TrackList";
import { EmptyState } from "@/components/ui/States";
import { formatCount, formatLongDuration, pluralize } from "@/lib/format";
import { routes } from "@/lib/routes";
import { loadOr404, optional } from "@/services/music/load";
import { musicService } from "@/services/music/music.service";
import { SOURCE_NAMES, type Playlist } from "@/types/music";

type Props = PageProps<"/playlist/[source]/[id]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { source, id } = await params;
  const playlist = await optional(musicService.getPlaylist(source, id), null);
  return { title: playlist?.title ?? "Playlist" };
}

export default async function PlaylistPage({ params }: Props) {
  const { source, id } = await params;
  const { tracks, ...playlist } = await loadOr404(musicService.getPlaylist(source, id));
  const snapshot: Playlist = playlist;
  const totalSeconds = tracks.reduce((sum, t) => sum + t.duration, 0);

  return (
    <div>
      <CollectionHeader
        image={playlist.artwork}
        kind={playlist.isAlbum ? "Album" : "Playlist"}
        title={playlist.title}
        description={playlist.description}
        meta={
          <span className="flex flex-wrap items-center justify-center gap-x-1.5 sm:justify-start">
            <Link
              href={routes.artist(playlist.owner.id)}
              className="text-foreground font-semibold hover:underline"
            >
              {playlist.owner.name}
            </Link>
            <span>· {pluralize(tracks.length, "song")}</span>
            {totalSeconds > 0 && <span>· {formatLongDuration(totalSeconds)}</span>}
            {playlist.playCount ? <span>· {formatCount(playlist.playCount)} plays</span> : null}
          </span>
        }
      />
      <PlayCollectionButtons tracks={tracks}>
        <SavePlaylistButton playlist={snapshot} />
      </PlayCollectionButtons>
      {tracks.length > 0 ? (
        <TrackList tracks={tracks} />
      ) : (
        <EmptyState title="This playlist is empty" />
      )}
      {playlist.externalUrl && (
        <p className="text-subtle mt-8 text-xs">
          <a
            href={playlist.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-muted-foreground underline"
          >
            View on {SOURCE_NAMES[playlist.source]}
          </a>
        </p>
      )}
    </div>
  );
}
