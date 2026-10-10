"use client";

import { ArrowDown, ArrowUp, ListMusic, Pencil, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CollectionHeader } from "@/components/collection/CollectionHeader";
import { PlayCollectionButtons } from "@/components/collection/PlayCollectionButtons";
import { PlaylistMosaic } from "@/components/playlists/PlaylistMosaic";
import { TrackList, TrackListSkeleton } from "@/components/tracks/TrackList";
import { Button, IconButton, buttonClass } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { MenuItem, MenuSeparator } from "@/components/ui/Menu";
import { EmptyState } from "@/components/ui/States";
import { formatLongDuration, pluralize } from "@/lib/format";
import { routes } from "@/lib/routes";
import { useHydrated } from "@/stores/hydration";
import { PLAYLIST_NAME_MAX, useLibraryStore, type UserPlaylist } from "@/stores/library.store";
import { toast } from "@/stores/toast.store";

function EditDialog({
  playlist,
  open,
  onOpenChange,
}: {
  playlist: UserPlaylist;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [name, setName] = useState(playlist.name);
  const [description, setDescription] = useState(playlist.description ?? "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Edit details">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          useLibraryStore.getState().renamePlaylist(playlist.id, name, description);
          onOpenChange(false);
        }}
      >
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={PLAYLIST_NAME_MAX}
            required
            autoFocus
            className="border-border bg-card focus:border-muted-foreground h-10 rounded-md border px-3 font-normal focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="Add an optional description"
            className="border-border bg-card focus:border-muted-foreground resize-none rounded-md border px-3 py-2 font-normal focus:outline-none"
          />
        </label>
        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={!name.trim()}>
            Save
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export default function UserPlaylistPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const hydrated = useHydrated();
  const playlist = useLibraryStore((s) => s.playlists.find((p) => p.id === id));
  const tracks = useMemo(() => playlist?.tracks.map((t) => t.track) ?? [], [playlist]);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!hydrated) return <TrackListSkeleton />;
  if (!playlist) {
    return (
      <EmptyState
        title="Playlist not found"
        description="It may have been deleted, or it was created on another device."
        action={
          <Link href={routes.library} className="text-sm font-semibold underline">
            Go to your library
          </Link>
        }
      />
    );
  }

  const store = useLibraryStore.getState;
  const total = tracks.reduce((sum, t) => sum + t.duration, 0);
  const last = playlist.tracks.length - 1;

  return (
    <div>
      <CollectionHeader
        imageNode={<PlaylistMosaic tracks={tracks} className="size-full" />}
        kind="Playlist"
        title={playlist.name}
        description={playlist.description}
        meta={
          tracks.length > 0
            ? `${pluralize(tracks.length, "song")} · ${formatLongDuration(total)}`
            : "Empty playlist"
        }
      />

      <PlayCollectionButtons tracks={tracks}>
        <IconButton
          label="Edit details"
          onClick={() => setEditing(true)}
          className="size-11 [&_svg]:size-6"
        >
          <Pencil />
        </IconButton>
        <IconButton
          label="Delete playlist"
          onClick={() => setDeleting(true)}
          className="size-11 [&_svg]:size-6"
        >
          <Trash2 />
        </IconButton>
      </PlayCollectionButtons>

      {tracks.length === 0 ? (
        <EmptyState
          icon={<ListMusic />}
          title="Let's find something for your playlist"
          description="Use “Add to playlist” from any song's menu."
          action={
            <Link href={routes.search()} className={buttonClass("primary")}>
              Search for songs
            </Link>
          }
        />
      ) : (
        <TrackList
          tracks={tracks}
          rowKeys={playlist.tracks.map((t) => t.uid)}
          menuExtras={(_, i) => (
            <>
              <MenuSeparator />
              <MenuItem
                disabled={i === 0}
                onSelect={() => store().movePlaylistTrack(playlist.id, i, i - 1)}
              >
                <ArrowUp /> Move up
              </MenuItem>
              <MenuItem
                disabled={i === last}
                onSelect={() => store().movePlaylistTrack(playlist.id, i, i + 1)}
              >
                <ArrowDown /> Move down
              </MenuItem>
              <MenuItem
                onSelect={() => {
                  store().removeFromPlaylist(playlist.id, playlist.tracks[i].uid);
                  toast(`Removed from ${playlist.name}`);
                }}
              >
                <X /> Remove from this playlist
              </MenuItem>
            </>
          )}
        />
      )}

      {/* Keyed so the form resets to current values each time it opens. */}
      {editing && (
        <EditDialog
          key={playlist.updatedAt}
          playlist={playlist}
          open={editing}
          onOpenChange={setEditing}
        />
      )}

      <Dialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`Delete “${playlist.name}”?`}
        description="This permanently removes the playlist from this device."
      >
        <div className="flex justify-end gap-2">
          <Button onClick={() => setDeleting(false)}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              store().deletePlaylist(playlist.id);
              toast("Playlist deleted");
              router.replace(routes.library);
            }}
          >
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
