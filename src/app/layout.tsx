import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClientRuntime } from "@/components/layout/ClientRuntime";
import { MobileNav, Sidebar } from "@/components/layout/Navigation";
import { PlayerBar } from "@/components/player/PlayerBar";
import { themeBootScript } from "@/lib/themes";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const description = "A free, open-source music player. Discover and stream independent music.";

// Absolute base for Open Graph URLs: explicit override, else Vercel's production domain.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Cadence · Independent music, no gatekeepers", template: "%s · Cadence" },
  description,
  applicationName: "Cadence",
  openGraph: { type: "website", siteName: "Cadence", title: "Cadence", description },
  twitter: { card: "summary_large_image", title: "Cadence", description },
};

export const viewport: Viewport = {
  themeColor: "#0c0d0d",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the boot script sets data-theme before React hydrates.
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="bg-signal-glow min-h-dvh bg-fixed">
        <a
          href="#main"
          className="bg-primary text-primary-foreground sr-only z-[70] rounded-md px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Skip to content
        </a>
        <Sidebar />
        {/* The player and runtime live outside page content, so they persist across navigation. */}
        <main
          id="main"
          className="min-h-dvh px-4 pt-6 pb-[calc(var(--mobile-nav-height)+var(--mini-player-height)+env(safe-area-inset-bottom)+2rem)] md:pt-8 md:pr-8 md:pb-[calc(var(--player-height)+2rem)] md:pl-28 lg:pl-[calc(var(--sidebar-width)+2rem)]"
        >
          {children}
        </main>
        <PlayerBar />
        <MobileNav />
        <ClientRuntime />
      </body>
    </html>
  );
}
