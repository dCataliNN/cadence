import type { ReactNode } from "react";

/** Top-of-page header for list pages (Library, Recently played): mono eyebrow, tight title, dot-grid band. */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="border-border relative -mx-4 -mt-6 mb-8 overflow-hidden border-b px-4 pt-12 pb-7 md:-mx-8 md:-mt-8 md:px-8 md:pt-16">
      <div className="bg-dot-grid absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)] opacity-50" />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="label-mono">
            <span className="text-primary">{"// "}</span>
            {eyebrow}
          </p>
          <h1 className="mt-3 text-[clamp(2rem,5vw,3.5rem)] leading-[1] font-medium tracking-[-0.05em]">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground mt-3 max-w-xl text-sm">{description}</p>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}
