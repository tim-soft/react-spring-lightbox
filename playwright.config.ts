import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    forbidOnly: Boolean(process.env.CI),
    fullyParallel: true,
    globalSetup: './e2e/coverage.ts',
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        // Touch tests drive Chromium's DevTools protocol for real multi-touch
        { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
        { name: 'mobile-webkit', use: { ...devices['iPhone 15'] } },
    ],
    reporter: process.env.CI
        ? [['github'], ['html', { open: 'never' }]]
        : 'list',
    retries: process.env.CI ? 1 : 0,
    testDir: './e2e',
    use: {
        baseURL: 'http://localhost:5174',
        trace: 'on-first-retry',
    },
    webServer: {
        command: 'vite --config e2e/vite.config.mts',
        reuseExistingServer: !process.env.CI,
        url: 'http://localhost:5174',
    },
});
