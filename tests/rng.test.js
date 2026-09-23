import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/rng.js';

test('same seed gives the same sequence', () => {
  const a = createRng(42);
  const b = createRng(42);
  for (let i = 0; i < 100; i++) assert.equal(a.next(), b.next());
});

test('different seeds diverge', () => {
  const a = createRng(1);
  const b = createRng(2);
  assert.notEqual(a.next(), b.next());
});

test('int stays inside inclusive bounds and hits both ends', () => {
  const r = createRng(7);
  const seen = new Set();
  for (let i = 0; i < 5000; i++) {
    const v = r.int(-3, 3);
    assert.ok(v >= -3 && v <= 3);
    seen.add(v);
  }
  assert.equal(seen.size, 7);
});

test('shuffle is a permutation', () => {
  const r = createRng(9);
  const arr = r.shuffle([1, 2, 3, 4, 5, 6]);
  assert.deepEqual([...arr].sort(), [1, 2, 3, 4, 5, 6]);
});
