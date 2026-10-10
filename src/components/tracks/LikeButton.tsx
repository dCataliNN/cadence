"use client";

import { Heart } from "lucide-react";
import { IconButton } from "@/components/ui/Button";
import { useIsLiked } from "@/hooks/usePlayback";
import { cn } from "@/lib/cn";
import { useLibraryStore } from "@/stores/library.store";
import { toast } from "@/stores/toast.store";
import type { Track } from "@/types/music";

export function LikeButton({ track, className }: { track: Track; className?: string }) {
  const liked = useIsLiked(track.id);
  return (
    <IconButton
      label={
        liked ? `Remove ${track.title} from Liked Songs` : `Save ${track.title} to Liked Songs`
      }
      aria-pressed={liked}
      active={liked}
      className={cn("size-8 [&_svg]:size-[18px]", className)}
      onClick={(e) => {
        e.stopPropagation();
        const nowLiked = useLibraryStore.getState().toggleLike(track);
        toast(nowLiked ? "Added to Liked Songs" : "Removed from Liked Songs");
      }}
    >
      <Heart className={cn(liked && "fill-current")} />
    </IconButton>
  );
}
