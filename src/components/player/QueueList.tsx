"use client";

import { ChevronDown, ChevronUp, GripVertical, ListMusic, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EqualizerIcon } from "@/components/tracks/TrackList";
import { Artwork } from "@/components/ui/Artwork";
import { Button, IconButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/format";
import { routes } from "@/lib/routes";
import { usePlayerStore } from "@/stores/player.store";
import type { QueueItem } from "@/types/music";

function QueueRow({
  item,
  index,
  current,
  isFirst,
  isLast,
  dragging,
  onDragStart,
  onDropAt,
}: {
  item: QueueItem;
  index: number;
  current?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  dragging?: boolean;
  onDragStart?: () => void;
  onDropAt?: () => void;
}) {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const { track } = item;
  const store = usePlayerStore.getState;

  return (
    <li
      draggable={!current}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.();
      }}
      onDragOver={(e) => !current && e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDropAt?.();
      }}
      className={cn(
        "group hover:bg-muted relative flex items-center gap-3 rounded-md px-2 py-1.5",
        dragging && "opacity-40",
        current && "bg-muted/60",
      )}
    >
      {!current && <GripVertical className="text-subtle size-4 shrink-0 cursor-grab" aria-hidden />}
      <button
        type="button"
        className="relative shrink-0"
        aria-label={current ? `Now playing: ${track.title}` : `Play ${track.title}`}
        onClick={() => (current ? store().togglePlay() : store().jumpTo(item.uid))}
      >
        <Artwork image={track.artwork} size="small" className="size-10" />
        {current && isPlaying && (
          <span className="absolute inset-0 flex items-center justify-center rounded-md bg-black/50">
            <EqualizerIcon />
          </span>
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", current && "text-primary")}>
          {track.title}
        </p>
        <Link
          href={routes.artist(track.artist.id)}
          className="text-muted-foreground block truncate text-xs hover:underline"
        >
          {track.artist.name}
        </Link>
      </div>
      {current ? (
        <span className="text-muted-foreground text-xs tabular-nums">
          {formatDuration(track.duration)}
        </span>
      ) : (
        <div className="md:bg-muted flex items-center md:absolute md:right-1 md:rounded-md md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
          <IconButton
            label="Move up"
            className="size-7 [&_svg]:size-4"
            disabled={isFirst}
            onClick={() => store().moveQueueItem(index, index - 1)}
          >
            <ChevronUp />
          </IconButton>
          <IconButton
            label="Move down"
            className="size-7 [&_svg]:size-4"
            disabled={isLast}
            onClick={() => store().moveQueueItem(index, index + 1)}
          >
            <ChevronDown />
          </IconButton>
          <IconButton
            label={`Remove ${track.title} from queue`}
            className="size-7 [&_svg]:size-4"
            onClick={() => store().removeFromQueue(item.uid)}
          >
            <X />
          </IconButton>
        </div>
      )}
    </li>
  );
}

export function QueueList() {
  const queue = usePlayerStore((s) => s.queue);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const current = queue.items[queue.index];
  const upcoming = queue.items.slice(queue.index + 1);

  if (!current) {
    return (
      <EmptyState
        icon={<ListMusic />}
        title="Your queue is empty"
        description="Play something, or use “Add to queue” on any track."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className="label-mono mb-3 px-2">Now playing</h3>
        <ul>
          <QueueRow item={current} index={queue.index} current />
        </ul>
      </section>
      <section>
        <div className="mb-2 flex items-center justify-between px-2">
          <h3 className="label-mono">Next up</h3>
          {upcoming.length > 0 && (
            <Button
              variant="ghost"
              className="h-7 px-3 text-xs"
              onClick={() => usePlayerStore.getState().clearQueue()}
            >
              Clear
            </Button>
          )}
        </div>
        {upcoming.length === 0 ? (
          <p className="text-subtle px-2 text-sm">Nothing queued after this track.</p>
        ) : (
          <ul onDragEnd={() => setDragFrom(null)}>
            {upcoming.map((item, i) => {
              const index = queue.index + 1 + i;
              return (
                <QueueRow
                  key={item.uid}
                  item={item}
                  index={index}
                  isFirst={i === 0}
                  isLast={i === upcoming.length - 1}
                  dragging={dragFrom === index}
                  onDragStart={() => setDragFrom(index)}
                  onDropAt={() => {
                    if (dragFrom !== null) usePlayerStore.getState().moveQueueItem(dragFrom, index);
                    setDragFrom(null);
                  }}
                />
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
