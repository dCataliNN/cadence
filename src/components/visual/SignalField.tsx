"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/cn";
import { selectCurrentTrack, usePlayerStore } from "@/stores/player.store";
import { useProgressStore } from "@/stores/progress.store";

const SPACING = 20;
const ALPHA_LEVELS = 12;
const POINTER_RADIUS = 110;

/**
 * Generative dot field (inspired by originkit.dev's pointer-reactive fields).
 *
 * It does not analyse the audio: routing provider streams through Web Audio
 * would require CORS on every content node and stops playback on iOS when the
 * screen locks. Instead, rings pulse on the track's BPM (from provider
 * metadata) anchored to the playback position, so beats line up for tracks
 * that start on the downbeat. Tracks without a known BPM only drift; the field
 * never fakes a beat it doesn't know.
 */
export function SignalField({
  className,
  origin = [0.5, 1],
  interactive = true,
}: {
  className?: string;
  /** Where beat rings start, as fractions of width/height. */
  origin?: [number, number];
  interactive?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [theme] = useTheme();
  const [ox, oy] = origin;

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;

    const styles = getComputedStyle(canvas);
    const signal = styles.getPropertyValue("--primary").trim() || "#00e599";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;
    const pointer = { x: -1e4, y: -1e4 };

    // Interpolated playback clock: timeupdate only fires ~4×/s.
    const clock = { pos: useProgressStore.getState().currentTime, at: performance.now() };
    const unsubscribeProgress = useProgressStore.subscribe((s) => {
      clock.pos = s.currentTime;
      clock.at = performance.now();
    });

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now: number) => {
      const player = usePlayerStore.getState();
      const track = selectCurrentTrack(player);
      const playing = player.isPlaying && !useProgressStore.getState().buffering;
      const pos = playing ? clock.pos + (now - clock.at) / 1000 : clock.pos;
      const t = now / 1000;

      const bpm = playing ? track?.bpm : undefined;
      const beatPhase = bpm ? ((pos * bpm) / 60) % 1 : 0;
      const beat = bpm ? Math.exp(-beatPhase * 4) : 0;

      const cx = width * ox;
      const cy = height * oy;
      const maxDist = Math.hypot(Math.max(cx, width - cx), Math.max(cy, height - cy));
      const ringRadius = beatPhase * maxDist;
      const drift = playing ? 1.1 : 0.45;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = signal;

      // Batch dots into a few alpha buckets: one fill per bucket instead of
      // one per dot keeps this cheap enough for large hero areas.
      const buckets: Array<Array<[number, number, number]>> = Array.from(
        { length: ALPHA_LEVELS },
        () => [],
      );
      const offset = (SPACING / 2) | 0;

      for (let y = offset; y < height; y += SPACING) {
        for (let x = offset; x < width; x += SPACING) {
          const d = Math.hypot(x - cx, y - cy);
          let v = 0.5 + 0.5 * Math.sin(d * 0.022 - t * drift + x * 0.003);
          v *= playing ? 0.5 : 0.42;

          if (bpm) {
            const ring = (d - ringRadius) / 46;
            v += Math.exp(-ring * ring) * (1 - beatPhase) * 0.85;
            v += beat * Math.max(0, 1 - d / (maxDist * 0.6)) * 0.25;
          }

          if (interactive) {
            const pd = Math.hypot(x - pointer.x, y - pointer.y);
            if (pd < POINTER_RADIUS * 2)
              v += Math.exp(-(pd * pd) / (POINTER_RADIUS * POINTER_RADIUS)) * 0.7;
          }

          v = Math.min(1, v);
          const level = Math.min(ALPHA_LEVELS - 1, Math.floor(v * ALPHA_LEVELS));
          // Whole-pixel squares: fractional sizes/positions get anti-aliased
          // across neighbouring pixels and wash out to a fraction of their alpha.
          const size = 2 + Math.round(v * 2);
          buckets[level].push([Math.round(x - size / 2), Math.round(y - size / 2), size]);
        }
      }

      for (let level = 0; level < ALPHA_LEVELS; level++) {
        const dots = buckets[level];
        if (dots.length === 0) continue;
        ctx.globalAlpha = 0.1 + (level / (ALPHA_LEVELS - 1)) * 0.9;
        ctx.beginPath();
        for (const [x, y, size] of dots) ctx.rect(x, y, size, size);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      draw(now);
      if (visible) frame = requestAnimationFrame(loop);
    };

    const start = () => {
      cancelAnimationFrame(frame);
      if (reducedMotion) draw(performance.now());
      else frame = requestAnimationFrame(loop);
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (reducedMotion) draw(performance.now());
    });
    resizeObserver.observe(host);
    resize();

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else cancelAnimationFrame(frame);
    });
    intersection.observe(host);

    const onPointerMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    };
    const onPointerLeave = () => {
      pointer.x = pointer.y = -1e4;
    };
    if (interactive) {
      host.addEventListener("pointermove", onPointerMove);
      host.addEventListener("pointerleave", onPointerLeave);
    }

    start();

    return () => {
      cancelAnimationFrame(frame);
      unsubscribeProgress();
      resizeObserver.disconnect();
      intersection.disconnect();
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
    };
    // theme: re-read the signal colour when the theme changes.
  }, [theme, ox, oy, interactive]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 size-full", className)}
    />
  );
}
