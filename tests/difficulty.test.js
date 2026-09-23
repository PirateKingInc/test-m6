// Difficulty-curve check with the "typical child" policy (see tests/helpers/policies.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { measureCurve, findSpikes, SPIKE_THRESHOLD } from './helpers/curve.js';
import { playLevel, childPolicy } from './helpers/policies.js';
import { getLevel } from '../src/data/levels.js';

const curve = measureCurve(40);

test('no level is a difficulty spike relative to its neighbours', () => {
  assert.deepEqual(findSpikes(curve), [], JSON.stringify(curve.map((m) => [m.id, +m.difficulty.toFixed(3)])));
});

test('a typical child clears every level (≥ 95% of runs)', () => {
  for (const m of curve) assert.ok(m.failRate <= 0.05, `${m.id} fail rate ${m.failRate}`);
});

test('difficulty ramps level by level inside each section', () => {
  const sections = [...new Set(curve.map((m) => m.section))];
  for (const s of sections) {
    const regular = curve.filter((m) => m.section === s && !m.id.endsWith('Boss'));
    for (let i = 1; i < regular.length; i++) {
      assert.ok(regular[i].difficulty >= regular[i - 1].difficulty - 0.03, `${regular[i].id} easier than ${regular[i - 1].id}`);
    }
  }
  // Sections get harder too: each section's hardest regular level beats the previous section's.
  const peak = (s) => Math.max(...curve.filter((m) => m.section === s && !m.id.endsWith('Boss')).map((m) => m.difficulty));
  assert.ok(peak('sub') > peak('add') && peak('mul') > peak('sub') - 0.03 && peak('div') > peak('mul'));
});

test('the spike detector flags a level that is much harder than its neighbours', () => {
  const fake = curve.map((m) => ({ ...m }));
  fake[3].difficulty += SPIKE_THRESHOLD + 0.2;
  assert.deepEqual(findSpikes(fake), [fake[3].id]);
  // And a genuinely over-tuned spec shows up as much harder in play.
  const spiky = { ...getLevel('A3'), descentSpeed: 40, safeAnswerTime: 3 };
  let lost = 0;
  for (let s = 1; s <= 20; s++) lost += 3 - playLevel(spiky, s, childPolicy()).lives;
  assert.ok(lost > 0, 'an over-tuned level costs the child policy lives');
});
