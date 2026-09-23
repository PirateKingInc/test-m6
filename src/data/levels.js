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
