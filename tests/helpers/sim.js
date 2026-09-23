import { step } from '../../src/game.js';

export function stepUntil(state, pred, maxSteps = 60 * 120) {
  for (let i = 0; i < maxSteps; i++) {
    if (pred(state)) return true;
    step(state);
  }
  return pred(state);
}

export const answerEnemy = (state) =>
  state.question ? state.enemies.find((e) => e.alive && e.value === state.question.answer) : null;
export const decoyEnemy = (state) =>
  state.enemies.find((e) => e.alive && e.value !== null && state.question && e.value !== state.question.answer);
