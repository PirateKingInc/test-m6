import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allLevels } from '../src/data/levels.js';
import { makeRound } from '../src/questions.js';
import { createRng } from '../src/rng.js';

const divLevels = allLevels().filter((l) => l.section === 'div');

test('division levels exist and follow multiplication', () => {
  assert.ok(divLevels.length >= 5);
  const ids = allLevels().map((l) => l.id);
  assert.ok(ids.indexOf('D1') > ids.indexOf('M5'));
});

test('division is always exact and never divides by zero', () => {
  for (const level of divLevels) {
    const rng = createRng(21);
    for (let i = 0; i < 10000; i++) {
      const { question: q } = makeRound(level, rng);
      assert.ok(q.b !== 0);
      assert.equal(q.a % q.b, 0, q.text);
      assert.equal(q.a / q.b, q.answer);
      assert.match(q.text, /^\d+ ÷ \d+$/);
    }
  }
});

test('"answered with the divisor" decoys appear where allowed', () => {
  const d4 = divLevels.find((l) => l.id === 'D4');
  const rng = createRng(5);
  let divisorDecoys = 0;
  for (let i = 0; i < 2000; i++) divisorDecoys += makeRound(d4, rng).decoys.filter((d) => d.rule === 'divisor').length;
  assert.ok(divisorDecoys > 500);
});
