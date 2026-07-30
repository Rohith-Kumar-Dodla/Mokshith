import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export default async function globalSetup() {
  try {
    const cacheFile = path.resolve(process.cwd(), 'test-results', '.validation-session-cache.json');
    fs.rmSync(cacheFile, { force: true });
  } catch {
    // ignore
  }

  try {
    if (!process.env.REDIS_URL || String(process.env.REDIS_URL).includes('upstash')) {
      process.env.REDIS_URL =
        process.env.PLAYWRIGHT_REDIS_URL || 'redis://127.0.0.1:6379';
    }
    const script = path.resolve(process.cwd(), '..', 'b2b-backend', 'scripts', 'clearAuthRateLimits.js');
    execSync(`node "${script}"`, {
      stdio: 'ignore',
      env: { ...process.env, REDIS_URL: process.env.REDIS_URL },
      timeout: 20000,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Validation global-setup: failed to clear auth rate limits:', message);
  }
}
