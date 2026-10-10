"use client";

import { Music, User } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { ImageSet } from "@/types/music";

type Size = "small" | "medium" | "large";

const PREFERENCE: Record<Size, Array<keyof Omit<ImageSet, "mirrors">>> = {
  small: ["small", "medium", "large"],
  medium: ["medium", "large", "small"],
  large: ["large", "medium", "small"],
};

function candidates(image: ImageSet | undefined, size: Size): string[] {
  if (!image) return [];
  const primary = PREFERENCE[size].map((key) => image[key]).find(Boolean);
  if (!primary) return [];
  const urls = [primary];
  // Same content path on alternative hosts, tried in order when one fails.
  try {
    const { pathname } = new URL(primary);
    for (const mirror of image.mirrors ?? []) urls.push(new URL(pathname, mirror).toString());
  } catch {}
  return urls;
}

interface ArtworkProps {
  image?: ImageSet;
  size?: Size;
  alt?: string;
  className?: string;
  rounded?: "md" | "lg" | "full";
  placeholder?: "track" | "artist";
  eager?: boolean;
}

/**
 * Plain <img> rather than next/image: artwork comes from many rotating
 * decentralised hosts, which would require an open-ended `remotePatterns`
 * allowlist and turn the image optimizer into an open proxy. Providers
 * already serve pre-sized variants.
 */
export function Artwork({
  image,
  size = "medium",
  alt = "",
  className,
  rounded = "md",
  placeholder = "track",
  eager,
}: ArtworkProps) {
  const urls = candidates(image, size);
  const key = urls[0] ?? "";
  const [state, setState] = useState({ key, attempt: 0 });
  const attempt = state.key === key ? state.attempt : 0;
  const src = urls[attempt];
  const radius = { md: "rounded-md", lg: "rounded-lg", full: "rounded-full" }[rounded];
  const Icon = placeholder === "artist" ? User : Music;

  return (
    <div className={cn("bg-accent relative overflow-hidden", radius, className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- see component docs
        <img
          key={src}
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="size-full object-cover"
          onError={() => setState({ key, attempt: attempt + 1 })}
        />
      ) : (
        <div className="text-subtle flex size-full items-center justify-center" aria-hidden>
          <Icon className="size-1/3 min-h-4 min-w-4" />
        </div>
      )}
    </div>
  );
}
