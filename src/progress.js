// Save data: unlocks, per-level best scores, endings seen. Pure apart from the injected
// storage object (localStorage in the browser, a stub in tests).
import { allLevels, SECTIONS } from './data/levels.js';

export const STORAGE_KEY = 'tidelight-tally-v1';
const KNOWN = new Set(allLevels().map((l) => l.id));

export function createProgress() {
  return { cleared: [], best: {}, endings: { main: false, mixed: false } };
}

// Never throws: missing, blocked or corrupt storage just means a fresh save.
export function loadProgress(storage) {
  const fresh = createProgress();
  let data;
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    data = JSON.parse(raw);
  } catch {
    return fresh;
  }
  if (!data || typeof data !== 'object') return fresh;
  if (Array.isArray(data.cleared)) fresh.cleared = [...new Set(data.cleared.filter((id) => KNOWN.has(id)))];
  if (data.best && typeof data.best === 'object') {
    for (const [id, score] of Object.entries(data.best)) {
      if (KNOWN.has(id) && Number.isFinite(score) && score > 0) fresh.best[id] = Math.floor(score);
    }
  }
  if (data.endings && typeof data.endings === 'object') {
    fresh.endings.main = data.endings.main === true;
    fresh.endings.mixed = data.endings.mixed === true;
  }
  return fresh;
}

export function saveProgress(storage, progress) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

// A section's high score is the sum of its levels' best scores.
export function sectionHighScore(progress, sectionId) {
  const section = SECTIONS.find((s) => s.id === sectionId);
  return section.levels.reduce((sum, l) => sum + (progress.best[l.id] ?? 0), 0);
}

export function hasProgress(progress) {
  return progress.cleared.length > 0;
}
