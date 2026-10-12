import { defineConfig } from '@playwright/test';

// Uses the already installed browser. No Playwright browser download or dev server.
export default defineConfig({
  testDir: './tests', testMatch: '**/browser.spec.ts', fullyParallel: false, workers: 1,
  timeout: 120_000, expect: { timeout: 15_000 }, retries: 0,
  reporter: [['list'], ['json', { outputFile: 'artifacts/browser-results.json' }]],
  outputDir: 'test-results',
  use: { channel: 'msedge', baseURL: 'http://localhost/holdem-lab/', viewport: { width: 1440, height: 1000 },
    headless: true, serviceWorkers: 'block', acceptDownloads: true, actionTimeout: 12_000,
    navigationTimeout: 15_000, trace: 'off', screenshot: 'only-on-failure' },
});
