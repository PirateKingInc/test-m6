// Browser entry: canvas sizing, fixed-timestep loop, input. Game rules live in game.js.
import { WORLD, TIMING } from './config.js';
import { createGame, step, fire, fireAtX, setCannonX, targetAt } from './game.js';
import { getLevel } from './data/levels.js';
import { drawGame } from './render.js';

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

const spec = getLevel('A1');
let state = createGame(spec, Date.now() >>> 0);

const keys = new Set();
window.addEventListener('keydown', (e) => {
  keys.add(e.key);
  if (e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault();
    fire(state);
  }
});
window.addEventListener('keyup', (e) => keys.delete(e.key));

// Convert a pointer event to world coordinates.
function toWorld(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale };
}
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'mouse') setCannonX(state, toWorld(e).x);
});
canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  canvas.focus();
  fireAtX(state, toWorld(e).x);
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

let last = performance.now();
let acc = 0;
function frame(now) {
  acc += Math.min(0.25, (now - last) / 1000);
  last = now;
  const move = (keys.has('ArrowRight') || keys.has('d') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('a') ? 1 : 0);
  while (acc >= TIMING.dt) {
    step(state, { move });
    acc -= TIMING.dt;
  }
  if (state.result || state.offsetY > 500) state = createGame(spec, Date.now() >>> 0);
  drawGame(ctx, state, targetAt(state, state.cannon.x));
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
