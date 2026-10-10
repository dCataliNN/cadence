import type { Metadata } from "next";

export const metadata: Metadata = { title: "Recently played" };

export default function HistoryLayout({ children }: LayoutProps<"/history">) {
  return children;
}
