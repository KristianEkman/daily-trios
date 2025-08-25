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

    const N = 180;
    const originX = w / 2;
    const originY = h * 0.9; // lower screen
    const g = 500; // gravity (px/s^2)
    const speedMin = 200,
      speedMax = 700;
    const spreadDeg = 55;

    const rad = (deg: number) => (deg * Math.PI) / 180;

    type Piece = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      rot: number;
      vr: number;
      hue: number;
    };

    const pieces: Piece[] = Array.from({ length: N }).map(() => {
      const angle = -90 + (Math.random() * 2 - 1) * spreadDeg;
      const speed = speedMin + Math.random() * (speedMax - speedMin);
      return {
        x: originX,
        y: originY,
        vx: Math.cos(rad(angle)) * speed,
        vy: Math.sin(rad(angle)) * speed,
        r: 2 + Math.random() * 4,
        rot: Math.random() * Math.PI,
        vr: (-0.2 + Math.random() * 0.4) * 4,
        hue: Math.random() * 360,
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
        ctx.fillStyle = `hsla(${p.hue}, 90%, 60%, ${opacity})`;
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
