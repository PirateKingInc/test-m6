// Pure game simulation for a single level attempt. No DOM access.
import { WORLD, TIMING } from './config.js';
import { createRng } from './rng.js';

export function laneLayout(spec) {
  const sway = spec.sway ?? 0;
  const count = spec.enemies;
  const left = WORLD.laneMin + sway;
  const width = (WORLD.laneMax - sway - left) / count;
  return Array.from({ length: count }, (_, i) => ({ x: left + (i + 0.5) * width, width }));
}

function buildFormation(spec) {
  const lanes = laneLayout(spec);
  const staggered = lanes.length >= 5;
  return lanes.map((lane, i) => ({
    id: i,
    lane: i,
    baseX: lane.x,
    baseY: WORLD.startY + (staggered && i % 2 === 1 ? WORLD.stagger : 0),
    halfWidth: lane.width / 2,
    x: lane.x,
    y: 0,
    r: WORLD.enemyR,
    alive: true,
  }));
}

export function createGame(spec, seed = 1) {
  const state = {
    spec,
    rng: createRng(seed),
    t: 0,
    offsetY: 0,
    swayX: 0,
    enemies: buildFormation(spec),
    cannon: { x: WORLD.W / 2 },
    events: [],
  };
  positionEnemies(state);
  return state;
}

function positionEnemies(state) {
  const amp = state.spec.sway ?? 0;
  state.swayX = amp * Math.sin((2 * Math.PI * state.t) / TIMING.swayPeriod);
  for (const e of state.enemies) {
    e.x = e.baseX + state.swayX;
    e.y = e.baseY + state.offsetY;
  }
}

// Advance the simulation by exactly one fixed timestep.
export function step(state, input = {}) {
  const dt = TIMING.dt;
  state.t += dt;
  const move = input.move ?? 0;
  if (move) {
    state.cannon.x = clamp(state.cannon.x + move * WORLD.cannonSpeed * dt, WORLD.laneMin, WORLD.laneMax);
  }
  state.offsetY += state.spec.descentSpeed * dt;
  positionEnemies(state);
  return state;
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
