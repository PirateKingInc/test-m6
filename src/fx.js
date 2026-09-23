// Cosmetic effects (particles, rings, floating score, shake). Driven by game events;
// never feeds back into the simulation, so game results stay deterministic.
import { WORLD } from './config.js';

const COLORS = ['#ff7eb6', '#7afcff', '#b18cff', '#ffd36e', '#7dffa8', '#ff9f6e', '#6ec8ff'];

export function createFx() {
  return { particles: [], rings: [], texts: [], shake: 0, flash: 0, seed: 1 };
}

function rand(fx) {
  fx.seed = (fx.seed * 16807) % 2147483647;
  return fx.seed / 2147483647;
}

function burst(fx, x, y, color, count, speed) {
  for (let i = 0; i < count; i++) {
    const a = rand(fx) * Math.PI * 2;
    const v = speed * (0.3 + rand(fx));
    fx.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: 0.6 + rand(fx) * 0.5, age: 0, r: 3 + rand(fx) * 5, color });
  }
}

export function fxHandle(fx, events) {
  for (const e of events) {
    switch (e.type) {
      case 'kill':
        burst(fx, e.x, e.y, e.boss ? '#ffe36e' : COLORS[e.lane % COLORS.length], e.boss ? 60 : 18, e.boss ? 320 : 180);
        if (e.boss) fx.shake = Math.max(fx.shake, 1);
        break;
      case 'correct':
        fx.texts.push({ x: e.x, y: e.y - 20, text: `+${e.points}`, age: 0, life: 1, big: e.fast });
        if (e.fast) {
          fx.rings.push({ x: e.x, y: e.y, r: 10, max: e.radius, age: 0, life: 0.45 });
          fx.shake = Math.max(fx.shake, 0.35 + 0.1 * e.splashKills);
        }
        break;
      case 'miss':
        burst(fx, e.x, e.y, 'rgba(255,255,255,0.7)', 6, 80);
        break;
      case 'breach':
        fx.shake = 1;
        fx.flash = 0.6;
        burst(fx, e.x, e.y, '#ff5c7a', 30, 260);
        break;
      case 'fizzle':
        burst(fx, e.x, e.y, '#fffbe0', 5, 60);
        break;
      default:
    }
  }
}

export function fxUpdate(fx, dt) {
  for (const p of fx.particles) {
    p.age += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 220 * dt;
    p.vx *= 0.98;
  }
  fx.particles = fx.particles.filter((p) => p.age < p.life);
  for (const r of fx.rings) r.age += dt;
  fx.rings = fx.rings.filter((r) => r.age < r.life);
  for (const t of fx.texts) t.age += dt;
  fx.texts = fx.texts.filter((t) => t.age < t.life);
  fx.shake = Math.max(0, fx.shake - dt * 2.5);
  fx.flash = Math.max(0, fx.flash - dt * 1.5);
}

export function shakeOffset(fx, time) {
  const s = fx.shake * fx.shake * 12;
  return { x: Math.sin(time * 91) * s, y: Math.cos(time * 77) * s };
}

export function fxDraw(ctx, fx) {
  ctx.save();
  for (const r of fx.rings) {
    const k = r.age / r.life;
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = '#fff6b0';
    ctx.lineWidth = 8 * (1 - k) + 2;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r + (r.max - r.r) * Math.sqrt(k), 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const p of fx.particles) {
    ctx.globalAlpha = 1 - p.age / p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const t of fx.texts) {
    const k = t.age / t.life;
    ctx.globalAlpha = 1 - k * k;
    ctx.font = `900 ${t.big ? 34 : 26}px "Trebuchet MS", sans-serif`;
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#08213a';
    ctx.strokeText(t.text, t.x, t.y - k * 50);
    ctx.fillStyle = t.big ? '#ffe36e' : '#ffffff';
    ctx.fillText(t.text, t.x, t.y - k * 50);
  }
  if (fx.flash > 0) {
    ctx.globalAlpha = fx.flash * 0.5;
    ctx.fillStyle = '#ff3355';
    ctx.fillRect(0, 0, WORLD.W, WORLD.H);
  }
  ctx.restore();
}
