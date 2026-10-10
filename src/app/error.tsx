"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <EmptyState
      title="Something went wrong"
      description="The music service may be unavailable. Playback and your library still work."
      action={
        <Button variant="primary" onClick={reset}>
          <RefreshCw /> Try again
        </Button>
      }
    />
  );
}
