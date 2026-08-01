import { defineConfig, devices } from '@playwright/test';

// Prefer local Redis + relaxed AUTH_STRICT for Playwright QA (matches Admin / SA Smoke harness).
process.env.REDIS_URL =
  process.env.PLAYWRIGHT_REDIS_URL || process.env.REDIS_URL || 'redis://127.0.0.1:6379';
if (!process.env.AUTH_STRICT_MODE) {
  process.env.AUTH_STRICT_MODE = 'false';
}

export default defineConfig({
  testDir: './tests/functional',
  testIgnore: [
    '**/integration/**',
    '**/__tests__/**',
    '**/tests/unit/**',
    '../../tools/**',
    '../../Production/b2b-backend/tests/**',
  ],
  testMatch: ['**/superadmin.functional.spec.ts'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 120000,
  globalSetup: './tests/functional/global-setup.ts',
  reporter: [
    ['html', { outputFolder: 'playwright-report-superadmin-functional' }],
    ['junit', { outputFile: 'test-results/junit-superadmin-functional.xml' }],
    ['json', { outputFile: 'test-results/superadmin-functional-results.json' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'node ./tools/start-dev-with-backend.cjs',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
    env: {
      ...process.env,
      REDIS_URL:
        process.env.PLAYWRIGHT_REDIS_URL ||
        process.env.REDIS_URL ||
        'redis://127.0.0.1:6379',
      AUTH_STRICT_MODE: process.env.AUTH_STRICT_MODE || 'false',
      ENABLE_QUEUE: process.env.ENABLE_QUEUE || 'false',
      ENABLE_WORKERS: process.env.ENABLE_WORKERS || 'false',
    },
  },
});
