// Synthesised sound effects (Web Audio API only, no files). Consumes game events;
// the game itself never touches audio.
const MUTE_KEY = 'tidelight-tally-muted';

export function createAudio(storage) {
  let ctx = null;
  let master = null;
  let muted = false;
  try {
    muted = storage?.getItem(MUTE_KEY) === '1';
  } catch {
    muted = false;
  }

  // Browsers only allow audio after a user gesture; call this from input handlers.
  function unlock() {
    if (!ctx) {
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  function tone(freq, dur, { type = 'sine', gain = 0.3, to = null, delay = 0 } = {}) {
    if (!ctx || muted) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise(dur, { gain = 0.2, delay = 0, filter = 1200 } = {}) {
    if (!ctx || muted) return;
    const t0 = ctx.currentTime + delay;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = filter;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(lp).connect(g).connect(master);
    src.start(t0);
  }

  const notes = (list, step, opts) => list.forEach((f, i) => tone(f, step * 1.6, { ...opts, delay: i * step }));

  const SOUNDS = {
    fire: () => tone(880, 0.08, { type: 'triangle', gain: 0.12, to: 1400 }),
    correct: (e) => {
      notes([660, 990], 0.07, { type: 'triangle', gain: 0.22 });
      if (e.fast) {
        notes([523, 659, 784, 1047], 0.05, { type: 'sine', gain: 0.18 });
        noise(0.35, { gain: 0.25, filter: 900 });
      }
    },
    miss: () => tone(220, 0.18, { type: 'sine', gain: 0.18, to: 160 }),
    question: () => tone(1320, 0.06, { type: 'sine', gain: 0.05 }),
    breach: () => {
      tone(200, 0.5, { type: 'sawtooth', gain: 0.15, to: 70 });
      noise(0.4, { gain: 0.2, filter: 400 });
    },
    bossDefeated: () => notes([392, 523, 659, 784, 1047], 0.09, { type: 'square', gain: 0.1 }),
    clear: () => notes([523, 659, 784, 1047, 784, 1047], 0.1, { type: 'triangle', gain: 0.18 }),
    gameover: () => notes([392, 330, 262, 196], 0.18, { type: 'triangle', gain: 0.16 }),
  };

  return {
    unlock,
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      try {
        storage?.setItem(MUTE_KEY, muted ? '1' : '0');
      } catch {
        // Preference just won't persist.
      }
      return muted;
    },
    handle(events) {
      for (const e of events) SOUNDS[e.type]?.(e);
    },
    ui: () => tone(740, 0.07, { type: 'triangle', gain: 0.12 }),
  };
}
