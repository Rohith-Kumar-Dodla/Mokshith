import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/smoke',
  testIgnore: [
    '**/integration/**',
    '**/__tests__/**',
    '**/tests/unit/**',
    '../../tools/**',
    '../../Production/b2b-backend/tests/**',
  ],
  testMatch: ['**/orders.smoke.spec.ts'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 120000,
  globalSetup: './tests/smoke/global-setup.ts',
  reporter: [
    ['html', { outputFolder: 'playwright-report-orders-smoke' }],
    ['junit', { outputFile: 'test-results/junit-orders-smoke.xml' }],
    ['json', { outputFile: 'test-results/orders-smoke-results.json' }],
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
  },
});
