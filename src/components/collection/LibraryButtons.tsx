"use client";

import { Heart } from "lucide-react";
import { Button, IconButton } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useLibraryStore } from "@/stores/library.store";
import { toast } from "@/stores/toast.store";
import type { Artist, Playlist } from "@/types/music";

export function FollowButton({ artist }: { artist: Artist }) {
  const following = useLibraryStore((s) =>
    s.followedArtists.some((f) => f.artist.id === artist.id),
  );
  return (
    <Button
      aria-pressed={following}
      onClick={() => {
        const now = useLibraryStore.getState().toggleFollow(artist);
        toast(now ? `Following ${artist.name}` : `Unfollowed ${artist.name}`);
      }}
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}

export function SavePlaylistButton({ playlist }: { playlist: Playlist }) {
  const saved = useLibraryStore((s) => s.savedPlaylists.some((p) => p.playlist.id === playlist.id));
  return (
    <IconButton
      label={saved ? "Remove from your library" : "Save to your library"}
      aria-pressed={saved}
      active={saved}
      className="size-11 [&_svg]:size-7"
      onClick={() => {
        const now = useLibraryStore.getState().toggleSavePlaylist(playlist);
        toast(now ? "Saved to your library" : "Removed from your library");
      }}
    >
      <Heart className={cn(saved && "fill-current")} />
    </IconButton>
  );
}
