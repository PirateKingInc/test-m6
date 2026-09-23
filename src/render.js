// Canvas renderer. Reads game state, never mutates it. All art is drawn in code.
import { WORLD } from './config.js';

const JELLY_COLORS = ['#ff7eb6', '#7afcff', '#b18cff', '#ffd36e', '#7dffa8', '#ff9f6e', '#6ec8ff'];

export function drawBackground(ctx, time) {
  const { W, H } = WORLD;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0b4a6b');
  g.addColorStop(0.55, '#062a45');
  g.addColorStop(1, '#03142a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Light rays from the surface.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    const x = 60 + i * 130 + Math.sin(time * 0.3 + i) * 20;
    const ray = ctx.createLinearGradient(x, 0, x + 80, H * 0.8);
    ray.addColorStop(0, 'rgba(150,230,255,0.10)');
    ray.addColorStop(1, 'rgba(150,230,255,0)');
    ctx.fillStyle = ray;
    ctx.beginPath();
    ctx.moveTo(x - 20, 0);
    ctx.lineTo(x + 30, 0);
    ctx.lineTo(x + 140, H * 0.8);
    ctx.lineTo(x + 40, H * 0.8);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // Seabed with coral silhouettes.
  ctx.fillStyle = '#0d2a3a';
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 760 + Math.sin(x * 0.05) * 8);
  ctx.lineTo(W, H);
  ctx.fill();
  ctx.fillStyle = '#12394d';
  for (const [cx, h] of [[40, 70], [110, 45], [500, 80], [565, 50]]) {
    ctx.fillRect(cx - 5, 760 - h, 10, h);
    ctx.beginPath();
    ctx.arc(cx, 760 - h, 14, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawDefenseLine(ctx, time) {
  ctx.save();
  ctx.strokeStyle = 'rgba(120,255,200,0.55)';
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 10]);
  ctx.lineDashOffset = -time * 20;
  ctx.beginPath();
  ctx.moveTo(0, WORLD.defenseY);
  ctx.lineTo(WORLD.W, WORLD.defenseY);
  ctx.stroke();
  ctx.restore();
}

export function drawJelly(ctx, e, time, opts = {}) {
  const r = e.r;
  const color = opts.color ?? JELLY_COLORS[e.lane % JELLY_COLORS.length];
  const wob = (e.wobble ?? 0) > 0 ? Math.sin(time * 60) * 6 * e.wobble : 0;
  ctx.save();
  ctx.translate(e.x + wob, e.y + r * 0.3);
  // Tentacles.
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = r > 40 ? 5 : 3;
  const n = opts.tentacles ?? (r > 40 ? 6 : 4);
  for (let i = 0; i < n; i++) {
    const tx = -r * 0.7 + (i * (r * 1.4)) / (n - 1);
    ctx.beginPath();
    ctx.moveTo(tx, r * 0.35);
    for (let k = 1; k <= 4; k++) {
      ctx.lineTo(tx + Math.sin(time * 3 + i + k) * 4, r * 0.35 + k * r * 0.22);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Bell.
  const bell = ctx.createRadialGradient(-r * 0.4, -r * 0.6, 1, 0, 0, r * 1.1);
  bell.addColorStop(0, '#ffffff');
  bell.addColorStop(0.2, color);
  bell.addColorStop(1, shade(color));
  ctx.fillStyle = bell;
  ctx.beginPath();
  ctx.arc(0, 0, r, Math.PI, 0);
  const scallops = 5;
  for (let i = 0; i <= scallops; i++) {
    const x = r - (i * 2 * r) / scallops;
    ctx.quadraticCurveTo(x + r / scallops, r * 0.55, x, r * 0.4);
  }
  ctx.closePath();
  ctx.fill();
  if (opts.highlight) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  if (e.flash > 0) {
    ctx.globalAlpha = e.flash * 0.6;
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  if (!opts.noNumber) drawNumber(ctx, e, opts);
}

function drawNumber(ctx, e, opts) {
  if (e.value === null || e.value === undefined) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(e.x, e.y + 2, 5, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const text = String(e.value).replace('-', '−');
  const size = e.r > 40 ? 46 : text.length >= 3 ? 28 : 36;
  ctx.font = `900 ${size}px "Trebuchet MS", "Arial Rounded MT Bold", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#08213a';
  ctx.strokeText(text, e.x, e.y + 2);
  ctx.fillStyle = opts.dim ? '#bcd' : '#ffffff';
  ctx.fillText(text, e.x, e.y + 2);
}

export function drawCrab(ctx, x, time) {
  const y = WORLD.cannonY;
  ctx.save();
  ctx.translate(x, y);
  // Lantern glow.
  const glow = ctx.createRadialGradient(0, -34, 2, 0, -34, 40);
  glow.addColorStop(0, 'rgba(255,250,200,0.9)');
  glow.addColorStop(1, 'rgba(255,250,200,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(-40, -74, 80, 80);
  // Legs.
  ctx.strokeStyle = '#c4452d';
  ctx.lineWidth = 4;
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(s * 20, 6 + i * 4);
      ctx.lineTo(s * (34 + i * 4), 16 + i * 6 + Math.sin(time * 8 + i) * 2);
      ctx.stroke();
    }
  }
  // Claws.
  ctx.fillStyle = '#ff6a4a';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(s * 40, -12, 12, 9, s * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Body.
  ctx.fillStyle = '#ff7b54';
  ctx.beginPath();
  ctx.ellipse(0, 4, 32, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eyes.
  ctx.fillStyle = '#fff';
  for (const s of [-1, 1]) {
    ctx.fillRect(s * 10 - 1.5, -22, 3, 10);
    ctx.beginPath();
    ctx.arc(s * 10, -24, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#10223a';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(s * 10 + 1, -24, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // Lantern.
  ctx.fillStyle = '#ffe98a';
  ctx.beginPath();
  ctx.arc(0, -34, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(0, -26);
  ctx.stroke();
  ctx.restore();
}

const BOSS_STYLE = {
  add: { color: '#ff8a5c', feature: 'claws' },
  sub: { color: '#4fe0c8', feature: 'fins' },
  mul: { color: '#b27bff', feature: 'tentacles' },
  div: { color: '#ffc861', feature: 'shell' },
  mix: { color: '#f4f0ff', feature: 'crown' },
};

// Bosses: a giant jelly with eyes and a section-specific feature, plus an HP bar.
export function drawBoss(ctx, e, time, section) {
  const style = BOSS_STYLE[section] ?? BOSS_STYLE.add;
  const r = e.r;
  ctx.save();
  ctx.translate(e.x, e.y + r * 0.3);
  ctx.fillStyle = shade(style.color);
  ctx.strokeStyle = style.color;
  if (style.feature === 'claws') {
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.translate(s * r * 1.15, -r * 0.1 + Math.sin(time * 3) * 4);
      ctx.rotate(s * (0.4 + Math.sin(time * 4) * 0.15));
      ctx.fillStyle = style.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.32, r * 0.22, 0, 0.5, Math.PI * 2 - 0.5);
      ctx.lineTo(0, 0);
      ctx.fill();
      ctx.restore();
    }
  } else if (style.feature === 'fins') {
    ctx.fillStyle = style.color;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * r * 0.8, -r * 0.2);
      ctx.lineTo(s * r * 1.45, -r * 0.7 + Math.sin(time * 5) * 6);
      ctx.lineTo(s * r * 1.3, r * 0.3);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(-r * 0.3, -r * 0.9);
    ctx.lineTo(0, -r * 1.45);
    ctx.lineTo(r * 0.35, -r * 0.9);
    ctx.fill();
  } else if (style.feature === 'shell') {
    ctx.lineWidth = 6;
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 5; a += 0.2) {
      const rad = r * 0.12 * a * 0.55;
      ctx.lineTo(Math.cos(a + time) * rad, -r * 0.35 + Math.sin(a + time) * rad);
    }
    ctx.stroke();
  } else if (style.feature === 'crown') {
    ctx.fillStyle = '#ffe36e';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.arc(i * r * 0.32, -r * 1.05 - Math.abs(i) * -4, 7 + Math.sin(time * 4 + i) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
  drawJelly(ctx, { ...e, lane: 0 }, time, { color: style.color, noNumber: true, tentacles: style.feature === 'tentacles' ? 9 : 6 });
  // Eyes with a determined brow.
  for (const s of [-1, 1]) {
    const ex = e.x + s * r * 0.42;
    const ey = e.y - r * 0.32;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ex, ey, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10223a';
    ctx.beginPath();
    ctx.arc(ex, ey + 2, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#10223a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(ex - s * 10, ey - 16);
    ctx.lineTo(ex + s * 8, ey - 10);
    ctx.stroke();
  }
  drawNumber(ctx, { ...e, y: e.y + r * 0.42 }, {});
  // HP pips.
  const w = 16;
  const total = e.maxHp * w + (e.maxHp - 1) * 4;
  for (let i = 0; i < e.maxHp; i++) {
    ctx.fillStyle = i < e.hp ? '#ff5c7a' : 'rgba(255,255,255,0.2)';
    ctx.fillRect(e.x - total / 2 + i * (w + 4), e.y - r - 22, w, 8);
  }
}

export function drawBeams(ctx, state) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const b of state.beams) {
    const g = ctx.createLinearGradient(b.x, b.y, b.x, b.y + 60);
    g.addColorStop(0, 'rgba(255,255,230,1)');
    g.addColorStop(1, 'rgba(255,240,150,0)');
    ctx.fillStyle = g;
    ctx.fillRect(b.x - 4, b.y, 8, 60);
    ctx.fillStyle = '#fffbe0';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawBanner(ctx, state) {
  const { W, bannerH } = WORLD;
  ctx.fillStyle = 'rgba(2,16,32,0.72)';
  ctx.fillRect(0, 0, W, bannerH);
  ctx.strokeStyle = 'rgba(120,230,255,0.35)';
  ctx.beginPath();
  ctx.moveTo(0, bannerH);
  ctx.lineTo(W, bannerH);
  ctx.stroke();
  const q = state.question;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (q) {
    ctx.font = '900 54px "Trebuchet MS", "Arial Rounded MT Bold", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${q.text.replace(/-/g, '−')} = ?`, W / 2, bannerH / 2 + 4);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(W / 2 + i * 24, bannerH / 2, 6 + 2 * Math.sin(state.t * 8 + i), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function drawGame(ctx, state, target) {
  const time = state.t;
  drawBackground(ctx, time);
  drawDefenseLine(ctx, time);
  if (target) {
    ctx.fillStyle = 'rgba(255,250,200,0.08)';
    ctx.fillRect(target.x - target.halfWidth, WORLD.bannerH, target.halfWidth * 2, WORLD.cannonY - WORLD.bannerH);
  }
  for (const e of state.enemies) {
    if (!e.alive) continue;
    if (e.boss) drawBoss(ctx, e, time, state.spec.section);
    else drawJelly(ctx, e, time, { highlight: e === target });
  }
  drawBeams(ctx, state);
  drawCrab(ctx, state.cannon.x, time);
  drawBanner(ctx, state);
}

function shade(hex) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.floor(v * 0.45);
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
