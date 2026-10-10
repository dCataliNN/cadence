"use client";

import { ChevronRight } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Styled Radix dropdown: keyboard navigation, typeahead and focus return come from Radix. */
export const Menu = DropdownMenu.Root;
export const MenuTrigger = DropdownMenu.Trigger;
export const MenuSub = DropdownMenu.Sub;

const panel =
  "z-50 min-w-52 max-w-72 overflow-y-auto rounded-lg border border-border bg-muted p-1 text-sm shadow-xl shadow-black/40 animate-fade-in";

export function MenuContent({ className, ...props }: ComponentProps<typeof DropdownMenu.Content>) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        align="end"
        sideOffset={4}
        collisionPadding={8}
        className={cn(
          panel,
          "max-h-[var(--radix-dropdown-menu-content-available-height)]",
          className,
        )}
        {...props}
      />
    </DropdownMenu.Portal>
  );
}

const itemClass =
  "flex cursor-default items-center gap-3 rounded-md px-3 py-2 outline-none select-none data-[disabled]:opacity-40 data-[highlighted]:bg-accent [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground";

export function MenuItem({ className, ...props }: ComponentProps<typeof DropdownMenu.Item>) {
  return <DropdownMenu.Item className={cn(itemClass, className)} {...props} />;
}

export function MenuSeparator() {
  return <DropdownMenu.Separator className="bg-border my-1 h-px" />;
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <DropdownMenu.Label className="text-subtle px-3 py-1.5 text-xs">{children}</DropdownMenu.Label>
  );
}

export function MenuSubTrigger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <DropdownMenu.SubTrigger className={cn(itemClass, "data-[state=open]:bg-accent", className)}>
      {children}
      <ChevronRight className="ml-auto" />
    </DropdownMenu.SubTrigger>
  );
}

export function MenuSubContent({
  className,
  ...props
}: ComponentProps<typeof DropdownMenu.SubContent>) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.SubContent
        sideOffset={4}
        collisionPadding={8}
        className={cn(panel, "max-h-80", className)}
        {...props}
      />
    </DropdownMenu.Portal>
  );
}
