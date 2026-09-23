// Browser entry: canvas sizing, fixed-timestep loop, input, screen wiring.
// Rules live in game.js (one level) and flow.js (screens/progress).
import { WORLD, TIMING } from './config.js';
import { createGame, step, fire, fireAtX, setCannonX, targetAt } from './game.js';
import { getLevel } from './data/levels.js';
import { createFlow, newGame, finishLevel, advance } from './flow.js';
import { drawGame } from './render.js';
import { drawTitle, drawResult, drawHud, hitButton } from './screens.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let scale = 1;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  scale = Math.min(window.innerWidth / WORLD.W, window.innerHeight / WORLD.H);
  canvas.style.width = `${WORLD.W * scale}px`;
  canvas.style.height = `${WORLD.H * scale}px`;
  canvas.width = Math.round(WORLD.W * scale * dpr);
  canvas.height = Math.round(WORLD.H * scale * dpr);
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();

const flow = createFlow();
let game = null;
let gameKey = null;
let attempt = 0;
let menuTime = 0;

function syncGame() {
  if (flow.screen !== 'play') return;
  const key = `${flow.levelId}#${attempt}`;
  if (key !== gameKey) {
    game = createGame(getLevel(flow.levelId), (Date.now() ^ (attempt * 7919)) >>> 0);
    gameKey = key;
  }
}

function press(id) {
  if (id === 'play') newGame(flow);
  else if (id === 'advance') advance(flow);
  attempt++;
  syncGame();
}

const keys = new Set();
window.addEventListener('keydown', (e) => {
  keys.add(e.key);
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    if (flow.screen === 'play') fire(game);
    else if (!e.repeat) press(flow.screen === 'title' ? 'play' : 'advance');
  }
});
window.addEventListener('keyup', (e) => keys.delete(e.key));

function toWorld(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale };
}
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'mouse' && flow.screen === 'play') setCannonX(game, toWorld(e).x);
});
canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  canvas.focus();
  const p = toWorld(e);
  if (flow.screen === 'play') {
    fireAtX(game, p.x);
  } else {
    const b = hitButton(flow, p.x, p.y);
    if (b) press(b.id);
  }
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

let last = performance.now();
let acc = 0;
function frame(now) {
  const elapsed = Math.min(0.25, (now - last) / 1000);
  last = now;
  menuTime += elapsed;
  if (flow.screen === 'play') {
    acc += elapsed;
    const move = (keys.has('ArrowRight') || keys.has('d') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('a') ? 1 : 0);
    while (acc >= TIMING.dt && !game.result) {
      step(game, { move });
      acc -= TIMING.dt;
    }
    game.events.length = 0;
    if (game.result) {
      finishLevel(flow, game.result, game.score, game.lives);
      acc = 0;
    }
  }
  if (flow.screen === 'play') {
    drawGame(ctx, game, targetAt(game, game.cannon.x));
    drawHud(ctx, game, flow.levelId);
  } else if (flow.screen === 'title') {
    drawTitle(ctx, flow, menuTime);
  } else {
    drawResult(ctx, flow, menuTime);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
