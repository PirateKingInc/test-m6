import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createAudio } from '../src/audio.js';

test('audio is silent and safe without Web Audio (e.g. Node, old browsers)', () => {
  const audio = createAudio(null);
  audio.unlock();
  audio.handle([{ type: 'fire' }, { type: 'correct', fast: true }, { type: 'unknown' }]);
  assert.equal(audio.muted, false);
});

test('mute preference persists and tolerates throwing storage', () => {
  const data = {};
  const store = { getItem: (k) => data[k] ?? null, setItem: (k, v) => (data[k] = v) };
  const a = createAudio(store);
  assert.equal(a.toggleMute(), true);
  assert.equal(createAudio(store).muted, true);
  const bad = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  const b = createAudio(bad);
  assert.equal(b.muted, false);
  assert.equal(b.toggleMute(), true);
});

test('no audio or image asset files ship with the game, and pure modules never touch audio/DOM', () => {
  const src = new URL('../src/', import.meta.url);
  for (const f of readdirSync(src, { recursive: true })) {
    assert.ok(!/\.(mp3|wav|ogg|png|jpe?g|gif|webp|svg)$/i.test(f), `asset file ${f}`);
  }
  for (const f of ['game.js', 'questions.js', 'flow.js', 'progress.js', 'rng.js', 'data/levels.js']) {
    const code = readFileSync(new URL(f, src), 'utf8');
    assert.ok(!/AudioContext|document\.|window\.|canvas/i.test(code), `${f} must stay pure`);
  }
});
