import { PlaylistCard } from "@/components/playlists/PlaylistCard";
import { TrackShelf } from "@/components/tracks/TrackShelf";
import { SectionHeading, Shelf } from "@/components/ui/Shelf";
import { ErrorState } from "@/components/ui/States";
import { describeProviderError, musicService } from "@/services/music/music.service";
import type { Playlist, Track } from "@/types/music";

/** Server-rendered catalog shelves. Each one fails independently so one bad request can't blank the page. */

function ShelfError({ title, error, index }: { title: string; error: unknown; index?: number }) {
  return (
    <section className="mb-12">
      <SectionHeading title={title} index={index} eyebrow="Signal lost" />
      <ErrorState message={describeProviderError(error)} />
    </section>
  );
}

export async function TrendingTracksShelf({
  title,
  eyebrow,
  index,
  underground,
  genre,
  href,
}: {
  title: string;
  eyebrow?: string;
  index?: number;
  underground?: boolean;
  genre?: string;
  href?: string;
}) {
  let tracks: Track[];
  try {
    tracks = await musicService.getTrending({ underground, genre, limit: 20 });
  } catch (error) {
    return <ShelfError title={title} error={error} index={index} />;
  }
  return (
    <TrackShelf
      title={title}
      subtitle={eyebrow}
      index={index}
      href={href}
      tracks={tracks.filter((t) => t.isPlayable)}
    />
  );
}

export async function TrendingPlaylistsShelf({
  title,
  eyebrow,
  index,
}: {
  title: string;
  eyebrow?: string;
  index?: number;
}) {
  let playlists: Playlist[];
  try {
    playlists = await musicService.getTrendingPlaylists(14);
  } catch (error) {
    return <ShelfError title={title} error={error} index={index} />;
  }
  if (playlists.length === 0) return null;
  return (
    <Shelf title={title} subtitle={eyebrow} index={index}>
      {playlists.map((p) => (
        <PlaylistCard key={p.id} playlist={p} />
      ))}
    </Shelf>
  );
}
