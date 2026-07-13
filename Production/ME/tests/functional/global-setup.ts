import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export default async function globalSetup() {
  // Start each functional run from a clean session cache so role logins happen
  // exactly once (fresh tokens), then survive worker restarts via the disk cache.
  try {
    const cacheFile = path.resolve(process.cwd(), 'test-results', '.functional-session-cache.json');
    fs.rmSync(cacheFile, { force: true });
  } catch {
    // ignore
  }

  // Reuse the certified Smoke-suite utility to reset auth rate-limit / fraud
  // counters before a long functional run. Does not modify production auth.
  try {
    const script = path.resolve(process.cwd(), '..', 'b2b-backend', 'scripts', 'clearAuthRateLimits.js');
    execSync(`node "${script}"`, { stdio: 'ignore' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Functional global-setup: failed to clear auth rate limits:', message);
  }
}
