import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadProgress, saveProgress, createProgress, sectionHighScore, STORAGE_KEY } from '../src/progress.js';
import { createFlow, newGame, finishLevel, advance, startLevel, play, askNewGame, frontierLevel, LEVEL_ORDER } from '../src/flow.js';
import { buttonsFor, hitButton } from '../src/screens.js';

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return { getItem: (k) => data[k] ?? null, setItem: (k, v) => (data[k] = String(v)), data };
}

test('progress round-trips through storage', () => {
  const store = memoryStorage();
  const p = createProgress();
  p.cleared.push('A1', 'A2');
  p.best.A1 = 1234;
  p.endings.main = true;
  assert.ok(saveProgress(store, p));
  assert.deepEqual(loadProgress(store), p);
});

test('missing, corrupt, hostile or throwing storage all load a fresh save', () => {
  assert.deepEqual(loadProgress(null), createProgress());
  assert.deepEqual(loadProgress(memoryStorage({ [STORAGE_KEY]: '{not json' })), createProgress());
  assert.deepEqual(loadProgress(memoryStorage({ [STORAGE_KEY]: '42' })), createProgress());
  const throwing = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } };
  assert.deepEqual(loadProgress(throwing), createProgress());
  assert.equal(saveProgress(throwing, createProgress()), false);
  const junk = loadProgress(memoryStorage({ [STORAGE_KEY]: JSON.stringify({ cleared: ['A1', 'Z9', 'A1'], best: { A1: 50, Q: 9, A2: 'x' }, endings: { main: 'yes' } }) }));
  assert.deepEqual(junk.cleared, ['A1']);
  assert.deepEqual(junk.best, { A1: 50 });
  assert.equal(junk.endings.main, false);
});

test('section high score is the sum of the section level bests', () => {
  const p = createProgress();
  p.best = { A1: 100, A2: 250, S1: 999 };
  assert.equal(sectionHighScore(p, 'add'), 350);
  assert.equal(sectionHighScore(p, 'sub'), 999);
  assert.equal(sectionHighScore(p, 'mix'), 0);
});

function clearUpTo(flow, lastId) {
  for (const id of LEVEL_ORDER) {
    assert.ok(startLevel(flow, id), `${id} unlocked`);
    finishLevel(flow, 'clear', 500, 3);
    if (id === lastId) return;
  }
}

test('the ending plays after the Division boss without touching Mixed', () => {
  const f = createFlow();
  newGame(f);
  clearUpTo(f, 'D-Boss');
  advance(f);
  assert.equal(f.screen, 'ending');
  assert.equal(f.ending, 'main');
  assert.ok(f.progress.endings.main);
  advance(f);
  assert.equal(f.screen, 'map');
  // Replaying the boss later doesn't replay the ending and doesn't force Mixed.
  startLevel(f, 'D-Boss');
  finishLevel(f, 'clear', 10, 1);
  advance(f);
  assert.equal(f.screen, 'map');
});

test('clearing the Mixed boss shows the extended ending', () => {
  const f = createFlow();
  newGame(f);
  clearUpTo(f, 'D-Boss');
  advance(f);
  clearUpTo(f, 'X-Boss');
  advance(f);
  assert.equal(f.screen, 'ending');
  assert.equal(f.ending, 'mixed');
});

test('title play continues on the map when a save exists; new game asks first', () => {
  const f = createFlow();
  play(f);
  assert.equal(f.screen, 'play');
  finishLevel(f, 'clear', 300, 2);
  const g = createFlow(f.progress);
  assert.ok(buttonsFor(g).some((b) => b.id === 'new'));
  play(g);
  assert.equal(g.screen, 'map');
  assert.equal(frontierLevel(g.progress), 'A2');
  askNewGame(g);
  assert.equal(g.screen, 'confirm');
});

test('map offers exactly the unlocked levels as big buttons', () => {
  const f = createFlow();
  newGame(f);
  clearUpTo(f, 'A3');
  f.screen = 'map';
  const levels = buttonsFor(f).filter((b) => b.levelId).map((b) => b.levelId);
  assert.deepEqual(levels, ['A1', 'A2', 'A3', 'A4']);
  for (const b of buttonsFor(f)) {
    assert.ok(b.r >= 27, 'touch target radius');
    assert.equal(hitButton(f, b.x, b.y).id, b.id);
  }
});
