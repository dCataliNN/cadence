import type { MusicSource } from "@/types/music";
import { AudiusProvider } from "./audius/audius.provider";
import { ProviderError, type MusicProvider } from "./types";

const providers: Record<MusicSource, MusicProvider> = {
  audius: new AudiusProvider(),
};

/** Provider used for catalog-wide discovery (home, trending, search). */
export const DEFAULT_SOURCE: MusicSource = "audius";

export function isMusicSource(value: string): value is MusicSource {
  return Object.hasOwn(providers, value);
}

export function getProvider(source: string): MusicProvider {
  if (!isMusicSource(source))
    throw new ProviderError("not_found", `Unknown music source "${source}"`);
  return providers[source];
}

export function listProviders(): MusicProvider[] {
  return Object.values(providers);
}
