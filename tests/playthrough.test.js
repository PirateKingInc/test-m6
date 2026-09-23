// Bot playthroughs over the same flow + game modules the browser uses.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFlow, play, finishLevel, advance, startLevel, REQUIRED_BOSSES } from '../src/flow.js';
import { getLevel } from '../src/data/levels.js';
import { playLevel, childPolicy } from './helpers/policies.js';

// Drive the flow until `done(flow)`, playing every level the flow puts on screen.
function drive(flow, done, policy, log) {
  let seed = 1;
  for (let guard = 0; guard < 500 && !done(flow); guard++) {
    if (flow.screen === 'play') {
      const r = playLevel(getLevel(flow.levelId), seed++, policy);
      log.push(`${flow.levelId}:${r.result}:${r.score}`);
      finishLevel(flow, r.result, r.score, r.lives);
    } else {
      advance(flow);
    }
  }
}

test('bot 1: New Game → all four sections and bosses → ending', () => {
  const flow = createFlow();
  play(flow); // New Game from the title screen
  assert.equal(flow.levelId, 'A1');
  const log = [];
  drive(flow, (f) => f.screen === 'ending', childPolicy(), log);
  assert.equal(flow.screen, 'ending');
  assert.equal(flow.ending, 'main');
  for (const boss of REQUIRED_BOSSES) assert.ok(flow.progress.cleared.includes(boss), `${boss} beaten`);
  assert.ok(!flow.progress.cleared.some((id) => id.startsWith('X')), 'Mixed was not needed');
  assert.equal(log.filter((l) => l.includes(':clear:')).length, 24);
  advance(flow);
  assert.equal(flow.screen, 'map');
});

test('bot 2: New Game → ending → Mixed Operations → extended ending', () => {
  const flow = createFlow();
  play(flow);
  const log = [];
  drive(flow, (f) => f.screen === 'ending', childPolicy(), log);
  advance(flow); // ending → map
  assert.ok(startLevel(flow, 'X1'), 'Mixed unlocked after the ending');
  drive(flow, (f) => f.screen === 'ending', childPolicy(), log);
  assert.equal(flow.ending, 'mixed');
  assert.ok(flow.progress.cleared.includes('X-Boss'));
  assert.equal(flow.progress.cleared.length, 28);
  assert.ok(flow.progress.endings.main && flow.progress.endings.mixed);
});
