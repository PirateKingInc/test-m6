import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFlow, newGame, finishLevel, advance, isUnlocked, startLevel, LEVEL_ORDER, createProgress } from '../src/flow.js';

test('new game starts the first addition level', () => {
  const f = createFlow();
  assert.equal(f.screen, 'title');
  newGame(f);
  assert.equal(f.screen, 'play');
  assert.equal(f.levelId, 'A1');
});

test('levels unlock in order and clearing advances to the next level', () => {
  const f = createFlow();
  newGame(f);
  assert.equal(startLevel(f, 'A3'), false, 'locked levels cannot be started');
  finishLevel(f, 'clear', 900);
  assert.equal(f.screen, 'clear');
  assert.equal(f.lastResult.newBest, true);
  assert.ok(isUnlocked(f.progress, 'A2'));
  advance(f);
  assert.equal(f.screen, 'play');
  assert.equal(f.levelId, 'A2');
});

test('best score only rises', () => {
  const f = createFlow();
  newGame(f);
  finishLevel(f, 'clear', 900);
  startLevel(f, 'A1');
  finishLevel(f, 'clear', 500);
  assert.equal(f.progress.best.A1, 900);
  assert.equal(f.lastResult.newBest, false);
});

test('level order starts with the addition section', () => {
  assert.deepEqual(LEVEL_ORDER.slice(0, 5), ['A1', 'A2', 'A3', 'A4', 'A5']);
  assert.ok(isUnlocked(createProgress(), 'A1'));
  assert.ok(!isUnlocked(createProgress(), 'A2'));
});
