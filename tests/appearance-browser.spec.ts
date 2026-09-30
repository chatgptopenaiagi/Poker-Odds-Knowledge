import { test, expect, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { appearanceTokens, defaultAppearance, PALETTES, type Palette } from '../src/appearance';
const catalogs = JSON.parse(readFileSync('src/locales/appearance.json','utf8')) as Record<string,Record<string,string>>;

const output = path.resolve('artifacts/pok-screenshots');
const evidence: Record<string, unknown>[] = [];
const faults = new WeakMap<Page, { external: string[]; errors: string[] }>();
test.setTimeout(240_000);
test.beforeEach(async ({ page, context }) => {
  const state = { external: [] as string[], errors: [] as string[] }; faults.set(page, state);
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (!['localhost','127.0.0.1','[::1]'].includes(url.hostname) && !['data:','blob:'].includes(url.protocol)) { state.external.push(url.origin); return route.abort(); }
    return route.continue();
  });
  page.on('pageerror', e => state.errors.push(e.message));
  await mkdir(output, { recursive: true });
  await page.goto('./', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Explore first', exact: true }).click();
});
test.afterEach(async ({ page }, info) => {
  evidence.push({ title: info.title, status: info.status, ...faults.get(page) });
  await writeFile('artifacts/appearance-browser-results.json', JSON.stringify({ observedAt: new Date().toISOString(), isolation: 'Fresh empty browser contexts; all external requests blocked; built Apache bundle', evidence }, null, 2));
  expect(faults.get(page)?.external).toEqual([]); expect(faults.get(page)?.errors).toEqual([]);
});
const drawer = (page: Page) => page.locator('.appearance-drawer[open]');
async function open(page: Page) { await page.locator('.topbar-controls button').click(); await expect(drawer(page)).toBeVisible(); }
async function close(page: Page) { await page.keyboard.press('Escape'); await expect(drawer(page)).toHaveCount(0); }
async function nav(page: Page, index: number) { await page.locator('nav[aria-label="Main navigation"] button').nth(index).click(); }
async function data(page: Page): Promise<any> {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('hil-study-v1', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => { const db = request.result; const tx = db.transaction('state'); const get = tx.objectStore('state').get('hil:session'); get.onsuccess = () => resolve(get.result); get.onerror = () => reject(get.error); tx.oncomplete = () => db.close(); };
  }));
}
async function screenshot(page: Page, name: string) { await expect(page.locator('.toast')).toHaveCount(0,{timeout:6000}); await page.screenshot({ path: path.join(output, name), fullPage: true, animations: 'disabled' }); }

test('all palettes, light/dark and high contrast apply throughout the built offline application', async ({ page }) => {
  const pages = ['Play','Odds Lab','Drills','Hand Review','Progress','Settings'];
  let screens = 0;
  for (const palette of Object.keys(PALETTES) as Palette[]) for (const mode of ['light','dark'] as const) for (const high of [false,true]) {
    await open(page);
    const d = drawer(page);
    await d.getByRole('button', { name: mode === 'light' ? 'Light' : 'Dark', exact: true }).click();
    await d.getByRole('button', { name: new RegExp(`^${palette[0].toUpperCase()}${palette.slice(1)}`) }).click();
    await d.getByRole('button', { name: high ? `High Contrast ${mode === 'light' ? 'Light' : 'Dark'}` : 'Standard contrast', exact: true }).click();
    const expected = appearanceTokens({ ...defaultAppearance, palette, mode, contrast: high });
    await expect(page.locator('html')).toHaveAttribute('data-theme', mode);
    expect(await page.locator('html').evaluate(el => (el as HTMLElement).style.getPropertyValue('--accent'))).toBe(expected['--accent']);
    await close(page);
    for (let index = 0; index < pages.length; index++) {
      await nav(page,index); await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('.topbar h1')).toHaveText(pages[index]);
      expect(await page.locator('main').evaluate(el => getComputedStyle(el).color)).not.toBe('rgba(0, 0, 0, 0)');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      screens++;
    }
    for (const index of [0,1,2]) { await page.locator('nav[aria-label="Platform navigation"] button').nth(index).click(); await expect(page.locator('main')).toBeVisible(); screens++; }
  }
  evidence.push({ matrix: '6 palettes × 2 modes × 2 contrast states × 9 screens', screens });
  expect(screens).toBe(216);
});

test('appearance changes preserve an active hand, draft answer, keyboard focus and preference storage', async ({ page }) => {
  await nav(page,5); await page.getByLabel('Table seats').selectOption('2'); await page.getByRole('button',{ name:'Apply settings',exact:true }).click();
  await nav(page,0); await page.getByRole('button',{ name:/^Start hand/ }).click(); await expect(page.getByTestId('poker-table')).toBeVisible();
  await page.getByRole('button',{ name:'Pause',exact:true }).click();
  const before = (await data(page)).hand;
  await open(page); const d = drawer(page);
  await d.getByRole('button',{ name:'Dark',exact:true }).click();
  await d.getByRole('button',{ name:/^Ocean/ }).click();
  for (let i=0;i<5;i++) await d.getByRole('button',{ name:'Increase text size',exact:true }).click();
  await expect(d.locator('output')).toHaveText('200%');
  await d.getByLabel(/^Card size/).selectOption('140');
  await d.getByLabel(/^Spacing/).selectOption('compact');
  await d.getByLabel(/^Reading font/).selectOption('verdana');
  await d.getByLabel('Reduce motion',{ exact:true }).check();
  await d.getByLabel('Table focus',{ exact:true }).check();
  await d.getByRole('button',{ name:'Close appearance',exact:true }).first().focus();
  for (let i=0;i<32;i++) { await page.keyboard.press('Tab'); expect(await page.evaluate(() => !!document.activeElement?.closest('.appearance-drawer'))).toBe(true); }
  await screenshot(page,'appearance-dark-200.png');
  await close(page);
  expect(await page.locator('.topbar-controls button').evaluate(el => document.activeElement === el)).toBe(true);
  expect((await data(page)).hand).toEqual(before);
  expect(await page.locator('.poker-table').evaluate(el => getComputedStyle(el).display)).toBe('grid');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await screenshot(page,'table-dark-200.png');
  await open(page); await d.getByRole('button',{name:'Reset appearance',exact:true}).click(); await close(page);
  await nav(page,2); await page.getByRole('button',{name:'Guess first',exact:true}).click();
  await expect.poll(async () => (await data(page)).settings.mode).toBe('guess');
  await page.getByLabel('Drill answer',{exact:true}).fill('37');
  await open(page); await d.getByRole('button',{name:'Light',exact:true}).click(); await d.getByRole('button',{name:/^Rose/}).click();
  await d.getByRole('button',{name:'Increase text size',exact:true}).click();
  await d.getByRole('button',{name:'Reset text size',exact:true}).click();
  await close(page); await expect(page.getByLabel('Drill answer',{exact:true})).toHaveValue('37');
  expect((await data(page)).attempts).toHaveLength(0);
  await screenshot(page,'drill-light.png');
  await page.reload({ waitUntil:'networkidle' });
  const prefs = await page.evaluate(() => JSON.parse(localStorage.getItem('pok:appearance:v1')!));
  expect(prefs.palette).toBe('rose'); expect(prefs.mode).toBe('light'); expect((await data(page)).hand).toEqual(before);
  await open(page);
  if (await page.evaluate(() => document.fullscreenEnabled)) {
    await drawer(page).getByRole('button',{name:'Enter fullscreen',exact:true}).click();
    await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
    await drawer(page).getByRole('button',{name:'Exit fullscreen',exact:true}).click();
    await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false);
    evidence.push({ fullscreen:'PASS real requestFullscreen and exitFullscreen; installed browser' });
  } else { await expect(drawer(page).getByRole('button',{name:'Enter fullscreen',exact:true})).toBeDisabled(); evidence.push({ fullscreen:'UNSUPPORTED; disabled control and explanation verified' }); }
  await close(page);
});

test('all shipped appearance languages render with selected RTL/CJK/narrow and 200 percent viewport coverage', async ({ page, context }) => {
  const locales = Object.keys(catalogs).filter(locale => locale !== 'zh-Hant');
  expect(locales).toHaveLength(41);
  for (const locale of locales) {
    await expect(page.getByLabel('Language',{exact:true}).locator(`option[value="${locale}"]`)).toHaveCount(1);
    await page.getByLabel('Language',{exact:true}).selectOption(locale);
    await open(page);
    await expect(drawer(page).locator('h2')).toHaveText(catalogs[locale as keyof typeof catalogs]['appearance.title']);
    expect(await drawer(page).innerText()).not.toContain('appearance.');
    await close(page);
  }
  await page.getByLabel('Language',{exact:true}).selectOption('ar');
  await expect(page.locator('html')).toHaveAttribute('dir','rtl');
  await screenshot(page,'rtl-desktop.png');
  await open(page); await screenshot(page,'appearance-rtl.png'); await close(page);
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await screenshot(page,'rtl-small.png');
  await page.getByLabel('Language',{exact:true}).selectOption('ja');
  await screenshot(page,'cjk-small.png');
  await page.getByLabel('Language',{exact:true}).selectOption('de');
  await open(page); await screenshot(page,'german-small.png'); await close(page);
  await page.setViewportSize({width:1440,height:1000});
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setPageScaleFactor',{pageScaleFactor:2});
  expect(await page.evaluate(() => visualViewport!.scale)).toBe(2);
  await screenshot(page,'browser-visual-zoom-200.png');
  await cdp.send('Emulation.setPageScaleFactor',{pageScaleFactor:1});
  evidence.push({ appearanceCatalogs:locales.length, traditionalChinese:'Source catalog available; NOT_SHIPPED in this frozen bundle picker', selectedFlows:['ar','ja','de'], zoom:'CDP browser visual viewport scale 2; separate text-scale200 and narrow reflow verified; not native browser menu zoom' });
});

