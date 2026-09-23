// Menu/result screens and HUD. Buttons are circles in world units so they're big touch targets.
import { WORLD } from './config.js';
import { drawBackground, drawJelly, drawCrab } from './render.js';

const FONT = '"Trebuchet MS", "Arial Rounded MT Bold", sans-serif';

export function buttonsFor(flow) {
  const cx = WORLD.W / 2;
  switch (flow.screen) {
    case 'title':
      return [{ id: 'play', x: cx, y: 560, r: 70, icon: 'play' }];
    case 'clear':
    case 'gameover':
      return [{ id: 'advance', x: cx, y: 600, r: 70, icon: flow.screen === 'clear' ? 'play' : 'retry' }];
    default:
      return [];
  }
}

export function hitButton(flow, x, y) {
  return buttonsFor(flow).find((b) => Math.hypot(x - b.x, y - b.y) <= b.r + 10) ?? null;
}

export function drawButton(ctx, b, time) {
  const pulse = 1 + Math.sin(time * 4) * 0.03;
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.scale(pulse, pulse);
  const g = ctx.createRadialGradient(-b.r * 0.3, -b.r * 0.3, 4, 0, 0, b.r);
  g.addColorStop(0, '#fff6c8');
  g.addColorStop(1, '#ff9f4a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, b.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  ctx.fillStyle = '#5a2310';
  ctx.strokeStyle = '#5a2310';
  const s = b.r * 0.45;
  if (b.icon === 'play') {
    ctx.beginPath();
    ctx.moveTo(-s * 0.6, -s);
    ctx.lineTo(s, 0);
    ctx.lineTo(-s * 0.6, s);
    ctx.closePath();
    ctx.fill();
  } else if (b.icon === 'retry') {
    ctx.lineWidth = s * 0.35;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.8, -Math.PI * 0.3, Math.PI * 1.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.9, -s * 0.9);
    ctx.lineTo(s * 0.95, -s * 0.1);
    ctx.lineTo(s * 0.15, -s * 0.35);
    ctx.closePath();
    ctx.fill();
  } else if (b.icon === 'map') {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(-s * 0.8 + i * s * 0.8, i % 2 ? -s * 0.3 : s * 0.3, s * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function title(ctx, text, y, size = 64) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${size}px ${FONT}`;
  ctx.lineJoin = 'round';
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#082a44';
  ctx.strokeText(text, WORLD.W / 2, y);
  ctx.fillStyle = '#fff3b0';
  ctx.fillText(text, WORLD.W / 2, y);
}

export function drawTitle(ctx, flow, time) {
  drawBackground(ctx, time);
  title(ctx, 'Tidelight', 150, 78);
  title(ctx, 'Tally', 230, 78);
  const demo = [
    { x: 150, y: 350, r: 34, lane: 0, value: 7 },
    { x: 300, y: 320, r: 34, lane: 1, value: 12 },
    { x: 450, y: 350, r: 34, lane: 2, value: 9 },
  ];
  for (const e of demo) drawJelly(ctx, { ...e, y: e.y + Math.sin(time * 2 + e.x) * 8 }, time);
  drawCrab(ctx, WORLD.W / 2 + Math.sin(time) * 60, time);
  for (const b of buttonsFor(flow)) drawButton(ctx, b, time);
}

export function drawResult(ctx, flow, time) {
  drawBackground(ctx, time);
  const r = flow.lastResult ?? { score: 0 };
  ctx.fillStyle = 'rgba(2,16,32,0.55)';
  ctx.fillRect(40, 140, WORLD.W - 80, 360);
  title(ctx, flow.levelId ?? '', 200, 48);
  if (flow.screen === 'clear') {
    drawStars(ctx, r.stars ?? 3, 300, time);
  } else {
    title(ctx, '✕', 300, 90);
  }
  title(ctx, String(r.score), 420, 56);
  for (const b of buttonsFor(flow)) drawButton(ctx, b, time);
}

export function drawStars(ctx, count, y, time) {
  for (let i = 0; i < 3; i++) {
    const x = WORLD.W / 2 + (i - 1) * 100;
    drawStar(ctx, x, y + (i === 1 ? -14 : 0), 38 + (i < count ? Math.sin(time * 5 + i) * 3 : 0), i < count);
  }
}

function drawStar(ctx, x, y, r, lit) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const rad = k % 2 ? r * 0.45 : r;
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fillStyle = lit ? '#ffd84a' : 'rgba(255,255,255,0.15)';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = lit ? '#fff' : 'rgba(255,255,255,0.3)';
  ctx.stroke();
  ctx.restore();
}

export function drawHud(ctx, state, levelId) {
  ctx.font = `800 22px ${FONT}`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(190,240,255,0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(levelId, 14, 22);
  for (let i = 0; i < 3; i++) drawShell(ctx, 24 + i * 30, 62, i < state.lives);
  ctx.textAlign = 'right';
  ctx.fillText(String(state.score), WORLD.W - 14, 22);
}

// A life is a little glowing scallop shell.
function drawShell(ctx, x, y, full) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.arc(0, 0, 12, Math.PI * 1.1, Math.PI * 1.9);
  ctx.closePath();
  ctx.fillStyle = full ? '#ffb4c8' : 'rgba(255,255,255,0.12)';
  ctx.fill();
  if (full) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    for (let k = -2; k <= 2; k++) {
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(k * 4.5, -10);
      ctx.stroke();
    }
  }
  ctx.restore();
}
