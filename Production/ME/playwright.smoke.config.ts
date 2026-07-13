import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Limit test discovery to the smoke folder only for smoke runs.
  testDir: './tests/smoke',
  testIgnore: [
    '**/integration/**',
    '**/__tests__/**',
    '**/tests/unit/**',
    '../../tools/**',
    '../../Production/b2b-backend/tests/**',
  ],
  testMatch: ['**/*.spec.{ts,tsx,js,jsx}'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  globalSetup: './tests/smoke/global-setup.ts',
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit-smoke.xml' }],
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
    // Launch an orchestrator that starts both backend and frontend (dev mode).
    // This ensures the API at port 5000 is available for smoke runs without
    // weakening the frontend production guard.
    command: 'node ./tools/start-dev-with-backend.js',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});