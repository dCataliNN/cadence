import type { ReactNode } from "react";
import { Artwork } from "@/components/ui/Artwork";
import type { ImageSet } from "@/types/music";

export function CollectionHeader({
  image,
  imageNode,
  rounded = "lg",
  kind,
  title,
  meta,
  description,
}: {
  image?: ImageSet;
  /** Custom artwork (e.g. a gradient tile for Liked Songs) instead of an image. */
  imageNode?: ReactNode;
  rounded?: "lg" | "full";
  kind: string;
  title: string;
  meta?: ReactNode;
  description?: string;
}) {
  return (
    <header className="border-border relative -mx-4 -mt-6 mb-8 overflow-hidden border-b px-4 pt-10 pb-8 md:-mx-8 md:-mt-8 md:px-8 md:pt-14">
      <div className="bg-dot-grid absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)] opacity-50" />
      <div className="relative flex flex-col items-center gap-7 text-center sm:flex-row sm:items-end sm:text-left">
        <div className="border-border size-44 shrink-0 rounded-lg border p-1.5 shadow-[0_24px_60px_-28px_var(--primary)] md:size-56">
          {imageNode ?? (
            <Artwork
              image={image}
              size="large"
              rounded={rounded === "full" ? "full" : "md"}
              placeholder={rounded === "full" ? "artist" : "track"}
              eager
              className="size-full"
            />
          )}
        </div>
        <div className="min-w-0 pb-1">
          <p className="label-mono">
            <span className="text-primary">[</span> {kind} <span className="text-primary">]</span>
          </p>
          <h1 className="mt-3 text-[clamp(2rem,5vw,3.75rem)] leading-[1] font-medium tracking-[-0.05em] text-balance break-words">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground mt-4 line-clamp-3 max-w-2xl text-sm leading-relaxed">
              {description}
            </p>
          )}
          {meta && (
            <div className="text-muted-foreground mt-4 font-mono text-xs tracking-wide">{meta}</div>
          )}
        </div>
      </div>
    </header>
  );
}
