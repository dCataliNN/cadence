"use client";

import {
  Disc3,
  ExternalLink,
  Heart,
  ListEnd,
  ListPlus,
  ListStart,
  MoreHorizontal,
  Plus,
  Share2,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from "@/components/ui/Menu";
import { useIsLiked } from "@/hooks/usePlayback";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { shareLink } from "@/lib/share";
import { useLibraryStore } from "@/stores/library.store";
import { usePlayerStore } from "@/stores/player.store";
import { toast } from "@/stores/toast.store";
import { SOURCE_NAMES, type Track } from "@/types/music";

export function AddToPlaylistItems({ tracks }: { tracks: Track[] }) {
  const playlists = useLibraryStore((s) => s.playlists);
  const router = useRouter();

  const add = (id: string, name: string) => {
    const added = useLibraryStore.getState().addToPlaylist(id, tracks);
    toast(added ? `Added to ${name}` : `Already in ${name}`);
  };

  return (
    <>
      <MenuItem
        onSelect={() => {
          const playlist = useLibraryStore.getState().createPlaylist("", tracks);
          toast(`Created ${playlist.name}`);
          router.push(routes.userPlaylist(playlist.id));
        }}
      >
        <Plus /> New playlist
      </MenuItem>
      {playlists.length > 0 && <MenuSeparator />}
      {playlists.length > 0 && <MenuLabel>Your playlists</MenuLabel>}
      {playlists.map((p) => (
        <MenuItem key={p.id} onSelect={() => add(p.id, p.name)}>
          <span className="truncate">{p.name}</span>
        </MenuItem>
      ))}
    </>
  );
}

/**
 * The one context menu for a track, used everywhere a track appears so the
 * same actions are always available in the same order.
 */
export function TrackActionsMenu({
  track,
  extraItems,
  className,
}: {
  track: Track;
  /** Context-specific actions, e.g. "Remove from this playlist". */
  extraItems?: ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const liked = useIsLiked(track.id);

  return (
    <Menu modal={false}>
      <MenuTrigger
        aria-label={`More options for ${track.title}`}
        title="More options"
        className={cn(
          "text-muted-foreground hover:text-foreground data-[state=open]:text-foreground inline-flex size-8 shrink-0 items-center justify-center rounded-full transition-colors [&_svg]:size-5",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <MoreHorizontal />
      </MenuTrigger>
      <MenuContent onClick={(e) => e.stopPropagation()}>
        <MenuItem
          disabled={!track.isPlayable}
          onSelect={() => {
            usePlayerStore.getState().playNext([track]);
            toast("Playing next");
          }}
        >
          <ListStart /> Play next
        </MenuItem>
        <MenuItem
          disabled={!track.isPlayable}
          onSelect={() => {
            usePlayerStore.getState().addToQueue([track]);
            toast("Added to queue");
          }}
        >
          <ListEnd /> Add to queue
        </MenuItem>
        <MenuSeparator />
        <MenuSub>
          <MenuSubTrigger>
            <ListPlus /> Add to playlist
          </MenuSubTrigger>
          <MenuSubContent>
            <AddToPlaylistItems tracks={[track]} />
          </MenuSubContent>
        </MenuSub>
        <MenuItem
          onSelect={() => {
            const nowLiked = useLibraryStore.getState().toggleLike(track);
            toast(nowLiked ? "Added to Liked Songs" : "Removed from Liked Songs");
          }}
        >
          <Heart className={cn(liked && "text-primary! fill-current")} />
          {liked ? "Remove from Liked Songs" : "Save to Liked Songs"}
        </MenuItem>
        {extraItems}
        <MenuSeparator />
        <MenuItem onSelect={() => router.push(routes.artist(track.artist.id))}>
          <User /> Go to artist
        </MenuItem>
        <MenuItem onSelect={() => router.push(routes.track(track.id))}>
          <Disc3 /> Go to track
        </MenuItem>
        <MenuItem onSelect={() => void shareLink(routes.track(track.id), track.title)}>
          <Share2 /> Share
        </MenuItem>
        {track.externalUrl && (
          <MenuItem
            onSelect={() => window.open(track.externalUrl, "_blank", "noopener,noreferrer")}
          >
            <ExternalLink /> Open on {SOURCE_NAMES[track.source]}
          </MenuItem>
        )}
      </MenuContent>
    </Menu>
  );
}
