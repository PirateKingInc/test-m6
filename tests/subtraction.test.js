import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allLevels } from '../src/data/levels.js';
import { makeRound } from '../src/questions.js';
import { createRng } from '../src/rng.js';
import { LEVEL_ORDER } from '../src/flow.js';

const subLevels = allLevels().filter((l) => l.section === 'sub');

test('subtraction section follows addition in the level order', () => {
  assert.ok(subLevels.length >= 5);
  assert.ok(LEVEL_ORDER.indexOf('S1') > LEVEL_ORDER.indexOf('A5'));
});

test('only S5 and later produce negative answers, and they do produce them', () => {
  for (const level of subLevels) {
    const rng = createRng(3);
    let negatives = 0;
    let signDecoys = 0;
    for (let i = 0; i < 5000; i++) {
      const { question, decoys } = makeRound(level, rng);
      if (question.answer < 0) negatives++;
      signDecoys += decoys.filter((d) => d.rule === 'sign').length;
    }
    if (level.answer[0] < 0) {
      assert.ok(negatives > 500, `${level.id} should include negative answers`);
      assert.ok(signDecoys > 500, `${level.id} should use sign-confusion decoys`);
    } else {
      assert.equal(negatives, 0, level.id);
    }
  }
});

test('question text uses a real minus sign', () => {
  const { question } = makeRound(subLevels[0], createRng(1));
  assert.match(question.text, /^\d+ − \d+$/);
});
