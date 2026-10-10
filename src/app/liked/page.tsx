"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { useMemo } from "react";
import { CollectionHeader } from "@/components/collection/CollectionHeader";
import { PlayCollectionButtons } from "@/components/collection/PlayCollectionButtons";
import { LikedSongsCover } from "@/components/playlists/PlaylistMosaic";
import { TrackList, TrackListSkeleton } from "@/components/tracks/TrackList";
import { EmptyState } from "@/components/ui/States";
import { formatLongDuration, pluralize } from "@/lib/format";
import { routes } from "@/lib/routes";
import { useHydrated } from "@/stores/hydration";
import { useLibraryStore } from "@/stores/library.store";

export default function LikedSongsPage() {
  const hydrated = useHydrated();
  const liked = useLibraryStore((s) => s.likedTracks);
  const tracks = useMemo(() => liked.map((l) => l.track), [liked]);
  const total = tracks.reduce((sum, t) => sum + t.duration, 0);

  return (
    <div>
      <CollectionHeader
        imageNode={<LikedSongsCover className="size-full" />}
        kind="Playlist"
        title="Liked Songs"
        meta={
          hydrated && tracks.length > 0
            ? `${pluralize(tracks.length, "song")} · ${formatLongDuration(total)}`
            : undefined
        }
      />
      {!hydrated ? (
        <TrackListSkeleton />
      ) : tracks.length === 0 ? (
        <EmptyState
          icon={<Heart />}
          title="Songs you like will appear here"
          description="Save songs by tapping the heart icon."
          action={
            <Link href={routes.search()} className={buttonClass("primary")}>
              Find songs
            </Link>
          }
        />
      ) : (
        <>
          <PlayCollectionButtons tracks={tracks} />
          <TrackList tracks={tracks} />
        </>
      )}
    </div>
  );
}
