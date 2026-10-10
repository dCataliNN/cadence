import { Suspense } from "react";
import { SignalField } from "@/components/visual/SignalField";
import { optional } from "@/services/music/load";
import { musicService } from "@/services/music/music.service";
import { HeroActions } from "./HeroActions";

async function HeroActionsLoader() {
  // Same request as the trending shelf; Next dedupes it within the render.
  const trending = await optional(musicService.getTrending({ limit: 20 }), []);
  return <HeroActions trending={trending} />;
}

const FACTS = ["No account needed", "Free & open source", "Live open catalog"];

export function Hero() {
  return (
    <section className="border-border relative -mx-4 -mt-6 mb-12 overflow-hidden border-b md:-mx-8 md:-mt-8">
      <div className="bg-dot-grid absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)] opacity-40" />
      <SignalField
        origin={[0.82, 1.05]}
        className="[mask-image:radial-gradient(85%_120%_at_85%_100%,black_35%,transparent_90%)]"
      />
      <div className="relative px-4 pt-14 pb-12 md:px-8 md:pt-20 md:pb-16">
        <p className="label-mono flex items-center gap-2">
          <span className="relative flex size-1.5">
            <span className="bg-primary absolute inset-0 animate-ping rounded-full opacity-60" />
            <span className="bg-primary relative size-1.5 rounded-full" />
          </span>
          Independent music · on air now
        </p>
        <h1 className="mt-5 max-w-3xl text-[clamp(2.5rem,6.2vw,4.75rem)] leading-[0.95] font-medium tracking-[-0.055em] text-balance">
          Sound from the open web, <span className="text-primary">no gatekeepers.</span>
        </h1>
        <p className="text-muted-foreground mt-5 max-w-xl text-[15px] leading-relaxed text-pretty">
          Stream what independent artists are releasing right now on Audius&apos; open catalog.
          Queue it, keep it, make it yours. No ads, no downloads.
        </p>
        <Suspense fallback={<HeroActions trending={[]} />}>
          <HeroActionsLoader />
        </Suspense>
        <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-2">
          {FACTS.map((fact, i) => (
            <li key={fact} className="label-mono text-subtle flex items-center gap-2">
              <span className="text-primary">{String(i + 1).padStart(2, "0")}</span>
              {fact}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
