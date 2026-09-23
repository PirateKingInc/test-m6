import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const spec = readFileSync(new URL('../SPEC.md', import.meta.url), 'utf8');

test('SPEC.md covers every required section', () => {
  for (const heading of [
    'Speed-to-damage (splash) formula',
    'Survivability guarantee',
    'Level difficulty specs',
    'Distractor rules',
    'Out of scope',
  ]) {
    assert.ok(spec.includes(heading), `missing: ${heading}`);
  }
});

test('BACKLOG.md exists', () => {
  assert.ok(readFileSync(new URL('../BACKLOG.md', import.meta.url), 'utf8').length > 0);
});
