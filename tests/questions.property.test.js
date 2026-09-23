// SPEC §5 property tests: >= 10,000 generated questions per level.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allLevels } from '../src/data/levels.js';
import { makeRound, nearMissBound, RULES } from '../src/questions.js';
import { createRng } from '../src/rng.js';

const SAMPLES = 10000;
const inRange = (v, [lo, hi]) => v >= lo && v <= hi;
const truth = {
  add: (a, b) => a + b,
  sub: (a, b) => a - b,
  mul: (a, b) => a * b,
  div: (a, b) => a / b,
};

function subSpecs(level) {
  return level.mix ? level.mix : [level];
}

for (const level of allLevels()) {
  test(`${level.id}: ${SAMPLES} questions are correct, in range, unique and near-miss`, () => {
    const rng = createRng(0xc0ffee ^ level.id.charCodeAt(0) ^ (level.id.charCodeAt(1) << 8));
    const ruleCounts = {};
    for (let i = 0; i < SAMPLES; i++) {
      const { question: q, decoys } = makeRound(level, rng);
      const spec = subSpecs(level).find((s) => s.op === q.op);
      assert.ok(spec, `op ${q.op} allowed`);
      // Correct answer is mathematically correct.
      assert.equal(q.answer, truth[q.op](q.a, q.b), q.text);
      assert.ok(Number.isInteger(q.answer));
      // Ranges match the spec exactly.
      if (q.op === 'div') {
        assert.ok(inRange(q.b, spec.b), `divisor ${q.b}`);
        assert.equal(q.a, q.b * q.answer);
      } else {
        assert.ok(inRange(q.a, spec.a), `a ${q.a}`);
        assert.ok(inRange(q.b, spec.b), `b ${q.b}`);
      }
      assert.ok(inRange(q.answer, spec.answer), `answer ${q.answer} outside ${spec.answer}`);
      assert.ok(inRange(q.answer, spec.display));
      // Decoys: right count, never the answer, no duplicate values on screen.
      assert.equal(decoys.length, level.decoys);
      const values = [q.answer, ...decoys.map((d) => d.value)];
      assert.equal(new Set(values).size, values.length, `duplicate on screen: ${values}`);
      for (const d of decoys) {
        assert.notEqual(d.value, q.answer);
        assert.ok(inRange(d.value, spec.display), `decoy ${d.value} outside display`);
        // Distractor quality: near-miss and reproducible from its rule.
        assert.ok(Math.abs(d.value - q.answer) <= nearMissBound(q), `decoy ${d.value} too far from ${q.answer}`);
        if (d.rule === 'offk') {
          assert.ok(Math.abs(d.value - q.answer) >= 3);
        } else {
          assert.ok(spec.rules.includes(d.rule), `rule ${d.rule} not allowed`);
          assert.ok(RULES[d.rule](q).includes(d.value), `${d.value} not produced by ${d.rule} for ${q.text}`);
        }
        ruleCounts[d.rule] = (ruleCounts[d.rule] ?? 0) + 1;
      }
    }
    // Fallback fill stays rare: the near-miss rules do the work.
    const total = Object.values(ruleCounts).reduce((s, n) => s + n, 0);
    assert.ok((ruleCounts.offk ?? 0) / total < 0.35, `too many fallback decoys: ${JSON.stringify(ruleCounts)}`);
  });
}

test('an early addition level never produces a two-digit answer or decoy', () => {
  const a1 = allLevels().find((l) => l.id === 'A1');
  const rng = createRng(1);
  for (let i = 0; i < 20000; i++) {
    const { question, decoys } = makeRound(a1, rng);
    assert.ok(question.answer <= 9);
    for (const d of decoys) assert.ok(d.value <= 9 && d.value >= 0);
  }
});
