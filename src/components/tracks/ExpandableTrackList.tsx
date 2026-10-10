"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { usePlayerStore } from "@/stores/player.store";
import type { Track } from "@/types/music";
import { TrackList } from "./TrackList";

/** Shows the first `initial` rows; playback always uses the full list as its queue. */
export function ExpandableTrackList({
  tracks,
  initial = 5,
  showPlays,
}: {
  tracks: Track[];
  initial?: number;
  showPlays?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? tracks : tracks.slice(0, initial);
  return (
    <div>
      <TrackList
        tracks={visible}
        showPlays={showPlays}
        showHeader={false}
        onPlay={(i) => usePlayerStore.getState().playTracks(tracks, i)}
      />
      {tracks.length > initial && (
        <Button variant="ghost" className="mt-2" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Show less" : "Show more"}
        </Button>
      )}
    </div>
  );
}
