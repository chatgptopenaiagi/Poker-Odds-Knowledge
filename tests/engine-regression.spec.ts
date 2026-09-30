import { test, expect, type Page } from '@playwright/test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { SavedData } from '../src/storage';

const out = path.resolve('artifacts/engine-screenshots');
const measurements: Record<string, unknown>[] = [];
const networkByPage = new WeakMap<Page, { local: number; external: string[]; errors: string[]; consoleErrors: string[]; workers: number; browserVersion: string; bundles: string[] }>();
const loopback = (url: string): boolean => {
  const parsed = new URL(url);
  return ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname) || ['blob:', 'data:'].includes(parsed.protocol);
};
test.beforeEach(async ({ context, page }) => {
  const evidence = { local: 0, external: [] as string[], errors: [] as string[], consoleErrors: [] as string[], workers: 0,
    browserVersion: context.browser()?.version() ?? 'UNKNOWN', bundles: [] as string[] };
  networkByPage.set(page, evidence);
  await context.route('**/*', route => {
    if (!loopback(route.request().url())) { evidence.external.push(route.request().url()); return route.abort('blockedbyclient'); }
    evidence.local++; return route.continue();
  });
  page.on('pageerror', error => evidence.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') evidence.consoleErrors.push(message.text()); });
  page.on('worker', () => evidence.workers++);
  await mkdir(out, { recursive: true });
  // Every Playwright test starts with a new empty browser context, cache and IDB.
  await page.goto('./', { waitUntil: 'networkidle' });
  evidence.bundles = await page.locator('script[src]').evaluateAll(elements => elements.map(e => new URL((e as HTMLScriptElement).src).pathname));
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Explore first', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
test.afterEach(async ({ page }, info) => {
  const evidence = networkByPage.get(page)!;
  measurements.push({ test: info.title, status: info.status, ...evidence });
  await writeFile('artifacts/engine-regression-measurements.json', JSON.stringify({ schemaVersion: 1,
    observedAt: new Date().toISOString(), origin: 'http://localhost/holdem-engines-preview/',
    context: 'Fresh isolated Edge contexts; nonloopback HTTP requests blocked before initial navigation; local Apache remains reachable; no service worker', measurements }, null, 2));
  expect(evidence.external, 'The public bundle must not request nonloopback resources').toEqual([]);
  expect(evidence.errors, 'No uncaught browser exceptions').toEqual([]);
  expect(evidence.consoleErrors, 'No browser console errors').toEqual([]);
});

async function nav(page: Page, name: string) {
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name, exact: false }).click();
}
async function notebook(page: Page): Promise<SavedData> {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('pok-engine-preview-study-v1', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result; const tx = db.transaction('state'); const record = tx.objectStore('state').get('hil:session');
      record.onsuccess = () => resolve(record.result); record.onerror = () => reject(record.error); tx.oncomplete = () => db.close();
    };
  }));
}
async function configure(page: Page, seats: number) {
  await nav(page, 'Settings');
  await page.getByLabel('Table seats').selectOption(String(seats));
  await page.getByLabel('Animation speed').selectOption('0');
  await page.getByLabel('Reduced motion', { exact: true }).check();
  await page.getByRole('button', { name: 'Apply settings', exact: true }).click();
  await expect.poll(async () => (await notebook(page)).settings.seats).toBe(seats);
  await nav(page, 'Play');
}
async function start(page: Page) {
  await page.getByRole('button', { name: 'Start hand', exact: false }).click();
  await expect(page.getByTestId('poker-table')).toBeVisible();
}
async function finishHand(page: Page) {
  for (let i = 0; i < 120; i++) {
    await expect.poll(async () => {
      const h = (await notebook(page)).hand;
      return h?.result ? 'complete' : h?.turn === 0 ? 'hero' : 'bots';
    }, { timeout: 20000 }).toMatch(/^(hero|complete)$/);
    const h = (await notebook(page)).hand!;
    if (h.result) return h;
    const button = page.getByTestId('action-panel').getByRole('button', { name: /^(Check|Call \d+)$/ });
    await expect(button).toBeEnabled();
    await button.click();
    await expect.poll(async () => (await notebook(page)).hand!.revision).toBeGreaterThan(h.revision);
  }
  throw new Error('Hand exceeded bounded 120 human-action steps');
}
async function snapshot(page: Page, name: string) {
  await expect(page.locator('.toast')).toHaveCount(0, { timeout: 6000 });
  await page.screenshot({ path: path.join(out, name), fullPage: true, animations: 'disabled' });
}

test('offline heads-up hand, duplicate-click guard, pause/step, atomic save and reload', async ({ page }) => {
  await configure(page, 2); await start(page);
  await expect.poll(async () => (await notebook(page)).hand!.turn).toBe(0);
  const initial = (await notebook(page)).hand!;
  expect(initial.smallBlindSeat).toBe(initial.button); expect(initial.bigBlindSeat).toBe(1);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: /Reveal calculation/ }).click();
  await expect(page.getByTestId('worked-calculation')).toContainText('C / (P + C)');
  const call = page.getByTestId('action-panel').getByRole('button', { name: /^Call \d+$/ });
  await call.evaluate(element => { (element as HTMLButtonElement).click(); (element as HTMLButtonElement).click(); });
  await expect.poll(async () => (await notebook(page)).hand!.revision).toBe(1);
  expect((await notebook(page)).hand!.log.filter(a => a.seat === 0)).toHaveLength(1);
  await page.getByRole('button', { name: 'Step', exact: true }).click();
  await expect.poll(async () => (await notebook(page)).hand!.revision).toBe(2);
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  const done = await finishHand(page);
  expect(done.seats.reduce((sum, seat) => sum + seat.stack, 0)).toBe(done.initialChipTotal);
  expect((await notebook(page)).hands.filter(h => h.id === done.id)).toHaveLength(1);
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByTestId('poker-table')).toBeVisible();
  const restored = await notebook(page);
  expect(restored.hand!.id).toBe(done.id); expect(restored.hand!.revision).toBe(done.revision);
  expect(restored.hand!.seats.map(s => s.stack)).toEqual(done.seats.map(s => s.stack));
  expect(restored.hands.filter(h => h.id === done.id)).toHaveLength(1);
  measurements.push({ kind: 'heads-up', handActions: done.revision, settlement: done.result!.reason, conservedChips: done.initialChipTotal });
});

test('offline 6-max play, review branches, side pots, drill, portable backup and Romanian layout', async ({ page }) => {
  await configure(page, 6); await start(page);
  await expect(page.locator('.seat')).toHaveCount(6);
  await expect.poll(async () => { const h = (await notebook(page)).hand!; return h.turn === 0 || !!h.result; }).toBe(true);
  for (let i = 0; i < 10; i++) {
    const hand = (await notebook(page)).hand!;
    if (hand.board.length || hand.result) break;
    await page.getByTestId('action-panel').getByRole('button', { name: /^(Check|Call \d+)$/ }).click();
    await expect.poll(async () => { const h = (await notebook(page)).hand!; return h.revision > hand.revision && (h.turn === 0 || !!h.result); }).toBe(true);
  }
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: /Reveal calculation/ }).click();
  await snapshot(page, 'table-desktop.png');
  await page.setViewportSize({ width: 430, height: 900 });
  await snapshot(page, 'table-small.png');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  const done = await finishHand(page);
  expect(done.seats).toHaveLength(6);
  expect(done.seats.reduce((sum, seat) => sum + seat.stack, 0)).toBe(done.initialChipTotal);
  await nav(page, 'Hand Review');
  await expect(page.getByLabel('Saved hand')).toBeVisible();
  await expect(page.getByLabel('Replay action', { exact: true })).toHaveValue('0');
  await page.getByRole('button', { name: 'Next replay action', exact: true }).click();
  await expect(page.getByLabel('Replay action', { exact: true })).toHaveValue('1');
  await page.getByRole('button', { name: /^Replay/ }).click();
  await expect(page.getByLabel('Replay action', { exact: true })).toHaveValue('0');
  await page.getByRole('button', { name: 'Branch to Odds Lab', exact: true }).click();
  await expect(page.getByLabel('Board cards')).toHaveValue('');
  await expect(page.getByLabel('Explicit known dead cards')).toHaveValue('');
  expect((await notebook(page)).hands.some(h => h.id === done.id)).toBe(true);
  await page.getByRole('button', { name: 'Save scenario', exact: true }).click();
  await expect.poll(async () => (await notebook(page)).scenarios.length).toBe(1);
  await nav(page, 'Hand Review');
  await page.getByRole('button', { name: 'Load side-pot lesson', exact: true }).click();
  await expect.poll(async () => (await notebook(page)).hands.some(h => h.id === 'side-pot-lesson-v1')).toBe(true);
  await page.getByLabel('Saved hand').selectOption('side-pot-lesson-v1');
  const replay = page.getByLabel('Replay action', { exact: true });
  await replay.focus(); await replay.press('End');
  await expect(page.locator('.review-notes')).toContainText('Main 1: 300');
  await expect(page.locator('.review-notes')).toContainText('Side 2: 200');
  const demo = (await notebook(page)).hands.find(h => h.id === 'side-pot-lesson-v1')!;
  expect(demo.board).toHaveLength(5); expect(demo.pots.map(p => p.amount)).toEqual([300, 200]);
  expect(demo.seats.reduce((sum, seat) => sum + seat.stack, 0)).toBe(600);
  await nav(page, 'Drills');
  await page.getByRole('button', { name: 'Guess first', exact: true }).click();
  await page.getByRole('button', { name: /The price of this call/ }).click();
  await expect(page.getByTestId('drill-explanation')).toHaveCount(0);
  await page.getByLabel('Drill answer').fill('20');
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Correct calculation' })).toBeVisible();
  await expect(page.getByTestId('drill-explanation')).toContainText('20/(80+20)');
  await snapshot(page, 'drill-desktop.png');
  await page.setViewportSize({ width: 430, height: 900 }); await snapshot(page, 'drill-small.png');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await nav(page, 'Progress');
  await expect(page.getByText('100%', { exact: true })).toBeVisible();
  await nav(page, 'Settings');
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Back up progress', exact: true }).click();
  const download = await downloading; const backupPath = path.resolve('artifacts', 'browser-test-backup.json');
  await download.saveAs(backupPath);
  const backup = JSON.parse(await readFile(backupPath, 'utf8')) as SavedData;
  expect(backup.hands.some(h => h.id === done.id)).toBe(true); expect(backup.attempts).toHaveLength(1);
  await page.getByRole('button', { name: 'Reset progress', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Export a backup first');
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect.poll(async () => (await notebook(page)).hands.length).toBe(0);
  await nav(page, 'Settings');
  await page.getByLabel('Import backup', { exact: true }).setInputFiles(backupPath);
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect.poll(async () => (await notebook(page)).hands.length).toBe(backup.hands.length);
  expect((await notebook(page)).attempts[0].correct).toBe(true);
  await page.getByLabel('Language', { exact: true }).selectOption('ro');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ro');
  await nav(page, 'Exerciții');
  await page.getByRole('button', { name: /Prețul acestei plăți/ }).click();
  await expect(page.getByTestId('drill-card')).toContainText('Potul era 60');
  await page.getByRole('button', { name: 'Învață', exact: true }).click();
  await expect(page.getByTestId('drill-explanation')).toBeVisible();
  await page.getByRole('button', { name: /Vizualizare începător/ }).click();
  await expect.poll(async () => (await notebook(page)).settings.advanced).toBe(true);
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('lang', 'ro');
  expect((await notebook(page)).hands).toHaveLength(backup.hands.length);
  measurements.push({ kind: '6-max', handActions: done.revision, settlement: done.result!.reason, backupRoundTrip: true,
    sidePotAmounts: demo.pots.map(p => p.amount), screenshots: ['table-desktop.png','table-small.png','drill-desktop.png','drill-small.png'] });
});

test('offline real worker exact and estimated equity, editable ranges, cancellation and responsiveness', async ({ page }) => {
  await nav(page, 'Odds Lab');
  await page.getByRole('button', { name: 'Calculate equity', exact: true }).click();
  await expect(page.getByTestId('equity-result')).toContainText('EXACT ENUMERATION');
  await expect(page.getByTestId('equity-result')).toContainText('990 outcomes');
  await snapshot(page, 'odds-desktop.png');
  await page.setViewportSize({ width: 430, height: 900 }); await snapshot(page, 'odds-small.png');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  const exactText = await page.getByTestId('equity-result').innerText();
  await page.getByRole('button', { name: 'Tight educational', exact: true }).click();
  const cell = page.getByRole('button', { name: 'AA weight 100 percent', exact: true });
  const weight = page.getByLabel(/^Weight /);
  await weight.focus(); await weight.press('Home');
  for (let i = 0; i < 10; i++) await weight.press('ArrowRight');
  await cell.click();
  await expect(page.getByRole('button', { name: 'AA weight 50 percent', exact: true })).toBeVisible();
  await expect(page.getByLabel('Opponent 1 range')).toHaveValue(/AA:0.5/);
  await page.getByLabel('Board cards').fill('');
  await page.getByLabel('Opponents', { exact: true }).selectOption('5');
  for (let i = 1; i <= 5; i++) await page.getByLabel(`Opponent ${i} range`).fill('random');
  await page.getByLabel('Calculation method').selectOption('monte-carlo');
  await page.getByLabel('Sample budget').selectOption('50000');
  await page.getByRole('button', { name: 'Calculate equity', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cancel calculation', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel calculation', exact: true }).click();
  await expect(page.getByTestId('equity-result')).toHaveCount(0);
  await page.getByLabel('Opponents', { exact: true }).selectOption('1');
  await page.getByLabel('Board cards').fill('Ks Qs 2d');
  await page.getByLabel('Opponent 1 range').fill('Kc Kh');
  await page.getByLabel('Calculation method').selectOption('exact');
  await page.getByRole('button', { name: 'Calculate equity', exact: true }).click();
  await expect(page.getByTestId('equity-result')).toContainText('EXACT ENUMERATION');
  await expect(page.getByTestId('equity-result')).toContainText('990 outcomes');
  await page.getByLabel('Board cards').fill('');
  await page.getByLabel('Opponent 1 range').fill('random');
  await page.getByLabel('Calculation method').selectOption('monte-carlo');
  await page.evaluate(() => {
    const w = window as unknown as { hilPerf: { running: boolean; previous: number; gaps: number[]; progressValues: number[] } };
    w.hilPerf = { running: true, previous: performance.now(), gaps: [], progressValues: [] };
    function tick(now: number) {
      const s = w.hilPerf; s.gaps.push(now - s.previous); s.previous = now;
      const p = document.querySelector<HTMLProgressElement>('main [role="status"] progress');
      if (p && p.value > 0 && s.progressValues.at(-1) !== p.value) s.progressValues.push(p.value);
      if (s.running) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
  const start = Date.now();
  await page.getByRole('button', { name: 'Calculate equity', exact: true }).click();
  await expect(page.getByTestId('equity-result')).toContainText('MONTE CARLO ESTIMATE');
  await expect(page.getByTestId('equity-result').locator(':scope > p').first()).toContainText(/50[,.\s]000 outcomes/);
  await expect(page.getByTestId('equity-result')).toContainText('Hoeffding');
  const end = Date.now();
  const performanceData = await page.evaluate(() => {
    const s = (window as unknown as { hilPerf: { running: boolean; gaps: number[]; progressValues: number[] } }).hilPerf;
    s.running = false; return { gaps: s.gaps, progressValues: s.progressValues };
  });
  const frameGaps = performanceData.gaps;
  const resultText = await page.getByTestId('equity-result').locator(':scope > p').first().innerText();
  const match = /50[,.\s]000 outcomes · ([\d.]+) ms/.exec(resultText);
  expect(match).not.toBeNull();
  const workerMs = Number(match![1]);
  expect(frameGaps.length).toBeGreaterThan(0);
  expect(performanceData.progressValues.length).toBeGreaterThan(0);
  // A bounded sanity check, not a professional-strength benchmark.
  expect(end - start).toBeLessThan(20_000);
  expect(Math.max(...frameGaps)).toBeLessThan(1500);
  measurements.push({ kind: 'worker-measurement', samples: 50000, opponents: 1, seed: 20260930,
    workerMs, samplesPerSecond: Math.round(50_000_000 / workerMs), roundTripMs: end - start,
    animationFrameCount: frameGaps.length, maximumAnimationFrameGapMs: Math.round(Math.max(...frameGaps)),
    observedProgressUpdates: performanceData.progressValues.length,
    exactReferenceDisplayed: exactText, method: 'real module worker in installed Edge from Apache built bundle',
    cancellation: 'real worker terminated, then fresh exact990 result; stale outcome absent' });
});
