import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/Shelf";
import { GENRES } from "@/lib/genres";
import { routes } from "@/lib/routes";

/**
 * Genres as a hairline index rather than solid colour blocks: each genre's
 * colour only appears as a marker and a faint wash on hover.
 */
export function GenreGrid({ title = "Browse genres", index }: { title?: string; index?: number }) {
  return (
    <section className="mb-12" aria-label={title}>
      <SectionHeading title={title} eyebrow="Frequencies" index={index} />
      <div className="border-border bg-border grid grid-cols-2 gap-px overflow-hidden rounded-lg border sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {GENRES.map((genre, i) => (
          <Link
            key={genre.name}
            href={routes.genre(genre.name)}
            style={{ "--genre": genre.color } as React.CSSProperties}
            className="group bg-background relative flex h-24 flex-col justify-between overflow-hidden p-3.5 transition-colors hover:bg-[color-mix(in_oklab,var(--genre)_14%,var(--background))]"
          >
            <span className="flex items-center justify-between">
              <span className="label-mono text-subtle text-[10px]">
                G{String(i + 1).padStart(2, "0")}
              </span>
              <ArrowUpRight className="text-subtle size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
            </span>
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="h-3 w-1 rounded-full transition-all group-hover:h-4"
                style={{ background: genre.color }}
              />
              <span className="truncate text-[15px] font-medium tracking-[-0.02em]">
                {genre.name}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
