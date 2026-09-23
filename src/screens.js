// Menu/result screens and HUD. Buttons are circles in world units so they're big touch targets.
import { WORLD } from './config.js';
import { drawBackground, drawJelly, drawCrab, drawBoss } from './render.js';
import { SECTIONS } from './data/levels.js';
import { isUnlocked } from './flow.js';
import { hasProgress, sectionHighScore } from './progress.js';

const FONT = '"Trebuchet MS", "Arial Rounded MT Bold", sans-serif';

const SECTION_SYMBOL = { add: '+', sub: '−', mul: '×', div: '÷', mix: '?' };
const SECTION_COLOR = { add: '#ffd36e', sub: '#7dffa8', mul: '#b18cff', div: '#6ec8ff', mix: '#ff7eb6' };

// Map layout: one row per section, one node per level (bosses bigger).
export function mapNodes() {
  const nodes = [];
  SECTIONS.forEach((section, row) => {
    section.levels.forEach((level, col) => {
      const boss = Boolean(level.boss);
      nodes.push({ id: `level:${level.id}`, levelId: level.id, section: section.id, x: 110 + col * 76 + (boss ? 8 : 0), y: 170 + row * 112, r: boss ? 34 : 27, boss });
    });
  });
  return nodes;
}

export function buttonsFor(flow) {
  const cx = WORLD.W / 2;
  switch (flow.screen) {
    case 'title': {
      const buttons = [{ id: 'play', x: cx, y: 560, r: 70, icon: 'play' }];
      if (hasProgress(flow.progress)) buttons.push({ id: 'new', x: 70, y: 730, r: 36, icon: 'new' });
      return buttons;
    }
    case 'confirm':
      return [
        { id: 'confirmNew', x: cx - 100, y: 520, r: 60, icon: 'check' },
        { id: 'title', x: cx + 100, y: 520, r: 60, icon: 'cross' },
      ];
    case 'map':
      return [
        { id: 'title', x: 50, y: 50, r: 32, icon: 'back' },
        ...mapNodes().filter((n) => isUnlocked(flow.progress, n.levelId)),
      ];
    case 'clear':
    case 'gameover':
      return [
        { id: 'advance', x: cx + 60, y: 600, r: 70, icon: flow.screen === 'clear' ? 'play' : 'retry' },
        { id: 'map', x: cx - 110, y: 610, r: 44, icon: 'map' },
      ];
    case 'ending':
      return [{ id: 'map', x: cx, y: 610, r: 56, icon: 'map' }];
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
  } else if (b.icon === 'check') {
    ctx.lineWidth = s * 0.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-s * 0.8, 0);
    ctx.lineTo(-s * 0.2, s * 0.6);
    ctx.lineTo(s * 0.9, -s * 0.6);
    ctx.stroke();
  } else if (b.icon === 'cross' || b.icon === 'new') {
    ctx.lineWidth = s * 0.4;
    ctx.lineCap = 'round';
    if (b.icon === 'new') {
      // A fresh start: a small sprout.
      ctx.beginPath();
      ctx.moveTo(0, s);
      ctx.lineTo(0, -s * 0.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(-s * 0.45, -s * 0.45, s * 0.5, s * 0.25, -0.6, 0, Math.PI * 2);
      ctx.ellipse(s * 0.45, -s * 0.6, s * 0.5, s * 0.25, 0.6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(-s * 0.7, -s * 0.7);
      ctx.lineTo(s * 0.7, s * 0.7);
      ctx.moveTo(s * 0.7, -s * 0.7);
      ctx.lineTo(-s * 0.7, s * 0.7);
      ctx.stroke();
    }
  } else if (b.icon === 'back') {
    ctx.beginPath();
    ctx.moveTo(s * 0.6, -s);
    ctx.lineTo(-s * 0.8, 0);
    ctx.lineTo(s * 0.6, s);
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

export function drawConfirm(ctx, flow, time) {
  drawBackground(ctx, time);
  ctx.fillStyle = 'rgba(2,16,32,0.6)';
  ctx.fillRect(40, 200, WORLD.W - 80, 420);
  // Wipe-the-map pictogram: three cleared stars fading out.
  drawStars(ctx, 0, 330, time);
  for (const b of buttonsFor(flow)) drawButton(ctx, b, time);
}

export function drawMap(ctx, flow, time) {
  drawBackground(ctx, time);
  const nodes = mapNodes();
  SECTIONS.forEach((section, row) => {
    const y = 170 + row * 112;
    const color = SECTION_COLOR[section.id];
    const open = isUnlocked(flow.progress, section.levels[0].id);
    ctx.globalAlpha = open ? 1 : 0.35;
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(110, y);
    ctx.lineTo(110 + (section.levels.length - 1) * 76 + 8, y);
    ctx.stroke();
    // Section badge with the operator symbol.
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(42, y, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#08213a';
    ctx.font = `900 40px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(SECTION_SYMBOL[section.id], 42, y + 2);
    // Section high score under the row.
    const high = sectionHighScore(flow.progress, section.id);
    ctx.font = `800 18px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.textAlign = 'right';
    if (high > 0) ctx.fillText(`★ ${high}`, 560, y + 50);
    ctx.globalAlpha = 1;
  });
  for (const n of nodes) {
    const cleared = flow.progress.cleared.includes(n.levelId);
    const open = isUnlocked(flow.progress, n.levelId);
    const color = SECTION_COLOR[n.section];
    const pulse = open && !cleared ? 1 + Math.sin(time * 5) * 0.08 : 1;
    ctx.save();
    ctx.translate(n.x, n.y);
    ctx.scale(pulse, pulse);
    ctx.beginPath();
    ctx.arc(0, 0, n.r, 0, Math.PI * 2);
    ctx.fillStyle = cleared ? '#ffd84a' : open ? color : '#1b3a52';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = open ? '#ffffff' : 'rgba(255,255,255,0.2)';
    ctx.stroke();
    ctx.fillStyle = open ? '#08213a' : 'rgba(255,255,255,0.35)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (!open) {
      // Padlock.
      ctx.fillRect(-9, -2, 18, 14);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -3, 6, Math.PI, 0);
      ctx.stroke();
    } else if (n.boss) {
      ctx.font = `900 30px ${FONT}`;
      ctx.fillText('♛', 0, 2);
    } else {
      ctx.font = `900 26px ${FONT}`;
      ctx.fillText(n.levelId.slice(1), 0, 2);
    }
    ctx.restore();
  }
  for (const b of buttonsFor(flow)) if (!b.levelId) drawButton(ctx, b, time);
}

export function drawEnding(ctx, flow, time) {
  drawBackground(ctx, time);
  // The reef lights up: the rescued jellies glow and dance.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(WORLD.W / 2, 420, 20, WORLD.W / 2, 420, 420);
  glow.addColorStop(0, 'rgba(255,240,160,0.45)');
  glow.addColorStop(1, 'rgba(255,240,160,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WORLD.W, WORLD.H);
  ctx.restore();
  const mixed = flow.ending === 'mixed';
  title(ctx, mixed ? 'True Tidelight!' : 'Reef Restored!', 110, mixed ? 54 : 58);
  for (let i = 0; i < 7; i++) {
    const a = time * 0.8 + (i * Math.PI * 2) / 7;
    drawJelly(ctx, { x: WORLD.W / 2 + Math.cos(a) * 200, y: 400 + Math.sin(a) * 120, r: 30, lane: i, value: null, flash: 0 }, time);
  }
  if (mixed) drawBoss(ctx, { x: WORLD.W / 2, y: 380, r: 56, value: null, hp: 0, maxHp: 0 }, time, 'mix');
  drawStars(ctx, 3, 205, time);
  drawCrab(ctx, WORLD.W / 2 + Math.sin(time * 3) * 40, time);
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
