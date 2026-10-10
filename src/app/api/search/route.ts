import type { NextRequest } from "next/server";
import { describeProviderError, musicService } from "@/services/music/music.service";
import { ProviderError } from "@/providers/types";

const MAX_QUERY_LENGTH = 100;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!query) return Response.json({ error: "Missing search query" }, { status: 400 });
  if (query.length > MAX_QUERY_LENGTH)
    return Response.json({ error: "Search query too long" }, { status: 400 });

  try {
    const results = await musicService.search(query, 10);
    return Response.json(results, {
      // Lets the browser/CDN reuse identical searches briefly (e.g. typing back and forth).
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    const status = error instanceof ProviderError && error.kind === "rate_limited" ? 429 : 502;
    return Response.json({ error: describeProviderError(error) }, { status });
  }
}
