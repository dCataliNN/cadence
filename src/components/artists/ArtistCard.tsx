import { BadgeCheck } from "lucide-react";
import Link from "next/link";
import { Artwork } from "@/components/ui/Artwork";
import { tileClass } from "@/components/ui/tile";
import { cn } from "@/lib/cn";
import { formatCount } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { Artist } from "@/types/music";

/** `fluid` fills a grid cell; the default fixed width suits horizontal shelves. */
export function ArtistCard({ artist, fluid }: { artist: Artist; fluid?: boolean }) {
  return (
    <Link
      href={routes.artist(artist.id)}
      className={cn(tileClass, fluid ? "w-full" : "w-40 sm:w-48")}
    >
      <div className="p-3">
        <Artwork
          image={artist.image}
          size="medium"
          rounded="full"
          placeholder="artist"
          className="ring-border group-hover:ring-primary/50 aspect-square w-full ring-1 ring-offset-4 ring-offset-transparent transition-shadow"
        />
      </div>
      <div className="px-0.5 pb-1 text-center">
        <p className="flex items-center justify-center gap-1 text-sm font-medium">
          <span className="truncate">{artist.name}</span>
          {artist.isVerified && (
            <BadgeCheck className="text-primary size-3.5 shrink-0" aria-label="Verified" />
          )}
        </p>
        <p className="label-mono text-subtle mt-2 text-[10px]">
          {artist.followerCount !== undefined
            ? `${formatCount(artist.followerCount)} followers`
            : "Artist"}
        </p>
      </div>
    </Link>
  );
}
