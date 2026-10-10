"use client";

import { Heart, ListMusic } from "lucide-react";
import { Artwork } from "@/components/ui/Artwork";
import { cn } from "@/lib/cn";
import type { Track } from "@/types/music";

/** Cover for user playlists: a 2×2 grid of distinct artworks, or a single image if there are fewer. */
export function PlaylistMosaic({ tracks, className }: { tracks: Track[]; className?: string }) {
  const seen = new Set<string>();
  const covers = tracks
    .filter((t) => {
      const key = t.artwork?.small ?? t.artwork?.medium;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 4);

  if (covers.length === 0) {
    return (
      <div
        className={cn(
          "bg-accent text-subtle flex items-center justify-center rounded-lg",
          className,
        )}
      >
        <ListMusic className="size-1/3" />
      </div>
    );
  }
  if (covers.length < 4) {
    return <Artwork image={covers[0].artwork} size="large" rounded="lg" className={className} />;
  }
  return (
    <div className={cn("grid grid-cols-2 overflow-hidden rounded-lg", className)}>
      {covers.map((t) => (
        <Artwork
          key={t.id}
          image={t.artwork}
          size="medium"
          rounded="md"
          className="aspect-square rounded-none"
        />
      ))}
    </div>
  );
}

export function LikedSongsCover({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "bg-primary text-primary-foreground relative flex items-center justify-center overflow-hidden rounded-lg",
        className,
      )}
    >
      <span className="bg-dot-grid absolute inset-0 opacity-40 mix-blend-multiply" />
      <Heart className="relative size-1/3 fill-current" />
    </div>
  );
}
