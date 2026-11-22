"use client";

import { useEffect, useRef } from "react";

// The home screen's sky (src/starfield.go), drawn on a canvas: three parallax
// layers drifting left, each star twinkling on its own phase, and a shooting
// star every 8–20 s. Reduced motion keeps it still.

type Star = { x: number; y: number; layer: number; phase: number; speed: number; tint: string };

const LAYERS = [
  { drift: 3, chars: ["·", "."], alpha: 0.35 },
  { drift: 7, chars: ["·", "•"], alpha: 0.55 },
  { drift: 14, chars: ["•", "+", "✦"], alpha: 0.85 },
];

const GREYS = ["#4e4e4e", "#6c6c6c", "#8a8a8a", "#b2b2b2", "#d0d0d0", "#eeeeee"];

export default function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let stars: Star[] = [];
    let raf = 0;
    let last = performance.now();
    let nextShot = last + 3000 + Math.random() * 5000;
    let shot: { x: number; y: number; vx: number; vy: number; life: number } | null = null;

    const seed = () => {
      const count = Math.round((w * h) / 9000);
      stars = Array.from({ length: count }, () => {
        const r = Math.random();
        const layer = r < 0.6 ? 0 : r < 0.88 ? 1 : 2;
        const t = Math.random();
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          layer,
          phase: Math.random() * Math.PI * 2,
          speed: 0.6 + Math.random() * 1.6,
          tint: t < 0.07 ? "#a9c7ff" : t < 0.12 ? "#ffd28a" : "",
        };
      });
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      if (still) draw(0, performance.now());
    };

    const draw = (dt: number, now: number) => {
      ctx.clearRect(0, 0, w, h);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const L = LAYERS[s.layer];
        if (!still) {
          s.x -= L.drift * dt;
          if (s.x < -8) {
            s.x = w + 8;
            s.y = Math.random() * h;
          }
        }
        const tw = still ? 0.7 : 0.5 + 0.5 * Math.sin(now / 1000 * s.speed + s.phase);
        const level = Math.min(GREYS.length - 1, Math.floor(tw * (2 + s.layer * 1.6)));
        ctx.globalAlpha = L.alpha * (0.35 + 0.65 * tw);
        ctx.fillStyle = s.tint || GREYS[level];
        ctx.font = `${10 + s.layer * 2}px ui-monospace, Menlo, monospace`;
        ctx.fillText(L.chars[i % L.chars.length], s.x, s.y);
      }

      if (shot) {
        const len = 14;
        for (let k = 0; k < len; k++) {
          const px = shot.x - shot.vx * k * 0.012;
          const py = shot.y - shot.vy * k * 0.012;
          ctx.globalAlpha = Math.max(0, (1 - k / len) * Math.min(1, shot.life));
          ctx.fillStyle = k === 0 ? "#ffffff" : k < 4 ? "#ffd28a" : "#8a8a8a";
          ctx.font = "12px ui-monospace, Menlo, monospace";
          ctx.fillText(k === 0 ? "✦" : "·", px, py);
        }
      }
      ctx.globalAlpha = 1;
    };

    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!shot && now > nextShot) {
        const fromLeft = Math.random() < 0.5;
        const speed = 520 + Math.random() * 260;
        shot = {
          x: fromLeft ? Math.random() * w * 0.5 : w * 0.5 + Math.random() * w * 0.5,
          y: Math.random() * h * 0.35,
          vx: fromLeft ? speed : -speed,
          vy: speed * 0.38,
          life: 1.4,
        };
        nextShot = now + 8000 + Math.random() * 12000;
      }
      if (shot) {
        shot.x += shot.vx * dt;
        shot.y += shot.vy * dt;
        shot.life -= dt;
        if (shot.life <= 0) shot = null;
      }
      draw(dt, now);
      raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener("resize", resize);
    if (!still) raf = requestAnimationFrame(frame);

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !still) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} className="sky" aria-hidden="true" />;
}
