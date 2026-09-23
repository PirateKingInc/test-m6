// Pure screen flow: which screen is showing, which level is being played, what's unlocked.
// The browser (main.js) and the bots (tests) drive the exact same state machine.
//
// Screens: title → (confirm) → map ⇄ play → clear | gameover → … → ending
import { allLevels, SECTIONS } from './data/levels.js';
import { createProgress, hasProgress } from './progress.js';

export { createProgress };

export const LEVEL_ORDER = allLevels().map((l) => l.id);
// The final (boss) level of every required section.
export const REQUIRED_BOSSES = SECTIONS.filter((s) => !s.optional).map((s) => s.levels[s.levels.length - 1].id);
export const FINAL_REQUIRED = REQUIRED_BOSSES[REQUIRED_BOSSES.length - 1];
export const FINAL_OPTIONAL = LEVEL_ORDER[LEVEL_ORDER.length - 1];
const OPTIONAL_STARTS = SECTIONS.filter((s) => s.optional).map((s) => s.levels[0].id);

export function isUnlocked(progress, id) {
  const i = LEVEL_ORDER.indexOf(id);
  if (i < 0) return false;
  if (OPTIONAL_STARTS.includes(id) && !REQUIRED_BOSSES.every((b) => progress.cleared.includes(b))) return false;
  return i === 0 || progress.cleared.includes(LEVEL_ORDER[i - 1]);
}

// The level the map suggests: the first unlocked, uncleared level (or the first level).
export function frontierLevel(progress) {
  return LEVEL_ORDER.find((id) => isUnlocked(progress, id) && !progress.cleared.includes(id)) ?? LEVEL_ORDER[0];
}

export function createFlow(progress = createProgress()) {
  return { screen: 'title', levelId: null, lastResult: null, ending: null, progress };
}

// Title "play": continue on the map when there's a save, otherwise start fresh.
export function play(flow) {
  if (hasProgress(flow.progress)) flow.screen = 'map';
  else newGame(flow);
}

export function askNewGame(flow) {
  flow.screen = 'confirm';
}

export function newGame(flow) {
  flow.progress = createProgress();
  return startLevel(flow, LEVEL_ORDER[0]);
}

export function toMap(flow) {
  flow.screen = 'map';
}

export function toTitle(flow) {
  flow.screen = 'title';
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
  const { progress } = flow;
  if (flow.screen === 'clear') {
    // The ending plays the first time the last required boss falls — Mixed is never needed.
    if (flow.levelId === FINAL_REQUIRED && !progress.endings.main) {
      progress.endings.main = true;
      flow.ending = 'main';
      flow.screen = 'ending';
      return;
    }
    if (flow.levelId === FINAL_OPTIONAL && !progress.endings.mixed) {
      progress.endings.mixed = true;
      flow.ending = 'mixed';
      flow.screen = 'ending';
      return;
    }
    const next = nextLevelId(flow.levelId);
    // Mixed Operations is optional: after the main ending, go to the map instead.
    if (next && flow.levelId !== FINAL_REQUIRED && startLevel(flow, next)) return;
    flow.screen = 'map';
  } else if (flow.screen === 'gameover') {
    startLevel(flow, flow.levelId);
  } else {
    flow.screen = 'map';
  }
}
