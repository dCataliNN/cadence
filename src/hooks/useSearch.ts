"use client";

import { useEffect, useState } from "react";
import type { SearchResults } from "@/types/music";

type SearchState =
  | { status: "idle" }
  | { status: "loading"; query: string }
  | { status: "error"; query: string; message: string }
  | { status: "success"; query: string; results: SearchResults };

// Small in-memory cache so retyping a query or navigating back is instant and
// doesn't spend provider rate limit on identical requests.
const cache = new Map<string, SearchResults>();
const CACHE_LIMIT = 30;

function remember(query: string, results: SearchResults) {
  cache.delete(query);
  cache.set(query, results);
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value!);
}

export function useSearch(query: string): SearchState & { retry: () => void } {
  const key = query.trim().toLowerCase();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<SearchState>({ status: "idle" });

  useEffect(() => {
    if (!key || cache.has(key)) return;
    const controller = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(key)}`, { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.error ?? "Search failed");
        remember(key, body as SearchResults);
        setState({ status: "success", query: key, results: body as SearchResults });
      })
      .catch((error: unknown) => {
        // Aborted requests are stale searches the user already typed past.
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : "Search failed";
        setState({ status: "error", query: key, message });
      });
    return () => controller.abort();
  }, [key, attempt]);

  const retry = () => {
    setState({ status: "loading", query: key });
    setAttempt((n) => n + 1);
  };
  if (!key) return { status: "idle", retry };
  const cached = cache.get(key);
  if (cached) return { status: "success", query: key, results: cached, retry };
  // Until the effect for a new key starts, report loading rather than a stale result.
  if (state.status === "idle" || state.query !== key)
    return { status: "loading", query: key, retry };
  return { ...state, retry };
}
