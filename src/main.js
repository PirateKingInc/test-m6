// Browser entry: canvas sizing, fixed-timestep loop, input. Game rules live in game.js.
import { WORLD, TIMING } from './config.js';
import { createGame, step } from './game.js';
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

const keys = new Set();
window.addEventListener('keydown', (e) => keys.add(e.key));
window.addEventListener('keyup', (e) => keys.delete(e.key));

const demoSpec = { enemies: 6, descentSpeed: 10, sway: 16 };
let state = createGame(demoSpec, Date.now());

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
  if (state.offsetY > 500) state = createGame(demoSpec, Date.now());
  drawGame(ctx, state, null);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
