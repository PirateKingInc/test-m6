// Level difficulty specs (SPEC.md §4). Data only: the generator, the simulation and the
// renderer all read from here. Ranges are inclusive [min, max].
//
//   a, b            operand ranges (for ÷, b is the divisor)
//   answer          range the correct result must fall in (for ÷, the quotient)
//   display         range every on-screen number must fall in
//   enemies         jellies in the formation (escorts, for boss levels)
//   decoys          wrong answers shown per question (the rest show a blank)
//   descentSpeed    units per second
//   safeAnswerTime  seconds per question the level promises to tolerate forever
//   splashWindow    answers faster than this (seconds) splash
//   sway            sideways drift amplitude in units
//   rules           allowed distractor rules (SPEC §5)

export const SECTIONS = [
  {
    id: 'add',
    op: 'add',
    name: 'Sunlit Shallows',
    boss: 'Captain Carryclaw',
    levels: [
      { id: 'A1', a: [0, 5], b: [0, 4], answer: [0, 9], display: [0, 9], enemies: 3, decoys: 1, descentSpeed: 8, safeAnswerTime: 12, splashWindow: 4.0, sway: 0, rules: ['off1', 'off2'] },
      { id: 'A2', a: [0, 9], b: [0, 9], answer: [0, 9], display: [0, 9], enemies: 4, decoys: 2, descentSpeed: 9, safeAnswerTime: 11, splashWindow: 3.6, sway: 10, rules: ['off1', 'off2'] },
      { id: 'A3', a: [1, 9], b: [1, 9], answer: [2, 18], display: [0, 20], enemies: 5, decoys: 3, descentSpeed: 10, safeAnswerTime: 10, splashWindow: 3.2, sway: 16, rules: ['off1', 'off2', 'op', 'place'] },
      { id: 'A4', a: [10, 40], b: [1, 9], answer: [11, 49], display: [0, 60], enemies: 5, decoys: 3, descentSpeed: 11, safeAnswerTime: 10, splashWindow: 3.0, sway: 16, rules: ['off1', 'off2', 'place', 'op'] },
      { id: 'A5', a: [10, 50], b: [10, 49], answer: [20, 99], display: [0, 120], enemies: 6, decoys: 4, descentSpeed: 12, safeAnswerTime: 9, splashWindow: 2.8, sway: 20, rules: ['off1', 'off2', 'place', 'op'] },
    ],
  },
  {
    id: 'sub',
    op: 'sub',
    name: 'Kelp Forest',
    boss: 'Borrowfin',
    levels: [
      { id: 'S1', a: [1, 9], b: [0, 9], answer: [0, 9], display: [0, 9], enemies: 4, decoys: 2, descentSpeed: 10, safeAnswerTime: 11, splashWindow: 3.6, sway: 10, rules: ['off1', 'off2'] },
      { id: 'S2', a: [5, 18], b: [1, 9], answer: [0, 9], display: [0, 20], enemies: 5, decoys: 3, descentSpeed: 11, safeAnswerTime: 10, splashWindow: 3.2, sway: 16, rules: ['off1', 'off2', 'op'] },
      { id: 'S3', a: [10, 50], b: [1, 9], answer: [1, 49], display: [0, 60], enemies: 5, decoys: 3, descentSpeed: 12, safeAnswerTime: 10, splashWindow: 3.0, sway: 16, rules: ['off1', 'off2', 'op', 'place'] },
      { id: 'S4', a: [20, 99], b: [10, 49], answer: [1, 89], display: [0, 150], enemies: 6, decoys: 4, descentSpeed: 13, safeAnswerTime: 9, splashWindow: 2.8, sway: 20, rules: ['off1', 'off2', 'op', 'place'] },
      { id: 'S5', a: [0, 20], b: [0, 20], answer: [-20, 20], display: [-40, 40], enemies: 6, decoys: 4, descentSpeed: 14, safeAnswerTime: 9, splashWindow: 2.6, sway: 20, rules: ['off1', 'off2', 'sign', 'op'] },
    ],
  },
  {
    id: 'mul',
    op: 'mul',
    name: 'Coral Canyon',
    boss: 'Timestentacle',
    levels: [
      { id: 'M1', a: [0, 5], b: [1, 2], answer: [0, 10], display: [0, 12], enemies: 4, decoys: 2, descentSpeed: 12, safeAnswerTime: 10, splashWindow: 3.4, sway: 10, rules: ['off1', 'off2', 'group'] },
      { id: 'M2', a: [1, 5], b: [1, 5], answer: [1, 25], display: [0, 30], enemies: 5, decoys: 3, descentSpeed: 13, safeAnswerTime: 10, splashWindow: 3.2, sway: 16, rules: ['group', 'off1', 'op'] },
      { id: 'M3', a: [2, 9], b: [2, 5], answer: [4, 45], display: [0, 60], enemies: 5, decoys: 3, descentSpeed: 14, safeAnswerTime: 9, splashWindow: 3.0, sway: 16, rules: ['group', 'off1', 'op'] },
      { id: 'M4', a: [2, 9], b: [2, 9], answer: [4, 81], display: [0, 100], enemies: 6, decoys: 4, descentSpeed: 15, safeAnswerTime: 9, splashWindow: 2.8, sway: 20, rules: ['group', 'off1', 'op', 'place'] },
      { id: 'M5', a: [2, 12], b: [2, 12], answer: [4, 144], display: [0, 160], enemies: 7, decoys: 5, descentSpeed: 16, safeAnswerTime: 8, splashWindow: 2.6, sway: 20, rules: ['group', 'off1', 'op', 'place'] },
    ],
  },
  {
    id: 'div',
    op: 'div',
    name: 'Twilight Trench',
    boss: 'Splitshell',
    // For ÷, b is the divisor and answer is the quotient; the dividend is b × answer.
    levels: [
      { id: 'D1', b: [1, 2], answer: [0, 5], display: [0, 9], enemies: 4, decoys: 2, descentSpeed: 13, safeAnswerTime: 10, splashWindow: 3.4, sway: 10, rules: ['off1', 'off2'] },
      { id: 'D2', b: [2, 5], answer: [1, 5], display: [0, 12], enemies: 5, decoys: 3, descentSpeed: 14, safeAnswerTime: 10, splashWindow: 3.2, sway: 16, rules: ['off1', 'off2', 'divisor'] },
      { id: 'D3', b: [2, 5], answer: [1, 10], display: [0, 15], enemies: 5, decoys: 3, descentSpeed: 15, safeAnswerTime: 9, splashWindow: 3.0, sway: 16, rules: ['off1', 'off2', 'divisor'] },
      { id: 'D4', b: [2, 9], answer: [2, 9], display: [0, 15], enemies: 6, decoys: 4, descentSpeed: 16, safeAnswerTime: 9, splashWindow: 2.8, sway: 20, rules: ['off1', 'off2', 'divisor'] },
      { id: 'D5', b: [2, 12], answer: [2, 12], display: [0, 20], enemies: 7, decoys: 5, descentSpeed: 17, safeAnswerTime: 8, splashWindow: 2.6, sway: 20, rules: ['off1', 'off2', 'divisor', 'place'] },
    ],
  },
];

export function allLevels() {
  const out = [];
  for (const section of SECTIONS) {
    for (const level of section.levels) out.push({ ...level, op: level.op ?? section.op, section: section.id });
  }
  return out;
}

export function getLevel(id) {
  const level = allLevels().find((l) => l.id === id);
  if (!level) throw new Error(`unknown level ${id}`);
  return level;
}
