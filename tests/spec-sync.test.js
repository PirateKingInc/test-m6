// Keeps the SPEC.md level tables and src/data/levels.js in lock-step.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { allLevels } from '../src/data/levels.js';

const spec = readFileSync(new URL('../SPEC.md', import.meta.url), 'utf8');

function range(cell) {
  const m = cell.replace(/−/g, '-').match(/^(-?\d+)–(-?\d+)$/);
  assert.ok(m, `bad range cell "${cell}"`);
  return [Number(m[1]), Number(m[2])];
}

// Parse every "| <id> | ... |" row of the level tables.
function specRows() {
  const rows = {};
  for (const line of spec.split('\n')) {
    const m = line.match(/^\| ([ASMDX](?:\d|-Boss)) \|/);
    if (!m) continue;
    rows[m[1]] = line.split('|').slice(1, -1).map((c) => c.trim());
  }
  return rows;
}

function expectedRow(level) {
  const n = level.boss ? `${level.enemies} + boss HP ${level.boss.hp}` : String(level.enemies);
  const tail = [n, String(level.decoys), String(level.descentSpeed), String(level.safeAnswerTime), level.splashWindow.toFixed(1), String(level.sway)];
  if (level.mix) return { mixes: level.mix.map((m) => m.id).join(', '), tail };
  return { tail, rules: level.rules.join(', ') };
}

const rows = specRows();

for (const level of allLevels()) {
  test(`SPEC.md row for ${level.id} matches levels.js`, () => {
    const row = rows[level.id];
    assert.ok(row, `SPEC.md has no row for ${level.id}`);
    const exp = expectedRow(level);
    if (level.mix) {
      assert.equal(row[1], exp.mixes);
      assert.deepEqual(row.slice(2), exp.tail);
      return;
    }
    let i = 1;
    if (level.op !== 'div') assert.deepEqual(range(row[i++]), level.a, 'a');
    assert.deepEqual(range(row[i++]), level.b, 'b');
    assert.deepEqual(range(row[i++]), level.answer, 'answer');
    assert.deepEqual(range(row[i++]), level.display, 'display');
    assert.deepEqual(row.slice(i, i + 6), exp.tail);
    assert.equal(row[i + 6], exp.rules);
  });
}
