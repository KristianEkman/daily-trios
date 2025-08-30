import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConfettiService {
  fire(durationMs = 3000) {
    const canvas = document.getElementById(
      'confetti-canvas'
    ) as HTMLCanvasElement | null;

    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = (canvas.width = window.innerWidth);
    const h = (canvas.height = window.innerHeight);

    const N = 160;
    const originX = w / 2;
    const originY = h * 0.9;
    const g = 600; // stronger gravity
    const speedMin = 250,
      speedMax = 750;
    const spreadDeg = 65;

    const rad = (deg: number) => (deg * Math.PI) / 180;

    type Piece = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      rot: number;
      vr: number;
      color: string;
    };

    // Palette: white, yellow, orange, red
    const palette = [
      'hsla(0, 100%, 60%, OPACITY)', // red
      'hsla(30, 100%, 55%, OPACITY)', // orange
      'hsla(45, 100%, 60%, OPACITY)', // yellow
      'hsla(0, 0%, 100%, OPACITY)', // white
    ];

    const pieces: Piece[] = Array.from({ length: N }).map(() => {
      const angle = -90 + (Math.random() * 2 - 1) * spreadDeg;
      const speed = speedMin + Math.random() * (speedMax - speedMin);
      const baseColor = palette[Math.floor(Math.random() * palette.length)];
      return {
        x: originX,
        y: originY,
        vx: Math.cos(rad(angle)) * speed,
        vy: Math.sin(rad(angle)) * speed,
        r: 2 + Math.random() * 4,
        rot: Math.random() * Math.PI,
        vr: (-0.2 + Math.random() * 0.4) * 4,
        color: baseColor,
      };
    });

    const fired = performance.now();
    let last = fired;
    let opacity = 1;

    const drawFrame = (t: number) => {
      const dt = Math.min(32, t - last) / 1000;
      last = t;

      for (const p of pieces) {
        p.vy += g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
      }

      const elapsed = t - fired;
      opacity = Math.max(0, 1 - elapsed / durationMs);

      ctx.clearRect(0, 0, w, h);
      for (const p of pieces) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);

        // Replace OPACITY placeholder in palette
        ctx.fillStyle = p.color.replace('OPACITY', opacity.toString());

        ctx.shadowBlur = 12; // glow effect
        ctx.shadowColor = ctx.fillStyle;

        ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
        ctx.restore();
      }

      if (elapsed < durationMs) {
        requestAnimationFrame(drawFrame);
      } else {
        ctx.clearRect(0, 0, w, h);
      }
    };

    requestAnimationFrame(drawFrame);
  }
}
