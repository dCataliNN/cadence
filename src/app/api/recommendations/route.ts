import type { NextRequest } from "next/server";
import { DEFAULT_SOURCE, isMusicSource } from "@/providers/registry";
import { splitGlobalId } from "@/lib/routes";
import { describeProviderError, musicService } from "@/services/music/music.service";

const MAX_EXCLUDED = 50;
const MAX_GENRE_LENGTH = 40;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const source = params.get("source") ?? DEFAULT_SOURCE;
  if (!isMusicSource(source)) return Response.json({ error: "Unknown source" }, { status: 400 });

  const genre = params.get("genre")?.trim().slice(0, MAX_GENRE_LENGTH) || undefined;
  // Clients send global IDs (`source:providerId`); keep only this provider's.
  const exclude = (params.get("exclude") ?? "")
    .split(",")
    .map((id) => splitGlobalId(id.trim()))
    .filter((id) => id.source === source && id.providerId)
    .map((id) => id.providerId)
    .slice(0, MAX_EXCLUDED);
  const limit = Math.min(Math.max(Number(params.get("limit")) || 20, 1), 50);

  try {
    const tracks = await musicService.getRecommendations(
      source,
      { genre, excludeProviderIds: exclude },
      limit,
    );
    return Response.json(tracks, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    return Response.json({ error: describeProviderError(error) }, { status: 502 });
  }
}
