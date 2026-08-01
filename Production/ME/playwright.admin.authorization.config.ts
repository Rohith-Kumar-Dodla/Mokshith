import { defineConfig, devices } from '@playwright/test';

// Prefer local Redis for this certification suite so Upstash quota cannot block runs.
// dotenv in the backend uses override:false, so a pre-set REDIS_URL is preserved.
process.env.REDIS_URL =
  process.env.PLAYWRIGHT_REDIS_URL || process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export default defineConfig({
  testDir: './tests/functional',
  testIgnore: [
    '**/integration/**',
    '**/__tests__/**',
    '**/tests/unit/**',
    '../../tools/**',
    '../../Production/b2b-backend/tests/**',
  ],
  testMatch: ['**/admin.authorization.spec.ts'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 120000,
  globalSetup: './tests/functional/global-setup.ts',
  reporter: [
    ['html', { outputFolder: 'playwright-report-admin-authorization' }],
    ['junit', { outputFile: 'test-results/junit-admin-authorization.xml' }],
    ['json', { outputFile: 'test-results/admin-authorization-results.json' }],
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
      ENABLE_QUEUE: process.env.ENABLE_QUEUE || 'false',
      ENABLE_WORKERS: process.env.ENABLE_WORKERS || 'false',
    },
  },
});
