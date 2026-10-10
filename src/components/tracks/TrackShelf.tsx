"use client";

import { Shelf } from "@/components/ui/Shelf";
import type { Track } from "@/types/music";
import { TrackCard } from "./TrackCard";

export function TrackShelf({
  title,
  subtitle,
  index,
  href,
  tracks,
}: {
  title: string;
  subtitle?: string;
  index?: number;
  href?: string;
  tracks: Track[];
}) {
  if (tracks.length === 0) return null;
  return (
    <Shelf title={title} subtitle={subtitle} index={index} href={href}>
      {tracks.map((track, i) => (
        <TrackCard key={track.id} track={track} tracks={tracks} index={i} />
      ))}
    </Shelf>
  );
}
