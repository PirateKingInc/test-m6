import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allLevels } from '../src/data/levels.js';
import { makeRound } from '../src/questions.js';
import { createRng } from '../src/rng.js';

const mulLevels = allLevels().filter((l) => l.section === 'mul');

test('multiplication levels exist and follow subtraction', () => {
  assert.ok(mulLevels.length >= 5);
  const ids = allLevels().map((l) => l.id);
  assert.ok(ids.indexOf('M1') > ids.indexOf('S5'));
});

test('multiplication decoys lean on "one group off" misconceptions', () => {
  for (const level of mulLevels) {
    const rng = createRng(11);
    let group = 0;
    let total = 0;
    for (let i = 0; i < 3000; i++) {
      const { decoys } = makeRound(level, rng);
      group += decoys.filter((d) => d.rule === 'group').length;
      total += decoys.length;
    }
    assert.ok(group / total > 0.2, `${level.id}: group share ${group / total}`);
  }
});

test('question text uses the × sign', () => {
  const { question } = makeRound(mulLevels[0], createRng(2));
  assert.match(question.text, /^\d+ × \d+$/);
});
