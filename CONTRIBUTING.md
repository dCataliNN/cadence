# Contributing to Cadence

Thanks for helping! Cadence aims to be a genuinely usable, legally clean music player, so a few ground rules matter more than usual.

## Ground rules

1. **Legitimate sources only.** No scraping, ripping, `yt-dlp`, proxying or caching of copyrighted audio, and no bypassing provider restrictions (gated tracks, ads, rate limits). PRs that add any of these will be closed.
2. **Keep provider logic in `src/providers/`.** UI components work with the normalized types in `src/types/music.ts` only. If you need a new field, add it to the domain model and map it in each provider's mapper.
3. **Never commit secrets.** Add new configuration to `.env.example` with a comment, and keep server-only values out of `NEXT_PUBLIC_*`.
4. **Respect attribution.** Pages showing provider content link back to the source.

## Development

```bash
npm install
npm run dev
```

Before opening a PR, run the full check:

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

Format with `npm run format`.

## Code style

- TypeScript strict; avoid `any`.
- Comments explain _why_, not _what_.
- Prefer small components and pure functions. Business rules (queue, history counting, mappers) live in `src/lib` or `src/providers` with unit tests in `tests/`.
- Match the surrounding code before introducing new patterns or dependencies, and explain any new dependency in the PR.

## Commit messages

Conventional style, scoped to the area:

```
feat(player): add crossfade setting
fix(audius): handle missing artwork sizes
test(queue): cover unshuffle after removal
```

## Adding a music provider

1. Create `src/providers/<name>/` with a client, raw response types, a mapper and a provider class implementing `MusicProvider`.
2. Add mapper tests with real (trimmed) API responses as fixtures in `tests/fixtures/<name>/`.
3. Register it in `src/providers/registry.ts`, extend `MusicSource`, and add a display name to `SOURCE_NAMES`.
4. If tracks can't play through a plain `<audio>` element, add a `PlaybackAdapter` in `src/lib/playback/`.
5. Check the provider's current terms and attribution requirements, and document them in the PR.
