import { ProviderError } from "@/providers/types";
import type { AudiusResponse } from "./audius.types";

export const AUDIUS_API_BASE_URL = (
  process.env.AUDIUS_API_BASE_URL ?? "https://api.audius.co"
).replace(/\/+$/, "");

export const AUDIUS_APP_NAME = process.env.NEXT_PUBLIC_AUDIUS_APP_NAME || "Cadence";

const REQUEST_TIMEOUT_MS = 8_000;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 300;

type QueryValue = string | number | boolean | undefined | string[];

export interface AudiusRequestOptions {
  params?: Record<string, QueryValue>;
  /** Seconds to cache in the Next.js data cache. Catalog data changes slowly. */
  revalidate?: number;
}

export function buildAudiusUrl(path: string, params: Record<string, QueryValue> = {}): string {
  const url = new URL(`${AUDIUS_API_BASE_URL}/v1${path}`);
  url.searchParams.set("app_name", AUDIUS_APP_NAME);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) value.forEach((v) => url.searchParams.append(key, v));
    else url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function isRetryable(error: unknown): boolean {
  if (error instanceof ProviderError)
    return error.kind === "unavailable" || error.kind === "timeout";
  // fetch() rejects with TypeError on network failures.
  return error instanceof TypeError;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestOnce<T>(url: string, revalidate: number): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: { revalidate },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ProviderError("timeout", "Audius did not respond in time");
    }
    throw error;
  }

  if (response.ok) {
    const body = (await response.json()) as AudiusResponse<T>;
    return body.data;
  }

  const status = response.status;
  if (status === 404) throw new ProviderError("not_found", "Not found on Audius", status);
  // Deliberately not retried: hammering a rate-limited API only extends the limit.
  if (status === 429) throw new ProviderError("rate_limited", "Audius rate limit reached", status);
  if (status >= 400 && status < 500)
    throw new ProviderError("invalid", `Audius rejected the request (${status})`, status);
  throw new ProviderError("unavailable", `Audius is unavailable (${status})`, status);
}

export async function audiusGet<T>(path: string, options: AudiusRequestOptions = {}): Promise<T> {
  const url = buildAudiusUrl(path, options.params);
  const revalidate = options.revalidate ?? 300;

  for (let attempt = 0; ; attempt++) {
    try {
      return await requestOnce<T>(url, revalidate);
    } catch (error) {
      if (attempt >= MAX_RETRIES || !isRetryable(error)) {
        if (error instanceof ProviderError) throw error;
        throw new ProviderError("unavailable", "Could not reach Audius");
      }
      await sleep(RETRY_BASE_DELAY_MS * 3 ** attempt);
    }
  }
}
