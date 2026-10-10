import type { Metadata } from "next";

export const metadata: Metadata = { title: "Your Library" };

export default function LibraryLayout({ children }: LayoutProps<"/library">) {
  return children;
}
