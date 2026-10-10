<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Cadence project rules

- Music comes only from legitimate provider APIs/players. Never add scraping, ripping, yt-dlp, audio proxying or offline caching of provider audio.
- Provider-specific code lives only in `src/providers/<name>/`. UI, stores and pages use the normalized types in `src/types/music.ts` and go through `src/services/music/music.service.ts` (server) or `/api/*` routes (client).
- The playback engine (`src/lib/playback/engine.ts`) is the only code that touches audio. UI changes playback through `usePlayerStore` actions.
- Queue and history rules are pure functions in `src/lib/queue.ts` and `src/lib/history.ts`; change them test-first (`tests/`).
- Persisted Zustand stores use `skipHydration` and are hydrated in `ClientRuntime`; pages reading them should wait for `useHydrated()`.
- Style with theme tokens only (`bg-card`, `text-muted-foreground`, `text-primary`, `border-border`, `label-mono`…); never hard-code colours, so all themes in `globals.css` keep working.
- Validate with `npm run typecheck && npm run lint && npm test && npm run build`.
