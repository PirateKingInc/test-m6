// Browser entry: canvas sizing, fixed-timestep loop, input, screen wiring.
// Rules live in game.js (one level) and flow.js (screens/progress).
import { WORLD, TIMING } from './config.js';
import { createGame, step, fire, fireAtX, setCannonX, targetAt } from './game.js';
import { getLevel } from './data/levels.js';
import { createFlow, frontierLevel, play, askNewGame, newGame, toMap, toTitle, startLevel, finishLevel, advance } from './flow.js';
import { loadProgress, saveProgress } from './progress.js';
import { createAudio } from './audio.js';
import { drawGame } from './render.js';
import { drawTitle, drawResult, drawHud, drawMap, drawConfirm, drawEnding, drawPause, hitButton, hudButtons, pauseButtons } from './screens.js';

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

function storage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const flow = createFlow(loadProgress(storage()));
const audio = createAudio(storage());
let paused = false;
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

const ACTIONS = {
  play: () => play(flow),
  new: () => askNewGame(flow),
  confirmNew: () => newGame(flow),
  title: () => toTitle(flow),
  map: () => toMap(flow),
  advance: () => advance(flow),
};

function press(id) {
  audio.ui();
  paused = false;
  if (id.startsWith('level:')) startLevel(flow, id.slice(6));
  else ACTIONS[id]?.();
  attempt++;
  saveProgress(storage(), flow.progress);
  syncGame();
}

// Enter/Space on a menu presses the screen's main button.
const PRIMARY = { title: 'play', confirm: 'title', map: null, clear: 'advance', gameover: 'advance', ending: 'map' };

// The only pause in the game is one the player asks for (or leaving the tab).
function setPaused(value) {
  paused = value && flow.screen === 'play';
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) setPaused(true);
});

function pressHud(id) {
  if (id === 'pause') setPaused(!paused);
  else if (id === 'mute') audio.toggleMute();
  else if (id === 'resume') setPaused(false);
  else press(id);
}

const keys = new Set();
window.addEventListener('keydown', (e) => {
  audio.unlock();
  keys.add(e.key);
  if (e.key === 'm' || e.key === 'M') audio.toggleMute();
  if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') setPaused(!paused);
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    if (flow.screen === 'play') {
      if (paused) setPaused(false);
      else fire(game);
    }
    else if (!e.repeat && flow.screen === 'map') press(`level:${frontierLevel(flow.progress)}`);
    else if (!e.repeat && PRIMARY[flow.screen]) press(PRIMARY[flow.screen]);
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
  audio.unlock();
  const p = toWorld(e);
  if (flow.screen === 'play') {
    const buttons = paused ? pauseButtons() : hudButtons(audio.muted);
    const hit = buttons.find((b) => Math.hypot(p.x - b.x, p.y - b.y) <= b.r + 10);
    if (hit) pressHud(hit.id);
    else if (!paused && p.y > WORLD.bannerH) fireAtX(game, p.x);
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
  if (flow.screen === 'play' && !paused) {
    acc += elapsed;
    const move = (keys.has('ArrowRight') || keys.has('d') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('a') ? 1 : 0);
    while (acc >= TIMING.dt && !game.result) {
      step(game, { move });
      acc -= TIMING.dt;
    }
    audio.handle(game.events);
    game.events.length = 0;
    if (game.result) {
      finishLevel(flow, game.result, game.score, game.lives);
      saveProgress(storage(), flow.progress);
      acc = 0;
    }
  }
  if (flow.screen === 'play') {
    drawGame(ctx, game, targetAt(game, game.cannon.x));
    drawHud(ctx, game, flow.levelId, audio.muted);
    if (paused) drawPause(ctx, menuTime);
  } else if (flow.screen === 'title') {
    drawTitle(ctx, flow, menuTime);
  } else if (flow.screen === 'map') {
    drawMap(ctx, flow, menuTime);
  } else if (flow.screen === 'confirm') {
    drawConfirm(ctx, flow, menuTime);
  } else if (flow.screen === 'ending') {
    drawEnding(ctx, flow, menuTime);
  } else {
    drawResult(ctx, flow, menuTime);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
