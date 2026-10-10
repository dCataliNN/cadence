import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Skeleton } from "./States";

/**
 * Section header in the "spec sheet" style: an oversized faint index numeral,
 * a mono eyebrow, and a hairline rule, instead of a bold heading alone.
 */
export function SectionHeading({
  title,
  eyebrow,
  index,
  href,
  action,
  className,
}: {
  title: string;
  eyebrow?: string;
  index?: number;
  href?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-border mb-5 flex items-end gap-4 border-b pb-3", className)}>
      {index !== undefined && (
        <span
          aria-hidden
          className="text-foreground/[0.09] -mb-1.5 font-mono text-5xl leading-none tracking-tighter tabular-nums select-none md:text-6xl"
        >
          {String(index).padStart(2, "0")}
        </span>
      )}
      <div className="min-w-0">
        {eyebrow && (
          <p className="label-mono mb-2">
            <span aria-hidden className="text-primary">
              {"// "}
            </span>
            {eyebrow}
          </p>
        )}
        <h2 className="truncate text-xl font-medium tracking-[-0.03em] md:text-2xl">{title}</h2>
      </div>
      <div className="ml-auto shrink-0">
        {action}
        {href && (
          <Link
            href={href}
            className="label-mono hover:text-primary inline-flex items-center gap-1 transition-colors"
          >
            View all <ArrowUpRight className="size-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

/** A titled section whose items scroll horizontally; the standard home-page building block. */
export function Shelf({
  title,
  subtitle,
  index,
  href,
  children,
}: {
  title: string;
  subtitle?: string;
  index?: number;
  href?: string;
  children: ReactNode;
}) {
  return (
    <section className="animate-rise-in mb-12" aria-label={title}>
      <SectionHeading title={title} eyebrow={subtitle} index={index} href={href} />
      <div className="-mx-4 flex snap-x scroll-px-4 scrollbar-none gap-3 overflow-x-auto px-4 pb-2 md:-mx-8 md:scroll-px-8 md:px-8">
        {children}
      </div>
    </section>
  );
}

export function ShelfSkeleton({ title, round }: { title?: string; round?: boolean }) {
  return (
    <section className="mb-12" aria-busy>
      {title ? (
        <SectionHeading title={title} eyebrow="Loading" />
      ) : (
        <Skeleton className="mb-5 h-8 w-56" />
      )}
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="border-border w-40 shrink-0 rounded-lg border p-2 sm:w-48">
            <Skeleton className={round ? "aspect-square rounded-full" : "aspect-square"} />
            <Skeleton className="mt-3 h-4 w-3/4" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </div>
        ))}
      </div>
    </section>
  );
}
