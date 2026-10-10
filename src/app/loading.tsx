import { TrackListSkeleton } from "@/components/tracks/TrackList";
import { Skeleton } from "@/components/ui/States";

export default function Loading() {
  return (
    <div aria-busy aria-label="Loading">
      <div className="mb-8 flex flex-col items-center gap-6 sm:flex-row sm:items-end">
        <Skeleton className="size-48 md:size-56" />
        <div className="w-full max-w-md">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-10 w-3/4" />
          <Skeleton className="mt-4 h-4 w-1/2" />
        </div>
      </div>
      <TrackListSkeleton />
    </div>
  );
}
