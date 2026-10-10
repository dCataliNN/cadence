/**
 * Shared frame for shelf tiles: hairline border that lights up in the signal
 * colour on hover. Lives in a plain module so server and client cards can share it.
 */
export const tileClass =
  "group border-border bg-card/50 hover:border-primary/40 hover:bg-muted/60 relative shrink-0 snap-start rounded-lg border p-2 transition-colors";
