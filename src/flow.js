// Pure screen flow: which screen is showing, which level is being played, what's unlocked.
// The browser (main.js) and the bots (tests) drive the exact same state machine.
import { allLevels, SECTIONS } from './data/levels.js';

export const LEVEL_ORDER = allLevels().map((l) => l.id);
// The final (boss) level of every required section.
export const REQUIRED_BOSSES = SECTIONS.filter((s) => !s.optional).map((s) => s.levels[s.levels.length - 1].id);
const OPTIONAL_STARTS = SECTIONS.filter((s) => s.optional).map((s) => s.levels[0].id);

export function createProgress() {
  return { cleared: [], best: {} };
}

export function isUnlocked(progress, id) {
  const i = LEVEL_ORDER.indexOf(id);
  if (i < 0) return false;
  if (OPTIONAL_STARTS.includes(id) && !REQUIRED_BOSSES.every((b) => progress.cleared.includes(b))) return false;
  return i === 0 || progress.cleared.includes(LEVEL_ORDER[i - 1]);
}

export function createFlow(progress = createProgress()) {
  return { screen: 'title', levelId: null, lastResult: null, progress };
}

export function newGame(flow) {
  flow.progress = createProgress();
  return startLevel(flow, LEVEL_ORDER[0]);
}

export function startLevel(flow, id) {
  if (!isUnlocked(flow.progress, id)) return false;
  flow.screen = 'play';
  flow.levelId = id;
  flow.lastResult = null;
  return true;
}

// Called by the host when the level simulation reports a result.
export function finishLevel(flow, outcome, score, lives = 0) {
  const { progress } = flow;
  const newBest = score > (progress.best[flow.levelId] ?? 0);
  if (outcome === 'clear') {
    if (!progress.cleared.includes(flow.levelId)) progress.cleared.push(flow.levelId);
    if (newBest) progress.best[flow.levelId] = score;
  }
  flow.lastResult = { outcome, score, stars: outcome === 'clear' ? Math.max(1, lives) : 0, newBest: outcome === 'clear' && newBest };
  flow.screen = outcome === 'clear' ? 'clear' : 'gameover';
}

export function nextLevelId(id) {
  const i = LEVEL_ORDER.indexOf(id);
  return i >= 0 && i + 1 < LEVEL_ORDER.length ? LEVEL_ORDER[i + 1] : null;
}

// Primary "continue" action from a result screen.
export function advance(flow) {
  if (flow.screen === 'clear') {
    const next = nextLevelId(flow.levelId);
    if (next && startLevel(flow, next)) return;
    flow.screen = 'title';
  } else if (flow.screen === 'gameover') {
    startLevel(flow, flow.levelId);
  } else {
    flow.screen = 'title';
  }
}
