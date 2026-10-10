import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-[0_0_24px_-8px_var(--primary)] hover:brightness-110",
  secondary:
    "border border-border bg-card/40 text-foreground hover:border-primary/50 hover:text-primary",
  ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
};

/** Exported so links styled as buttons stay in sync with <Button>. */
export const buttonBase =
  "inline-flex h-9 items-center justify-center gap-2 rounded-full px-4 font-mono text-[11px] font-medium tracking-[0.06em] uppercase transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-3.5";

export function buttonClass(variant: Variant = "secondary") {
  return cn(buttonBase, VARIANTS[variant]);
}

export function Button({
  variant = "secondary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" className={cn(buttonClass(variant), className)} {...props} />;
}

/** Icon-only button; `label` is required so every control has an accessible name. */
export function IconButton({
  label,
  active,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-5",
        active
          ? "text-primary hover:brightness-125"
          : "text-muted-foreground hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}
