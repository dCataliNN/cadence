import Link from "next/link";
import { Artwork } from "@/components/ui/Artwork";
import { tileClass } from "@/components/ui/tile";
import { cn } from "@/lib/cn";
import { pluralize } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { Playlist } from "@/types/music";

/** `fluid` fills a grid cell; the default fixed width suits horizontal shelves. */
export function PlaylistCard({ playlist, fluid }: { playlist: Playlist; fluid?: boolean }) {
  return (
    <Link
      href={routes.playlist(playlist.id)}
      className={cn(tileClass, fluid ? "w-full" : "w-40 sm:w-48")}
    >
      <div className="relative">
        <Artwork image={playlist.artwork} size="medium" className="aspect-square w-full" />
        <span className="label-mono bg-background/75 text-foreground absolute top-2 left-2 rounded-sm px-1.5 py-1 text-[10px] backdrop-blur-sm">
          {playlist.isAlbum ? "Album" : "Playlist"}
        </span>
      </div>
      <div className="px-0.5 pt-3 pb-1">
        <p className="truncate text-sm font-medium tracking-[-0.01em]">{playlist.title}</p>
        <p className="text-muted-foreground truncate text-[13px]">{playlist.owner.name}</p>
        <p className="label-mono text-subtle mt-2.5 text-[10px]">
          {pluralize(playlist.trackCount, "track")}
        </p>
      </div>
    </Link>
  );
}
