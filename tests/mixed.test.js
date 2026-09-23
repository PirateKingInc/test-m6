import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allLevels, SECTIONS } from '../src/data/levels.js';
import { makeRound } from '../src/questions.js';
import { createRng } from '../src/rng.js';
import { createProgress, isUnlocked, LEVEL_ORDER } from '../src/flow.js';

const mixLevels = allLevels().filter((l) => l.section === 'mix');

test('the game has 4 sections of 6 levels plus 4 optional mixed levels', () => {
  assert.equal(SECTIONS.length, 5);
  for (const s of SECTIONS.slice(0, 4)) assert.equal(s.levels.length, 6);
  assert.equal(mixLevels.length, 4);
  assert.equal(allLevels().length, 28);
  assert.ok(SECTIONS[4].optional);
});

test('mixed levels draw every operation from their referenced specs', () => {
  for (const level of mixLevels) {
    assert.deepEqual(level.mix.map((m) => m.op), ['add', 'sub', 'mul', 'div']);
    const rng = createRng(17);
    const ops = {};
    for (let i = 0; i < 4000; i++) {
      const { question } = makeRound(level, rng);
      ops[question.op] = (ops[question.op] ?? 0) + 1;
    }
    for (const op of ['add', 'sub', 'mul', 'div']) assert.ok(ops[op] > 700, `${level.id} ${op}: ${ops[op]}`);
  }
});

test('mixed operations unlock only after every section boss is cleared', () => {
  const progress = createProgress();
  const required = LEVEL_ORDER.slice(0, LEVEL_ORDER.indexOf('X1'));
  assert.equal(required.length, 24);
  assert.equal(required[required.length - 1], 'D-Boss');
  for (const id of required.slice(0, -1)) {
    progress.cleared.push(id);
    assert.ok(!isUnlocked(progress, 'X1'), `X1 must stay locked after only ${id}`);
  }
  progress.cleared.push('D-Boss');
  assert.ok(isUnlocked(progress, 'X1'));
  // Even a save that somehow skipped a section boss keeps Mixed locked.
  progress.cleared.splice(progress.cleared.indexOf('M-Boss'), 1);
  assert.ok(!isUnlocked(progress, 'X1'));
});
