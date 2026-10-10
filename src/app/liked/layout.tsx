import type { Metadata } from "next";

export const metadata: Metadata = { title: "Liked Songs" };

export default function LikedLayout({ children }: LayoutProps<"/liked">) {
  return children;
}
