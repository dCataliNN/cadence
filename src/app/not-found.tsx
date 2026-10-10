import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";

export default function NotFound() {
  return (
    <EmptyState
      title="Not found"
      description="This track, artist or playlist doesn't exist or is no longer available."
      action={
        <Link href="/" className={buttonClass("primary")}>
          Back to Home
        </Link>
      }
    />
  );
}
