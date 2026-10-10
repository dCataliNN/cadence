"use client";

import { History } from "lucide-react";
import { useMemo, useState } from "react";
import { PlayCollectionButtons } from "@/components/collection/PlayCollectionButtons";
import { TrackList, TrackListSkeleton } from "@/components/tracks/TrackList";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { dedupeRecent } from "@/lib/history";
import { timeAgo } from "@/lib/format";
import { useHistoryStore } from "@/stores/history.store";
import { useHydrated } from "@/stores/hydration";

export default function RecentlyPlayedPage() {
  const hydrated = useHydrated();
  const entries = useHistoryStore((s) => s.entries);
  const recent = useMemo(() => dedupeRecent(entries, 100), [entries]);
  const tracks = useMemo(() => recent.map((e) => e.track), [recent]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div>
      <PageHeader
        eyebrow="History"
        title="Recently played"
        description="Stored on this device. A song counts after 30 seconds of listening."
        action={
          hydrated &&
          entries.length > 0 && <Button onClick={() => setConfirmOpen(true)}>Clear history</Button>
        }
      />

      {!hydrated ? (
        <TrackListSkeleton />
      ) : tracks.length === 0 ? (
        <EmptyState
          icon={<History />}
          title="Nothing here yet"
          description="Songs you listen to will show up here."
        />
      ) : (
        <>
          <PlayCollectionButtons tracks={tracks} />
          <TrackList
            tracks={tracks}
            rowExtras={(_, i) => (
              <span className="text-subtle hidden w-24 text-right text-xs lg:block">
                {timeAgo(recent[i].playedAt)}
              </span>
            )}
          />
        </>
      )}

      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Clear listening history?"
        description="This removes your recently played songs from this device. It can't be undone."
      >
        <div className="flex justify-end gap-2">
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              useHistoryStore.getState().clear();
              setConfirmOpen(false);
            }}
          >
            Clear
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
