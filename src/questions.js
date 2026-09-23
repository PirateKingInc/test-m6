// Procedural question + distractor generation (SPEC §5). Pure; uses the injected seeded RNG.

export const OPS = {
  add: { symbol: '+', apply: (a, b) => a + b },
  sub: { symbol: '−', apply: (a, b) => a - b },
};

const MISCONCEPTION_RULES = new Set(['op', 'place', 'sign', 'group', 'divisor']);

// Candidate values for each distractor rule, given a question {op, a, b, answer}.
export const RULES = {
  off1: ({ answer: c }) => [c - 1, c + 1],
  off2: ({ answer: c }) => [c - 2, c + 2],
  op: ({ op, a, b }) => ({ add: [Math.abs(a - b), a * b], sub: [a + b] })[op] ?? [],
  place: ({ answer: c }) => (Math.abs(c) >= 10 ? [c - 10, c + 10] : []),
  sign: ({ op, answer: c }) => (op === 'sub' && c !== 0 ? [-c] : []),
};

export function generateQuestion(spec, rng) {
  const op = OPS[spec.op];
  if (!op) throw new Error(`unsupported op ${spec.op}`);
  for (let tries = 0; tries < 10000; tries++) {
    const a = rng.int(spec.a[0], spec.a[1]);
    const b = rng.int(spec.b[0], spec.b[1]);
    const answer = op.apply(a, b);
    if (answer >= spec.answer[0] && answer <= spec.answer[1]) {
      return { op: spec.op, a, b, answer, text: `${fmt(a)} ${op.symbol} ${fmt(b)}` };
    }
  }
  throw new Error(`level ${spec.id}: no operands satisfy the answer range`);
}

export function nearMissBound(q) {
  return Math.max(10, Math.abs(q.answer), Math.abs(q.a), Math.abs(q.b));
}

function isValid(value, q, spec, taken) {
  return (
    Number.isInteger(value) &&
    value !== q.answer &&
    value >= spec.display[0] &&
    value <= spec.display[1] &&
    Math.abs(value - q.answer) <= nearMissBound(q) &&
    !taken.has(value)
  );
}

// Returns `count` distractors [{value, rule}] with unique values, none equal to the answer.
export function generateDistractors(q, spec, count, rng) {
  const taken = new Set([q.answer]);
  const misconceptions = [];
  const offs = [];
  for (const rule of spec.rules) {
    for (const value of RULES[rule](q)) {
      if (!isValid(value, q, spec, taken)) continue;
      taken.add(value);
      (MISCONCEPTION_RULES.has(rule) ? misconceptions : offs).push({ value, rule });
    }
  }
  rng.shuffle(misconceptions);
  rng.shuffle(offs);
  const preferred = Math.min(misconceptions.length, Math.ceil(count / 2));
  const ordered = [...misconceptions.slice(0, preferred), ...offs, ...misconceptions.slice(preferred)];
  const out = ordered.slice(0, count);
  const used = new Set([q.answer, ...out.map((d) => d.value)]);
  for (let k = 3; out.length < count && k <= 60; k++) {
    for (const value of rng.chance(0.5) ? [q.answer + k, q.answer - k] : [q.answer - k, q.answer + k]) {
      if (out.length < count && isValid(value, q, spec, used)) {
        used.add(value);
        out.push({ value, rule: 'offk' });
      }
    }
  }
  if (out.length < count) throw new Error(`level ${spec.id}: cannot place ${count} distractors for ${q.text}`);
  return out;
}

export function makeRound(spec, rng, decoyCount = spec.decoys) {
  const question = generateQuestion(spec, rng);
  const decoys = generateDistractors(question, spec, decoyCount, rng);
  return { question, decoys };
}

function fmt(n) {
  return n < 0 ? `(−${-n})` : String(n);
}
