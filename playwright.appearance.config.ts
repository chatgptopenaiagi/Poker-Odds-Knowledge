import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: '**/appearance-browser.spec.ts', fullyParallel: false, workers: 1, retries: 0,
  timeout: 240_000, reporter: [['list'],['json',{ outputFile:'artifacts/appearance-playwright.json' }]],
  use: { baseURL:'http://localhost/holdem-lab/', browserName:'chromium', channel:'msedge', headless:true,
    viewport:{width:1440,height:1000}, serviceWorkers:'block', trace:'off', screenshot:'only-on-failure', actionTimeout:10_000, navigationTimeout:15_000 },
  outputDir: 'artifacts/appearance-playwright',
});
