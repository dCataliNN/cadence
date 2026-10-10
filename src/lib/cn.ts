/** Joins class names, dropping falsy values. Conflicting Tailwind classes are avoided by convention. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
