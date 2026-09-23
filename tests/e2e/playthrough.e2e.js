// Browser bot playthrough of the real page in headless Chromium.
// Clicks the canvas exactly where a player would tap: the correct jelly, then the
// on-screen buttons. Run: node tests/e2e/playthrough.e2e.js [--mixed]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  for (const id of ['playwright', '/opt/node22/lib/node_modules/playwright']) {
    try {
      return require(id);
    } catch {
      // try the next location
    }
  }
  throw new Error('playwright not installed (npm i --no-save playwright)');
}
const { chromium } = loadPlaywright();

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
  try {
    const body = await readFile(join(ROOT, path || 'index.html'));
    res.writeHead(200, { 'content-type': TYPES[extname(path || 'index.html')] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const withMixed = process.argv.includes('--mixed');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: false });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

await page.goto(`http://localhost:${port}/?bot&speed=20`);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForFunction(() => window.__tidelight);

const state = () => page.evaluate(() => window.__tidelight.state());
async function click(x, y) {
  const p = await page.evaluate(([wx, wy]) => window.__tidelight.toPage(wx, wy), [x, y]);
  await page.mouse.click(p.x, p.y);
}
async function pressButton(s, id) {
  const b = s.buttons.find((btn) => btn.id === id);
  if (!b) throw new Error(`no button ${id} on ${s.screen}`);
  await click(b.x, b.y);
}

const log = [];
let lastLevel = null;
const deadline = Date.now() + 12 * 60 * 1000;
let target = 'main';
while (Date.now() < deadline) {
  const s = await state();
  if (s.screen === 'ending') {
    log.push(`ending:${s.ending}`);
    if (s.ending === target && (!withMixed || target === 'mixed')) break;
    if (withMixed && target === 'main') {
      target = 'mixed';
      await pressButton(s, 'map');
      await page.waitForFunction(() => window.__tidelight.state().screen === 'map');
      await pressButton(await state(), 'level:X1');
    }
    continue;
  }
  if (s.screen === 'title') await pressButton(s, 'play');
  else if (s.screen === 'clear' || s.screen === 'gameover') {
    log.push(`${s.levelId}:${s.screen}`);
    await pressButton(s, 'advance');
    await page.waitForFunction((prev) => window.__tidelight.state().screen !== prev, s.screen);
  } else if (s.screen === 'play') {
    if (s.levelId !== lastLevel) {
      lastLevel = s.levelId;
      process.stdout.write(`${s.levelId} `);
    }
    const g = s.game;
    if (g && !g.result && g.question && g.cooldown === 0 && g.beams === 0) {
      const t = g.enemies.find((e) => e.value === g.question.answer);
      if (t) await click(t.x, t.y);
    }
    await page.waitForTimeout(30);
  } else {
    throw new Error(`unexpected screen ${s.screen}`);
  }
}

const final = await state();
await browser.close();
server.close();
console.log(`\n${log.join(' ')}`);
const want = withMixed ? 'mixed' : 'main';
const ok = final.screen === 'ending' && final.ending === want && errors.length === 0;
console.log(ok ? `PASS: reached the ${want} ending in the browser with ${final.cleared.length} levels cleared` : `FAIL: ${JSON.stringify({ screen: final.screen, ending: final.ending, errors })}`);
process.exit(ok ? 0 : 1);
